const BASE = '/api';

function getToken() {
  return localStorage.getItem('casa_token');
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try { data = await res.json(); } catch (e) { /* respuesta sin cuerpo */ }

  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem('casa_token');
      if (!location.pathname.startsWith('/login')) location.href = '/login';
    }
    throw new Error((data && data.error) || 'Error de red');
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  setToken: (token) => localStorage.setItem('casa_token', token),
  clearToken: () => localStorage.removeItem('casa_token'),
  hasToken: () => !!getToken(),
};
