import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import authModule from './auth.js';
import serverModule from './server.js';

const { generateAccessToken } = authModule;
const { app, pool } = serverModule;

let httpServer;
let baseUrl;

beforeAll(async () => {
  httpServer = app.listen(0);
  await new Promise((resolve) => httpServer.once('listening', resolve));
  const address = httpServer.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise((resolve, reject) => {
    httpServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PATCH /api/sessions/:id/end', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const querySpy = vi.spyOn(pool, 'query');

    const response = await fetch(`${baseUrl}/api/sessions/42/end`, {
      method: 'PATCH',
    });

    expect(response.status).toBe(401);
    expect(querySpy).not.toHaveBeenCalled();
  });

  it('returns 403 for authenticated non-owners when session exists', async () => {
    vi.spyOn(pool, 'query')
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ user_id: 999, ended_at: null }] });

    const token = generateAccessToken({ id: 123 });
    const response = await fetch(`${baseUrl}/api/sessions/42/end`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Access denied' });
    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('AND user_id = $2'),
      ['42', 123]
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      'SELECT user_id, ended_at FROM stream_sessions WHERE id = $1',
      ['42']
    );
  });

  it('returns 200 for authenticated owners and ends their session', async () => {
    const endedSession = {
      id: 42,
      user_id: 123,
      status: 'ended',
      ended_at: '2026-03-30T00:00:00.000Z',
      duration_seconds: 120,
    };

    vi.spyOn(pool, 'query').mockResolvedValueOnce({ rows: [endedSession] });

    const token = generateAccessToken({ id: 123 });
    const response = await fetch(`${baseUrl}/api/sessions/42/end`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ session: endedSession });
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('AND user_id = $2'),
      ['42', 123]
    );
  });
});
