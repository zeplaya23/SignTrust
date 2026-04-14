import { api } from './api';
import type { SignEnvelopeInfo } from '../types/envelope';

export const signService = {
  async getEnvelopeByToken(token: string): Promise<SignEnvelopeInfo> {
    const { data } = await api.get(`/sign/${token}`);
    return data;
  },

  async sign(token: string, signatureBase64: string): Promise<void> {
    await api.post(`/sign/${token}`, { signature: signatureBase64 });
  },

  async reject(token: string, reason?: string): Promise<void> {
    await api.post(`/sign/${token}/reject`, { reason });
  },
};
