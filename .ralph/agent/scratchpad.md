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
