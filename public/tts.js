/**
 * tts.js — Text-to-speech abstraction.
 *
 * Uses server-side TTS (OpenAI / custom endpoint) when configured,
 * and falls back to the browser's Web Speech API.
 */
class TTS {
  constructor() {
    this.serverTTS = false;
    this.synth = window.speechSynthesis || null;
    this._voice = null;
    this._initVoice();
  }

  _initVoice() {
    if (!this.synth) return;
    const pick = () => {
      const voices = this.synth.getVoices();
      this._voice = voices.find(v => v.lang === 'en-US') ||
                    voices.find(v => v.lang.startsWith('en-')) ||
                    voices[0] || null;
    };
    pick();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = pick;
    }
  }

  async init() {
    try {
      const res = await fetch('/api/tts/config');
      const cfg = await res.json();
      this.serverTTS = cfg.serverTTS === true;
    } catch (_) {
      this.serverTTS = false;
    }
  }

  async speak(word) {
    if (this.serverTTS) {
      const ok = await this._speakServer(word);
      if (ok) return;
    }
    this._speakBrowser(word);
  }

  async _speakServer(word) {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: word })
      });
      if (!res.ok) return false;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      return new Promise(resolve => {
        audio.onended = () => { URL.revokeObjectURL(url); resolve(true); };
        audio.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
        audio.play().catch(() => resolve(false));
      });
    } catch (_) {
      return false;
    }
  }

  _speakBrowser(word) {
    if (!this.synth) return;
    this.synth.cancel();
    const utt = new SpeechSynthesisUtterance(word);
    utt.rate = 0.82;
    utt.pitch = 1;
    utt.volume = 1;
    if (this._voice) utt.voice = this._voice;
    this.synth.speak(utt);
  }

  cancel() {
    if (this.synth) this.synth.cancel();
  }
}

window.tts = new TTS();
