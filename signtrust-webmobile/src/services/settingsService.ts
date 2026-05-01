import { api } from './api';

export const settingsService = {
  getProfile: () => api.get('/settings/profile').then((r) => r.data),
  updateProfile: (data: { firstName: string; lastName: string; phone: string }) =>
    api.put('/settings/profile', data).then((r) => r.data),
  getSubscription: () => api.get('/settings/subscription').then((r) => r.data),
};
