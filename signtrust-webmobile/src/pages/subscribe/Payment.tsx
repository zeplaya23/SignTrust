import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import { PLANS } from '../../config/plans';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import type { MobileOperator, PaymentMethod } from '../../types/subscription';

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

  const operators: { id: MobileOperator; label: string; icon: string }[] = [
    { id: 'orange', label: 'Orange Money', icon: '🟠' },
    { id: 'mtn', label: 'MTN MoMo', icon: '🟡' },
    { id: 'moov', label: 'Moov Money', icon: '🔵' },
    { id: 'wave', label: 'Wave', icon: '💧' },
  ];

  return (
    <div className="flex flex-col pb-32">
      <TopBar title="Paiement" back />
      <div className="px-5 pt-4">
        <div className="bg-primary text-white rounded-2xl p-5">
          <p className="text-sm text-white/70">Plan {plan.name}</p>
          <p className="text-3xl font-bold mt-1">{plan.price.toLocaleString('fr-FR')} <span className="text-base font-normal">FCFA / mois</span></p>
        </div>

        <h2 className="text-base font-semibold text-ink mt-6 mb-2">Méthode de paiement</h2>
        <div className="grid grid-cols-3 gap-2">
          {([
            ['mobile_money', 'Mobile Money'],
            ['card', 'Carte'],
            ['virement', 'Virement'],
          ] as [PaymentMethod, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setMethod(id)}
              className={`h-14 rounded-xl border text-xs font-medium ${
                method === id ? 'bg-primary-light border-primary text-primary' : 'bg-white border-line text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {method === 'mobile_money' && (
          <>
            <h3 className="text-base font-semibold text-ink mt-6 mb-2">Opérateur</h3>
            <div className="grid grid-cols-2 gap-2">
              {operators.map((op) => (
                <button
                  key={op.id}
                  onClick={() => setOperator(op.id)}
                  className={`h-14 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 ${
                    operator === op.id ? 'bg-primary-light border-primary text-primary' : 'bg-white border-line text-muted'
                  }`}
                >
                  <span>{op.icon}</span> {op.label}
                </button>
              ))}
            </div>
          </>
        )}

        {method === 'virement' && (
          <p className="text-sm text-muted mt-4 bg-white p-4 rounded-2xl border border-line-soft">
            Vous recevrez un email avec les coordonnées bancaires pour effectuer le virement.
          </p>
        )}
      </div>

      <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-line-soft px-5 py-3 safe-bottom">
        <div className="mobile-shell px-0">
          <Button size="lg" fullWidth onClick={pay} loading={loading}>Payer maintenant</Button>
        </div>
      </div>
    </div>
  );
}
