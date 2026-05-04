# Agent Scratchpad

## Iteration 1 — 2026-05-04

### Objective
Build a head-to-head web spelling bee game ready for two-player testing.

### Plan
- Node.js + Express + Socket.io backend (single process, no external DB needed for v1)
- Vanilla JS + HTML/CSS frontend (zero build step, served as static files)
- Free Dictionary API for word definitions
- Built-in word list (~700 words across easy/medium/hard)
- Browser Web Speech API for TTS (server-side OpenAI/custom also supported)
- Game modes: rounds, points race, sudden death
- Custom dictionary upload from lobby
- Dockerfile + docker-compose for containerised deployment

### Architecture decisions
- No persistence: rooms live in server memory, resetting on restart (acceptable for v1 party game)
- Word kept secret client-side: sent in socket payload for browser TTS but never rendered in the DOM
- Timer managed server-side (authoritative) with client-side countdown for display

### Status
- All source files created in iteration 1
- Task: install deps, smoke test, commit

## Iteration 2 — 2026-05-04

### Verification
- node_modules: already installed (express@4.22.1, socket.io@4.8.3, nodemon@3.1.14)
- Smoke test on PORT=3001:
  - HTML served at `/` → HTTP 200 ✅
  - `/api/tts/config` → `{"serverTTS":false,"provider":"browser"}` ✅
  - `/socket.io/socket.io.js` → HTTP 200 ✅
- Git: commit `fcd5821` contains all source files
- Game is fully ready for two-player testing

### All objective requirements met
- ✅ Room code based head-to-head (Socket.io rooms)
- ✅ Timer-based spelling challenge (server-side authoritative timer)
- ✅ Spelling bee rules (correct vs incorrect = score/lives)
- ✅ Configurable modes: rounds / points-race / sudden-death
- ✅ Custom dictionary upload + 700-word built-in
- ✅ Word definition shown (Free Dictionary API with fallback)
- ✅ TTS: browser Web Speech API + optional OpenAI/custom server TTS
- ✅ Docker + docker-compose for deployment

### Status: COMPLETE
