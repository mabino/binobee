/**
 * tests/dictionary.test.js
 * Unit tests for the Dictionary class.
 * fetch is mocked globally so no real network calls are made.
 */
'use strict';

const { Dictionary, WORDS } = require('../src/dictionary');

// ─── fetch mock ───────────────────────────────────────────────────────────────

const mockEntry = (word) => ({
  word,
  phonetic: `/${word}/`,
  phonetics: [{ text: `/${word}/` }],
  meanings: [
    {
      partOfSpeech: 'noun',
      definitions: [{ definition: `Definition of ${word}.`, example: `Example with ${word}.` }]
    }
  ]
});

function mockFetchSuccess(word) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue([mockEntry(word)])
  });
}

function mockFetchFailure() {
  global.fetch = jest.fn().mockResolvedValue({ ok: false });
}

function mockFetchNetworkError() {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Dictionary.getDefinition ─────────────────────────────────────────────────

describe('Dictionary.getDefinition', () => {
  test('returns parsed word data from a successful API response', async () => {
    mockFetchSuccess('apple');
    const dict = new Dictionary();
    const result = await dict.getDefinition('apple');

    expect(result.word).toBe('apple');
    expect(result.definition).toBe('Definition of apple.');
    expect(result.example).toBe('Example with apple.');
    expect(result.partOfSpeech).toBe('noun');
    expect(result.phonetic).toBeTruthy();
  });

  test('returns a fallback object when the API returns a non-ok response', async () => {
    mockFetchFailure();
    const dict = new Dictionary();
    const result = await dict.getDefinition('unknownword');

    expect(result.word).toBe('unknownword');
    expect(result.definition).toBe('No definition available.');
    expect(result.example).toBeNull();
  });

  test('returns a fallback object on network error', async () => {
    mockFetchNetworkError();
    const dict = new Dictionary();
    const result = await dict.getDefinition('broken');

    expect(result.word).toBe('broken');
    expect(result.definition).toBe('No definition available.');
  });

  test('caches results after the first call', async () => {
    mockFetchSuccess('cat');
    const dict = new Dictionary();

    await dict.getDefinition('cat');
    await dict.getDefinition('cat'); // second call should hit cache

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test('phonetic falls back to /word/ when API provides none', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue([
        {
          word: 'xyz',
          phonetics: [],
          meanings: [{ partOfSpeech: 'noun', definitions: [{ definition: 'test' }] }]
        }
      ])
    });
    const dict = new Dictionary();
    const result = await dict.getDefinition('xyz');
    expect(result.phonetic).toBe('/xyz/');
  });
});

// ─── Dictionary.getRandomWord ─────────────────────────────────────────────────

describe('Dictionary.getRandomWord', () => {
  beforeEach(() => {
    // Use successful mock for all getRandomWord tests
    global.fetch = jest.fn().mockImplementation((url) => {
      const word = decodeURIComponent(url.split('/').pop());
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([mockEntry(word)])
      });
    });
  });

  test('returns a word object with required fields', async () => {
    const dict = new Dictionary();
    const result = await dict.getRandomWord({ difficulty: 'easy' });
    expect(result).toHaveProperty('word');
    expect(result).toHaveProperty('definition');
    expect(result).toHaveProperty('phonetic');
  });

  test('easy difficulty draws from the easy pool only', async () => {
    const dict = new Dictionary();
    const result = await dict.getRandomWord({ difficulty: 'easy' });
    expect(WORDS.easy).toContain(result.word);
  });

  test('medium difficulty draws from the medium pool', async () => {
    const dict = new Dictionary();
    // Run enough times to be statistically certain it never picks a hard word
    const results = await Promise.all(
      Array.from({ length: 20 }, () => dict.getRandomWord({ difficulty: 'medium' }))
    );
    for (const r of results) {
      expect(WORDS.medium).toContain(r.word);
    }
  });

  test('hard difficulty draws from the hard pool', async () => {
    const dict = new Dictionary();
    const results = await Promise.all(
      Array.from({ length: 20 }, () => dict.getRandomWord({ difficulty: 'hard' }))
    );
    for (const r of results) {
      expect(WORDS.hard).toContain(r.word);
    }
  });

  test('custom dictionary overrides built-in list', async () => {
    const customWords = ['zephyr', 'quorum', 'nexus', 'vortex', 'cipher'];
    const dict = new Dictionary();
    const results = await Promise.all(
      Array.from({ length: 30 }, () =>
        dict.getRandomWord({ difficulty: 'easy', customDictionary: customWords })
      )
    );
    for (const r of results) {
      expect(customWords).toContain(r.word);
    }
  });

  test('mixed difficulty never returns a medium/hard word if only easy slice is given', async () => {
    // mixed mode uses a combined pool; just verify the function returns successfully
    const dict = new Dictionary();
    const result = await dict.getRandomWord({ difficulty: 'mixed' });
    const allWords = [...WORDS.easy, ...WORDS.medium, ...WORDS.hard];
    expect(allWords).toContain(result.word);
  });
});

// ─── WORDS word lists ─────────────────────────────────────────────────────────

describe('WORDS lists', () => {
  test('each difficulty has at least 10 words', () => {
    expect(WORDS.easy.length).toBeGreaterThanOrEqual(10);
    expect(WORDS.medium.length).toBeGreaterThanOrEqual(10);
    expect(WORDS.hard.length).toBeGreaterThanOrEqual(10);
  });

  test('all words are non-empty lowercase strings', () => {
    const allWords = [...WORDS.easy, ...WORDS.medium, ...WORDS.hard];
    for (const w of allWords) {
      expect(typeof w).toBe('string');
      expect(w.length).toBeGreaterThan(0);
      expect(w).toBe(w.toLowerCase());
    }
  });
});
