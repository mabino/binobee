function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

class Room {
  constructor(hostId, hostName) {
    this.code = generateCode();
    this.hostId = hostId;
    this.players = {
      [hostId]: this._makePlayer(hostId, hostName)
    };
    this.config = {
      mode: 'rounds',        // 'rounds' | 'points' | 'sudden-death'
      maxRounds: 10,
      pointsToWin: 5,
      timerSeconds: 30,
      difficulty: 'mixed',   // 'easy' | 'medium' | 'hard' | 'mixed'
      customDictionary: null,
      showWpm: true
    };
    this.phase = 'lobby';    // 'lobby' | 'playing' | 'over'
    this.currentWord = null;
    this.currentRound = 0;
    this.usedWords = new Set();
  }

  _makePlayer(id, name) {
    return { id, name, score: 0, lives: 3, answer: null, answeredAt: null, wpm: null, rematch: false };
  }

  setConfig(cfg) {
    const allowed = ['mode', 'maxRounds', 'pointsToWin', 'timerSeconds', 'difficulty', 'showWpm'];
    for (const key of allowed) {
      if (cfg[key] !== undefined) this.config[key] = cfg[key];
    }
  }

  setCustomDictionary(words) {
    const cleaned = words
      .map(w => String(w).trim().toLowerCase())
      .filter(w => w.length >= 2 && /^[a-z\-']+$/.test(w));
    if (cleaned.length < 5) return { success: false, error: 'Need at least 5 valid words' };
    this.config.customDictionary = cleaned;
    return { success: true, wordCount: cleaned.length };
  }

  addPlayer(id, name) {
    if (Object.keys(this.players).length >= 2) return { success: false, error: 'Room is full' };
    this.players[id] = this._makePlayer(id, name);
    return { success: true };
  }

  removePlayer(id) {
    delete this.players[id];
    if (this.hostId === id) {
      const ids = Object.keys(this.players);
      if (ids.length) this.hostId = ids[0];
    }
  }

  isEmpty() { return Object.keys(this.players).length === 0; }

  getOtherPlayer(id) {
    return Object.keys(this.players).find(pid => pid !== id) || null;
  }

  startGame() {
    this.phase = 'playing';
    this.currentRound = 0;
    this.usedWords = new Set();
    for (const p of Object.values(this.players)) {
      p.score = 0;
      p.lives = 3;
      p.answer = null;
      p.answeredAt = null;
      p.rematch = false;
    }
  }

  requestRematch(playerId) {
    if (this.players[playerId]) this.players[playerId].rematch = true;
  }

  async nextRound(dictionary) {
    this.currentRound++;
    for (const p of Object.values(this.players)) {
      p.answer = null;
      p.answeredAt = null;
    }

    let wordData;
    let attempts = 0;
    do {
      wordData = await dictionary.getRandomWord(this.config);
      attempts++;
    } while (this.usedWords.has(wordData.word) && attempts < 15);

    this.usedWords.add(wordData.word);
    this.currentWord = wordData;
    return wordData;
  }

  submitAnswer(playerId, answer, wpm = null) {
    if (!this.players[playerId]) return { success: false, error: 'Unknown player' };
    if (this.phase !== 'playing') return { success: false, error: 'Game not active' };
    if (this.players[playerId].answer !== null) return { success: false, error: 'Already submitted' };
    this.players[playerId].answer = String(answer).trim().toLowerCase();
    this.players[playerId].answeredAt = Date.now();
    this.players[playerId].wpm = (typeof wpm === 'number' && wpm >= 0) ? Math.round(wpm) : null;
    return { success: true };
  }

  bothAnswered() {
    return Object.values(this.players).every(p => p.answer !== null);
  }

  evaluateRound() {
    const correct = this.currentWord.word.toLowerCase();
    const results = {};

    for (const [id, p] of Object.entries(this.players)) {
      results[id] = {
        playerId: id,
        playerName: p.name,
        answer: p.answer,
        correct: p.answer === correct,
        wpm: p.wpm
      };
    }

    const ids = Object.keys(this.players);
    const [a, b] = ids;
    const ra = results[a];
    const rb = results[b];

    if (ra.correct && rb.correct) {
      // Both correct — tie round; award point to both (except sudden-death)
      if (this.config.mode !== 'sudden-death') {
        this.players[a].score++;
        this.players[b].score++;
      }
      ra.outcome = rb.outcome = 'tie';
    } else if (ra.correct && !rb.correct) {
      this.players[a].score++;
      this.players[b].lives = Math.max(0, this.players[b].lives - 1);
      ra.outcome = 'win';
      rb.outcome = 'loss';
    } else if (!ra.correct && rb.correct) {
      this.players[b].score++;
      this.players[a].lives = Math.max(0, this.players[a].lives - 1);
      rb.outcome = 'win';
      ra.outcome = 'loss';
    } else {
      // Both wrong
      if (this.config.mode === 'sudden-death') {
        this.players[a].lives = Math.max(0, this.players[a].lives - 1);
        this.players[b].lives = Math.max(0, this.players[b].lives - 1);
      }
      ra.outcome = rb.outcome = 'both-wrong';
    }

    return results;
  }

  isGameOver() {
    const players = Object.values(this.players);
    if (players.length < 2) return true;

    if (this.config.mode === 'rounds') {
      return this.currentRound >= this.config.maxRounds;
    }
    if (this.config.mode === 'points') {
      return players.some(p => p.score >= this.config.pointsToWin);
    }
    if (this.config.mode === 'sudden-death') {
      return players.some(p => p.lives <= 0);
    }
    return false;
  }

  getWinner() {
    const players = Object.values(this.players);
    if (this.config.mode === 'sudden-death') {
      const alive = players.filter(p => p.lives > 0);
      if (alive.length === 1) return { id: alive[0].id, name: alive[0].name };
      return null; // mutual elimination or nobody left
    }
    const sorted = [...players].sort((a, b) => b.score - a.score);
    if (sorted.length > 1 && sorted[0].score === sorted[1].score) return null;
    return { id: sorted[0].id, name: sorted[0].name };
  }

  getGameOverReason() {
    const reasons = { rounds: 'All rounds complete', points: 'Point target reached', 'sudden-death': 'Eliminated!' };
    return reasons[this.config.mode] || 'Game over';
  }

  getScores() {
    const out = {};
    for (const [id, p] of Object.entries(this.players)) out[id] = { id, name: p.name, score: p.score };
    return out;
  }

  getLives() {
    const out = {};
    for (const [id, p] of Object.entries(this.players)) out[id] = { id, name: p.name, lives: p.lives };
    return out;
  }

  toPublic() {
    return {
      code: this.code,
      hostId: this.hostId,
      players: Object.values(this.players).map(p => ({ id: p.id, name: p.name })),
      config: this.config,
      phase: this.phase
    };
  }
}

class RoomManager {
  constructor() {
    this.rooms = new Map();       // code → Room
    this.playerRooms = new Map(); // socketId → code
  }

  createRoom(hostId, hostName) {
    const room = new Room(hostId, hostName);
    while (this.rooms.has(room.code)) room.code = generateCode();
    this.rooms.set(room.code, room);
    this.playerRooms.set(hostId, room.code);
    return room;
  }

  joinRoom(code, playerId, playerName) {
    const room = this.rooms.get(code.toUpperCase().trim());
    if (!room) return { success: false, error: 'Room not found' };
    if (room.phase !== 'lobby') return { success: false, error: 'Game already in progress' };
    const result = room.addPlayer(playerId, playerName);
    if (!result.success) return result;
    this.playerRooms.set(playerId, room.code);
    return { success: true, room };
  }

  getRoomByPlayer(playerId) {
    const code = this.playerRooms.get(playerId);
    return code ? (this.rooms.get(code) || null) : null;
  }

  removePlayer(playerId) {
    const room = this.getRoomByPlayer(playerId);
    if (room) room.removePlayer(playerId);
    this.playerRooms.delete(playerId);
  }

  deleteRoom(code) {
    const room = this.rooms.get(code);
    if (room) {
      for (const id of Object.keys(room.players)) this.playerRooms.delete(id);
    }
    this.rooms.delete(code);
  }
}

module.exports = { RoomManager, Room };
