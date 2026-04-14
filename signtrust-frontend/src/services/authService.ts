import { api } from './api';
import type { LoginRequest, RegisterRequest } from '../types/auth';

export interface RegisterResponse {
  userId: number;
  email: string;
  message: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    tenantId: string;
    subscriptionStatus: string;
  };
}

export interface OtpResponse {
  success: boolean;
  message: string;
}

export const authService = {
  register: (data: RegisterRequest) =>
    api.post<RegisterResponse>('/auth/register', data).then((r) => r.data),

  login: (data: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', data).then((r) => r.data),

  sendOtp: (email: string) =>
    api.post<OtpResponse>('/auth/otp/send', { email }).then((r) => r.data),

  verifyOtp: (email: string, code: string) =>
    api.post<OtpResponse>('/auth/otp/verify', { email, code }).then((r) => r.data),
};
