import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import { PLANS } from '../../config/plans';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import type { MobileOperator, PaymentMethod } from '../../types/subscription';

const METHODS: { id: PaymentMethod; label: string; subtitle: string; icon: string }[] = [
  { id: 'mobile_money', label: 'Mobile Money', subtitle: 'Orange · MTN · Moov · Wave', icon: '📱' },
  { id: 'card', label: 'Carte bancaire', subtitle: 'Visa · Mastercard', icon: '💳' },
  { id: 'virement', label: 'Virement bancaire', subtitle: 'Sous 24-48h', icon: '🏦' },
];

const OPERATORS: { id: MobileOperator; label: string; color: string }[] = [
  { id: 'orange', label: 'Orange Money', color: '#FF7900' },
  { id: 'mtn', label: 'MTN MoMo', color: '#FFCC00' },
  { id: 'moov', label: 'Moov Money', color: '#1A6BB5' },
  { id: 'wave', label: 'Wave', color: '#1DCFFF' },
];

export default function Payment() {
  const nav = useNavigate();
  const loc = useLocation() as { state?: { planId?: string } };
  const planId = loc.state?.planId ?? 'pro';
  const plan = PLANS.find((p) => p.id === planId)!;

  const [method, setMethod] = useState<PaymentMethod>('mobile_money');
  const [operator, setOperator] = useState<MobileOperator>('orange');
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    try {
      const r = await paymentService.initialize({
        userId: 0,
        planId,
        paymentMethod: method,
        mobileOperator: method === 'mobile_money' ? operator : null,
        amount: plan.price,
      });
      if (r.status === 'success' || r.status === 'pending') {
        nav('/subscribe/success', { state: { planId, reference: r.reference } });
      } else {
        toast(r.message || 'Paiement échoué', 'error');
      }
    } catch {
      toast('Erreur de paiement', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="mobile-shell flex flex-col bg-white min-h-[100dvh] pb-28">
      <TopBar title="Paiement" back />

      {/* Récapitulatif */}
      <section className="px-5 pt-3">
        <div className="bg-ink rounded-2xl p-5 text-white relative overflow-hidden">
          <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded-full">Plan {plan.name}</span>
          <p className="text-[11px] text-white/60 uppercase tracking-wider font-semibold">À payer</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">
            {plan.price.toLocaleString('fr-FR')}
            <span className="text-base font-medium text-white/70 ml-1">FCFA</span>
          </p>
          <p className="text-[12px] text-white/60 mt-1">Renouvellement mensuel · Annulable à tout moment</p>
        </div>
      </section>

      {/* Méthode de paiement */}
      <section className="px-5 mt-6">
        <p className="text-[11px] font-bold text-muted uppercase tracking-[0.12em] mb-2.5">Méthode de paiement</p>
        <div className="flex flex-col gap-2">
          {METHODS.map((m) => {
            const active = method === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`text-left bg-white rounded-2xl p-3.5 border-2 flex items-center gap-3 transition-colors ${
                  active ? 'border-primary shadow-sm shadow-primary/15' : 'border-line'
                }`}
              >
                <span className="w-10 h-10 rounded-xl bg-canvas inline-flex items-center justify-center text-xl shrink-0">{m.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink text-[15px]">{m.label}</p>
                  <p className="text-[12px] text-muted">{m.subtitle}</p>
                </div>
                <span className={`w-5 h-5 rounded-full border-2 ${active ? 'border-primary bg-primary' : 'border-line'} inline-flex items-center justify-center shrink-0`}>
                  {active && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                      <path d="M5 12l5 5 9-9" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Opérateurs Mobile Money */}
      {method === 'mobile_money' && (
        <section className="px-5 mt-6">
          <p className="text-[11px] font-bold text-muted uppercase tracking-[0.12em] mb-2.5">Opérateur</p>
          <div className="grid grid-cols-2 gap-2">
            {OPERATORS.map((op) => {
              const active = operator === op.id;
              return (
                <button
                  key={op.id}
                  onClick={() => setOperator(op.id)}
                  className={`bg-white rounded-2xl p-3 text-center border-2 transition-colors ${
                    active ? 'border-primary shadow-sm shadow-primary/15' : 'border-line'
                  }`}
                >
                  <span
                    className="inline-block w-7 h-7 rounded-full mb-1.5"
                    style={{ backgroundColor: op.color }}
                    aria-hidden
                  />
                  <p className="text-[13px] font-bold text-ink">{op.label}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {method === 'virement' && (
        <section className="px-5 mt-6">
          <div className="bg-warning-light border border-warning/30 rounded-2xl p-4 text-[13px] text-ink-soft">
            Vous recevrez par email les coordonnées bancaires pour effectuer votre virement.
          </div>
        </section>
      )}

      {/* Sticky CTA */}
      <div className="sticky bottom-0 mt-auto bg-white border-t border-line-soft px-5 pt-3 pb-3 safe-bottom">
        <Button size="lg" fullWidth onClick={pay} loading={loading}>
          Payer {plan.price.toLocaleString('fr-FR')} F
        </Button>
        <p className="text-center text-[11px] text-faint mt-2">🔒 Paiement sécurisé · Cryptoneo</p>
      </div>
    </div>
  );
}
