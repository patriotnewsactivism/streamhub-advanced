import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('apiClient base-path fallback', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('falls back to single-path deployment prefix when root health endpoint is 404', async () => {
    window.history.pushState({}, '', '/log');

    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('Not found', { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'healthy' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    const { pingBackend } = await import('./apiClient');
    const payload = await pingBackend();

    expect(payload).toEqual({ status: 'healthy' });
    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:3000/health', undefined);
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:3000/log/health', undefined);
  });

  it('uses explicit VITE_BACKEND_URL without fallback probing', async () => {
    vi.stubEnv('VITE_BACKEND_URL', 'https://api.example.com');

    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'healthy' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const { pingBackend } = await import('./apiClient');
    await pingBackend();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/health', undefined);
  });
});
