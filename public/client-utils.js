/**
 * client-utils.js — Pure utility functions shared between browser and test environments.
 * Exported via module.exports for Node.js/Jest; also attached to window for browser use.
 */

function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

function escHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Compute the timer ring stroke offset and urgent-class flag.
 * Returns an object so callers can decide how to apply the result.
 * @param {number} left  - seconds remaining
 * @param {number} max   - total seconds for this round
 * @param {number} circumference - SVG ring circumference (default 2πr where r=44 ≈ 276.46)
 * @returns {{ offset: number, urgent: boolean }}
 */
function calcTimerState(left, max, circumference = 276.46) {
  const pct = max > 0 ? left / max : 0;
  const offset = circumference * (1 - pct);
  const urgent = left <= 5 && left > 0;
  return { offset, urgent };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initials, escHtml, calcTimerState };
} else {
  window.clientUtils = { initials, escHtml, calcTimerState };
}
