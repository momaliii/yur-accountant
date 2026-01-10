// Get API base URL and ensure it doesn't end with /api
let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// Remove any trailing /api to avoid double prefix
API_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// Import apiClient only where needed (avoid circular dependency)
let apiClient;
const getApiClient = async () => {
  if (!apiClient) {
    apiClient = (await import('../api/client.js')).default;
  }
  return apiClient;
};

const authService = {
  async login(email, password) {
    try {
      // Ensure we have a clean URL without double slashes
      const baseUrl = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
      const url = `${baseUrl}/api/auth/login`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store token
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(email, password, name, planSlug = null, billingCycle = 'monthly') {
    try {
      // Ensure we have a clean URL without double slashes
      const baseUrl = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
      const url = `${baseUrl}/api/auth/register`;
      const body = { email, password, name };
      if (planSlug) {
        body.planSlug = planSlug;
        body.billingCycle = billingCycle;
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();
      
      // Store token
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async getCurrentUser() {
    try {
      const token = this.getToken();
      if (!token) return null;

      const client = await getApiClient();
      const response = await client.get('/api/auth/me');
      return response;
    } catch (error) {
      console.error('Get current user error:', error);
      this.logout();
      return null;
    }
  },

  async refreshToken() {
    try {
      const client = await getApiClient();
      const response = await client.post('/api/auth/refresh');
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      return response;
    } catch (error) {
      console.error('Refresh token error:', error);
      this.logout();
      throw error;
    }
  },

  getToken() {
    return localStorage.getItem('auth_token');
  },

  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },
};

export default authService;
