import { useState, useEffect, useRef } from 'react';
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
};

export function useSubscription() {
  const [info, setInfo] = useState<SubscriptionInfo>(DEFAULT_INFO);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.user?.id);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Abort previous request if user changed
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!userId) {
      setInfo(DEFAULT_INFO);
      setLoading(false);
      return;
    }

    setLoading(true);
    const load = async () => {
      try {
        const [sub, stats] = await Promise.all([
          settingsService.getSubscription(),
          dashboardService.getStats(),
        ]);
        if (controller.signal.aborted) return;
        const plan = PLANS.find((p) => p.id === sub.planId) || PLANS[0];
        setInfo({
          planId: sub.planId || 'discovery',
          planName: plan.name,
          status: sub.status || 'NONE',
          used: stats.totalEnvelopes,
          max: plan.envelopesPerMonth,
          price: plan.price,
          startDate: sub.startDate || '',
          endDate: sub.endDate || '',
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
    };
    load();

    return () => controller.abort();
  }, [userId]);

  return { info, loading };
}
