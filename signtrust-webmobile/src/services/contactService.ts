import { api } from './api';

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  envelopeCount: number;
  createdAt: string;
}

export const contactService = {
  getAll: () => api.get<Contact[]>('/contacts').then((r) => r.data),
  create: (data: { name: string; email: string; phone?: string }) =>
    api.post<Contact>('/contacts', data).then((r) => r.data),
  remove: (id: number) => api.delete(`/contacts/${id}`).then((r) => r.data),
};
