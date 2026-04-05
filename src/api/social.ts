import { postJson, getJson, requestVoid } from './client';
import type { LoginResponse } from '../types/authApi';
import { getRedirectUri } from '../config/oauth';
import type { OAuthProvider } from '../config/oauth';

export function socialLogin(provider: OAuthProvider, authorizationCode: string, state?: string) {
  return postJson<LoginResponse>('/api/v1/auth/social/login', {
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
