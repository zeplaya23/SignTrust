import { api } from './api';

export interface ApiKey {
  id: number;
  keyPrefix: string;
  label: string;
  usageCount: number;
  active: boolean;
  enabled: boolean;
  createdAt: string;
  revokedAt: string | null;
}

export interface ApiKeyCreated {
  id: number;
  keyPrefix: string;
  label: string;
  fullKey: string;
}

export const apiKeyService = {
  getAll: () => api.get<ApiKey[]>('/apikeys').then((r) => r.data),

  create: (label: string) =>
    api.post<ApiKeyCreated>('/apikeys', { label }).then((r) => r.data),

  toggle: (id: number) =>
    api.patch<ApiKey>(`/apikeys/${id}/toggle`).then((r) => r.data),

  revoke: (id: number) => api.delete(`/apikeys/${id}`).then((r) => r.data),
};
