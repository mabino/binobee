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

const { initials, escHtml, calcTimerState } = window.clientUtils;

// ── TTS init ───────────────────────────────────────────────────────────────
tts.init();

// ── Chat + Voice init ──────────────────────────────────────────────────────
Chat.init(socket);

socket.on('connect', () => { state.myId = socket.id; });

socket.on('tts:config', cfg => {
  tts.serverTTS = cfg.serverTTS === true;
});

// ══════════════════════════════════════════════════════════════════════════
//  LANDING SCREEN
// ══════════════════════════════════════════════════════════════════════════
$('btn-join-toggle').addEventListener('click', () => {
  $('join-form').classList.remove('hidden');
  $('main-actions').classList.add('hidden');
  $('landing-error').classList.add('hidden');
});

$('btn-join-back').addEventListener('click', () => {
  $('join-form').classList.add('hidden');
  $('main-actions').classList.remove('hidden');
  $('landing-error').classList.add('hidden');
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

// ── Lobby config controls ──────────────────────────────────────────────────
// Guard: prevent syncConfig from emitting while we're applying a remote config update.
// Without this, programmatic control changes (from applyConfigToControls) could
// trigger syncConfig in browsers that fire change/input events on programmatic value sets,
// causing a feedback loop that makes radio/select selections alternate rapidly.
let _applyingConfig = false;

function renderConfigUI() {
  const mode = document.querySelector('input[name="mode"]:checked')?.value || 'rounds';
  const maxRounds = parseInt($('cfg-max-rounds').value);
  const pointsToWin = parseInt($('cfg-points-to-win').value);
  const timerSeconds = parseInt($('cfg-timer').value);

  $('rounds-val').textContent = maxRounds;
  $('points-val').textContent = pointsToWin;
  $('timer-val').textContent  = timerSeconds;

  $('cfg-rounds').classList.toggle('hidden', mode !== 'rounds');
  $('cfg-points').classList.toggle('hidden', mode !== 'points');
}

function syncConfig() {
  if (_applyingConfig) return;
  renderConfigUI();

  const mode = document.querySelector('input[name="mode"]:checked')?.value || 'rounds';
  const maxRounds = parseInt($('cfg-max-rounds').value);
  const pointsToWin = parseInt($('cfg-points-to-win').value);
  const timerSeconds = parseInt($('cfg-timer').value);
  const difficulty = $('cfg-difficulty').value;
  const showWpm = $('cfg-show-wpm').checked;

  state.config = { mode, maxRounds, pointsToWin, timerSeconds, difficulty, showWpm };

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
  VoiceChat.disable(socket);
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
  // Host already has the latest values — skip to avoid an emit loop
  if (isHost()) return;
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
  _applyingConfig = true;
  try {
    if (cfg.mode) {
      const radio = document.querySelector(`input[name="mode"][value="${cfg.mode}"]`);
      if (radio) radio.checked = true;
    }
    if (cfg.maxRounds != null)   $('cfg-max-rounds').value   = cfg.maxRounds;
    if (cfg.pointsToWin != null) $('cfg-points-to-win').value = cfg.pointsToWin;
    if (cfg.timerSeconds != null) $('cfg-timer').value        = cfg.timerSeconds;
    if (cfg.difficulty)  $('cfg-difficulty').value            = cfg.difficulty;
    if (cfg.showWpm != null) $('cfg-show-wpm').checked        = cfg.showWpm;
    renderConfigUI(); // update labels/sections without emitting to server
  } finally {
    _applyingConfig = false;
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  GAME SCREEN
// ══════════════════════════════════════════════════════════════════════════
let timerMax = 30;
let roundStartTime = null;

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

// Track how many opponents have submitted this round
let opponentsAnswered = 0;
let totalOpponents = 0;

socket.on('game:round-start', data => {
  state.currentWord = data.ttsWord;
  state.submitted = false;
  timerMax = data.timerSeconds;
  roundStartTime = Date.now();
  opponentsAnswered = 0;
  totalOpponents = Object.keys(data.scores || {}).length - 1;

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
  const container = $('scores-container');
  if (!container) return;
  container.innerHTML = '';
  for (const p of Object.values(scores)) {
    const isMe = p.id === state.myId;
    const l = lives?.[p.id]?.lives;
    const box = document.createElement('div');
    box.className = `score-box${isMe ? ' is-me' : ''}`;
    box.innerHTML = `
      <div class="score-name">${escHtml(p.name)}${isMe ? ' <small style="color:var(--accent)">you</small>' : ''}</div>
      <div class="score-val">${p.score}</div>
      ${mode === 'sudden-death' && l != null ? `<div class="lives-row">${'❤️'.repeat(Math.max(0, l))}</div>` : ''}
    `;
    container.appendChild(box);
  }
}

socket.on('game:timer', ({ timeLeft }) => {
  setTimer(timeLeft, timerMax);
});

function setTimer(left, max) {
  $('timer-num').textContent = left;
  const { offset, urgent } = calcTimerState(left, max);
  $('timer-ring-fg').style.strokeDashoffset = offset;

  const wrap = $('screen-game').querySelector('.timer-wrap');
  wrap.classList.toggle('timer-urgent', urgent);
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

  const elapsedMs = roundStartTime ? Date.now() - roundStartTime : 0;
  const wpm = (elapsedMs > 0 && answer.length > 0)
    ? Math.min(300, Math.round((answer.length / 5) / (elapsedMs / 60000)))
    : null;

  state.submitted = true;
  $('answer-input').disabled = true;
  $('btn-submit').disabled = true;
  $('answer-wrap').classList.add('hidden');
  $('answer-submitted-msg').classList.remove('hidden');

  socket.emit('game:submit', { answer, wpm }, res => {
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
    opponentsAnswered++;
    const remaining = totalOpponents - opponentsAnswered;
    if (remaining > 0) {
      $('opponent-submitted-msg').textContent = `⏳ ${opponentsAnswered} of ${totalOpponents} opponents submitted…`;
    } else {
      $('opponent-submitted-msg').textContent = `⏳ All opponents submitted!`;
    }
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
        ${state.config.showWpm && r.wpm != null ? `<div class="wpm-tag">⚡ ${r.wpm} WPM</div>` : ''}
      </div>
    `;
    container.appendChild(card);
  }

  // Score summary — all players sorted by score
  const allPlayers = Object.values(scores).sort((a, b) => b.score - a.score);
  const mode = state.config.mode;
  $('result-scores').innerHTML = allPlayers.map((p, i) => `
    ${i > 0 ? '<div class="vs-sep">·</div>' : ''}
    <div class="score-item">
      <div class="sname">${escHtml(p.name)}${p.id === state.myId ? ' <small>(you)</small>' : ''}</div>
      <div class="sval">${p.score}</div>
      ${mode === 'sudden-death' && lives?.[p.id]?.lives != null ? `<div class="slives">${'❤️'.repeat(Math.max(0, lives[p.id].lives))}</div>` : ''}
    </div>
  `).join('');

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

  const allPlayers = Object.values(scores).sort((a, b) => b.score - a.score);
  const mode = state.config.mode;
  $('gameover-scores').innerHTML = allPlayers.map((p, i) => `
    ${i > 0 ? '<div class="vs-sep">·</div>' : ''}
    <div class="score-item">
      <div class="sname">${escHtml(p.name)}${p.id === state.myId ? ' (you)' : ''}</div>
      <div class="sval">${p.score}</div>
      ${mode === 'sudden-death' && lives?.[p.id]?.lives != null ? `<div class="slives">${'❤️'.repeat(Math.max(0, lives[p.id].lives))}</div>` : ''}
    </div>
  `).join('');

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
      $('rematch-status').textContent = '⏳ Waiting for other players…';
      $('rematch-status').classList.remove('hidden');
      $('btn-rematch').disabled = true;
    }
  });
});

$('btn-leave-gameover').addEventListener('click', () => {
  VoiceChat.disable(socket);
  socket.emit('room:leave');
  location.reload();
});

// ══════════════════════════════════════════════════════════════════════════
//  VOICE CHAT
// ══════════════════════════════════════════════════════════════════════════
$('btn-voice').addEventListener('click', async () => {
  const btn = $('btn-voice');
  if (!VoiceChat.isEnabled) {
    const ok = await VoiceChat.enable(socket);
    if (ok) {
      btn.textContent = '🎤 Mute';
      btn.classList.add('voice-active');
    } else {
      btn.textContent = '🎤 Denied';
    }
  } else {
    const muted = VoiceChat.toggleMute();
    btn.textContent = muted ? '🔇 Unmute' : '🎤 Mute';
  }
});

// WebRTC socket events
socket.on('voice:peer-joined', ({ peerId }) => {
  VoiceChat.handlePeerJoined(peerId);
});

socket.on('voice:peer-left', ({ peerId }) => {
  VoiceChat.removePeer(peerId);
});

socket.on('webrtc:offer', ({ fromId, offer }) => {
  VoiceChat.handleOffer(fromId, offer);
});

socket.on('webrtc:answer', ({ fromId, answer }) => {
  VoiceChat.handleAnswer(fromId, answer);
});

socket.on('webrtc:ice-candidate', ({ fromId, candidate }) => {
  VoiceChat.handleIceCandidate(fromId, candidate);
});

// ── Error handler ──────────────────────────────────────────────────────────
socket.on('error', ({ message }) => {
  alert(message);
});

socket.on('disconnect', () => {
  console.warn('Disconnected from server');
});

// ══════════════════════════════════════════════════════════════════════════
//  BACKGROUND THEME PICKER
// ══════════════════════════════════════════════════════════════════════════
(function initBgPicker() {
  const stored = localStorage.getItem('bgTheme') || 'none';

  function applyBgTheme(theme) {
    if (theme === 'none') {
      document.body.removeAttribute('data-bg');
    } else {
      document.body.setAttribute('data-bg', theme);
    }
    localStorage.setItem('bgTheme', theme);
    document.querySelectorAll('.bg-preset').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.bg === theme);
    });
  }

  applyBgTheme(stored);

  $('btn-bg-toggle').addEventListener('click', e => {
    e.stopPropagation();
    $('bg-picker-menu').classList.toggle('hidden');
  });

  document.querySelectorAll('.bg-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      applyBgTheme(btn.dataset.bg);
      $('bg-picker-menu').classList.add('hidden');
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#bg-picker')) {
      $('bg-picker-menu').classList.add('hidden');
    }
  });
})();
