import { User } from '../types';

// Use empty string for relative URLs - nginx/Vite proxy handles routing to backend
const API_BASE = import.meta.env.VITE_BACKEND_URL || '';

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
      response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
    } catch (_networkError) {
      throw new Error('Network error: Unable to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      const error = await this.parseJsonResponse(response);
      throw new Error(error.error || error.message || `Registration failed (${response.status})`);
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
      response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });
    } catch (_networkError) {
      throw new Error('Network error: Unable to connect to server. Please check your connection.');
    }

    if (!response.ok) {
      const error = await this.parseJsonResponse(response);
      throw new Error(error.error || error.message || `Login failed (${response.status})`);
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
