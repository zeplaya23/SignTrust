import { api } from './api';

export interface AuditLog {
  id: number;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface AuditPage {
  items: AuditLog[];
  total: number;
  page: number;
  size: number;
}

export const auditService = {
  list: (params: { page?: number; size?: number; userId?: string; action?: string; days?: number }) =>
    api.get<AuditPage>('/audit', { params }).then((r) => r.data),

  getActions: () =>
    api.get<string[]>('/audit/actions').then((r) => r.data),
};
