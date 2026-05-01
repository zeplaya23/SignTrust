import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useOtpTimer } from '../../hooks/useOtpTimer';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';

export default function VerifyOtp() {
  const nav = useNavigate();
  const loc = useLocation() as { state?: { email?: string; planId?: string } };
  const email = loc.state?.email ?? '';
  const planId = loc.state?.planId ?? 'discovery';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const otp = useOtpTimer(60);

  const submit = async () => {
    setLoading(true);
    try {
      await authService.verifyOtp(email, code);
      if (planId === 'discovery') {
        nav('/subscribe/success', { state: { planId } });
      } else {
        nav('/subscribe/payment', { state: { email, planId } });
      }
    } catch {
      toast('Code invalide', 'error');
    } finally { setLoading(false); }
  };

  const resend = async () => {
    try {
      await authService.sendOtp(email);
      otp.reset();
      toast('Code renvoyé', 'success');
    } catch { toast('Erreur', 'error'); }
  };

  return (
    <div className="flex flex-col">
      <TopBar title="Vérifier l'email" back />
      <div className="px-5 pt-6 text-center">
        <p className="text-muted">Code envoyé à</p>
        <p className="font-semibold text-ink">{email}</p>

        <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="••••••"
          className="mt-6 w-full h-16 text-center text-3xl font-bold tracking-[0.5em] rounded-2xl bg-white border border-line focus:border-primary outline-none"
        />

        <Button size="lg" fullWidth className="mt-5" onClick={submit} loading={loading} disabled={code.length !== 6}>
          Confirmer
        </Button>

        <button
          onClick={resend}
          disabled={!otp.expired}
          className="mt-4 text-sm text-primary font-medium"
        >
          {otp.expired ? 'Renvoyer le code' : `Renvoyer dans ${otp.seconds}s`}
        </button>
      </div>
    </div>
  );
}
