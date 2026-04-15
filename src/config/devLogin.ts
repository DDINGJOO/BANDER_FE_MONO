import type { LoginResponse } from '../types/authApi';
import {
  getDevLoginEmailOverride,
  getDevLoginPasswordOverride,
  isDevLoginBypassExplicitlyOff,
} from './publicEnv';

const DEFAULT_EMAIL = 'dev@bander.local';
const DEFAULT_PASSWORD = 'bander-dev-2024';

/**
 * `npm start`에서만 동작. `npm run build` 프로덕션 번들과 Jest(`NODE_ENV=test`)에서는 항상 false.
 * 끄려면 `.env.development.local`에 `REACT_APP_DEV_LOGIN_BYPASS=0`
 */
export function isDevLoginBypassEnabled() {
  return process.env.NODE_ENV === 'development' && !isDevLoginBypassExplicitlyOff();
}

function devLoginEmail() {
  return getDevLoginEmailOverride()?.trim() || DEFAULT_EMAIL;
}

function devLoginPassword() {
  const override = getDevLoginPasswordOverride();
  return override !== undefined ? override : DEFAULT_PASSWORD;
}

/** 로그인 화면에만 표시 — 실제 매칭과 동일한 값 */
export function getDevLoginHint(): string | null {
  if (!isDevLoginBypassEnabled()) {
    return null;
  }

  return `로컬 개발 전용 — 이메일: ${devLoginEmail()}, 비밀번호: ${devLoginPassword()}`;
}

export function tryDevLoginBypass(email: string, password: string): LoginResponse | null {
  if (!isDevLoginBypassEnabled()) {
    return null;
  }

  if (email.trim().toLowerCase() !== devLoginEmail().toLowerCase() || password !== devLoginPassword()) {
    return null;
  }

  return {
    expiresAt: new Date(Date.now() + 86400000 * 365).toISOString(),
    gatewayContextToken: 'dev-login-bypass-token',
    userId: '900001',
  };
}
