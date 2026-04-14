import { api } from './api';

export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  envelopeCount: number;
  lastActive: string;
}

export const teamService = {
  getAll: () => api.get<TeamMember[]>('/team').then((r) => r.data),
  invite: (data: { email: string; firstName: string; lastName: string; role: string }) =>
    api.post('/team/invite', data).then((r) => r.data),
  updateRole: (userId: string, role: string) =>
    api.put(`/team/${userId}/role`, { role }).then((r) => r.data),
};
