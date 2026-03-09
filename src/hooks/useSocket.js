import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * Singleton socket instance shared across all components.
 * Connects to the same origin (Nginx proxies /socket.io/ to the backend).
 */
let socketInstance = null;
let refCount = 0;

function getSocket() {
  if (!socketInstance) {
    const url = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.io] Connected:', socketInstance.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('[Socket.io] Connection error:', err.message);
    });
  }
  return socketInstance;
}

/**
 * Hook to listen for real-time events and trigger a refetch callback.
 *
 * @param {string[]} events - Array of event names to listen for (e.g., ['case_added', 'case_updated'])
 * @param {Function} onEvent - Callback to invoke when any of the events fire (typically a refetch function)
 *
 * Usage:
 *   useSocket(['case_added', 'case_updated', 'case_deleted'], fetchAllCases);
 */
export function useSocket(events, onEvent) {
  const callbackRef = useRef(onEvent);

  // Keep callback ref up to date without re-subscribing
  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const socket = getSocket();
    refCount++;

    const handler = (data) => {
      console.log('[Socket.io] Event received, refreshing data...');
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    events.forEach((event) => {
      socket.on(event, handler);
    });

    return () => {
      events.forEach((event) => {
        socket.off(event, handler);
      });
      refCount--;
      // Disconnect only when no components are using it
      if (refCount === 0 && socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
    };
  }, [events]);
}

/**
 * Predefined event arrays for convenience
 */
export const CASE_EVENTS = [
  'case_added',
  'case_updated',
  'case_deleted',
  'case_restored',
  'case_permanent_deleted',
];

export const CLEARANCE_EVENTS = [
  'clearance_added',
  'clearance_updated',
  'clearance_deleted',
  'clearance_restored',
  'clearance_permanent_deleted',
  'clearance_revoked',
  'clearance_status_updated',
  'clearance_bulk_status_updated',
  'clearance_bulk_permanent_deleted',
];

export const ALL_EVENTS = [...CASE_EVENTS, ...CLEARANCE_EVENTS];
