import { getJson, requestVoid } from './client';

export type NotificationItem = {
  notificationId: number;
  type: string;
  title: string;
  content: string;
  referenceType: string | null;
  referenceId: number | null;
  read: boolean;
  createdAt: string;
};

export type NotificationPage = {
  content: NotificationItem[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
};

export type UnreadCount = {
  count: number;
};

export function fetchNotifications(page = 0, size = 20): Promise<NotificationPage> {
  return getJson<NotificationPage>(`/api/v1/notifications?page=${page}&size=${size}`);
}

export function fetchUnreadCount(): Promise<UnreadCount> {
  return getJson<UnreadCount>('/api/v1/notifications/unread-count');
}

export function markAsRead(notificationId: number): Promise<void> {
  return requestVoid(`/api/v1/notifications/${notificationId}/read`, { method: 'PATCH' });
}

export function markAllAsRead(): Promise<void> {
  return requestVoid('/api/v1/notifications/read-all', { method: 'POST' });
}
