import { logger } from '@/libs/Logger';
import type { ApiError, ApiResponse } from '@/types/api';

// Same-origin base: a Next rewrite proxies /api/v1 to the Django backend, so the
// browser talks only to the app origin and the httpOnly auth cookies ride along
// automatically. Tokens never touch JS (no localStorage, no Authorization header).
const API_BASE = '/api/v1';

let refreshing: Promise<boolean> | null = null;

/** Event fired when a request is still 401 after a refresh attempt — the session
 * is dead and the app should log the user out. `AuthProvider` listens for it. */
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';

// A 401 on these auth-flow endpoints is expected (anonymous login/refresh/logout)
// and must NOT trigger a forced logout — that would loop on the login screen.
const AUTH_FLOW_PATHS = ['/auth/login/', '/auth/refresh/', '/auth/logout/'];

/**
 * Broadcasts that the session has expired so the auth layer can log out and
 * redirect. No-op on the server and for the auth-flow endpoints themselves.
 * @param path - The API path that returned the terminal 401.
 */
function notifySessionExpired(path: string): void {
  if (typeof window === 'undefined' || AUTH_FLOW_PATHS.some((p) => path.startsWith(p))) {
    return;
  }
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

/**
 * Refreshes the session by exchanging the httpOnly refresh cookie for a new pair
 * (the backend sets fresh cookies). Single-flight: concurrent 401s share one
 * in-flight refresh so a rotating refresh token isn't consumed twice.
 * @returns Whether the refresh succeeded.
 */
export async function refreshSession(): Promise<boolean> {
  if (refreshing) {
    return await refreshing;
  }
  refreshing = (async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        credentials: 'include',
      });
      return res.ok;
    } catch {
      return false;
    }
  })();
  const ok = await refreshing;
  refreshing = null;
  return ok;
}

export class ApiError_ extends Error {
  status: number;
  body: ApiError | null;

  constructor(status: number, body: ApiError | null) {
    super(body?.error ?? body?.message ?? `HTTP ${status}`);
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
} & Omit<RequestInit, 'body'>;

function buildUrl(path: string, query?: RequestOptions['query']): string {
  let url = `${API_BASE}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) {
      url += `?${qs}`;
    }
  }
  return url;
}

async function unwrap<T>(res: Response, method: string, path: string): Promise<T> {
  if (!res.ok) {
    let errorBody: ApiError | null = null;
    try {
      errorBody = (await res.json()) as ApiError;
    } catch {
      // noop
    }
    throw new ApiError_(res.status, errorBody);
  }

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new ApiError_(res.status, { success: false, message: json.message, error: json.message });
  }
  logger.debug(`API ${method} ${path} -> success`);
  return json.data;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, headers: initHeaders, ...rest } = options;
  const url = buildUrl(path, query);

  const send = async (): Promise<Response> =>
    await fetch(url, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(initHeaders as Record<string, string>),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

  let res = await send();
  if (res.status === 401 && (await refreshSession())) {
    res = await send();
  }
  if (res.status === 401) {
    notifySessionExpired(path);
  }
  return await unwrap<T>(res, options.method ?? 'GET', path);
}

/**
 * Upload multipart form data (e.g. images). The browser sets the multipart
 * boundary; auth is the httpOnly cookie carried by the same-origin request.
 * @param path - API path appended to the base URL.
 * @param formData - The multipart form data to send.
 * @param options - Optional request options (HTTP method, defaults to POST).
 * @returns The unwrapped `data` payload from the API response.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { method?: string } = {},
): Promise<T> {
  const url = buildUrl(path);
  const method = options.method ?? 'POST';

  const send = async (): Promise<Response> =>
    await fetch(url, { method, body: formData, credentials: 'include' });

  let res = await send();
  if (res.status === 401 && (await refreshSession())) {
    res = await send();
  }
  if (res.status === 401) {
    notifySessionExpired(path);
  }
  return await unwrap<T>(res, method, path);
}
