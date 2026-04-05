/**
 * CRA 브라우저 번들에 포함되는 공개 설정 (REACT_APP_* 만).
 * 결제 시크릿·서버 API 키는 백엔드에만 두고 여기 넣지 않습니다.
 */

function optionalEnv(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

/** 비우면 상대 경로 → package.json `proxy` 로 전달 */
export function getApiBaseUrl(): string {
  const v = optionalEnv('REACT_APP_API_BASE_URL');
  if (!v) {
    return '';
  }
  return v.endsWith('/') ? v.slice(0, -1) : v;
}

/** 로그인 후 `X-Gateway-Auth` (백엔드와 합의) */
export function getGatewayAuthToken(): string {
  return optionalEnv('REACT_APP_GATEWAY_AUTH_TOKEN') ?? 'local-dev-gateway-token';
}

/** 토스페이먼츠 위젯/SDK 클라이언트 키 */
export function getTossPaymentsClientKey(): string | undefined {
  return optionalEnv('REACT_APP_TOSS_CLIENT_KEY');
}

/** Google Maps JavaScript API */
export function getGoogleMapsApiKey(): string | undefined {
  return optionalEnv('REACT_APP_GOOGLE_MAPS_API_KEY');
}

/** 카카오 JavaScript 키 (로그인/맵 등) */
export function getKakaoJavaScriptKey(): string | undefined {
  return optionalEnv('REACT_APP_KAKAO_JAVASCRIPT_KEY');
}

/** Google OAuth Client ID (소셜 로그인 등) */
export function getGoogleOAuthClientId(): string | undefined {
  return optionalEnv('REACT_APP_GOOGLE_OAUTH_CLIENT_ID');
}

/** Sign in with Apple Services ID / client id */
export function getAppleClientId(): string | undefined {
  return optionalEnv('REACT_APP_APPLE_CLIENT_ID');
}

export function getSentryDsn(): string | undefined {
  return optionalEnv('REACT_APP_SENTRY_DSN');
}

/** CloudFront CDN base URL for media files */
export function getCdnBaseUrl(): string {
  return optionalEnv('REACT_APP_CDN_BASE_URL') ?? '';
}

/* --- 로컬 개발 로그인 백도어 (`devLogin.ts`) --- */

export function isDevLoginBypassExplicitlyOff(): boolean {
  return process.env.REACT_APP_DEV_LOGIN_BYPASS === '0';
}

export function getDevLoginEmailOverride(): string | undefined {
  return optionalEnv('REACT_APP_DEV_LOGIN_EMAIL');
}

/** 빈 문자열·공백만 있으면 미설정으로 간주 (`.env`에 `REACT_APP_DEV_LOGIN_PASSWORD=` 만 둔 경우 기본 비번 유지) */
export function getDevLoginPasswordOverride(): string | undefined {
  const v = process.env.REACT_APP_DEV_LOGIN_PASSWORD;
  if (v === undefined) {
    return undefined;
  }
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
