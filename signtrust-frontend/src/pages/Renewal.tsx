import { useState } from 'react';
import { AlertTriangle, Zap } from 'lucide-react';
import clsx from 'clsx';
import Button from '../components/ui/Button';

type RenewalOption = 'renew' | 'upgrade';

export default function Renewal() {
  const [option, setOption] = useState<RenewalOption>('renew');

  const expirationDate = new Date(2026, 3, 1).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleLogout = () => {
    // TODO: integrate logout
    window.location.href = '/';
  };

  const handleRenew = () => {
    // TODO: integrate Paystack renewal
    console.log('Renew with option:', option);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        {/* Alert icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-warning-light rounded-full flex items-center justify-center">
            <AlertTriangle size={28} className="text-warning" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-dark text-center mb-2">
          Abonnement expiré
        </h1>
        <p className="text-sm text-txt-secondary text-center mb-8">
          Votre abonnement a expiré le {expirationDate}.
        </p>

        {/* Options */}
        <div className="flex flex-col gap-3 mb-6">
          <div
            onClick={() => setOption('renew')}
            className={clsx(
              'rounded-xl p-5 cursor-pointer transition-all',
              option === 'renew'
                ? 'border-2 border-accent bg-accent-light'
                : 'border border-border bg-white hover:border-accent/30'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                  option === 'renew' ? 'border-accent' : 'border-border'
                )}
              >
                {option === 'renew' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                )}
              </div>
              <div>
                <p className="font-semibold text-dark">Renouveler le même plan</p>
                <p className="text-sm text-txt-secondary mt-0.5">
                  Continuez avec votre abonnement actuel
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setOption('upgrade')}
            className={clsx(
              'rounded-xl p-5 cursor-pointer transition-all',
              option === 'upgrade'
                ? 'border-2 border-primary bg-primary-light'
                : 'border border-border bg-white hover:border-primary/30'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                  option === 'upgrade' ? 'border-primary' : 'border-border'
                )}
              >
                {option === 'upgrade' && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold text-dark">Upgrader mon plan</p>
                <p className="text-sm text-txt-secondary mt-0.5">
                  Passez à un plan supérieur avec plus de fonctionnalités
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reassurance box */}
        <div className="bg-accent-light rounded-xl p-4 flex items-start gap-3 mb-8">
          <Zap size={20} className="text-accent shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-dark text-sm">Vos données sont conservées</p>
            <p className="text-sm text-txt-secondary mt-1">
              Tous vos documents, signatures et paramètres sont intacts.
              Renouvelez votre abonnement pour y accéder à nouveau.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleLogout}>
            Déconnexion
          </Button>
          <Button variant="accent" onClick={handleRenew}>
            Renouveler — Payer avec Paystack
          </Button>
        </div>
      </div>
    </div>
  );
}
