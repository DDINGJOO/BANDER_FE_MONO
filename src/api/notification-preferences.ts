import { getJson, patchJson } from './client';

export interface NotificationPreferencesView {
  interestAppPush: boolean;
  communityAppPush: boolean;
  updatedAt: string | null;
}

export interface NotificationPreferencesChange {
  interestAppPush?: boolean | null;
  communityAppPush?: boolean | null;
}

export function getNotificationPreferences(): Promise<NotificationPreferencesView> {
  return getJson<NotificationPreferencesView>('/api/v1/users/me/notification-preferences');
}

export function updateNotificationPreferences(
  change: NotificationPreferencesChange,
): Promise<NotificationPreferencesView> {
  return patchJson<NotificationPreferencesView>(
    '/api/v1/users/me/notification-preferences',
    change,
  );
}
