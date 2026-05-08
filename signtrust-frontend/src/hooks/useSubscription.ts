import { useState, useEffect, useRef, useCallback } from 'react';
import { create } from 'zustand';
import { settingsService } from '../services/settingsService';
import { dashboardService } from '../services/dashboardService';
import { useAuthStore } from '../stores/useAuthStore';
import { PLANS } from '../config/plans';

export interface SubscriptionInfo {
  planId: string;
  planName: string;
  status: string;
  used: number;
  max: number;
  price: number;
  startDate: string;
  endDate: string;
  canCreate: boolean;
  quotaMessage: string | null;
}

const DEFAULT_INFO: SubscriptionInfo = {
  planId: 'discovery',
  planName: 'Découverte',
  status: 'NONE',
  used: 0,
  max: 5,
  price: 0,
  startDate: '',
  endDate: '',
  canCreate: true,
  quotaMessage: null,
};

// Shared refresh trigger — any component can call refreshSubscription()
interface RefreshStore {
  key: number;
  refresh: () => void;
}

const useRefreshStore = create<RefreshStore>((set) => ({
  key: 0,
  refresh: () => set((s) => ({ key: s.key + 1 })),
}));

/** Call this from anywhere to force subscription/quota reload */
export const refreshSubscription = () => useRefreshStore.getState().refresh();

export function useSubscription() {
  const [info, setInfo] = useState<SubscriptionInfo>(DEFAULT_INFO);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);
  const refreshKey = useRefreshStore((s) => s.key);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (controller: AbortController) => {
    try {
      const [sub, stats] = await Promise.all([
        settingsService.getSubscription(),
        dashboardService.getStats(),
      ]);
      if (controller.signal.aborted) return;
      const plan = PLANS.find((p) => p.id === sub.planId) || PLANS[0];
      const quota = stats.quota;
      setInfo({
        planId: sub.planId || 'discovery',
        planName: plan.name,
        status: sub.status || 'NONE',
        used: quota?.envelopesUsed ?? stats.totalEnvelopes,
        max: quota?.envelopesMax ?? plan.envelopesPerMonth,
        price: plan.price,
        startDate: sub.startDate || '',
        endDate: sub.endDate || '',
        canCreate: quota?.canCreate ?? true,
        quotaMessage: quota?.message ?? null,
      });
    } catch {
      if (!controller.signal.aborted) {
        setInfo(DEFAULT_INFO);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!userId) {
      setInfo(DEFAULT_INFO);
      setLoading(false);
      return;
    }

    setLoading(true);
    load(controller);

    return () => controller.abort();
  }, [userId, refreshKey, load]);

  return { info, loading, refresh: useRefreshStore.getState().refresh };
}
