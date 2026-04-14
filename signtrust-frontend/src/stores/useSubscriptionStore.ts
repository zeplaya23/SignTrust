import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Plan } from '../config/plans';
import type { PaymentMethod, MobileOperator } from '../types/subscription';

interface SubscriptionState {
  selectedPlan: Plan | null;
  accountType: 'particulier' | 'entreprise';
  registrationData: {
    companyName?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  } | null;
  otpVerified: boolean;
  paymentMethod: PaymentMethod;
  mobileOperator: MobileOperator | null;
  paymentReference: string | null;
  userId: number | null;
  selectPlan: (plan: Plan) => void;
  setAccountType: (type: 'particulier' | 'entreprise') => void;
  setRegistrationData: (data: SubscriptionState['registrationData']) => void;
  setOtpVerified: (v: boolean) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setMobileOperator: (op: MobileOperator | null) => void;
  setPaymentReference: (ref: string | null) => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      selectedPlan: null,
      accountType: 'entreprise',
      registrationData: null,
      otpVerified: false,
      paymentMethod: 'mobile_money',
      mobileOperator: null,
      paymentReference: null,
      userId: null,
      selectPlan: (plan) => set({ selectedPlan: plan }),
      setAccountType: (type) => set({ accountType: type }),
      setRegistrationData: (data) => set({ registrationData: data }),
      setOtpVerified: (v) => set({ otpVerified: v }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setMobileOperator: (op) => set({ mobileOperator: op }),
      setPaymentReference: (ref) => set({ paymentReference: ref }),
      reset: () => set({
        selectedPlan: null,
        accountType: 'entreprise',
        registrationData: null,
        otpVerified: false,
        paymentMethod: 'mobile_money',
        mobileOperator: null,
        paymentReference: null,
        userId: null,
      }),
    }),
    {
      name: 'signtrust-subscription',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
