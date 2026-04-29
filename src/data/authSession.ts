export type SignupDraft = {
  email: string;
  gender?: 'MALE' | 'FEMALE' | 'PREFER_NOT_TO_SAY';
  nickname?: string;
  profileImageRef?: string;
  /** JWS ticket from signup-time profile-image grant — passed to completeSignup. */
  profileImageOwnershipTicket?: string;
  regionCode?: string;
  signupSource?: 'EMAIL' | 'SOCIAL';
  socialProvider?: 'KAKAO' | 'GOOGLE' | 'APPLE';
  signupCompletionToken?: string;
  verifiedEmailToken?: string;
};

export type PasswordResetDraft = {
  email: string;
  passwordResetToken?: string;
};

export type AuthSession = {
  expiresAt: string;
  gatewayContextToken: string;
  phoneVerified?: boolean;
  /** Snowflake ID — stored as string to avoid JS number precision loss */
  userId: string;
};

const SIGNUP_DRAFT_KEY = 'bander.signupDraft';
const PASSWORD_RESET_DRAFT_KEY = 'bander.passwordResetDraft';
const AUTH_SESSION_KEY = 'bander.authSession';
const GATEWAY_CONTEXT_COOKIE_NAME = 'bander_gateway_context';

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    window.sessionStorage.removeItem(key);
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(value));
}

function clearCookie(name: string) {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  const host = window.location.hostname;
  const domainPart =
    host === 'bander.co.kr' || host.endsWith('.bander.co.kr') ? '; Domain=.bander.co.kr' : '';

  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${domainPart}`;
}

function clearLegacyGatewayContextCookie() {
  clearCookie(GATEWAY_CONTEXT_COOKIE_NAME);
}

export function loadSignupDraft() {
  return readJson<SignupDraft>(SIGNUP_DRAFT_KEY);
}

export function saveSignupDraft(nextDraft: SignupDraft) {
  writeJson(SIGNUP_DRAFT_KEY, nextDraft);
}

export function clearSignupDraft() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(SIGNUP_DRAFT_KEY);
}

export function loadPasswordResetDraft() {
  return readJson<PasswordResetDraft>(PASSWORD_RESET_DRAFT_KEY);
}

export function savePasswordResetDraft(nextDraft: PasswordResetDraft) {
  writeJson(PASSWORD_RESET_DRAFT_KEY, nextDraft);
}

export function clearPasswordResetDraft() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(PASSWORD_RESET_DRAFT_KEY);
}

export function loadAuthSession() {
  clearLegacyGatewayContextCookie();
  return readJson<AuthSession>(AUTH_SESSION_KEY);
}

export function saveAuthSession(session: AuthSession) {
  writeJson(AUTH_SESSION_KEY, session);
  clearLegacyGatewayContextCookie();
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  clearLegacyGatewayContextCookie();
}
