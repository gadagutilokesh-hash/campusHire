// Centralized API Service Layer
// Bridges React frontend to Express.js REST API with Firebase Bearer token support,
// and preserves a clean demonstration fallback mode when VITE_USE_MOCK_API is enabled.

const IS_MOCK_MODE = import.meta.env.VITE_USE_MOCK_API === 'true';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Simulates network latency for realistic feel in demonstration mode
 */
export const delay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Standard API response wrapper
 */
export const apiResponse = (data, message = 'Success') => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString(),
});

export const apiError = (errorMessage, statusCode = 400) => {
  const err = new Error(errorMessage);
  err.statusCode = statusCode;
  err.success = false;
  return Promise.reject(err);
};

export const apiClient = {
  isMock: IS_MOCK_MODE,
  baseUrl: BASE_URL,

  getAuthHeader() {
    const token =
      localStorage.getItem('campushire_auth_token') ||
      localStorage.getItem('campushire_token') ||
      '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async get(endpoint, mockFallbackFn) {
    if (this.isMock && mockFallbackFn) {
      await delay(200);
      return mockFallbackFn();
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (this.isMock && mockFallbackFn) {
        console.warn(`[API] Failed fetching from ${endpoint}, using mock fallback:`, err.message);
        return mockFallbackFn();
      }
      throw err;
    }
  },

  async post(endpoint, payload, mockFallbackFn) {
    if (this.isMock && mockFallbackFn) {
      await delay(300);
      return mockFallbackFn(payload);
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (this.isMock && mockFallbackFn) {
        console.warn(`[API] Failed POST to ${endpoint}, using mock fallback:`, err.message);
        return mockFallbackFn(payload);
      }
      throw err;
    }
  },

  async put(endpoint, payload, mockFallbackFn) {
    if (this.isMock && mockFallbackFn) {
      await delay(300);
      return mockFallbackFn(payload);
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (this.isMock && mockFallbackFn) {
        console.warn(`[API] Failed PUT to ${endpoint}, using mock fallback:`, err.message);
        return mockFallbackFn(payload);
      }
      throw err;
    }
  },

  async patch(endpoint, payload, mockFallbackFn) {
    if (this.isMock && mockFallbackFn) {
      await delay(250);
      return mockFallbackFn(payload);
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (this.isMock && mockFallbackFn) {
        console.warn(`[API] Failed PATCH to ${endpoint}, using mock fallback:`, err.message);
        return mockFallbackFn(payload);
      }
      throw err;
    }
  },
};

