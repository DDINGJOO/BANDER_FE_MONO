import { getJson, requestVoid } from './client';
import type {
  NotificationCursorPage,
  NotificationApiDto,
  UnreadCountDto,
} from '../data/schemas/notificationsApi';

export function fetchNotifications(_page = 0, size = 20) {
  return getJson<NotificationCursorPage<NotificationApiDto>>(
    `/api/v1/notifications?limit=${size}`,
  );
}

export function fetchUnreadNotificationCount() {
  return getJson<UnreadCountDto>('/api/v1/notifications/unread-count');
}

export function markNotificationRead(notificationId: string) {
  return requestVoid(`/api/v1/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

export function markAllNotificationsRead() {
  return requestVoid('/api/v1/notifications/read-all', { method: 'POST' });
}
