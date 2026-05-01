export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED' | 'NONE';
export type PaymentMethod = 'card' | 'mobile_money' | 'virement';
export type MobileOperator = 'orange' | 'mtn' | 'moov' | 'wave';

export interface Subscription {
  id: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
}
