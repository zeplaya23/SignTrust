import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { signService } from '../../services/signService';
import { useOtpTimer } from '../../hooks/useOtpTimer';
import Button from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';

export default function SignVerify() {
  const { token } = useParams();
  const nav = useNavigate();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const otp = useOtpTimer(60);

  const code = digits.join('');

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  const { data: env } = useQuery({
    queryKey: ['sign-info', token],
    queryFn: () => signService.getEnvelopeByToken(token!),
    enabled: !!token,
  });

  const updateDigit = (i: number, v: string) => {
    const ch = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    if (ch && i < 5) inputs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    inputs.current[Math.min(text.length, 5)]?.focus();
  };

  const sendOtp = async () => {
    try {
      await signService.sendOtp(token!);
      otp.reset();
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      toast('Code envoyé par email', 'success');
    } catch {
      toast('Échec de l\'envoi du code', 'error');
    }
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
    <div className="mobile-shell flex flex-col bg-white min-h-[100dvh] px-5 pt-8 pb-8 safe-top">
      <div className="text-center">
        <span className="inline-flex w-16 h-16 rounded-3xl bg-primary-light text-primary items-center justify-center">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
            <circle cx="12" cy="16" r="1" />
          </svg>
        </span>
        <h1 className="mt-5 text-2xl font-bold text-ink tracking-tight">Vérifions votre identité</h1>
        <p className="text-muted mt-2 text-[14px] leading-relaxed max-w-xs mx-auto">
          {env ? (
            <>Pour signer <strong className="text-ink">« {env.envelopeName} »</strong>, entrez le code reçu par email.</>
          ) : 'Chargement…'}
        </p>
      </div>

      <div className="mt-8" onPaste={onPaste}>
        <div className="flex justify-center gap-2">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={d}
              onChange={(e) => updateDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              className="w-11 h-14 text-center text-2xl font-bold rounded-xl bg-canvas border-2 border-transparent focus:border-primary focus:bg-white outline-none transition-colors text-ink"
            />
          ))}
        </div>

        <Button size="lg" fullWidth className="mt-6" onClick={verify} loading={verifying} disabled={code.length !== 6}>
          Vérifier le code
        </Button>

        <button
          type="button"
          onClick={sendOtp}
          disabled={!otp.expired}
          className="mt-4 w-full text-[13px] font-semibold text-primary disabled:text-faint"
        >
          {otp.expired ? '↻ Renvoyer le code' : `Renvoyer dans ${otp.seconds}s`}
        </button>
      </div>

      <p className="mt-auto pt-8 text-center text-[11px] text-faint">
        🔒 Signature électronique sécurisée · DigiSign Parapheur
      </p>
    </div>
  );
}
