import { Link } from 'react-router-dom';
import { Check, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import clsx from 'clsx';
import TopBar from '../../components/layout/TopBar';
import { PLANS, type Plan } from '../../config/plans';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useEffect } from 'react';

function formatPrice(price: number): string {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function CompactPlanCard({ plan, selected, onSelect }: { plan: Plan; selected: boolean; onSelect: (p: Plan) => void }) {
  const isClickable = !plan.contactOnly;

  return (
    <div
      onClick={() => isClickable && onSelect(plan)}
      className={clsx(
        'relative rounded-xl p-4 transition-all',
        isClickable && 'cursor-pointer',
        plan.contactOnly && 'opacity-50 cursor-not-allowed',
        selected
          ? 'bg-white border-2 shadow-sm'
          : 'bg-white border border-border hover:border-primary/30',
      )}
      style={selected ? { borderColor: plan.color } : undefined}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: plan.color + '15' }}
          >
            <Zap size={14} style={{ color: plan.color }} />
          </div>
          <h3 className="font-bold text-sm text-txt">{plan.name}</h3>
        </div>
        {selected && (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: plan.color }}
          >
            <Check size={11} className="text-white" />
          </div>
        )}
        {!selected && plan.id === 'discovery' && (
          <span className="text-[10px] font-semibold text-accent bg-accent-light px-2 py-0.5 rounded-full">
            14j gratuit
          </span>
        )}
        {!selected && plan.popular && plan.id !== 'discovery' && (
          <span className="text-[10px] font-semibold text-primary bg-primary-light px-2 py-0.5 rounded-full">
            Populaire
          </span>
        )}
      </div>

      {/* Price */}
      <div className="mb-2">
        {plan.contactOnly ? (
          <span className="text-xs text-txt-muted font-medium">Sur devis</span>
        ) : plan.price === 0 ? (
          <span className="text-lg font-bold text-accent">Gratuit</span>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-txt">{formatPrice(plan.price)}</span>
            <span className="text-[11px] text-txt-secondary">FCFA/mois</span>
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="flex flex-col gap-1">
        {plan.features.slice(0, 3).map((f) => (
          <li key={f} className="flex items-center gap-1.5 text-xs text-txt-secondary">
            <Check size={11} className="text-success shrink-0" />
            <span className="truncate">{f}</span>
          </li>
        ))}
        {plan.features.length > 3 && (
          <li className="text-[10px] text-txt-muted pl-4">
            +{plan.features.length - 3} de plus
          </li>
        )}
      </ul>
    </div>
  );
}

export default function ChoosePlan() {
  const { selectedPlan, selectPlan } = useSubscriptionStore();

  useEffect(() => {
    if (!selectedPlan) {
      const proPlan = PLANS.find((p) => p.id === 'pro');
      if (proPlan) selectPlan(proPlan);
    }
  }, [selectedPlan, selectPlan]);

  const isDiscovery = selectedPlan?.id === 'discovery';

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <TopBar currentStep={1} stepLabel="Choix du plan" />

      {/* Content */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-6">
        <h1 className="text-xl font-bold text-dark text-center mb-6">
          Choisissez votre abonnement
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PLANS.map((plan) => (
            <CompactPlanCard
              key={plan.id}
              plan={plan}
              selected={selectedPlan?.id === plan.id}
              onSelect={selectPlan}
            />
          ))}
        </div>
      </div>

      {/* Bottom bar fixe */}
      <div className="sticky bottom-0 bg-white border-t border-border px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-txt-secondary hover:text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            Retour
          </Link>

          {selectedPlan && (
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <span className="text-txt-secondary">
                Plan <strong className="text-txt">{selectedPlan.name}</strong>
              </span>
              <span className="font-bold text-dark">
                {isDiscovery ? (
                  <span className="text-accent">Gratuit — 14 jours</span>
                ) : selectedPlan.contactOnly ? (
                  'Sur devis'
                ) : (
                  <>{formatPrice(selectedPlan.price)} FCFA/mois</>
                )}
              </span>
            </div>
          )}

          <Link to={selectedPlan && !selectedPlan.contactOnly ? '/subscribe/register' : '#'}>
            <button
              disabled={!selectedPlan || selectedPlan.contactOnly}
              className={clsx(
                'inline-flex items-center gap-2 rounded-xl font-semibold px-6 py-2.5 text-sm transition-all',
                selectedPlan && !selectedPlan.contactOnly
                  ? 'bg-accent text-white hover:bg-accent/90 cursor-pointer'
                  : 'bg-border text-txt-muted cursor-not-allowed'
              )}
            >
              Continuer
              <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
