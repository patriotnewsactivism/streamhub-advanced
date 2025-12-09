import { User } from '../types';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

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

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on init
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  /**
   * Register a new user
   */
  async register(credentials: RegisterCredentials): Promise<User> {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data: AuthResponse = await response.json();

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
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data: AuthResponse = await response.json();

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
        await fetch(`${API_BASE}/api/auth/logout`, {
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
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User | null> {
    if (!this.accessToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
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
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();

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
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        // Refresh token invalid or expired
        this.logout();
        return false;
      }

      const data = await response.json();
      this.accessToken = data.accessToken;
      localStorage.setItem('accessToken', data.accessToken);

      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.logout();
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
