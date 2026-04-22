import { Check } from 'lucide-react';
import clsx from 'clsx';
import type { Plan } from '../../config/plans';

interface PlanCardProps {
  plan: Plan;
  selected: boolean;
  onSelect: (plan: Plan) => void;
  highlighted?: boolean;
}

function formatPrice(price: number): string {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export default function PlanCard({ plan, selected, onSelect, highlighted }: PlanCardProps) {
  const isClickable = !plan.contactOnly;

  return (
    <div
      onClick={() => isClickable && onSelect(plan)}
      className={clsx(
        'relative rounded-2xl bg-white p-6 transition-all',
        isClickable && 'cursor-pointer',
        plan.contactOnly && 'opacity-50 cursor-not-allowed',
        selected
          ? 'border-2 shadow-md'
          : highlighted
            ? 'border-2 border-accent shadow-sm'
            : 'border border-border',
      )}
      style={selected ? { borderColor: plan.color } : undefined}
    >
      {selected && (
        <div
          className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: plan.color }}
        >
          <Check size={14} className="text-white" />
        </div>
      )}

      {highlighted && !selected && (
        <span className="absolute top-4 right-4 bg-accent-light text-accent text-xs font-semibold px-2.5 py-1 rounded-full">
          Essai gratuit
        </span>
      )}

      {plan.popular && !selected && !highlighted && (
        <span className="absolute top-4 right-4 bg-accent-light text-accent text-xs font-semibold px-2.5 py-1 rounded-full">
          Populaire
        </span>
      )}

      <h3 className="font-bold text-lg text-txt pr-24">{plan.name}</h3>

      <div className="mt-2">
        {plan.contactOnly ? (
          <span className="text-txt-muted font-medium">Contactez-nous</span>
        ) : plan.price === 0 ? (
          <span className="text-2xl font-bold text-accent">Gratuit</span>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-txt">
              {formatPrice(plan.price)}
            </span>
            <span className="text-sm text-txt-secondary">FCFA/mois</span>
          </div>
        )}
      </div>

      <p className="mt-1 text-sm text-txt-secondary">{plan.description}</p>

      <ul className="mt-5 flex flex-col gap-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-txt">
            <Check size={16} className="text-success shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
