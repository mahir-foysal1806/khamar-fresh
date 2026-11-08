const BASE = import.meta.env.VITE_API_URL || '/api';
const KEY = 'kf_admin_token';

export const tokenStore = {
  get: () => localStorage.getItem(KEY),
  set: (t) => localStorage.setItem(KEY, t),
  clear: () => localStorage.removeItem(KEY),
};

export const assetUrl = (u) => (!u ? '' : /^(https?:|data:)/.test(u) ? u : `${import.meta.env.VITE_ASSET_URL || ''}${u}`);

async function request(path, { method = 'GET', body, query, auth = false, form } = {}) {
  const qs = query ? '?' + new URLSearchParams(Object.entries(query).filter(([, v]) => v !== '' && v != null && v !== false)).toString() : '';
  const headers = {};
  if (auth && tokenStore.get()) headers.Authorization = `Bearer ${tokenStore.get()}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${BASE}${path}${qs}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && auth) {
      tokenStore.clear();
      if (!location.pathname.includes('/admin/login')) location.href = '/admin/login';
    }
    const err = new Error(data.message || 'Something went wrong');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (p, query) => request(p, { query }),
  post: (p, body) => request(p, { method: 'POST', body }),
  // admin (authenticated)
  aget: (p, query) => request(p, { query, auth: true }),
  apost: (p, body) => request(p, { method: 'POST', body, auth: true }),
  aput: (p, body) => request(p, { method: 'PUT', body, auth: true }),
  apatch: (p, body) => request(p, { method: 'PATCH', body, auth: true }),
  adel: (p) => request(p, { method: 'DELETE', auth: true }),
  upload: async (files) => {
    const form = new FormData();
    [...files].forEach((f) => form.append('images', f));
    return request('/admin/upload', { method: 'POST', form, auth: true });
  },
};
