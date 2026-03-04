/**
 * Centralized API Service
 * Handles all backend communication with automatic token injection and refresh
 */
import { API_URL } from '../config/api';

const API_BASE_URL = API_URL;

class ApiService {
  constructor() {
    this.tokenRefreshPromise = null;
  }

  /**
   * Get current JWT token from localStorage
   */
  getToken() {
    return localStorage.getItem('ocpToken');
  }

  /**
   * Build headers with Authorization token if available
   */
  getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Refresh JWT token using stored token
   */
  async refreshToken() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token available');
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success && data.data?.token) {
        localStorage.setItem('ocpToken', data.data.token);
        return data.data.token;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear invalid token and require re-login
      localStorage.removeItem('ocpToken');
      localStorage.removeItem('ocpUser');
      throw error;
    }
  }

  /**
   * Handle 401 responses with automatic token refresh retry
   */
  async handleTokenExpiry(originalRequest, originalHeaders) {
    // Prevent multiple simultaneous refresh attempts
    if (this.tokenRefreshPromise) {
      await this.tokenRefreshPromise;
      return this.fetch(originalRequest.url, {
        ...originalRequest,
        headers: this.getHeaders(originalHeaders),
      });
    }

    this.tokenRefreshPromise = this.refreshToken();

    try {
      await this.tokenRefreshPromise;
      this.tokenRefreshPromise = null;

      // Retry original request with new token
      return this.fetch(originalRequest.url, {
        ...originalRequest,
        headers: this.getHeaders(originalHeaders),
      });
    } catch (error) {
      this.tokenRefreshPromise = null;
      throw error;
    }
  }

  /**
   * Generic fetch wrapper with error handling
   */
  async fetch(url, options = {}) {
    const customHeaders = options.headers || {};
    const finalOptions = {
      ...options,
      headers: this.getHeaders(customHeaders),
    };

    try {
      let response = await fetch(url, finalOptions);

      // Handle token expiry with automatic refresh
      if (response.status === 401) {
        try {
          return await this.handleTokenExpiry({ url, ...finalOptions }, customHeaders);
        } catch (refreshError) {
          // Refresh failed, return original error
          return response;
        }
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Auth endpoints
   */
  auth = {
    login: async (email, password) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return response.json();
    },

    register: async (name, email, password, role) => {
      const response = await this.fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });
      return response.json();
    },

    logout: async (userId) => {
      const response = await this.fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      return response.json();
    },

    refresh: async (token) => {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      return response.json();
    },
  };

  /**
   * User management endpoints
   */
  users = {
    getAll: async () => {
      const response = await this.fetch(`${API_BASE_URL}/users`);
      return response.json();
    },

    getById: async (id) => {
      const response = await this.fetch(`${API_BASE_URL}/user/${id}`);
      return response.json();
    },

    delete: async (id) => {
      const response = await this.fetch(`${API_BASE_URL}/user/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },

    updateRole: async (id, role) => {
      const response = await this.fetch(`${API_BASE_URL}/user/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      return response.json();
    },

    toggleStatus: async (id) => {
      const response = await this.fetch(`${API_BASE_URL}/user/${id}/toggle-status`, {
        method: 'PUT',
      });
      return response.json();
    },

    getStatus: async (id) => {
      const response = await this.fetch(`${API_BASE_URL}/user/${id}/status`);
      return response.json();
    },
  };

  /**
   * Case endpoints
   */
  cases = {
    getAll: async (filters) => {
      const params = new URLSearchParams(filters).toString();
      const response = await this.fetch(`${API_BASE_URL}/get-cases?${params}`);
      return response.json();
    },

    getById: async (id) => {
      const response = await this.fetch(`${API_BASE_URL}/get-case?id=${id}`);
      return response.json();
    },

    create: async (caseData) => {
      const formData = new FormData();
      Object.keys(caseData).forEach(key => {
        formData.append(key, caseData[key]);
      });

      const response = await this.fetch(`${API_BASE_URL}/create-case`, {
        method: 'POST',
        body: formData,
        headers: {}, // FormData sets its own Content-Type
      });
      return response.json();
    },

    update: async (id, caseData) => {
      const formData = new FormData();
      Object.keys(caseData).forEach(key => {
        formData.append(key, caseData[key]);
      });

      const response = await this.fetch(`${API_BASE_URL}/update-case/${id}`, {
        method: 'POST',
        body: formData,
        headers: {},
      });
      return response.json();
    },

    delete: async (id) => {
      const response = await this.fetch(`${API_BASE_URL}/delete-case/${id}`, {
        method: 'DELETE',
      });
      return response.json();
    },
  };

  /**
   * Clearance endpoints
   */
  clearances = {
    getAll: async (filters) => {
      const params = new URLSearchParams(filters).toString();
      const response = await this.fetch(`${API_BASE_URL}/clearances?${params}`);
      return response.json();
    },

    getArchived: async (filters) => {
      const params = new URLSearchParams(filters).toString();
      const response = await this.fetch(`${API_BASE_URL}/clearances/archived?${params}`);
      return response.json();
    },

    create: async (clearanceData) => {
      const response = await this.fetch(`${API_BASE_URL}/clearances`, {
        method: 'POST',
        body: JSON.stringify(clearanceData),
      });
      return response.json();
    },

    deleteArchived: async (id) => {
      const response = await this.fetch(`${API_BASE_URL}/clearances/${id}/permanent`, {
        method: 'DELETE',
      });
      return response.json();
    },

    deleteAllArchived: async () => {
      const response = await this.fetch(`${API_BASE_URL}/clearances/archived/all`, {
        method: 'DELETE',
      });
      return response.json();
    },

    restore: async (id) => {
      const response = await this.fetch(`${API_BASE_URL}/clearances/${id}/restore`, {
        method: 'PATCH',
      });
      return response.json();
    },
  };
}

// Export singleton instance
export const apiService = new ApiService();
