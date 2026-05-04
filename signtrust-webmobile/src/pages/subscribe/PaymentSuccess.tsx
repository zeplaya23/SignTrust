import { Link, useLocation } from 'react-router-dom';
import { PLANS } from '../../config/plans';

export default function PaymentSuccess() {
  const loc = useLocation() as { state?: { planId?: string } };
  const plan = PLANS.find((p) => p.id === loc.state?.planId);

  return (
    <div className="mobile-shell flex flex-col bg-white min-h-[100dvh] px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-accent/15 animate-ping" />
          <span className="relative w-24 h-24 rounded-full bg-accent text-white inline-flex items-center justify-center">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12l5 5 9-9" />
            </svg>
          </span>
        </div>

        <h1 className="text-[28px] font-bold text-ink mt-7 tracking-tight">Bienvenue !</h1>
        <p className="text-muted mt-2 max-w-xs leading-relaxed">
          Votre compte est activé.<br />Vous pouvez créer et signer vos enveloppes dès maintenant.
        </p>

        {plan && (
          <div className="mt-7 inline-flex items-center gap-2.5 bg-canvas rounded-full px-4 py-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: plan.color }} />
            <span className="text-[13px] font-semibold text-ink">Plan {plan.name}</span>
            <span className="text-[12px] text-muted">·</span>
            <span className="text-[12px] text-muted">
              {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString('fr-FR')} F/mois`}
            </span>
          </div>
        )}
      </div>

      <Link
        to="/login"
        className="h-14 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 text-[15px] shadow-md shadow-primary/30 mt-8"
      >
        Se connecter
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </Link>
    </div>
  );
}
