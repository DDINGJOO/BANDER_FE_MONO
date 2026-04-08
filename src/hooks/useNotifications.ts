import { useCallback, useEffect, useMemo, useState } from 'react';
import { isMockMode } from '../config/publicEnv';
import { loadAuthSession } from '../data/authSession';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllAsRead as apiMarkAllAsRead,
  markAsRead as apiMarkAsRead,
  type NotificationItem,
} from '../api/notifications';
import { useNotificationSSE } from './useNotificationSSE';

export function useNotifications() {
  const mock = isMockMode();
  const authenticated = Boolean(loadAuthSession());
  const enabled = !mock && authenticated;
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { lastEvent, connected } = useNotificationSSE(enabled);

  // Initial fetch
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [page, count] = await Promise.all([
          fetchNotifications(0, 50),
          fetchUnreadCount(),
        ]);
        if (!cancelled) {
          setNotifications(page.content);
          setUnreadCount(count.count);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [enabled]);

  // Handle SSE events
  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === 'notification') {
      setNotifications((prev) => [lastEvent.data, ...prev]);
      setUnreadCount((prev) => prev + 1);
    } else if (lastEvent.type === 'unread-count') {
      setUnreadCount(lastEvent.data);
    }
  }, [lastEvent]);

  // Re-fetch unread count on reconnect
  useEffect(() => {
    if (connected && enabled) {
      fetchUnreadCount()
        .then((res) => setUnreadCount(res.count))
        .catch(() => {});
    }
  }, [connected, enabled]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await apiMarkAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent fail
    }
  }, []);

  return useMemo(
    () => ({ notifications, unreadCount, loading, error, connected, markAsRead, markAllAsRead }),
    [notifications, unreadCount, loading, error, connected, markAsRead, markAllAsRead]
  );
}
