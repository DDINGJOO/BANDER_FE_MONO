import { getApiBaseUrl } from '../config/publicEnv';
import { clearAuthSession } from '../data/authSession';

export type ApiErrorPayload = {
  code?: string;
  message?: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
  timestamp?: string;
};

type JsonRequestInit = RequestInit & {
  /**
   * Public optional-auth reads can still receive 401 from stale edge builds or
   * backend drift. Those responses must not wipe the user's local session.
   */
  preserveAuthOnUnauthorized?: boolean;
};

type JsonGetOptions = {
  preserveAuthOnUnauthorized?: boolean;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function shouldClearAuthOnUnauthorized(payload: ApiResponse<unknown> | null, preserveAuthOnUnauthorized: boolean) {
  if (preserveAuthOnUnauthorized) {
    return false;
  }

  // GW-AUTH-002 means a downstream service rejected the gateway user context.
  // Clearing the browser session here turns an infra/header mismatch into a
  // forced logout, while the session cookie may still be valid.
  return payload?.error?.code !== 'GW-AUTH-002';
}

function buildHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

export async function requestJson<T>(path: string, init?: JsonRequestInit): Promise<T> {
  let response: Response;
  const { preserveAuthOnUnauthorized = false, ...fetchInit } = init ?? {};

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...fetchInit,
      credentials: 'include',
      headers: buildHeaders(fetchInit),
    });
  } catch (error) {
    throw new ApiError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 0);
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch (error) {
    payload = null;
  }

  if (response.status === 401 && shouldClearAuthOnUnauthorized(payload, preserveAuthOnUnauthorized)) {
    clearAuthSession();
  }

  if (!response.ok || !payload?.success || payload.data === undefined) {
    throw new ApiError(
      payload?.error?.message ?? '요청 처리에 실패했습니다.',
      response.status,
      payload?.error?.code
    );
  }

  return payload.data;
}

export async function requestVoid(path: string, init?: RequestInit): Promise<void> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      credentials: 'include',
      headers: buildHeaders(init),
    });
  } catch (error) {
    throw new ApiError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 0);
  }

  let payload: ApiResponse<unknown> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<unknown>;
  } catch {
    payload = null;
  }

  if (response.status === 401 && shouldClearAuthOnUnauthorized(payload, false)) {
    clearAuthSession();
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.error?.message ?? '요청 처리에 실패했습니다.',
      response.status,
      payload?.error?.code
    );
  }
}

export function postJson<T>(path: string, body: unknown) {
  return requestJson<T>(path, {
    body: JSON.stringify(body),
    method: 'POST',
  });
}

export function getJson<T>(path: string, options?: JsonGetOptions) {
  return requestJson<T>(path, {
    method: 'GET',
    preserveAuthOnUnauthorized: options?.preserveAuthOnUnauthorized,
    signal: options?.signal,
  });
}

export function patchJson<T>(path: string, body: unknown) {
  return requestJson<T>(path, {
    body: JSON.stringify(body),
    method: 'PATCH',
  });
}

export function patchVoid(path: string, body: unknown) {
  return requestVoid(path, {
    body: JSON.stringify(body),
    method: 'PATCH',
  });
}

export function deleteJson<T>(path: string) {
  return requestJson<T>(path, {
    method: 'DELETE',
  });
}
