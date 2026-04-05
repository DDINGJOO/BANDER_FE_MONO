import { getApiBaseUrl, getGatewayAuthToken } from '../config/publicEnv';
import { clearAuthSession, loadAuthSession } from '../data/authSession';

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

function buildHeaders(init?: RequestInit) {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const authSession = loadAuthSession();
  if (authSession?.gatewayContextToken) {
    headers.set('X-Gateway-Context', authSession.gatewayContextToken);
    headers.set('X-Gateway-Auth', getGatewayAuthToken());
  }

  return headers;
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
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

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch (error) {
    payload = null;
  }

  if (response.status === 401) {
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

  if (response.status === 401) {
    clearAuthSession();
  }

  if (!response.ok) {
    let payload: ApiResponse<unknown> | null = null;
    try {
      payload = (await response.json()) as ApiResponse<unknown>;
    } catch {
      payload = null;
    }
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

export function getJson<T>(path: string) {
  return requestJson<T>(path, {
    method: 'GET',
  });
}

export function patchJson<T>(path: string, body: unknown) {
  return requestJson<T>(path, {
    body: JSON.stringify(body),
    method: 'PATCH',
  });
}

export function deleteJson<T>(path: string) {
  return requestJson<T>(path, {
    method: 'DELETE',
  });
}
