/**
 * UC-14 알림
 * @see docs/BACKEND_API.md §13
 */

import type { ApiCursorPageDto } from './common';

export type NotificationCategoryDto = 'activity' | 'news';

export type NotificationIconKindDto = 'like' | 'bell' | 'comment' | 'gift';

export type NotificationSectionDto = 'today' | 'week';

/** GET /api/v1/notifications */
export type AppNotificationItemDto = {
  id: string;
  category: NotificationCategoryDto;
  icon: NotificationIconKindDto;
  message: string;
  section: NotificationSectionDto;
  timeLabel: string;
  thumbUrl?: string | null;
  cta?: { href: string; label: string };
  read: boolean;
};

export type NotificationsPageResponseDto = ApiCursorPageDto<AppNotificationItemDto>;

/** PATCH /api/v1/notifications/{id}/read */
export type MarkNotificationReadResponseDto = {
  id: string;
  read: true;
};
