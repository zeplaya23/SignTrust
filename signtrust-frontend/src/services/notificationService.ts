import { api } from './api';

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
}

export const notificationService = {
  getAll: () => api.get<AppNotification[]>('/notifications').then((r) => r.data),
  markRead: (id: number) => api.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.post('/notifications/read-all').then((r) => r.data),
};
