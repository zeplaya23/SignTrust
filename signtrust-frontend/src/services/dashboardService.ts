import { api } from './api';
import type { Envelope } from '../types/envelope';

export interface QuotaInfo {
  plan: string;
  subscriptionStatus: string;
  envelopesMax: number;
  envelopesUsed: number;
  canCreate: boolean;
  message: string | null;
}

export interface DashboardStats {
  totalEnvelopes: number;
  pending: number;
  signed: number;
  completionRate: number;
  quota: QuotaInfo | null;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get('/dashboard/stats');
    return data;
  },

  async getRecent(): Promise<Envelope[]> {
    const { data } = await api.get('/dashboard/recent');
    return data;
  },
};
