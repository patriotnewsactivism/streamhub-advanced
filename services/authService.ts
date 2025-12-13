import { User } from '../types';
import { buildUrl } from './apiClient';

interface AuthResponse {
  user: {
    id: number;
    email: string;
    username: string;
    plan: string;
    cloudHoursUsed: number;
    cloudHoursLimit: number;
    trialEndDate?: string;
  };
  accessToken: string;
  refreshToken: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
}

export class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on init
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private getOfflineUser(): User | null {
    const stored = localStorage.getItem(OFFLINE_USER_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored) as User;
    } catch (error) {
      console.warn('Failed to parse offline user profile', error);
      localStorage.removeItem(OFFLINE_USER_KEY);
      return null;
    }
  }

  private persistOfflineSession(user: User): User {
    this.accessToken = OFFLINE_ACCESS_TOKEN;
    this.refreshToken = OFFLINE_REFRESH_TOKEN;
    localStorage.setItem('accessToken', OFFLINE_ACCESS_TOKEN);
    localStorage.setItem('refreshToken', OFFLINE_REFRESH_TOKEN);
    localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user));
    return user;
  }

  private buildOfflineUser(email: string, username?: string): User {
    const derivedUsername =
      username || email?.split('@')[0] || 'creator';

    return {
      id: `offline-${derivedUsername}`,
      email,
      name: derivedUsername,
      username: derivedUsername,
      plan: 'free_trial',
      cloudHoursUsed: 0,
      cloudHoursLimit: 5,
    };
  }

  private fallbackToOfflineUser(email: string, username?: string): User {
    const offlineUser = this.getOfflineUser() || this.buildOfflineUser(email, username);
    return this.persistOfflineSession(offlineUser);
  }

  /**
   * Safely parse JSON response, handling HTML error pages
   */
  private async parseJsonResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    const text = await response.text();

    // Check if response is JSON
    if (contentType && contentType.includes('application/json')) {
      try {
        return JSON.parse(text);
      } catch {
        throw new Error('Invalid JSON response from server');
      }
    }

    // Response is not JSON (likely HTML error page)
    if (text.toLowerCase().includes('<!doctype') || text.toLowerCase().includes('<html')) {
      throw new Error('Server returned an error page. The API may be unavailable.');
    }

    // Try to parse anyway in case content-type is wrong
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(text || 'Unknown server error');
    }
  }

  /**
   * Register a new user
   */
  async register(credentials: RegisterCredentials): Promise<User> {
    let response: Response;

    try {
      response = await fetch(buildUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
    } catch (_networkError) {
      console.warn('Falling back to offline auth after network error');
      return this.fallbackToOfflineUser(credentials.email, credentials.username);
    }

    if (!response.ok) {
      const error = await this.parseJsonResponse(response);
      const validationMessage = Array.isArray(error?.errors)
        ? error.errors.map((issue: any) => issue.msg || issue.message).join(' ')
        : null;
      throw new Error(
        validationMessage || error.error || error.message || `Registration failed (${response.status})`
      );
    }

    const data: AuthResponse = await this.parseJsonResponse(response);

    // Store tokens
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return {
      id: data.user.id.toString(),
      email: data.user.email,
      name: data.user.username, // Map username to name for frontend
      username: data.user.username,
      plan: (data.user.plan as any) || 'free_trial',
      cloudHoursUsed: data.user.cloudHoursUsed || 0,
      cloudHoursLimit: data.user.cloudHoursLimit || 5,
      trialEndDate: data.user.trialEndDate,
    };
  }

  /**
   * Login existing user
   */
  async login(credentials: LoginCredentials): Promise<User> {
    let response: Response;

    try {
      response = await fetch(buildUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
    } catch (_networkError) {
      console.warn('Falling back to offline auth after network error');
      return this.fallbackToOfflineUser(credentials.email);
    }

    if (!response.ok) {
      const error = await this.parseJsonResponse(response);
      const validationMessage = Array.isArray(error?.errors)
        ? error.errors.map((issue: any) => issue.msg || issue.message).join(' ')
        : null;
      throw new Error(
        validationMessage || error.error || error.message || `Login failed (${response.status})`
      );
    }

    const data: AuthResponse = await this.parseJsonResponse(response);

    // Store tokens
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return {
      id: data.user.id.toString(),
      email: data.user.email,
      name: data.user.username, // Map username to name for frontend
      username: data.user.username,
      plan: (data.user.plan as any) || 'always_free',
      cloudHoursUsed: data.user.cloudHoursUsed || 0,
      cloudHoursLimit: data.user.cloudHoursLimit || 5,
      trialEndDate: data.user.trialEndDate,
    };
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      if (this.accessToken) {
        await fetch(buildUrl('/api/auth/logout'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens regardless of API call success
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem(OFFLINE_USER_KEY);
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    if (!this.accessToken) {
      return this.getOfflineUser();
    }

    // Serve offline users without making a network request
    if (this.accessToken === OFFLINE_ACCESS_TOKEN) {
      return this.getOfflineUser();
    }

    try {
      const response = await fetch(buildUrl('/api/auth/me'), {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry with new token
          return this.getCurrentUser();
        }
        return null;
      }

      if (!response.ok) {
        const error = await this.parseJsonResponse(response).catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch user profile');
      }

      const data = await this.parseJsonResponse(response);

      return {
        id: data.user.id.toString(),
        email: data.user.email,
        name: data.user.username, // Map username to name for frontend
        username: data.user.username,
        plan: (data.user.plan as any) || 'always_free',
        cloudHoursUsed: data.user.cloudHoursUsed || 0,
        cloudHoursLimit: data.user.cloudHoursLimit || 5,
        trialEndDate: data.user.trialEndDate,
      };
    } catch (error) {
      console.error('Error fetching current user:', error);
      const offlineUser = this.getOfflineUser();
      if (offlineUser) return offlineUser;
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken || this.refreshToken === OFFLINE_REFRESH_TOKEN) {
      return false;
    }

    try {
      const response = await fetch(buildUrl('/api/auth/refresh'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        // Refresh token invalid or expired
        await this.logout();
        return false;
      }

      const data = await this.parseJsonResponse(response);
      this.accessToken = data.accessToken;
      localStorage.setItem('accessToken', data.accessToken);

      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await this.logout();
      return false;
    }
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Make authenticated API request
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.accessToken}`,
    };

    let response = await fetch(url, { ...options, headers });

    // If 401, try to refresh token and retry
    if (response.status === 401) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry with new token
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...options, headers });
      } else {
        throw new Error('Authentication expired');
      }
    }

    return response;
  }
}

export const authService = new AuthService();
export default authService;
