const configuredBackendUrl =
  typeof import.meta !== 'undefined' ? import.meta.env?.VITE_BACKEND_URL : '';

const configuredBasePath =
  typeof import.meta !== 'undefined' ? import.meta.env?.BASE_URL || '/' : '/';

const normalizeBase = (value: string) => value.replace(/\/$/, '');

const normalizePathPrefix = (value: string) => {
  if (!value || value === '/') return '';
  return `/${value.replace(/^\/+|\/+$/g, '')}`;
};

const getCandidateBases = (): string[] => {
  if (configuredBackendUrl) {
    return [normalizeBase(configuredBackendUrl)];
  }

  if (typeof window === 'undefined') return [''];

  const origin = normalizeBase(window.location.origin);
  const candidates = new Set<string>([origin]);

  const basePath = normalizePathPrefix(configuredBasePath);
  if (basePath) {
    candidates.add(`${origin}${basePath}`);
  }

  const pathnameParts = window.location.pathname.split('/').filter(Boolean);
  if (!basePath && pathnameParts.length === 1) {
    candidates.add(`${origin}/${pathnameParts[0]}`);
  }

  return Array.from(candidates);
};

const buildUrlFromBase = (base: string, path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!base) return normalizedPath;
  return `${base}${normalizedPath}`;
};

const API_BASE = getCandidateBases()[0] || '';

const buildUrl = (path: string) => buildUrlFromBase(API_BASE, path);

const apiFetch = async (path: string, options?: RequestInit) => {
  const bases = getCandidateBases();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      const response = await fetch(buildUrlFromBase(base, path), options);
      if (response.status === 404 && bases.length > 1) {
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`Request failed for ${path}`);
};

export const pingBackend = async () => {
  const res = await apiFetch('/health');
  if (!res.ok) throw new Error(`Healthcheck failed with ${res.status}`);
  return res.json();
};

export { API_BASE, buildUrl, apiFetch };
