/**
 * tests/rooms.test.js
 * Unit tests for the Room and RoomManager classes.
 */
'use strict';

const { Room, RoomManager } = require('../src/rooms');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRoom(hostId = 'host-1', hostName = 'Alice') {
  return new Room(hostId, hostName);
}

function addGuest(room, id = 'guest-1', name = 'Bob') {
  room.addPlayer(id, name);
  return id;
}

function startedRoom() {
  const room = makeRoom();
  addGuest(room);
  room.startGame();
  return room;
}

// Mock dictionary that always returns the same word without network calls
const mockDictionary = {
  getRandomWord: jest.fn().mockResolvedValue({
    word: 'apple',
    phonetic: '/ˈæp.əl/',
    partOfSpeech: 'noun',
    definition: 'A round fruit.',
    example: 'She ate an apple.'
  })
};

// ─── Room constructor ─────────────────────────────────────────────────────────

describe('Room constructor', () => {
  test('generates a 6-character room code', () => {
    const room = makeRoom();
    expect(room.code).toMatch(/^[A-Z2-9]{6}$/);
  });

  test('sets hostId correctly', () => {
    const room = makeRoom('abc', 'Alice');
    expect(room.hostId).toBe('abc');
  });

  test('initialises with one player', () => {
    const room = makeRoom('h1', 'Alice');
    expect(Object.keys(room.players)).toHaveLength(1);
    expect(room.players['h1'].name).toBe('Alice');
  });

  test('starts in lobby phase', () => {
    expect(makeRoom().phase).toBe('lobby');
  });

  test('default config is valid', () => {
    const { config } = makeRoom();
    expect(config.mode).toBe('rounds');
    expect(config.maxRounds).toBe(10);
    expect(config.timerSeconds).toBe(30);
    expect(config.difficulty).toBe('mixed');
  });
});

// ─── Room.setConfig ───────────────────────────────────────────────────────────

describe('Room.setConfig', () => {
  test('updates allowed keys', () => {
    const room = makeRoom();
    room.setConfig({ mode: 'points', pointsToWin: 7 });
    expect(room.config.mode).toBe('points');
    expect(room.config.pointsToWin).toBe(7);
  });

  test('ignores unknown keys', () => {
    const room = makeRoom();
    room.setConfig({ hack: true });
    expect(room.config.hack).toBeUndefined();
  });

  test('does not touch keys that are not provided', () => {
    const room = makeRoom();
    const originalMaxRounds = room.config.maxRounds;
    room.setConfig({ mode: 'sudden-death' });
    expect(room.config.maxRounds).toBe(originalMaxRounds);
  });
});

// ─── Room.setCustomDictionary ─────────────────────────────────────────────────

describe('Room.setCustomDictionary', () => {
  test('accepts a valid word list (>= 5 words)', () => {
    const room = makeRoom();
    const result = room.setCustomDictionary(['cat', 'dog', 'fish', 'bird', 'frog']);
    expect(result.success).toBe(true);
    expect(result.wordCount).toBe(5);
    expect(room.config.customDictionary).toHaveLength(5);
  });

  test('rejects fewer than 5 words', () => {
    const room = makeRoom();
    const result = room.setCustomDictionary(['cat', 'dog']);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('strips invalid characters and short words', () => {
    const room = makeRoom();
    const words = ['cat', 'dog', 'fish', 'bird', 'frog', '12invalid', 'a'];
    const result = room.setCustomDictionary(words);
    expect(result.success).toBe(true);
    // '12invalid' and 'a' should be filtered out
    expect(room.config.customDictionary).not.toContain('12invalid');
    expect(room.config.customDictionary).not.toContain('a');
  });

  test('lowercases all words', () => {
    const room = makeRoom();
    const result = room.setCustomDictionary(['APPLE', 'BANANA', 'CHERRY', 'DATE', 'ELDERBERRY']);
    expect(result.success).toBe(true);
    expect(room.config.customDictionary).toContain('apple');
  });
});

// ─── Room.addPlayer / removePlayer ───────────────────────────────────────────

describe('Room.addPlayer', () => {
  test('adds a second player successfully', () => {
    const room = makeRoom();
    const result = room.addPlayer('guest-1', 'Bob');
    expect(result.success).toBe(true);
    expect(room.players['guest-1']).toBeDefined();
  });

  test('rejects a third player (room full)', () => {
    const room = makeRoom();
    room.addPlayer('guest-1', 'Bob');
    const result = room.addPlayer('guest-2', 'Carol');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/full/i);
  });
});

describe('Room.removePlayer', () => {
  test('removes a player', () => {
    const room = makeRoom('h1', 'Alice');
    addGuest(room, 'g1', 'Bob');
    room.removePlayer('g1');
    expect(room.players['g1']).toBeUndefined();
  });

  test('transfers host when host leaves', () => {
    const room = makeRoom('h1', 'Alice');
    addGuest(room, 'g1', 'Bob');
    room.removePlayer('h1');
    expect(room.hostId).toBe('g1');
  });

  test('isEmpty returns true when last player leaves', () => {
    const room = makeRoom('h1', 'Alice');
    room.removePlayer('h1');
    expect(room.isEmpty()).toBe(true);
  });
});

// ─── Room.startGame ───────────────────────────────────────────────────────────

describe('Room.startGame', () => {
  test('sets phase to playing', () => {
    const room = startedRoom();
    expect(room.phase).toBe('playing');
  });

  test('resets scores and lives', () => {
    const room = startedRoom();
    for (const p of Object.values(room.players)) {
      expect(p.score).toBe(0);
      expect(p.lives).toBe(3);
    }
  });

  test('resets round counter', () => {
    const room = startedRoom();
    expect(room.currentRound).toBe(0);
  });

  test('clears used-word set', () => {
    const room = makeRoom();
    addGuest(room);
    room.usedWords.add('test');
    room.startGame();
    expect(room.usedWords.size).toBe(0);
  });
});

// ─── Room.submitAnswer ────────────────────────────────────────────────────────

describe('Room.submitAnswer', () => {
  test('records a valid answer', () => {
    const room = startedRoom();
    const result = room.submitAnswer('host-1', 'apple');
    expect(result.success).toBe(true);
    expect(room.players['host-1'].answer).toBe('apple');
  });

  test('lowercases and trims the answer', () => {
    const room = startedRoom();
    room.submitAnswer('host-1', '  Apple  ');
    expect(room.players['host-1'].answer).toBe('apple');
  });

  test('rejects a second submission from the same player', () => {
    const room = startedRoom();
    room.submitAnswer('host-1', 'apple');
    const result = room.submitAnswer('host-1', 'orange');
    expect(result.success).toBe(false);
  });

  test('rejects answer when game is not active', () => {
    const room = makeRoom();
    addGuest(room);
    const result = room.submitAnswer('host-1', 'apple');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not active/i);
  });

  test('rejects unknown player', () => {
    const room = startedRoom();
    const result = room.submitAnswer('nobody', 'apple');
    expect(result.success).toBe(false);
  });
});

// ─── Room.bothAnswered ────────────────────────────────────────────────────────

describe('Room.bothAnswered', () => {
  test('returns false when only one player has answered', () => {
    const room = startedRoom();
    room.submitAnswer('host-1', 'apple');
    expect(room.bothAnswered()).toBe(false);
  });

  test('returns true after both players answer', () => {
    const room = startedRoom();
    room.submitAnswer('host-1', 'apple');
    room.submitAnswer('guest-1', 'banana');
    expect(room.bothAnswered()).toBe(true);
  });
});

// ─── Room.evaluateRound ───────────────────────────────────────────────────────

describe('Room.evaluateRound', () => {
  function roundWith(hostAnswer, guestAnswer, word = 'apple', mode = 'rounds') {
    const room = startedRoom();
    room.config.mode = mode;
    room.currentWord = { word };
    room.submitAnswer('host-1', hostAnswer);
    room.submitAnswer('guest-1', guestAnswer);
    return room.evaluateRound();
  }

  test('awards win/loss when only one player is correct', () => {
    const results = roundWith('apple', 'appel');
    expect(results['host-1'].outcome).toBe('win');
    expect(results['guest-1'].outcome).toBe('loss');
  });

  test('both-wrong outcome when neither is correct', () => {
    const results = roundWith('appel', 'appl');
    expect(results['host-1'].outcome).toBe('both-wrong');
    expect(results['guest-1'].outcome).toBe('both-wrong');
  });

  test('tie outcome when both are correct', () => {
    const results = roundWith('apple', 'apple');
    expect(results['host-1'].outcome).toBe('tie');
    expect(results['guest-1'].outcome).toBe('tie');
  });

  test('correct flag is set per player', () => {
    const results = roundWith('apple', 'appel');
    expect(results['host-1'].correct).toBe(true);
    expect(results['guest-1'].correct).toBe(false);
  });

  test('winner score increments', () => {
    const room = startedRoom();
    room.currentWord = { word: 'apple' };
    room.submitAnswer('host-1', 'apple');
    room.submitAnswer('guest-1', 'appel');
    room.evaluateRound();
    expect(room.players['host-1'].score).toBe(1);
    expect(room.players['guest-1'].score).toBe(0);
  });

  test('loser loses a life', () => {
    const room = startedRoom();
    room.currentWord = { word: 'apple' };
    room.submitAnswer('host-1', 'apple');
    room.submitAnswer('guest-1', 'appel');
    room.evaluateRound();
    expect(room.players['guest-1'].lives).toBe(2);
  });

  test('sudden-death: both wrong means both lose a life', () => {
    const room = startedRoom();
    room.config.mode = 'sudden-death';
    room.currentWord = { word: 'apple' };
    room.submitAnswer('host-1', 'wrong1');
    room.submitAnswer('guest-1', 'wrong2');
    room.evaluateRound();
    expect(room.players['host-1'].lives).toBe(2);
    expect(room.players['guest-1'].lives).toBe(2);
  });
});

// ─── Room.isGameOver ─────────────────────────────────────────────────────────

describe('Room.isGameOver', () => {
  test('rounds mode: over when currentRound reaches maxRounds', () => {
    const room = startedRoom();
    room.config.mode = 'rounds';
    room.config.maxRounds = 3;
    room.currentRound = 3;
    expect(room.isGameOver()).toBe(true);
  });

  test('rounds mode: not over before maxRounds', () => {
    const room = startedRoom();
    room.config.mode = 'rounds';
    room.config.maxRounds = 3;
    room.currentRound = 2;
    expect(room.isGameOver()).toBe(false);
  });

  test('points mode: over when a player reaches pointsToWin', () => {
    const room = startedRoom();
    room.config.mode = 'points';
    room.config.pointsToWin = 5;
    room.players['host-1'].score = 5;
    expect(room.isGameOver()).toBe(true);
  });

  test('sudden-death mode: over when a player has 0 lives', () => {
    const room = startedRoom();
    room.config.mode = 'sudden-death';
    room.players['host-1'].lives = 0;
    expect(room.isGameOver()).toBe(true);
  });

  test('returns true with fewer than 2 players', () => {
    const room = makeRoom();
    expect(room.isGameOver()).toBe(true);
  });
});

// ─── Room.getWinner ───────────────────────────────────────────────────────────

describe('Room.getWinner', () => {
  test('returns the player with the highest score', () => {
    const room = startedRoom();
    room.players['host-1'].score = 5;
    room.players['guest-1'].score = 3;
    const winner = room.getWinner();
    expect(winner).not.toBeNull();
    expect(winner.id).toBe('host-1');
  });

  test('returns null on a tie', () => {
    const room = startedRoom();
    room.players['host-1'].score = 3;
    room.players['guest-1'].score = 3;
    expect(room.getWinner()).toBeNull();
  });

  test('sudden-death: returns alive player', () => {
    const room = startedRoom();
    room.config.mode = 'sudden-death';
    room.players['host-1'].lives = 0;
    room.players['guest-1'].lives = 2;
    const winner = room.getWinner();
    expect(winner.id).toBe('guest-1');
  });

  test('sudden-death: mutual elimination → null', () => {
    const room = startedRoom();
    room.config.mode = 'sudden-death';
    room.players['host-1'].lives = 0;
    room.players['guest-1'].lives = 0;
    expect(room.getWinner()).toBeNull();
  });
});

// ─── Room.getScores / getLives ────────────────────────────────────────────────

describe('Room.getScores', () => {
  test('returns id, name, and score for every player', () => {
    const room = startedRoom();
    room.players['host-1'].score = 4;
    const scores = room.getScores();
    expect(scores['host-1']).toEqual({ id: 'host-1', name: 'Alice', score: 4 });
  });
});

describe('Room.getLives', () => {
  test('returns id, name, and lives for every player', () => {
    const room = startedRoom();
    room.players['guest-1'].lives = 2;
    const lives = room.getLives();
    expect(lives['guest-1']).toEqual({ id: 'guest-1', name: 'Bob', lives: 2 });
  });
});

// ─── Room.toPublic ────────────────────────────────────────────────────────────

describe('Room.toPublic', () => {
  test('omits sensitive fields (answer, answeredAt, rematch)', () => {
    const room = makeRoom('h1', 'Alice');
    const pub = room.toPublic();
    expect(pub.players[0].answer).toBeUndefined();
    expect(pub.players[0].answeredAt).toBeUndefined();
  });

  test('includes code, hostId, config, phase, and players array', () => {
    const room = makeRoom('h1', 'Alice');
    const pub = room.toPublic();
    expect(pub.code).toBeTruthy();
    expect(pub.hostId).toBe('h1');
    expect(Array.isArray(pub.players)).toBe(true);
    expect(pub.phase).toBe('lobby');
  });
});

// ─── Room.nextRound ───────────────────────────────────────────────────────────

describe('Room.nextRound', () => {
  test('increments round counter', async () => {
    const room = startedRoom();
    await room.nextRound(mockDictionary);
    expect(room.currentRound).toBe(1);
  });

  test('sets currentWord from dictionary', async () => {
    const room = startedRoom();
    await room.nextRound(mockDictionary);
    expect(room.currentWord.word).toBe('apple');
  });

  test('resets player answers', async () => {
    const room = startedRoom();
    room.submitAnswer('host-1', 'test');
    await room.nextRound(mockDictionary);
    expect(room.players['host-1'].answer).toBeNull();
  });
});

// ─── RoomManager ─────────────────────────────────────────────────────────────

describe('RoomManager.createRoom', () => {
  test('creates and stores a room', () => {
    const mgr = new RoomManager();
    const room = mgr.createRoom('h1', 'Alice');
    expect(mgr.getRoomByPlayer('h1')).toBe(room);
  });

  test('generates unique codes even on collision', () => {
    const mgr = new RoomManager();
    const r1 = mgr.createRoom('h1', 'Alice');
    const r2 = mgr.createRoom('h2', 'Bob');
    expect(r1.code).not.toBe(r2.code);
  });
});

describe('RoomManager.joinRoom', () => {
  test('lets a second player join successfully', () => {
    const mgr = new RoomManager();
    const room = mgr.createRoom('h1', 'Alice');
    const result = mgr.joinRoom(room.code, 'g1', 'Bob');
    expect(result.success).toBe(true);
    expect(mgr.getRoomByPlayer('g1')).toBe(room);
  });

  test('rejects an invalid room code', () => {
    const mgr = new RoomManager();
    const result = mgr.joinRoom('ZZZZZZ', 'g1', 'Bob');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  test('rejects joining a room that is already in progress', () => {
    const mgr = new RoomManager();
    const room = mgr.createRoom('h1', 'Alice');
    mgr.joinRoom(room.code, 'g1', 'Bob');
    room.startGame();
    const result = mgr.joinRoom(room.code, 'g2', 'Carol');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/in progress/i);
  });

  test('is case-insensitive for room code', () => {
    const mgr = new RoomManager();
    const room = mgr.createRoom('h1', 'Alice');
    const result = mgr.joinRoom(room.code.toLowerCase(), 'g1', 'Bob');
    expect(result.success).toBe(true);
  });
});

describe('RoomManager.removePlayer', () => {
  test('removes player from room and index', () => {
    const mgr = new RoomManager();
    const room = mgr.createRoom('h1', 'Alice');
    mgr.joinRoom(room.code, 'g1', 'Bob');
    mgr.removePlayer('g1');
    expect(mgr.getRoomByPlayer('g1')).toBeNull();
    expect(room.players['g1']).toBeUndefined();
  });
});

describe('RoomManager.deleteRoom', () => {
  test('removes room and clears all player mappings', () => {
    const mgr = new RoomManager();
    const room = mgr.createRoom('h1', 'Alice');
    mgr.joinRoom(room.code, 'g1', 'Bob');
    mgr.deleteRoom(room.code);
    expect(mgr.getRoomByPlayer('h1')).toBeNull();
    expect(mgr.getRoomByPlayer('g1')).toBeNull();
  });
});
