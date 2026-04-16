/* ═══════════════════════════════════════════════════════════════════
   auto-refresh.js — Lightweight AJAX auto-refresh module
   Provides periodic background data refresh without page reload.
   Uses Page Visibility API to pause when tab is hidden.
   ═══════════════════════════════════════════════════════════════════ */
'use strict';

(function () {
  const _autoRefreshTimers = [];

  /**
   * Register a refresh callback that runs on an interval.
   * Pauses when the tab/page is hidden.
   * @param {Function} callback - async/sync function to call
   * @param {number}   intervalMs - milliseconds between refreshes (default 15000)
   * @param {string}   [label] - optional label for debugging
   * @returns {number} timer ID for manual cancellation
   */
  window.startAutoRefresh = function (callback, intervalMs, label) {
    intervalMs = intervalMs || 15000;
    label = label || 'auto-refresh';

    const timer = setInterval(() => {
      // Only refresh if page is visible
      if (document.visibilityState === 'hidden') return;
      try {
        const result = callback();
        // Handle promises silently
        if (result && typeof result.catch === 'function') {
          result.catch(err => console.debug(`[${label}] refresh error:`, err));
        }
      } catch (err) {
        console.debug(`[${label}] refresh error:`, err);
      }
    }, intervalMs);

    _autoRefreshTimers.push({ id: timer, label });
    console.debug(`[auto-refresh] Started "${label}" every ${intervalMs / 1000}s`);
    return timer;
  };

  /**
   * Stop a specific auto-refresh timer.
   * @param {number} timerId
   */
  window.stopAutoRefresh = function (timerId) {
    clearInterval(timerId);
    const idx = _autoRefreshTimers.findIndex(t => t.id === timerId);
    if (idx >= 0) _autoRefreshTimers.splice(idx, 1);
  };

  /**
   * Stop ALL auto-refresh timers on the page.
   */
  window.stopAllAutoRefresh = function () {
    _autoRefreshTimers.forEach(t => clearInterval(t.id));
    _autoRefreshTimers.length = 0;
  };
})();
