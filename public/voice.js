/* voice.js — WebRTC mesh voice chat (up to 8 peers) */
(function () {
  const ICE_CONFIG = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  let localStream = null;
  let peers = {};       // peerId → { pc: RTCPeerConnection, audio: HTMLAudioElement }
  let isEnabled = false;
  let isMuted = false;
  let _socket = null;

  async function _getLocalStream() {
    if (localStream) return localStream;
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    return localStream;
  }

  function _createPeerConnection(peerId) {
    if (peers[peerId]) return peers[peerId].pc;

    const pc = new RTCPeerConnection(ICE_CONFIG);
    const audio = new Audio();
    audio.autoplay = true;
    peers[peerId] = { pc, audio };

    if (localStream) {
      localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    }

    pc.ontrack = (ev) => {
      audio.srcObject = ev.streams[0];
    };

    pc.onicecandidate = (ev) => {
      if (ev.candidate && _socket) {
        _socket.emit('webrtc:ice-candidate', { targetId: peerId, candidate: ev.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (['closed', 'failed', 'disconnected'].includes(pc.connectionState)) {
        removePeer(peerId);
      }
    };

    return pc;
  }

  async function enable(socket) {
    _socket = socket;
    try {
      await _getLocalStream();
      if (isMuted) localStream.getAudioTracks().forEach(t => { t.enabled = false; });
      isEnabled = true;
      socket.emit('voice:join');
      return true;
    } catch (err) {
      console.warn('[Voice] Failed to get microphone:', err.message);
      return false;
    }
  }

  function disable(socket) {
    isEnabled = false;
    if (socket) socket.emit('voice:leave');
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream = null;
    }
    for (const peerId of Object.keys(peers)) removePeer(peerId);
  }

  function toggleMute() {
    isMuted = !isMuted;
    if (localStream) {
      localStream.getAudioTracks().forEach(t => { t.enabled = !isMuted; });
    }
    return isMuted;
  }

  async function handlePeerJoined(peerId) {
    if (!isEnabled || !_socket) return;
    // We are the existing peer — initiate the offer
    const pc = _createPeerConnection(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    _socket.emit('webrtc:offer', { targetId: peerId, offer: pc.localDescription });
  }

  async function handleOffer(fromId, offer) {
    if (!isEnabled || !_socket) return;
    const pc = _createPeerConnection(fromId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    _socket.emit('webrtc:answer', { targetId: fromId, answer: pc.localDescription });
  }

  async function handleAnswer(fromId, answer) {
    const entry = peers[fromId];
    if (!entry) return;
    await entry.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  async function handleIceCandidate(fromId, candidate) {
    const entry = peers[fromId];
    if (!entry) return;
    try {
      await entry.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.warn('[Voice] ICE candidate error:', e.message);
    }
  }

  function removePeer(peerId) {
    const entry = peers[peerId];
    if (entry) {
      entry.pc.close();
      if (entry.audio) {
        entry.audio.srcObject = null;
        entry.audio.remove();
      }
      delete peers[peerId];
    }
  }

  window.VoiceChat = {
    enable,
    disable,
    toggleMute,
    handlePeerJoined,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    removePeer,
    get isEnabled() { return isEnabled; },
    get isMuted() { return isMuted; }
  };
}());
