# 🐝 Spelling Bee — Head-to-Head

A real-time two-player spelling bee game built with Node.js and Socket.IO. Two players compete to correctly spell words as fast as possible, hearing each word read aloud before typing their answer.

---

## Table of Contents

1. [Player Guide](#player-guide)
2. [Game Modes](#game-modes)
3. [Scoring & Lives](#scoring--lives)
4. [Difficulty Levels](#difficulty-levels)
5. [Text-to-Speech (TTS)](#text-to-speech-tts)
6. [Quick Start (Local)](#quick-start-local)
7. [Docker Deployment](#docker-deployment)
8. [Running Tests](#running-tests)
9. [Project Structure](#project-structure)
10. [Environment Variables](#environment-variables)

---

## Player Guide

### Starting a Game

1. **Open the app** in your browser at `http://localhost:3000`.
2. **Enter your name** in the *Your Name* field.
3. Choose to **Create Room** or **Join Room**.
   - **Create Room** – you become the host and receive a 6-character room code (e.g., `KR7PAN`). Share this code with your opponent.
   - **Join Room** – enter the room code your opponent shared, then click **Join**.

### In the Lobby (Host Controls)

Once two players are in the lobby the host can configure the game before starting:

| Setting | Options | Default |
|---|---|---|
| **Game Mode** | Rounds / Points Race / Sudden Death | Rounds |
| **Number of Rounds** | 3–30 | 10 |
| **Points to Win** | 3–20 | 5 |
| **Timer** | 10–90 seconds | 30 s |
| **Difficulty** | Easy / Medium / Hard / Mixed | Mixed |

The host can also upload a **Custom Dictionary** — paste words separated by newlines or commas (minimum 5 words). Click *Use Built-in* to revert to the built-in word lists.

When ready, the host clicks **Start Game 🚀**.

### Playing a Round

1. The round begins and the word is **spoken aloud** automatically via Text-to-Speech.
2. A clue card shows the word's **definition**, **phonetic pronunciation**, **part of speech**, and (when available) an **example sentence** — but never the word itself.
3. Click 🔊 at any time to **hear the word again**.
4. **Type your spelling** in the answer box and press **Submit** (or hit Enter).
5. Once submitted you cannot change your answer. Wait for your opponent to submit or for the timer to run out.
6. After both players have submitted (or the timer expires), the **Round Result** screen reveals the correct spelling, each player's answer, and the updated scores.

### Game Over

The game ends according to the selected mode (see [Game Modes](#game-modes)). The **Game Over** screen shows the winner's name and final scores. Both players can click **Play Again 🔄** to start a rematch in the same room with the same settings.

---

## Game Modes

### Rounds Mode
Play a fixed number of rounds (default 10). The player with the most points when all rounds are complete wins. Ties are possible.

### Points Race
First player to reach the target score (default 5 points) wins. The game can end mid-round as soon as the target is reached.

### Sudden Death
Each player starts with **3 lives ❤️❤️❤️**. A wrong answer costs you a life. Lose all 3 lives and you're out. If both players lose their last life in the same round, the game is a tie.

---

## Scoring & Lives

| Situation | Points | Lives |
|---|---|---|
| You spell correctly, opponent doesn't | +1 (you) | –1 (opponent) |
| Opponent spells correctly, you don't | +1 (opponent) | –1 (you) |
| Both correct | +1 each (except Sudden Death) | no change |
| Both wrong | no points | –1 each (Sudden Death only) |
| Timer expires (no answer) | treated as empty answer | as above |

---

## Difficulty Levels

| Level | Description |
|---|---|
| **Easy** | Short, common English words (3–5 letters) |
| **Medium** | Intermediate vocabulary; academic and everyday words |
| **Hard** | Challenging words including tricky spellings and long words |
| **Mixed** | Mostly medium/hard words with a small set of easy words |

When a **Custom Dictionary** is active, the difficulty setting is ignored.

---

## Text-to-Speech (TTS)

By default the game uses the **browser's built-in Web Speech API** — no configuration required.

For a more consistent voice across all players and browsers, you can configure a server-side TTS provider via environment variables (see [Environment Variables](#environment-variables)).

---

## Quick Start (Local)

**Prerequisites:** Node.js ≥ 18

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open two browser tabs/windows
open http://localhost:3000
```

For live-reload during development:

```bash
npm run dev
```

---

## Docker Deployment

```bash
# Build and start with Docker Compose
docker-compose up --build

# Stop
docker-compose down
```

The game will be available at `http://localhost:3000`.

To enable OpenAI TTS, add the variables to `docker-compose.yml` under `environment`:

```yaml
- TTS_PROVIDER=openai
- OPENAI_API_KEY=sk-...
- TTS_VOICE=alloy
```

---

## Running Tests

```bash
npm test
```

Tests cover all critical server-side game functions (room lifecycle, scoring, game-over detection) as well as the shared client utilities. No real network calls are made — `fetch` is mocked throughout.

```
Test Suites: 3 passed
Tests:       91 passed
```

---

## Project Structure

```
sprkspl/
├── public/               # Static client assets (served by Express)
│   ├── index.html        # Single-page app shell
│   ├── app.js            # Client-side Socket.IO game logic
│   ├── tts.js            # Text-to-speech abstraction
│   ├── client-utils.js   # Pure utility functions (shared with tests)
│   ├── style.css         # Styles
│   └── socket.io/
│       └── socket.io.js  # Socket.IO client bundle (copied on npm install)
├── src/
│   ├── rooms.js          # Room and RoomManager classes
│   └── dictionary.js     # Word lists and dictionary/definition fetching
├── tests/
│   ├── rooms.test.js     # Room & RoomManager unit tests
│   ├── dictionary.test.js# Dictionary unit tests
│   └── client-utils.test.js # Client utility unit tests
├── scripts/
│   └── copy-socket-client.js # Copies socket.io.js into public/ on install
├── server.js             # Express + Socket.IO server
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port the server listens on |
| `NODE_ENV` | — | Set to `production` for production deployments |
| `TTS_PROVIDER` | `browser` | TTS provider: `browser`, `openai`, or `custom` |
| `OPENAI_API_KEY` | — | Required when `TTS_PROVIDER=openai` |
| `TTS_VOICE` | `alloy` | OpenAI TTS voice name |
| `TTS_ENDPOINT_URL` | — | Full URL for `TTS_PROVIDER=custom` |
