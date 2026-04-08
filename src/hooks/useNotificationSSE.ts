import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiBaseUrl } from '../config/publicEnv';
import type { NotificationItem } from '../api/notifications';

type SseEvent =
  | { type: 'notification'; data: NotificationItem }
  | { type: 'unread-count'; data: number }
  | { type: 'connected' };

export function useNotificationSSE(enabled: boolean) {
  const [lastEvent, setLastEvent] = useState<SseEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryDelayRef = useRef(1000);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    const url = `${getApiBaseUrl()}/api/v1/notifications/stream`;
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.addEventListener('connected', () => {
      setConnected(true);
      retryDelayRef.current = 1000; // reset backoff
    });

    es.addEventListener('notification', (event) => {
      try {
        const data = JSON.parse(event.data) as NotificationItem;
        setLastEvent({ type: 'notification', data });
      } catch {
        // ignore malformed data
      }
    });

    es.addEventListener('unread-count', (event) => {
      const count = parseInt(event.data, 10);
      if (!isNaN(count)) {
        setLastEvent({ type: 'unread-count', data: count });
      }
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      eventSourceRef.current = null;

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
      const delay = Math.min(retryDelayRef.current, 30000);
      retryTimeoutRef.current = setTimeout(() => {
        retryDelayRef.current = delay * 2;
        connect();
      }, delay);
    };
  }, [enabled]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [connect]);

  return { lastEvent, connected };
}
