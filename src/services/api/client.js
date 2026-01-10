// Get API base URL and ensure it doesn't end with /api
let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// Remove any trailing /api to avoid double prefix
API_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

// Helper to get token without circular dependency
const getToken = () => {
  return localStorage.getItem('auth_token');
};

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = getToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 - Unauthorized
      if (response.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/#/login';
        throw new Error('Session expired. Please login again.');
      }

      return this.handleResponse(response);
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }

  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      let errorData = null;
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
      } catch (parseError) {
        // If we can't parse the error, use status text
        errorMessage = response.statusText || errorMessage;
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.response = { data: errorData, status: response.status };
      throw error;
    }

    // Handle empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null;
    }

    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    const config = {
      ...options,
      method: 'DELETE',
    };
    
    // If body is provided, add it to the request
    if (options.body) {
      config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }
    
    return this.request(endpoint, config);
  }
}

const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;
