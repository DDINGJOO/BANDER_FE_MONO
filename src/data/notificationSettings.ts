/** Figma 6419:86624 — 알림 설정 초기값 (API 연동 시 교체) */

import type { NotificationSettingsUiStateDto } from './schemas/user';

export type NotificationSettingsState = NotificationSettingsUiStateDto;

export const NOTIFICATION_SETTINGS_DEFAULTS: NotificationSettingsState = {
  interestEnabled: true,
  communityEnabled: true,
  marketingEnabled: false,
};
