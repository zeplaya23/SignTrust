import { api } from './api';

export interface AnalyticsOverview {
  totalEnvelopes: number;
  envelopesThisMonth: number;
  envelopesGrowth: number;
  totalSignatures: number;
  signaturesThisMonth: number;
  signaturesGrowth: number;
  pending: number;
  completed: number;
  rejected: number;
  completionRate: number;
  teamSize: number;
}

export interface UserStats {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  envelopesCreated: number;
  signaturesDone: number;
  lastActivity: string | null;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface Trends {
  envelopes: TrendPoint[];
  signatures: TrendPoint[];
}

export const analyticsService = {
  getOverview: () =>
    api.get<AnalyticsOverview>('/analytics/overview').then((r) => r.data),

  getUserStats: () =>
    api.get<UserStats[]>('/analytics/users').then((r) => r.data),

  getTrends: (days = 30) =>
    api.get<Trends>('/analytics/trends', { params: { days } }).then((r) => r.data),
};
