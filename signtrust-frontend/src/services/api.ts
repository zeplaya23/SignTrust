import axios from 'axios';
import { ENV } from '../config/env';
import { useAuthStore } from '../stores/useAuthStore';

export const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const user = useAuthStore.getState().user;
  if (user?.tenantId) {
    config.headers['X-Tenant-Id'] = user.tenantId;
  }
  return config;
});

// Refresh token logic — prevent multiple concurrent refresh calls
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) throw new Error('No refresh token');

  const resp = await axios.post(`${ENV.API_BASE_URL}/auth/refresh`, {
    refreshToken,
  });

  const { accessToken, refreshToken: newRefreshToken } = resp.data;
  useAuthStore.getState().setTokens(accessToken, newRefreshToken);
  return accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';

    // Don't intercept auth endpoints
    if (url.includes('/auth/')) {
      return Promise.reject(error);
    }

    // On 401, try to refresh the token once
    if (error.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;

      try {
        // Reuse in-flight refresh if one is already running
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — session expired, force logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
