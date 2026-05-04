/* ─────────────────────────────────────────────────────────────────────────
 *  app.js — client-side game logic
 * ───────────────────────────────────────────────────────────────────────── */

const socket = io();

// ── State ──────────────────────────────────────────────────────────────────
const state = {
  myId: socket.id,
  myName: '',
  room: null,
  config: {},
  timerMax: 30,
  currentWord: null,   // for TTS only; never displayed
  submitted: false
};

// ── Helpers ────────────────────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(`screen-${name}`).classList.add('active');
}

function showError(id, msg) {
  const el = $(id);
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

// ── TTS init ───────────────────────────────────────────────────────────────
tts.init();

socket.on('connect', () => { state.myId = socket.id; });

socket.on('tts:config', cfg => {
  tts.serverTTS = cfg.serverTTS === true;
});

// ══════════════════════════════════════════════════════════════════════════
//  LANDING SCREEN
// ══════════════════════════════════════════════════════════════════════════
$('btn-join-toggle').addEventListener('click', () => {
  $('join-form').classList.toggle('hidden');
});

$('btn-create').addEventListener('click', () => {
  const name = $('player-name').value.trim();
  if (!name) { showError('landing-error', 'Please enter your name.'); return; }
  state.myName = name;
  socket.emit('room:create', { playerName: name }, res => {
    if (!res.success) { showError('landing-error', res.error); return; }
    state.room = res.room;
    enterLobby();
  });
});

$('btn-join').addEventListener('click', () => {
  const name = $('player-name').value.trim();
  const code = $('room-code-input').value.trim().toUpperCase();
  if (!name) { showError('landing-error', 'Please enter your name.'); return; }
  if (!code) { showError('landing-error', 'Please enter a room code.'); return; }
  state.myName = name;
  socket.emit('room:join', { code, playerName: name }, res => {
    if (!res.success) { showError('landing-error', res.error); return; }
    state.room = res.room;
    enterLobby();
  });
});

// allow Enter key on code input
$('room-code-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('btn-join').click();
});
$('player-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('btn-create').click();
});

// ══════════════════════════════════════════════════════════════════════════
//  LOBBY SCREEN
// ══════════════════════════════════════════════════════════════════════════
function isHost() { return state.room?.hostId === state.myId; }

function enterLobby() {
  state.config = state.room.config || {};
  renderLobby();
  showScreen('lobby');
}

function renderLobby() {
  const room = state.room;
  $('lobby-code').textContent = room.code;
  renderPlayerList(room.players);

  const host = isHost();
  $('lobby-config').classList.toggle('hidden', !host);
  $('lobby-waiting').classList.toggle('hidden', host);
  $('btn-start').classList.toggle('hidden', !host || room.players.length < 2);
}

function renderPlayerList(players) {
  const el = $('lobby-players');
  el.innerHTML = '';
  for (const p of players) {
    const row = document.createElement('div');
    row.className = 'player-row';
    row.innerHTML = `
      <div class="player-avatar">${initials(p.name)}</div>
      <span class="player-name">${escHtml(p.name)}</span>
      ${p.id === state.room.hostId ? '<span class="player-badge">👑 Host</span>' : ''}
      ${p.id === state.myId ? '<span class="player-badge" style="color:var(--accent)">You</span>' : ''}
    `;
    el.appendChild(row);
  }
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Lobby config controls ──────────────────────────────────────────────────
function syncConfig() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value || 'rounds';
  const maxRounds = parseInt($('cfg-max-rounds').value);
  const pointsToWin = parseInt($('cfg-points-to-win').value);
  const timerSeconds = parseInt($('cfg-timer').value);
  const difficulty = $('cfg-difficulty').value;

  $('rounds-val').textContent = maxRounds;
  $('points-val').textContent = pointsToWin;
  $('timer-val').textContent  = timerSeconds;

  $('cfg-rounds').classList.toggle('hidden', mode !== 'rounds');
  $('cfg-points').classList.toggle('hidden', mode !== 'points');

  state.config = { mode, maxRounds, pointsToWin, timerSeconds, difficulty };

  socket.emit('game:configure', { config: state.config }, () => {});
}

document.querySelectorAll('input[name="mode"]').forEach(r => r.addEventListener('change', syncConfig));
$('cfg-max-rounds').addEventListener('input', syncConfig);
$('cfg-points-to-win').addEventListener('input', syncConfig);
$('cfg-timer').addEventListener('input', syncConfig);
$('cfg-difficulty').addEventListener('change', syncConfig);

// ── Dictionary upload ──────────────────────────────────────────────────────
$('btn-upload-dict').addEventListener('click', () => {
  const raw = $('custom-words').value;
  const words = raw.split(/[\n,]+/).map(w => w.trim()).filter(Boolean);
  if (words.length < 5) {
    $('dict-status').textContent = '⚠ Need at least 5 words.';
    return;
  }
  socket.emit('game:upload-dictionary', { words }, res => {
    if (res.success) {
      $('dict-status').textContent = `✅ ${res.wordCount} words loaded.`;
    } else {
      $('dict-status').textContent = `⚠ ${res.error}`;
    }
  });
});

$('btn-clear-dict').addEventListener('click', () => {
  $('custom-words').value = '';
  socket.emit('game:clear-dictionary', res => {
    $('dict-status').textContent = res.success ? '✅ Using built-in dictionary.' : `⚠ ${res.error}`;
  });
});

$('btn-copy-code').addEventListener('click', () => {
  navigator.clipboard?.writeText(state.room?.code || '').then(() => {
    $('btn-copy-code').textContent = '✅';
    setTimeout(() => { $('btn-copy-code').textContent = '📋'; }, 1500);
  });
});

$('btn-start').addEventListener('click', () => {
  socket.emit('game:start', res => {
    if (!res.success) showError('lobby-error', res.error);
  });
});

$('btn-leave-lobby').addEventListener('click', () => {
  socket.emit('room:leave');
  location.reload();
});

// ── Lobby socket events ────────────────────────────────────────────────────
socket.on('room:updated', room => {
  state.room = room;
  if (document.getElementById('screen-lobby').classList.contains('active')) {
    renderLobby();
  }
});

socket.on('room:player-left', ({ playerName }) => {
  // handled via room:updated
  console.log(`${playerName} left`);
});

socket.on('game:configured', ({ config }) => {
  state.config = config;
  // Sync sliders if I'm not the host
  if (!isHost()) return;
  applyConfigToControls(config);
});

socket.on('game:dictionary-updated', ({ wordCount, custom }) => {
  if (isHost()) {
    $('dict-status').textContent = custom
      ? `✅ ${wordCount} custom words active.`
      : '✅ Using built-in dictionary.';
  }
});

function applyConfigToControls(cfg) {
  if (cfg.mode) {
    const radio = document.querySelector(`input[name="mode"][value="${cfg.mode}"]`);
    if (radio) radio.checked = true;
  }
  if (cfg.maxRounds)   $('cfg-max-rounds').value   = cfg.maxRounds;
  if (cfg.pointsToWin) $('cfg-points-to-win').value = cfg.pointsToWin;
  if (cfg.timerSeconds)$('cfg-timer').value          = cfg.timerSeconds;
  if (cfg.difficulty)  $('cfg-difficulty').value     = cfg.difficulty;
  syncConfig();
}

// ══════════════════════════════════════════════════════════════════════════
//  GAME SCREEN
// ══════════════════════════════════════════════════════════════════════════
let timerCircumference = 276.46; // 2πr where r=44
let timerMax = 30;

socket.on('game:started', ({ config }) => {
  state.config = config;
  timerMax = config.timerSeconds;
  showScreen('game');
  updateModeBadge(config.mode);
});

function updateModeBadge(mode) {
  const labels = { rounds: '📋 Rounds', points: '🏅 Points Race', 'sudden-death': '💀 Sudden Death' };
  $('mode-badge').textContent = labels[mode] || mode;
}

socket.on('game:round-start', data => {
  state.currentWord = data.ttsWord;
  state.submitted = false;
  timerMax = data.timerSeconds;

  // Update round label
  if (data.mode === 'rounds' && data.totalRounds) {
    $('round-label').textContent = `Round ${data.round} / ${data.totalRounds}`;
  } else {
    $('round-label').textContent = `Round ${data.round}`;
  }

  // Scores
  updateScoreBoxes(data.scores, data.lives, data.mode);

  // Clues
  $('clue-pos').textContent  = data.partOfSpeech || '';
  $('clue-pos').style.display = data.partOfSpeech ? '' : 'none';
  $('clue-phonetic').textContent = data.phonetic || '';
  $('clue-definition').textContent = data.definition || '';

  if (data.example) {
    $('clue-example').textContent = `"${data.example}"`;
    $('clue-example').classList.remove('hidden');
  } else {
    $('clue-example').classList.add('hidden');
  }

  // Reset input
  $('answer-input').value = '';
  $('answer-input').disabled = false;
  $('btn-submit').disabled = false;
  $('answer-wrap').classList.remove('hidden');
  $('answer-submitted-msg').classList.add('hidden');
  $('opponent-submitted-msg').classList.add('hidden');

  // Timer reset
  setTimer(data.timerSeconds, data.timerSeconds);

  // Auto-speak word
  setTimeout(() => tts.speak(data.ttsWord), 300);

  showScreen('game');
});

function updateScoreBoxes(scores, lives, mode) {
  const players = Object.values(scores);
  if (players.length < 2) return;

  // Identify which player is me and which is opponent
  const me = players.find(p => p.id === state.myId);
  const opp = players.find(p => p.id !== state.myId);
  if (!me || !opp) return;

  const meL  = lives?.[me.id]?.lives;
  const oppL = lives?.[opp.id]?.lives;

  $('score-a').innerHTML = `
    <div class="score-name">${escHtml(me.name)} <span style="color:var(--accent);font-size:.7rem">You</span></div>
    <div class="score-val">${me.score}</div>
    ${mode === 'sudden-death' && meL != null ? `<div class="lives-row">${'❤️'.repeat(Math.max(0, meL))}</div>` : ''}
  `;
  $('score-b').innerHTML = `
    <div class="score-name" style="text-align:right">${escHtml(opp.name)}</div>
    <div class="score-val">${opp.score}</div>
    ${mode === 'sudden-death' && oppL != null ? `<div class="lives-row" style="text-align:right">${'❤️'.repeat(Math.max(0, oppL))}</div>` : ''}
  `;
}

socket.on('game:timer', ({ timeLeft }) => {
  setTimer(timeLeft, timerMax);
});

function setTimer(left, max) {
  $('timer-num').textContent = left;
  const pct = max > 0 ? left / max : 0;
  const offset = timerCircumference * (1 - pct);
  $('timer-ring-fg').style.strokeDashoffset = offset;

  const wrap = $('screen-game').querySelector('.timer-wrap');
  wrap.classList.toggle('timer-urgent', left <= 5 && left > 0);
}

// ── Answer submission ──────────────────────────────────────────────────────
$('btn-submit').addEventListener('click', submitAnswer);
$('answer-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitAnswer();
});

function submitAnswer() {
  if (state.submitted) return;
  const answer = $('answer-input').value.trim();
  if (!answer) return;

  state.submitted = true;
  $('answer-input').disabled = true;
  $('btn-submit').disabled = true;
  $('answer-wrap').classList.add('hidden');
  $('answer-submitted-msg').classList.remove('hidden');

  socket.emit('game:submit', { answer }, res => {
    if (!res.success) {
      showError('landing-error', res.error || 'Submit failed');
      // allow re-submit
      state.submitted = false;
      $('answer-input').disabled = false;
      $('btn-submit').disabled = false;
      $('answer-wrap').classList.remove('hidden');
      $('answer-submitted-msg').classList.add('hidden');
    }
  });
}

socket.on('game:answer-in', ({ playerId }) => {
  if (playerId !== state.myId) {
    $('opponent-submitted-msg').classList.remove('hidden');
  }
});

// ── TTS button ─────────────────────────────────────────────────────────────
$('btn-hear').addEventListener('click', () => {
  if (state.currentWord) tts.speak(state.currentWord);
});

// ══════════════════════════════════════════════════════════════════════════
//  ROUND RESULT SCREEN
// ══════════════════════════════════════════════════════════════════════════
socket.on('game:round-result', ({ word, results, scores, lives }) => {
  tts.cancel();

  $('result-word').textContent = word;

  // Render each player's result card
  const container = $('result-cards');
  container.innerHTML = '';
  for (const r of Object.values(results)) {
    const isMe = r.playerId === state.myId;
    const card = document.createElement('div');
    card.className = `result-card ${r.outcome}`;

    const icon = r.outcome === 'win' ? '✅' :
                 r.outcome === 'loss' ? '❌' :
                 r.outcome === 'tie' ? '🤝' : '😬';

    const answerClass = r.correct ? 'correct' : 'wrong';

    card.innerHTML = `
      <div class="result-icon">${icon}</div>
      <div class="result-info">
        <div class="result-pname">${escHtml(r.playerName)}${isMe ? ' <span style="color:var(--accent);font-size:.75rem">(you)</span>' : ''}</div>
        <div class="result-answer"><span class="${answerClass}">${escHtml(r.answer || '(no answer)')}</span></div>
      </div>
    `;
    container.appendChild(card);
  }

  // Score summary
  const players = Object.values(scores);
  const me  = players.find(p => p.id === state.myId);
  const opp = players.find(p => p.id !== state.myId);
  if (me && opp) {
    const mode = state.config.mode;
    const meL  = lives?.[me.id]?.lives;
    const oppL = lives?.[opp.id]?.lives;
    $('result-scores').innerHTML = `
      <div class="score-item">
        <div class="sname">${escHtml(me.name)}</div>
        <div class="sval">${me.score}</div>
        ${mode === 'sudden-death' && meL != null ? `<div class="slives">${'❤️'.repeat(Math.max(0,meL))}</div>` : ''}
      </div>
      <div class="vs-sep">vs</div>
      <div class="score-item">
        <div class="sname">${escHtml(opp.name)}</div>
        <div class="sval">${opp.score}</div>
        ${mode === 'sudden-death' && oppL != null ? `<div class="slives">${'❤️'.repeat(Math.max(0,oppL))}</div>` : ''}
      </div>
    `;
  }

  showScreen('result');
});

// ══════════════════════════════════════════════════════════════════════════
//  GAME OVER SCREEN
// ══════════════════════════════════════════════════════════════════════════
socket.on('game:over', ({ winner, scores, lives, reason }) => {
  tts.cancel();

  const iWon   = winner && winner.id === state.myId;
  const isTie  = !winner;
  const disconnected = reason === 'opponent-disconnected';

  if (disconnected) {
    $('gameover-headline').textContent = '🚪 Opponent disconnected — you win!';
  } else if (isTie) {
    $('gameover-headline').textContent = "🤝 It's a Tie!";
  } else if (iWon) {
    $('gameover-headline').textContent = '🎉 You Win!';
  } else {
    $('gameover-headline').textContent = `🏆 ${escHtml(winner.name)} Wins!`;
  }

  $('gameover-reason').textContent = reason || '';

  const players = Object.values(scores);
  const me  = players.find(p => p.id === state.myId);
  const opp = players.find(p => p.id !== state.myId);
  if (me && opp) {
    const mode = state.config.mode;
    const meL  = lives?.[me.id]?.lives;
    const oppL = lives?.[opp.id]?.lives;
    $('gameover-scores').innerHTML = `
      <div class="score-item">
        <div class="sname">${escHtml(me.name)} (you)</div>
        <div class="sval">${me.score}</div>
        ${mode === 'sudden-death' && meL != null ? `<div class="slives">${'❤️'.repeat(Math.max(0,meL))}</div>` : ''}
      </div>
      <div class="vs-sep">vs</div>
      <div class="score-item">
        <div class="sname">${escHtml(opp.name)}</div>
        <div class="sval">${opp.score}</div>
        ${mode === 'sudden-death' && oppL != null ? `<div class="slives">${'❤️'.repeat(Math.max(0,oppL))}</div>` : ''}
      </div>
    `;
  }

  $('rematch-status').classList.add('hidden');
  showScreen('gameover');
});

socket.on('game:rematch-requested', ({ playerName }) => {
  $('rematch-status').textContent = `${escHtml(playerName)} wants a rematch…`;
  $('rematch-status').classList.remove('hidden');
});

socket.on('game:started', ({ config }) => {
  // also handles rematch re-start
  state.config = config;
  timerMax = config.timerSeconds;
  updateModeBadge(config.mode);
});

$('btn-rematch').addEventListener('click', () => {
  socket.emit('game:rematch', res => {
    if (res?.success) {
      $('rematch-status').textContent = '⏳ Waiting for opponent…';
      $('rematch-status').classList.remove('hidden');
      $('btn-rematch').disabled = true;
    }
  });
});

$('btn-leave-gameover').addEventListener('click', () => {
  socket.emit('room:leave');
  location.reload();
});

// ── Error handler ──────────────────────────────────────────────────────────
socket.on('error', ({ message }) => {
  alert(message);
});

socket.on('disconnect', () => {
  console.warn('Disconnected from server');
});
