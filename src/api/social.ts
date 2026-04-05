import { postJson, getJson, requestVoid } from './client';
import { getRedirectUri } from '../config/oauth';
import type { OAuthProvider } from '../config/oauth';

export type SocialLoginResponse = {
  userId: number;
  gatewayContextToken: string;
  expiresAt: string;
  newUser: boolean;
};

export function socialLogin(provider: OAuthProvider, authorizationCode: string, state?: string) {
  return postJson<SocialLoginResponse>('/api/v1/auth/social/login', {
    provider,
    authorizationCode,
    redirectUri: getRedirectUri(),
    state,
  });
}

export function socialLink(provider: OAuthProvider, authorizationCode: string, state?: string) {
  return postJson<{ provider: string; linked: boolean }>('/api/v1/auth/social/link', {
    provider,
    authorizationCode,
    redirectUri: getRedirectUri(),
    state,
  });
}

export function socialUnlink(provider: OAuthProvider) {
  return requestVoid(`/api/v1/auth/social/link/${provider}`, {
    method: 'DELETE',
  });
}

export type LinkedProvider = {
  provider: string;
};

export function getLinkedProviders() {
  return getJson<{ providers: LinkedProvider[] }>('/api/v1/auth/social/linked');
}
