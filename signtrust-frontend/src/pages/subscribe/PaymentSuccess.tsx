import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Download, ArrowRight, Loader2 } from 'lucide-react';
import ReceiptCard from '../../components/subscription/ReceiptCard';
import Button from '../../components/ui/Button';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { authService } from '../../services/authService';
import type { SubscriptionStatus } from '../../types/subscription';

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
  const navigate = useNavigate();
  const { selectedPlan, paymentMethod, registrationData, reset } = useSubscriptionStore();
  const { setAuth, token } = useAuthStore();
  const [autoLoginDone, setAutoLoginDone] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Auto-login after payment
  useEffect(() => {
    if (token || autoLoginDone) return;

    const doLogin = async () => {
      if (!registrationData?.email || !registrationData?.password) {
        setAutoLoginDone(true);
        return;
      }

      try {
        const resp = await authService.login({
          email: registrationData.email,
          password: registrationData.password,
        });
        setAuth(
          resp.accessToken,
          resp.refreshToken,
          {
            id: resp.user.id,
            email: resp.user.email,
            firstName: resp.user.firstName,
            lastName: resp.user.lastName,
            phone: resp.user.phone,
            role: resp.user.role,
            tenantId: resp.user.tenantId,
          },
          (resp.user.subscriptionStatus || 'NONE') as SubscriptionStatus
        );
        setAutoLoginDone(true);
      } catch {
        setLoginError('Connexion automatique echouee');
        setAutoLoginDone(true);
      }
    };

    doLogin();
  }, [token, autoLoginDone, registrationData, setAuth]);

  const handleGo = () => {
    reset();
    navigate('/dashboard');
  };

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

        {loginError && (
          <div className="bg-danger-light text-danger rounded-xl px-4 py-3 mb-4 text-sm font-medium">
            {loginError}. <button onClick={() => navigate('/login')} className="underline font-bold">Se connecter manuellement</button>
          </div>
        )}

        {!autoLoginDone && !token ? (
          <div className="flex items-center justify-center gap-2 text-sm text-txt-secondary mb-4">
            <Loader2 size={16} className="animate-spin" />
            Connexion en cours...
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" icon={Download} className="flex-1">
            Telecharger le recu
          </Button>
          <Button
            variant="primary"
            icon={ArrowRight}
            className="flex-1"
            onClick={handleGo}
            disabled={!autoLoginDone && !token}
          >
            Acceder a SignTrust
          </Button>
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
