const API_BASE = '/api';

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include', // carry HttpOnly cookie
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Redirect to login on auth failure
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new Error('未登录或登录已过期');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: '请求失败' }));
    throw new Error(body.message ?? `请求失败 (${res.status})`);
  }

  return res.json();
}
