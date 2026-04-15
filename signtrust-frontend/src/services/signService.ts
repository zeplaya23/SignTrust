import { api } from './api';
import type { SignEnvelopeInfo } from '../types/envelope';

export const signService = {
  async getEnvelopeByToken(token: string): Promise<SignEnvelopeInfo> {
    const { data } = await api.get(`/sign/${token}`);
    return data;
  },

  async sendOtp(token: string): Promise<void> {
    await api.post(`/sign/${token}/otp/send`);
  },

  async verifyOtp(token: string, code: string): Promise<void> {
    await api.post(`/sign/${token}/otp/verify`, { code });
  },

  async sign(token: string, signatureBase64: string): Promise<void> {
    await api.post(`/sign/${token}/sign`, { signatureImageBase64: signatureBase64 });
  },

  async reject(token: string, reason?: string): Promise<void> {
    await api.post(`/sign/${token}/reject`, { reason });
  },
};
