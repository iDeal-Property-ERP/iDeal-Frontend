import { Env } from '@/libs/Env';
import { logger } from '@/libs/Logger';
import type { ApiError, ApiResponse } from '@/types/api';

const TOKEN_KEY = 'ideal_access_token';
const REFRESH_KEY = 'ideal_refresh_token';

function getStoredTokens(): { access: string | null; refresh: string | null } {
  if (typeof window === 'undefined') {
    return { access: null, refresh: null };
  }
  return {
    access: localStorage.getItem(TOKEN_KEY),
    refresh: localStorage.getItem(REFRESH_KEY),
  };
}

export function storeTokens(access: string, refresh: string): void {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken(): string | null {
  return getStoredTokens().access;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refresh } = getStoredTokens();
  if (!refresh) {
    return null;
  }

  try {
    const res = await fetch(`${Env.NEXT_PUBLIC_API_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const json = (await res.json()) as ApiResponse<{
      access_token: string;
      refresh_token: string;
    }>;

    if (!json.success || !json.data) {
      clearTokens();
      return null;
    }

    storeTokens(json.data.access_token, json.data.refresh_token);
    return json.data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

async function getValidToken(): Promise<string | null> {
  const { access } = getStoredTokens();
  if (access) {
    return access;
  }

  if (isRefreshing && refreshPromise) {
    return await refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = refreshAccessToken();
  const token = await refreshPromise;
  isRefreshing = false;
  refreshPromise = null;
  return token;
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

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, body, headers: initHeaders, ...rest } = options;

  const url = new URL(`${Env.NEXT_PUBLIC_API_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(initHeaders as Record<string, string>),
  };

  const token = await getValidToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res = await fetch(url.toString(), {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url.toString(), {
        ...rest,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    }
  }

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
    throw new ApiError_(res.status, {
      success: false,
      message: json.message,
      error: json.message,
    });
  }

  logger.debug(`API ${options.method ?? 'GET'} ${path} -> success`);
  return json.data;
}

/**
 * Upload multipart form data (e.g. images) with the same auth/refresh handling
 * as {@link apiFetch}. Does NOT set Content-Type — the browser sets the
 * multipart boundary automatically.
 * @param path - API path appended to the configured base URL.
 * @param formData - The multipart form data to send.
 * @param options - Optional request options (HTTP method, defaults to POST).
 * @returns The unwrapped `data` payload from the API response.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: { method?: string } = {},
): Promise<T> {
  const url = `${Env.NEXT_PUBLIC_API_URL}${path}`;
  const headers: Record<string, string> = {};

  const token = await getValidToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const method = options.method ?? 'POST';
  let res = await fetch(url, { method, headers, body: formData });

  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url, { method, headers, body: formData });
    }
  }

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
  return json.data;
}
