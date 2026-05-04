/**
 * tests/client-utils.test.js
 * Unit tests for the pure utility functions in public/client-utils.js.
 */
'use strict';

const { initials, escHtml, calcTimerState } = require('../public/client-utils');

// ─── initials ─────────────────────────────────────────────────────────────────

describe('initials', () => {
  test('returns first two characters uppercased', () => {
    expect(initials('Alice')).toBe('AL');
    expect(initials('bob')).toBe('BO');
  });

  test('handles single-character names', () => {
    expect(initials('X')).toBe('X');
  });

  test('handles exactly two characters', () => {
    expect(initials('Jo')).toBe('JO');
  });

  test('handles longer names by only taking two chars', () => {
    expect(initials('Christopher')).toBe('CH');
  });

  test('handles names with leading spaces', () => {
    expect(initials('  Alice')).toBe('  ');
  });
});

// ─── escHtml ──────────────────────────────────────────────────────────────────

describe('escHtml', () => {
  test('escapes ampersands', () => {
    expect(escHtml('A & B')).toBe('A &amp; B');
  });

  test('escapes less-than and greater-than', () => {
    expect(escHtml('<b>bold</b>')).toBe('&lt;b&gt;bold&lt;/b&gt;');
  });

  test('escapes double quotes', () => {
    expect(escHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  test('escapes all special characters together', () => {
    expect(escHtml('<script>"alert(&amp;)"</script>')).toBe(
      '&lt;script&gt;&quot;alert(&amp;amp;)&quot;&lt;/script&gt;'
    );
  });

  test('leaves plain text unchanged', () => {
    expect(escHtml('Hello World')).toBe('Hello World');
  });

  test('empty string returns empty string', () => {
    expect(escHtml('')).toBe('');
  });
});

// ─── calcTimerState ───────────────────────────────────────────────────────────

describe('calcTimerState', () => {
  const C = 276.46; // default circumference

  test('full time remaining → offset is 0', () => {
    const { offset } = calcTimerState(30, 30);
    expect(offset).toBeCloseTo(0);
  });

  test('no time remaining → offset equals circumference', () => {
    const { offset } = calcTimerState(0, 30);
    expect(offset).toBeCloseTo(C);
  });

  test('half time remaining → offset is half circumference', () => {
    const { offset } = calcTimerState(15, 30);
    expect(offset).toBeCloseTo(C * 0.5, 1);
  });

  test('urgent flag is true at 5 seconds or less (but > 0)', () => {
    expect(calcTimerState(5, 30).urgent).toBe(true);
    expect(calcTimerState(3, 30).urgent).toBe(true);
    expect(calcTimerState(1, 30).urgent).toBe(true);
  });

  test('urgent flag is false above 5 seconds', () => {
    expect(calcTimerState(6, 30).urgent).toBe(false);
    expect(calcTimerState(30, 30).urgent).toBe(false);
  });

  test('urgent flag is false at 0 seconds (timer expired)', () => {
    expect(calcTimerState(0, 30).urgent).toBe(false);
  });

  test('handles max = 0 gracefully (no division by zero)', () => {
    const { offset } = calcTimerState(5, 0);
    expect(offset).toBeCloseTo(C); // pct=0 → offset=circumference
  });

  test('custom circumference is respected', () => {
    const custom = 100;
    const { offset } = calcTimerState(10, 20, custom);
    expect(offset).toBeCloseTo(50); // 50% used → offset = 50
  });
});
