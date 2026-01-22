import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import config from '../config';

/**
 * Standard API Response interface
 * All API responses should follow this structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  status: number;
  message: string;
  data?: T;
  errors?: string[];
  warnings?: string[];
  timestamp?: string;
}

/**
 * API Error Response interface
 */
export interface ApiErrorResponse {
  success: false;
  status: number;
  message: string;
  errors?: string[];
}

/**
 * Create and configure API client instance
 */
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: config.api.baseURL,
    timeout: config.api.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  instance.interceptors.request.use(
    (requestConfig) => {
      // Add auth token if available
      const token = localStorage.getItem('authToken');
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }

      return requestConfig;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
      // Log errors in development
      if (config.isDevelopment) {
        console.error('API Error:', error);
      }

      // Handle specific status codes
      if (error.response?.status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem('authToken');
        // You can emit an event or use Redux here to trigger logout
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const apiClient = createApiClient();

/**
 * Generic API request wrapper with error handling
 */
export const apiRequest = async <T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient({
      method,
      url,
      data,
      ...config,
    });

    return response.data as ApiResponse<T>;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw {
        success: false,
        status: error.response?.status || 500,
        message: error.response?.data?.message || error.message || 'An error occurred',
        errors: error.response?.data?.errors,
      } as ApiErrorResponse;
    }

    throw {
      success: false,
      status: 500,
      message: 'An unexpected error occurred',
    } as ApiErrorResponse;
  }
};

/**
 * Utility methods for common API operations
 */
export const apiService = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>('GET', url, undefined, config),

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>('POST', url, data, config),

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>('PUT', url, data, config),

  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiRequest<T>('PATCH', url, data, config),

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>('DELETE', url, undefined, config),
};

export default apiClient;
