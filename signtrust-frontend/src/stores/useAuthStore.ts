import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth';
import type { SubscriptionStatus } from '../types/subscription';

interface AuthState {
  token: string | null;
  user: User | null;
  subscriptionStatus: SubscriptionStatus;
  setAuth: (token: string, user: User, subscriptionStatus: SubscriptionStatus) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      subscriptionStatus: 'NONE',
      setAuth: (token, user, subscriptionStatus) => set({ token, user, subscriptionStatus }),
      logout: () => set({ token: null, user: null, subscriptionStatus: 'NONE' }),
    }),
    { name: 'signtrust-auth' }
  )
);
