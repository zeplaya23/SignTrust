import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { signService } from '../../services/signService';
import { useOtpTimer } from '../../hooks/useOtpTimer';
import Button from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';

export default function SignVerify() {
  const { token } = useParams();
  const nav = useNavigate();
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const otp = useOtpTimer(60);

  const { data: env } = useQuery({
    queryKey: ['sign-info', token],
    queryFn: () => signService.getEnvelopeByToken(token!),
    enabled: !!token,
  });

  const sendOtp = async () => {
    setSending(true);
    try {
      await signService.sendOtp(token!);
      otp.reset();
      toast('Code envoyé par email', 'success');
    } catch {
      toast('Échec de l\'envoi du code', 'error');
    } finally { setSending(false); }
  };

  const verify = async () => {
    setVerifying(true);
    try {
      await signService.verifyOtp(token!, code);
      nav(`/sign/${token}/view`);
    } catch {
      toast('Code invalide', 'error');
    } finally { setVerifying(false); }
  };

  return (
    <div className="mobile-shell flex flex-col px-5 pt-8 pb-8">
      <div className="safe-top" />
      <div className="text-center">
        <span className="inline-flex w-16 h-16 rounded-3xl bg-primary text-white items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </span>
        <h1 className="mt-5 text-2xl font-bold text-ink">Vérification</h1>
        <p className="text-muted mt-1.5 text-sm">
          {env ? <>Pour signer <strong className="text-ink">{env.envelopeName}</strong>, entrez le code à 6 chiffres.</> : 'Chargement…'}
        </p>
      </div>

      <div className="mt-8">
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="••••••"
          className="w-full h-16 text-center text-3xl font-bold tracking-[0.5em] rounded-2xl bg-white border border-line focus:border-primary outline-none"
        />

        <Button size="lg" fullWidth className="mt-5" onClick={verify} loading={verifying} disabled={code.length !== 6}>
          Vérifier
        </Button>

        <button
          onClick={sendOtp}
          disabled={!otp.expired || sending}
          className="mt-4 text-sm text-primary font-medium w-full"
        >
          {otp.expired ? 'Renvoyer le code' : `Renvoyer dans ${otp.seconds}s`}
        </button>
      </div>
    </div>
  );
}
