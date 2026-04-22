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

function getRenewDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PlanSummary({ plan }: PlanSummaryProps) {
  if (!plan) return null;

  const isDiscovery = plan.id === 'discovery';
  const priceFormatted = formatPrice(plan.price);

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <h3 className="font-bold text-base text-txt mb-4">Récapitulatif</h3>

      <div className="flex items-center justify-between text-sm">
        <span className="text-txt-secondary">Plan {plan.name}</span>
        <span className="font-medium text-txt">
          {isDiscovery ? 'Gratuit' : `${priceFormatted} FCFA/mois`}
        </span>
      </div>

      {isDiscovery && (
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-txt-secondary">Durée de l'essai</span>
          <span className="font-medium text-success">14 jours</span>
        </div>
      )}

      <div className="border-t border-border my-4" />

      <div className="flex items-center justify-between">
        <span className="font-bold text-txt">Total</span>
        <span className="font-bold text-xl text-accent">
          {isDiscovery ? '0 FCFA' : `${priceFormatted} FCFA`}
        </span>
      </div>

      {isDiscovery && (
        <p className="text-sm text-txt-muted mt-3">
          Essai gratuit jusqu'au {getTrialEndDate()}. Passez à un plan payant pour continuer.
        </p>
      )}

      {!isDiscovery && (
        <p className="text-sm text-txt-muted mt-3">
          Prochain renouvellement le {getRenewDate()}
        </p>
      )}
    </div>
  );
}
