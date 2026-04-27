import { getAppleClientId, getGoogleOAuthClientId, getKakaoOAuthClientId } from './publicEnv';

export type OAuthProvider = 'KAKAO' | 'GOOGLE' | 'APPLE';

const REDIRECT_URI = `${window.location.origin}/auth/callback`;

function buildKakaoAuthUrl(state: string): string {
  const clientId = getKakaoOAuthClientId();
  if (!clientId) throw new Error('카카오 로그인 키가 설정되지 않았습니다.');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    state,
  });
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

function buildGoogleAuthUrl(state: string): string {
  const clientId = getGoogleOAuthClientId();
  if (!clientId) throw new Error('구글 로그인 키가 설정되지 않았습니다.');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function buildAppleAuthUrl(state: string): string {
  const clientId = getAppleClientId();
  if (!clientId) throw new Error('애플 로그인 키가 설정되지 않았습니다.');
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'name email',
    state,
  });
  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
}

export function getRedirectUri(): string {
  return REDIRECT_URI;
}

export function startOAuth(provider: OAuthProvider, purpose: 'login' | 'link' = 'login'): void {
  const state = JSON.stringify({ provider, purpose, nonce: crypto.randomUUID() });
  const encoded = btoa(state);

  sessionStorage.setItem('bander.oauthState', encoded);

  switch (provider) {
    case 'KAKAO':
      window.location.href = buildKakaoAuthUrl(encoded);
      break;
    case 'GOOGLE':
      window.location.href = buildGoogleAuthUrl(encoded);
      break;
    case 'APPLE':
      window.location.href = buildAppleAuthUrl(encoded);
      break;
  }
}

export function parseOAuthState(stateParam: string): { provider: OAuthProvider; purpose: 'login' | 'link' } | null {
  try {
    const saved = sessionStorage.getItem('bander.oauthState');
    if (!saved || saved !== stateParam) return null;
    sessionStorage.removeItem('bander.oauthState');
    const parsed = JSON.parse(atob(stateParam));
    return { provider: parsed.provider, purpose: parsed.purpose };
  } catch {
    return null;
  }
}
