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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
