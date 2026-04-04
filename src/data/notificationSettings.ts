/** Figma 6419:86624 — 알림 설정 초기값 (API 연동 시 교체) */
export type NotificationSettingsState = {
  communityEnabled: boolean;
  interestEnabled: boolean;
  marketingEnabled: boolean;
};

export const NOTIFICATION_SETTINGS_DEFAULTS: NotificationSettingsState = {
  interestEnabled: true,
  communityEnabled: true,
  marketingEnabled: false,
};
