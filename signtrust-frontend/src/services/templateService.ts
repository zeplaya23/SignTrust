import { api } from './api';

export interface Template {
  id: number;
  name: string;
  description: string;
  documentsCount: number;
  usageCount: number;
  createdAt: string;
}

export const templateService = {
  getAll: () => api.get<Template[]>('/templates').then((r) => r.data),
  create: (data: { name: string; description: string }) =>
    api.post<Template>('/templates', data).then((r) => r.data),
  remove: (id: number) => api.delete(`/templates/${id}`).then((r) => r.data),
};
