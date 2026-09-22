// Stores the access token in memory (never in localStorage — safer against XSS)
let _accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export function getAccessToken() { return _accessToken; }
export function setAccessToken(t: string | null) { _accessToken = t; }

export const API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : '/api';

export function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    .then(async refreshRes => {
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setAccessToken(data.accessToken);
        return true;
      }
      setAccessToken(null);
      return false;
    })
    .catch(() => {
      setAccessToken(null);
      return false;
    })
    .finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Wrapper around fetch that auto-attaches the Bearer token.
// On a 401, it tries a silent token refresh before retrying once.
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const doRequest = (token: string | null) => {
    const url = `${API_URL}${path}${path.includes('?') ? '&' : '?'}cb=${Date.now()}`;
    return fetch(url, {
      cache: 'no-store',
      ...options,
      credentials: 'include', // send cookies (refresh token)
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  };

  let res = await doRequest(_accessToken);

  // Silent refresh on 401
  if (res.status === 401) {
    const success = await refreshSession();
    if (success) {
      res = await doRequest(_accessToken);
    }
  }

  return res;
}
