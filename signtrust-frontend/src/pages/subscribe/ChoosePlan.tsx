import { Link } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import PlanCard from '../../components/subscription/PlanCard';
import PlanSummary from '../../components/subscription/PlanSummary';
import Button from '../../components/ui/Button';
import { PLANS } from '../../config/plans';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useEffect } from 'react';

export default function ChoosePlan() {
  const { selectedPlan, selectPlan } = useSubscriptionStore();

  // Default to Pro plan if nothing selected
  useEffect(() => {
    if (!selectedPlan) {
      const proPlan = PLANS.find((p) => p.id === 'pro');
      if (proPlan) selectPlan(proPlan);
    }
  }, [selectedPlan, selectPlan]);

  return (
    <div className="min-h-screen bg-bg">
      <TopBar currentStep={1} stepLabel="Choix du plan" />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-dark text-center mb-8">
          Choisissez votre abonnement
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlan?.id === plan.id}
              onSelect={selectPlan}
            />
          ))}
        </div>

        <PlanSummary plan={selectedPlan} />

        <div className="mt-8 flex items-center justify-between">
          <Link
            to="/"
            className="rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-white text-primary border border-border hover:bg-bg px-5 py-2.5 text-sm"
          >
            Retour
          </Link>
          <Link to={selectedPlan ? '/subscribe/register' : '#'}>
            <Button variant="accent" disabled={!selectedPlan}>
              Continuer
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
