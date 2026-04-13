import { getJson, requestVoid } from './client';
import type {
  NotificationApiDto,
  SpringPage,
  UnreadCountDto,
} from '../data/schemas/notificationsApi';

export function fetchNotifications(page = 0, size = 20) {
  return getJson<SpringPage<NotificationApiDto>>(
    `/api/v1/notifications?page=${page}&size=${size}`,
  );
}

export function fetchUnreadNotificationCount() {
  return getJson<UnreadCountDto>('/api/v1/notifications/unread-count');
}

export function markNotificationRead(notificationId: number) {
  return requestVoid(`/api/v1/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

export function markAllNotificationsRead() {
  return requestVoid('/api/v1/notifications/read-all', { method: 'POST' });
}
