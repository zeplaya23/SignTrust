import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import SecurityBadge from '../../components/subscription/SecurityBadge';
import PaymentMethodTabs from '../../components/subscription/PaymentMethodTabs';
import MobileMoneyGrid from '../../components/subscription/MobileMoneyGrid';
import PlanSummary from '../../components/subscription/PlanSummary';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { paymentService } from '../../services/paymentService';

export default function Payment() {
  const navigate = useNavigate();
  const {
    selectedPlan,
    paymentMethod,
    setPaymentMethod,
    mobileOperator,
    setMobileOperator,
    userId,
    setPaymentReference,
  } = useSubscriptionStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!userId || !selectedPlan) return;

    setLoading(true);
    setError(null);

    try {
      const resp = await paymentService.initialize({
        userId,
        planId: selectedPlan.id,
        paymentMethod,
        mobileOperator,
        amount: selectedPlan.price,
      });

      setPaymentReference(resp.reference);
      navigate('/subscribe/success');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Erreur lors du paiement';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <TopBar currentStep={4} stepLabel="Paiement" />

      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="mb-6">
          <SecurityBadge />
        </div>

        {error && (
          <div className="bg-danger-light text-danger rounded-xl px-4 py-3 mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="mb-6">
          <PaymentMethodTabs selected={paymentMethod} onSelect={setPaymentMethod} />
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 mb-6">
          {paymentMethod === 'card' && (
            <div className="flex flex-col gap-4">
              <Field label="Numéro de carte" placeholder="1234 5678 9012 3456" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Expiration" placeholder="MM/AA" />
                <Field label="CVV" placeholder="123" />
              </div>
              <Field label="Titulaire de la carte" placeholder="Jean Kouamé" />
            </div>
          )}

          {paymentMethod === 'mobile_money' && (
            <div className="flex flex-col gap-4">
              <MobileMoneyGrid selected={mobileOperator} onSelect={setMobileOperator} />
              <Field
                label="Numéro de téléphone"
                type="tel"
                prefix="+225"
                placeholder="07 XX XX XX XX"
              />
            </div>
          )}

          {paymentMethod === 'virement' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-txt-secondary">
                Sélectionnez votre banque
              </p>
              <select className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-sm text-txt focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors">
                <option value="">Choisir une banque...</option>
                <option value="sgbci">SGBCI</option>
                <option value="bicici">BICICI</option>
                <option value="ecobank">Ecobank</option>
                <option value="bni">BNI</option>
                <option value="sib">SIB</option>
              </select>
            </div>
          )}
        </div>

        <div className="mb-6">
          <PlanSummary plan={selectedPlan} />
        </div>

        <div className="flex items-center justify-between">
          <Link
            to="/subscribe/verify"
            className="rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-white text-primary border border-border hover:bg-bg px-5 py-2.5 text-sm"
          >
            Retour
          </Link>
          <Button variant="success" icon={Lock} onClick={handlePay} disabled={loading}>
            {loading ? 'Traitement...' : 'Payer avec Paystack'}
          </Button>
        </div>
      </div>
    </div>
  );
}
