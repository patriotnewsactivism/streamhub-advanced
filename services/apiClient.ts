const BASE =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) ||
  (typeof window !== 'undefined' ? window.location.origin : '');

const API_BASE = BASE ? BASE.replace(/\/$/, '') : '';

const buildUrl = (path: string) => {
  if (!API_BASE) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};

export const pingBackend = async () => {
  const res = await fetch(buildUrl('/health'));
  if (!res.ok) throw new Error(`Healthcheck failed with ${res.status}`);
  return res.json();
};

export { API_BASE, buildUrl };
