import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth';
import type { SubscriptionStatus } from '../types/subscription';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  subscriptionStatus: SubscriptionStatus;
  setAuth: (token: string, refreshToken: string, user: User, subscriptionStatus: SubscriptionStatus) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      subscriptionStatus: 'NONE',
      setAuth: (token, refreshToken, user, subscriptionStatus) =>
        set({ token, refreshToken, user, subscriptionStatus }),
      setTokens: (token, refreshToken) =>
        set({ token, refreshToken }),
      logout: () =>
        set({ token: null, refreshToken: null, user: null, subscriptionStatus: 'NONE' }),
    }),
    { name: 'signtrust-auth' }
  )
);
