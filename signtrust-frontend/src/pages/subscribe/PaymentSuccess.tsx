import { Link } from 'react-router-dom';
import { Check, Download, ArrowRight } from 'lucide-react';
import ReceiptCard from '../../components/subscription/ReceiptCard';
import Button from '../../components/ui/Button';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';

function getTrialEndDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function PaymentSuccess() {
  const { selectedPlan, paymentMethod } = useSubscriptionStore();

  const methodLabels: Record<string, string> = {
    card: 'Carte bancaire',
    mobile_money: 'Mobile Money',
    virement: 'Virement bancaire',
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Success animation */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center animate-[scaleIn_0.5s_ease-out]">
            <Check size={40} className="text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-dark mb-2">
          Bienvenue sur SignTrust !
        </h1>
        <p className="text-sm text-txt-secondary mb-8">
          Abonnement {selectedPlan?.name || 'Pro'} actif. Essai gratuit 14 jours.
        </p>

        <div className="mb-8">
          <ReceiptCard
            reference="00127"
            plan={selectedPlan?.name || 'Pro'}
            method={methodLabels[paymentMethod] || 'Mobile Money'}
            trialEnd={getTrialEndDate()}
            status="trial"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" icon={Download} className="flex-1">
            Télécharger le reçu
          </Button>
          <Link to="/dashboard" className="flex-1">
            <Button variant="primary" icon={ArrowRight} className="w-full">
              Accéder à SignTrust
            </Button>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
