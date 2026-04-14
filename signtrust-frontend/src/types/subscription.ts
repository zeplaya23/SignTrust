export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'NONE';

export type PaymentMethod = 'card' | 'mobile_money' | 'virement';

export type MobileOperator = 'orange' | 'mtn' | 'moov' | 'wave';

export interface Subscription {
  id: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  trialEndDate?: string;
}

export interface PaymentInitResponse {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
}

export interface PaymentVerifyResponse {
  reference: string;
  status: 'success' | 'failed' | 'pending' | 'abandoned';
  amount: number;
  currency: string;
  channel: string;
  paidAt: string;
}
