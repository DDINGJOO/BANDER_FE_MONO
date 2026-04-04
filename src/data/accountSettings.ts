import { loadSignupDraft } from './authSession';
import { DEFAULT_HOME_PROFILE_MENU_MODEL } from '../types/homeProfileMenu';

/** Figma 6419:86165 — 계정 설정 데모 값 (API 연동 시 교체) */
export type AccountLinkProvider = 'kakao' | 'google' | 'apple';

export function resolveAccountSettingsEmail(): string {
  const draft = loadSignupDraft();
  if (draft?.email?.trim()) return draft.email.trim();
  return DEFAULT_HOME_PROFILE_MENU_MODEL.email;
}

export const ACCOUNT_SETTINGS_DEFAULT_PHONE = '010-1234-5678';
