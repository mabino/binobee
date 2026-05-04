/* chat.js — In-game text chat sidebar */
(function () {
  let _socket = null;
  const { escHtml } = window.clientUtils;

  function init(socket) {
    _socket = socket;

    // Send on button click
    document.getElementById('btn-chat-send').addEventListener('click', sendMessage);

    // Send on Enter key
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    // Close sidebar
    document.getElementById('btn-chat-close').addEventListener('click', closeSidebar);

    // Open from lobby
    document.getElementById('btn-chat-lobby').addEventListener('click', openSidebar);

    // Open from game
    document.getElementById('btn-chat-game').addEventListener('click', openSidebar);

    // Receive messages
    socket.on('chat:message', renderMessage);
  }

  function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || !_socket) return;
    _socket.emit('chat:message', { text });
    input.value = '';
    input.focus();
  }

  function renderMessage({ playerName, text, timestamp }) {
    const container = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = 'chat-msg';
    const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    msg.innerHTML = `<span class="chat-name">${escHtml(playerName)}</span> <span class="chat-time">${time}</span><div class="chat-text">${escHtml(text)}</div>`;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;

    // Badge if sidebar is closed
    if (document.getElementById('chat-sidebar').classList.contains('hidden')) {
      const btns = document.querySelectorAll('#btn-chat-lobby, #btn-chat-game');
      btns.forEach(btn => btn.classList.add('has-badge'));
    }
  }

  function openSidebar() {
    document.getElementById('chat-sidebar').classList.remove('hidden');
    document.querySelectorAll('#btn-chat-lobby, #btn-chat-game').forEach(btn => btn.classList.remove('has-badge'));
    document.getElementById('chat-input').focus();
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
  }

  function closeSidebar() {
    document.getElementById('chat-sidebar').classList.add('hidden');
  }

  window.Chat = { init, openSidebar, closeSidebar };
}());
