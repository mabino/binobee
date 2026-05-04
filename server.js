const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const { RoomManager } = require('./src/rooms');
const { Dictionary } = require('./src/dictionary');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const roomManager = new RoomManager();
const dictionary = new Dictionary();

// Per-room timer handles
const roomTimers = new Map();

app.use(express.json());

// Serve the socket.io client bundle explicitly so it is always available,
// even in environments where the prepare script did not run (e.g. bare npm ci).
app.get('/socket.io/socket.io.js', (_req, res) => {
  res.sendFile(require.resolve('socket.io/client-dist/socket.io.js'));
});

app.use(express.static(path.join(__dirname, 'public')));

// TTS config endpoint
app.get('/api/tts/config', (_req, res) => {
  res.json({
    serverTTS: !!(process.env.TTS_PROVIDER && process.env.TTS_PROVIDER !== 'browser'),
    provider: process.env.TTS_PROVIDER || 'browser'
  });
});

// Server-side TTS proxy
app.post('/api/tts', async (req, res) => {
  const { text } = req.body;
  const provider = process.env.TTS_PROVIDER;

  if (!provider || provider === 'browser') {
    return res.status(400).json({ error: 'No server TTS configured' });
  }

  if (provider === 'openai') {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: 'tts-1', input: text, voice: process.env.TTS_VOICE || 'alloy' })
      });
      if (!response.ok) throw new Error('OpenAI TTS failed');
      const buf = await response.arrayBuffer();
      res.set('Content-Type', 'audio/mpeg');
      return res.send(Buffer.from(buf));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (provider === 'custom') {
    try {
      const response = await fetch(process.env.TTS_ENDPOINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!response.ok) throw new Error('Custom TTS failed');
      const buf = await response.arrayBuffer();
      res.set('Content-Type', response.headers.get('content-type') || 'audio/mpeg');
      return res.send(Buffer.from(buf));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(400).json({ error: 'Unknown TTS provider' });
});

// ─── Timer helpers ────────────────────────────────────────────────────────────

function clearRoomTimers(roomCode) {
  const t = roomTimers.get(roomCode);
  if (t) {
    clearInterval(t.interval);
    clearTimeout(t.timeout);
    roomTimers.delete(roomCode);
  }
}

async function startNextRound(room) {
  clearRoomTimers(room.code);

  if (room.isGameOver()) {
    io.to(room.code).emit('game:over', {
      winner: room.getWinner(),
      scores: room.getScores(),
      lives: room.getLives(),
      reason: room.getGameOverReason()
    });
    return;
  }

  let wordData;
  try {
    wordData = await room.nextRound(dictionary);
  } catch (err) {
    io.to(room.code).emit('error', { message: 'Failed to fetch word. Please try again.' });
    return;
  }

  io.to(room.code).emit('game:round-start', {
    round: room.currentRound,
    totalRounds: room.config.maxRounds,
    definition: wordData.definition,
    phonetic: wordData.phonetic,
    partOfSpeech: wordData.partOfSpeech,
    example: wordData.example,
    timerSeconds: room.config.timerSeconds,
    scores: room.getScores(),
    lives: room.getLives(),
    mode: room.config.mode,
    ttsWord: wordData.word   // used by browser TTS; never displayed
  });

  let timeLeft = room.config.timerSeconds;
  const interval = setInterval(() => {
    timeLeft--;
    io.to(room.code).emit('game:timer', { timeLeft });
    if (timeLeft <= 0) clearInterval(interval);
  }, 1000);

  const timeout = setTimeout(() => {
    clearInterval(interval);
    for (const pid of Object.keys(room.players)) {
      if (room.players[pid].answer === null) room.submitAnswer(pid, '');
    }
    processRoundResults(room);
  }, (room.config.timerSeconds + 1) * 1000);

  roomTimers.set(room.code, { interval, timeout });
}

function processRoundResults(room) {
  clearRoomTimers(room.code);

  const results = room.evaluateRound();

  io.to(room.code).emit('game:round-result', {
    word: room.currentWord.word,
    results,
    scores: room.getScores(),
    lives: room.getLives()
  });

  setTimeout(async () => {
    if (room.isGameOver()) {
      io.to(room.code).emit('game:over', {
        winner: room.getWinner(),
        scores: room.getScores(),
        lives: room.getLives(),
        reason: room.getGameOverReason()
      });
    } else {
      await startNextRound(room);
    }
  }, 4500);
}

function handlePlayerLeave(socketId) {
  const room = roomManager.getRoomByPlayer(socketId);
  if (!room) return;

  const playerName = room.players[socketId]?.name || 'A player';
  const wasPlaying = room.phase === 'playing';
  const otherPlayerId = room.getOtherPlayer(socketId);

  roomManager.removePlayer(socketId);

  if (room.isEmpty()) {
    clearRoomTimers(room.code);
    roomManager.deleteRoom(room.code);
  } else {
    io.to(room.code).emit('room:player-left', { playerName, playerId: socketId });

    if (wasPlaying) {
      clearRoomTimers(room.code);
      const winner = otherPlayerId
        ? { id: otherPlayerId, name: room.players[otherPlayerId]?.name }
        : null;
      io.to(room.code).emit('game:over', {
        winner,
        scores: room.getScores(),
        lives: room.getLives(),
        reason: 'opponent-disconnected'
      });
      room.phase = 'lobby';
    }

    io.to(room.code).emit('room:updated', room.toPublic());
  }
}

// ─── Socket.io ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  socket.emit('tts:config', {
    serverTTS: !!(process.env.TTS_PROVIDER && process.env.TTS_PROVIDER !== 'browser'),
    provider: process.env.TTS_PROVIDER || 'browser'
  });

  socket.on('room:create', ({ playerName }, cb) => {
    if (!playerName?.trim()) return cb({ success: false, error: 'Name required' });
    const room = roomManager.createRoom(socket.id, playerName.trim());
    socket.join(room.code);
    cb({ success: true, room: room.toPublic() });
  });

  socket.on('room:join', ({ code, playerName }, cb) => {
    if (!playerName?.trim()) return cb({ success: false, error: 'Name required' });
    const result = roomManager.joinRoom(code, socket.id, playerName.trim());
    if (!result.success) return cb(result);
    socket.join(result.room.code);
    io.to(result.room.code).emit('room:updated', result.room.toPublic());
    cb({ success: true, room: result.room.toPublic() });
  });

  socket.on('game:configure', ({ config }, cb) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return cb({ success: false, error: 'Not in a room' });
    if (room.hostId !== socket.id) return cb({ success: false, error: 'Host only' });
    room.setConfig(config);
    io.to(room.code).emit('game:configured', { config: room.config });
    cb({ success: true });
  });

  socket.on('game:upload-dictionary', ({ words }, cb) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return cb({ success: false, error: 'Not in a room' });
    if (room.hostId !== socket.id) return cb({ success: false, error: 'Host only' });
    const result = room.setCustomDictionary(words);
    if (!result.success) return cb(result);
    io.to(room.code).emit('game:dictionary-updated', { wordCount: result.wordCount, custom: true });
    cb({ success: true, wordCount: result.wordCount });
  });

  socket.on('game:clear-dictionary', (cb) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return cb({ success: false, error: 'Not in a room' });
    if (room.hostId !== socket.id) return cb({ success: false, error: 'Host only' });
    room.config.customDictionary = null;
    io.to(room.code).emit('game:dictionary-updated', { wordCount: 0, custom: false });
    cb({ success: true });
  });

  socket.on('game:start', async (cb) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return cb({ success: false, error: 'Not in a room' });
    if (room.hostId !== socket.id) return cb({ success: false, error: 'Host only' });
    if (Object.keys(room.players).length < 2) return cb({ success: false, error: 'Need 2 players to start' });
    if (room.phase === 'playing') return cb({ success: false, error: 'Game already started' });

    room.startGame();
    io.to(room.code).emit('game:started', { config: room.config });
    cb({ success: true });

    await startNextRound(room);
  });

  socket.on('game:submit', ({ answer, wpm }, cb) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return cb({ success: false, error: 'Not in a room' });
    const result = room.submitAnswer(socket.id, answer || '', wpm ?? null);
    if (!result.success) return cb(result);
    cb({ success: true });

    io.to(room.code).emit('game:answer-in', {
      playerId: socket.id,
      playerName: room.players[socket.id].name
    });

    if (room.bothAnswered()) processRoundResults(room);
  });

  socket.on('game:rematch', (cb) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return cb?.({ success: false, error: 'Not in a room' });
    room.requestRematch(socket.id);
    const allReady = Object.keys(room.players).length === 2 &&
      Object.values(room.players).every(p => p.rematch);
    if (allReady) {
      room.startGame();
      io.to(room.code).emit('game:started', { config: room.config });
      startNextRound(room);
    } else {
      io.to(room.code).emit('game:rematch-requested', {
        playerId: socket.id,
        playerName: room.players[socket.id]?.name
      });
    }
    cb?.({ success: true });
  });

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id}`);
    handlePlayerLeave(socket.id);
  });

  socket.on('room:leave', () => handlePlayerLeave(socket.id));
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`🐝 Bino Bee on http://localhost:${PORT}`);
  console.log(`   TTS: ${process.env.TTS_PROVIDER || 'browser (Web Speech API)'}`);
});
