import type { Plan } from '../../config/plans';

interface PlanSummaryProps {
  plan: Plan | null;
}

function formatPrice(price: number): string {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function getTrialEndDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PlanSummary({ plan }: PlanSummaryProps) {
  if (!plan) return null;

  const priceFormatted = formatPrice(plan.price);

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h3 className="font-bold text-base text-txt mb-4">Récapitulatif</h3>

      <div className="flex items-center justify-between text-sm">
        <span className="text-txt-secondary">{plan.name}</span>
        <span className="font-medium text-txt">
          {plan.price === 0 ? 'Gratuit' : `${priceFormatted} FCFA`}
        </span>
      </div>

      {plan.price > 0 && (
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-txt-secondary">Essai gratuit 14 jours</span>
          <span className="font-medium text-success">-{priceFormatted} FCFA</span>
        </div>
      )}

      <div className="border-t border-border my-4" />

      <div className="flex items-center justify-between">
        <span className="font-bold text-txt">Total</span>
        <span className="font-bold text-xl text-accent">0 FCFA</span>
      </div>

      {plan.price > 0 && (
        <p className="text-sm text-txt-muted mt-3">
          1er prélèvement le {getTrialEndDate()}
        </p>
      )}
    </div>
  );
}
