export const NOTIFICATION_UNREAD_COUNT_EVENT =
  'bander:notification-unread-count-changed';

export type NotificationUnreadCountChange = {
  count?: number;
  delta?: number;
};

export function emitNotificationUnreadCountChange(
  detail: NotificationUnreadCountChange,
) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<NotificationUnreadCountChange>(
      NOTIFICATION_UNREAD_COUNT_EVENT,
      { detail },
    ),
  );
}
