import { useEffect, useRef, useCallback } from 'react';

/**
 * Auto-refresh hook that polls for data at a set interval.
 * Skips refresh when the browser tab is hidden to save resources.
 *
 * @param {Function} fetchFn - The function to call on each refresh
 * @param {number} intervalMs - Polling interval in milliseconds (default: 5000)
 * @param {boolean} enabled - Whether polling is active (default: true)
 */
const useAutoRefresh = (fetchFn, intervalMs = 5000, enabled = true) => {
  const intervalRef = useRef(null);
  const fetchRef = useRef(fetchFn);

  // Keep the latest fetch function in a ref to avoid re-creating the interval
  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (!document.hidden) {
        fetchRef.current();
      }
    }, intervalMs);
  }, [intervalMs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      stopPolling();
      return;
    }

    startPolling();

    // Pause when tab is hidden, resume when visible
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        fetchRef.current(); // Fetch immediately when tab becomes visible
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled, startPolling, stopPolling]);
};

export default useAutoRefresh;
