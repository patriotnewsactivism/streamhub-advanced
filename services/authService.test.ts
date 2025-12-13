import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './authService';
import { User } from '../types';

const OFFLINE_ACCESS_TOKEN = 'offline-access-token';
const OFFLINE_USER_KEY = 'chatScreamerOfflineUser';

const buildStoredUser = (): User => ({
  id: 'offline-demo',
  email: 'stored@test.com',
  name: 'Stored User',
  username: 'stored',
  plan: 'free_trial',
  cloudHoursUsed: 0,
  cloudHoursLimit: 5,
});

describe('AuthService offline resiliency', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('falls back to offline signup when the network is unavailable', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
    const service = new AuthService();

    const user = await service.register({
      email: 'demo@test.com',
      username: 'demo',
      password: 'password123',
    });

    expect(user.plan).toBe('free_trial');
    expect(localStorage.getItem('accessToken')).toBe(OFFLINE_ACCESS_TOKEN);
    expect(localStorage.getItem(OFFLINE_USER_KEY)).not.toBeNull();
  });

  it('uses offline login when the API returns a server error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'maintenance' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const service = new AuthService();

    const user = await service.login({ email: 'fail@test.com', password: 'password123' });

    expect(user.id).toContain('offline-');
    expect(localStorage.getItem('accessToken')).toBe(OFFLINE_ACCESS_TOKEN);
  });

  it('restores offline sessions without hitting the network', async () => {
    localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(buildStoredUser()));
    localStorage.setItem('accessToken', OFFLINE_ACCESS_TOKEN);
    const service = new AuthService();
    const fetchSpy = vi.spyOn(global, 'fetch');

    const restoredUser = await service.getCurrentUser();

    expect(restoredUser?.email).toBe('stored@test.com');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
