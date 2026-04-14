import { api } from './api';

export interface PaymentInitRequest {
  userId: number;
  planId: string;
  paymentMethod: string;
  mobileOperator: string | null;
  amount: number;
}

export interface PaymentInitResponse {
  reference: string;
  status: string;
  message: string;
}

export interface PaymentVerifyResponse {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  channel: string;
  paidAt: string;
  subscriptionStatus: string;
}

export const paymentService = {
  initialize: (data: PaymentInitRequest) =>
    api.post<PaymentInitResponse>('/api/payments/initialize', data).then((r) => r.data),

  verify: (reference: string) =>
    api.get<PaymentVerifyResponse>(`/api/payments/verify/${reference}`).then((r) => r.data),
};
