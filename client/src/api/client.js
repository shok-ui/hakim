const BASE = '/api';

export function setToken(token) {
  if (token) localStorage.setItem('hakim.token', token);
  else localStorage.removeItem('hakim.token');
}

function getToken() {
  return localStorage.getItem('hakim.token');
}

// Minimal fetch wrapper: JSON in/out, bearer token attached, errors thrown
// as Error objects with the server message and HTTP status.
export async function api(path, { method = 'GET', body, query } = {}) {
  const url = new URL(BASE + path, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    }
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) setToken(null);
    const error = new Error(data.message ?? `Request failed (${res.status})`);
    error.status = res.status;
    error.details = data.details;
    throw error;
  }
  return data;
}
