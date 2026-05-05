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

function updateVoiceBtns() {
  const btns = [$('btn-voice'), $('btn-voice-lobby')];
  if (VoiceChat.isEnabled) {
    const label = VoiceChat.isMuted ? '🔇 Unmute' : '🎤 Mute';
    btns.forEach(btn => {
      if (!btn) return;
      btn.textContent = label;
      btn.classList.add('voice-active');
    });
  } else {
    btns.forEach(btn => {
      if (!btn) return;
      btn.textContent = '🎤 Voice';
      btn.classList.remove('voice-active');
    });
  }
}

async function handleVoiceBtnClick() {
  if (!VoiceChat.isEnabled) {
    const ok = await VoiceChat.enable(socket);
    if (!ok) {
      [$('btn-voice'), $('btn-voice-lobby')].forEach(btn => {
        if (btn) btn.textContent = '🎤 Denied';
      });
      return;
    }
  } else {
    VoiceChat.toggleMute();
  }
  updateVoiceBtns();
}

$('btn-voice').addEventListener('click', handleVoiceBtnClick);
$('btn-voice-lobby').addEventListener('click', handleVoiceBtnClick);

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
//  CANVAS BACKGROUND: STARFIELD
// ══════════════════════════════════════════════════════════════════════════
function initStarsCanvas() {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
  document.body.insertBefore(canvas, document.body.firstChild);
  const ctx = canvas.getContext('2d');

  let animId;
  let layers = [];

  function genLayer(count, minR, maxR, speed, baseAlpha) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      const rnd = Math.random();
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: minR + Math.random() * (maxR - minR),
        alpha: baseAlpha * (0.35 + Math.random() * 0.65),
        twinkleSpeed: 0.4 + Math.random() * 2.0,
        twinklePhase: Math.random() * Math.PI * 2,
        color: rnd > 0.88 ? [180, 215, 255] : rnd > 0.76 ? [255, 228, 160] : [255, 255, 255],
      });
    }
    return { stars, speed, offset: 0 };
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const area = canvas.width * canvas.height;
    layers = [
      genLayer(Math.floor(area / 4500), 0.25, 0.75, 0.10, 0.45),
      genLayer(Math.floor(area / 7500), 0.50, 1.20, 0.20, 0.72),
      genLayer(Math.floor(area / 14000), 0.90, 2.20, 0.34, 1.00),
    ];
  }

  window.addEventListener('resize', resize);
  resize();

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 0.016;

    for (const layer of layers) {
      layer.offset = (layer.offset + layer.speed) % canvas.width;
      for (const s of layer.stars) {
        const x = (s.x * canvas.width + layer.offset) % canvas.width;
        const y = s.y * canvas.height;
        const twinkle = 0.55 + 0.45 * Math.sin(t * s.twinkleSpeed + s.twinklePhase);
        const alpha = s.alpha * twinkle;
        const [r, g, b] = s.color;

        if (s.r > 1.1 && alpha > 0.45) {
          const grd = ctx.createRadialGradient(x, y, s.r * 0.4, x, y, s.r * 4.5);
          grd.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
          grd.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(x, y, s.r * 4.5, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      }
    }

    animId = requestAnimationFrame(draw);
  }

  draw();

  return function destroy() {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    canvas.remove();
  };
}

// ══════════════════════════════════════════════════════════════════════════
//  CANVAS BACKGROUND: CIRCUIT WITH RACING ELECTRICITY
// ══════════════════════════════════════════════════════════════════════════
function initCircuitCanvas() {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
  document.body.insertBefore(canvas, document.body.firstChild);
  const ctx = canvas.getContext('2d');

  const GRID = 75;
  const CA = [249, 199, 79];  // amber
  const CW = [255, 242, 180]; // bright white-yellow

  function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

  let animId, gridW, gridH, bolts = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gridW = Math.ceil(canvas.width / GRID) + 2;
    gridH = Math.ceil(canvas.height / GRID) + 2;
  }

  window.addEventListener('resize', resize);
  resize();

  function generatePath() {
    const points = [{ x: Math.floor(Math.random() * gridW) * GRID, y: Math.floor(Math.random() * gridH) * GRID }];
    let cx = points[0].x, cy = points[0].y, lastDir = null;
    const numSeg = 2 + Math.floor(Math.random() * 5);
    const DIRS = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];

    for (let i = 0; i < numSeg; i++) {
      let dirs = DIRS.filter(d => !lastDir || !(d.dx === -lastDir.dx && d.dy === -lastDir.dy));
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      const cells = 1 + Math.floor(Math.random() * 5);
      cx += dir.dx * cells * GRID;
      cy += dir.dy * cells * GRID;
      points.push({ x: cx, y: cy });
      lastDir = dir;
    }
    return points;
  }

  function pathLength(path) {
    let len = 0;
    for (let i = 1; i < path.length; i++) len += Math.hypot(path[i].x - path[i-1].x, path[i].y - path[i-1].y);
    return len;
  }

  function posOnPath(path, pos) {
    let rem = pos;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i-1].x, dy = path[i].y - path[i-1].y;
      const seg = Math.hypot(dx, dy);
      if (rem <= seg) { const t = rem / seg; return { x: path[i-1].x + dx * t, y: path[i-1].y + dy * t }; }
      rem -= seg;
    }
    return path[path.length - 1];
  }

  function buildTrailPath(b, tp, hp) {
    ctx.beginPath();
    let cumLen = 0, first = true;
    for (let i = 1; i < b.path.length; i++) {
      const prev = b.path[i-1], curr = b.path[i];
      const dx = curr.x - prev.x, dy = curr.y - prev.y;
      const seg = Math.hypot(dx, dy), segEnd = cumLen + seg;
      if (segEnd < tp) { cumLen = segEnd; continue; }
      if (cumLen > hp) break;
      const t1 = Math.max(0, (tp - cumLen) / seg), t2 = Math.min(1, (hp - cumLen) / seg);
      const x1 = prev.x + dx * t1, y1 = prev.y + dy * t1, x2 = prev.x + dx * t2, y2 = prev.y + dy * t2;
      if (first) { ctx.moveTo(x1, y1); first = false; } else ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      cumLen = segEnd;
    }
  }

  function spawnBolt() {
    const path = generatePath();
    bolts.push({ path, totalLen: pathLength(path), pos: 0, speed: 3 + Math.random() * 6, trailLen: 70 + Math.random() * 80, width: 1 + Math.random() * 1.5, alpha: 1 });
  }

  function drawGrid() {
    ctx.lineCap = 'square';
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgba(CA, 0.09);
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += GRID) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
    for (let y = 0; y <= canvas.height; y += GRID) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
    ctx.stroke();

    const MINOR = 15;
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = rgba(CA, 0.04);
    ctx.beginPath();
    for (let x = MINOR; x < canvas.width; x += MINOR) { if (x % GRID !== 0) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); } }
    for (let y = MINOR; y < canvas.height; y += MINOR) { if (y % GRID !== 0) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); } }
    ctx.stroke();

    ctx.fillStyle = rgba(CA, 0.15);
    for (let x = 0; x <= canvas.width; x += GRID) {
      for (let y = 0; y <= canvas.height; y += GRID) {
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function drawBolt(b) {
    const hp = Math.min(b.pos, b.totalLen);
    const tp = Math.max(0, hp - b.trailLen);
    if (hp <= tp) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    buildTrailPath(b, tp, hp);
    ctx.lineWidth = b.width * 7;
    ctx.strokeStyle = rgba(CA, b.alpha * 0.10);
    ctx.stroke();

    buildTrailPath(b, tp, hp);
    ctx.lineWidth = b.width * 3.5;
    ctx.strokeStyle = rgba(CA, b.alpha * 0.30);
    ctx.stroke();

    buildTrailPath(b, tp, hp);
    ctx.lineWidth = b.width;
    ctx.strokeStyle = rgba(CW, b.alpha * 0.92);
    ctx.stroke();

    if (b.pos <= b.totalLen + b.speed * 2) {
      const head = posOnPath(b.path, hp);
      const grd = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, b.width * 7);
      grd.addColorStop(0, `rgba(255,255,255,${b.alpha})`);
      grd.addColorStop(0.25, rgba(CW, b.alpha * 0.85));
      grd.addColorStop(0.55, rgba(CA, b.alpha * 0.45));
      grd.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(head.x, head.y, b.width * 7, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
    }

    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    if (Math.random() < 0.045 && bolts.length < 18) spawnBolt();

    bolts = bolts.filter(b => b.alpha > 0.02);
    for (const b of bolts) {
      b.pos += b.speed;
      if (b.pos > b.totalLen + b.trailLen) b.alpha -= 0.03;
      drawBolt(b);
    }

    animId = requestAnimationFrame(draw);
  }

  draw();

  return function destroy() {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    canvas.remove();
  };
}

// ══════════════════════════════════════════════════════════════════════════
//  BACKGROUND THEME PICKER
// ══════════════════════════════════════════════════════════════════════════
(function initBgPicker() {
  const stored = localStorage.getItem('bgTheme') || 'none';

  function applyBgTheme(theme) {
    if (window._bgCanvasDestroy) {
      window._bgCanvasDestroy();
      window._bgCanvasDestroy = null;
    }

    if (theme === 'none') {
      document.body.removeAttribute('data-bg');
    } else {
      document.body.setAttribute('data-bg', theme);
    }
    localStorage.setItem('bgTheme', theme);
    document.querySelectorAll('.bg-preset').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.bg === theme);
    });

    if (theme === 'stars') {
      window._bgCanvasDestroy = initStarsCanvas();
    } else if (theme === 'circuit') {
      window._bgCanvasDestroy = initCircuitCanvas();
    }
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
