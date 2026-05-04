import { useEffect, useRef, useState } from 'react';
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
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const otp = useOtpTimer(60);

  const code = digits.join('');

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const updateDigit = (i: number, v: string) => {
    const ch = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = ch;
    setDigits(next);
    if (ch && i < 5) inputs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
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
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      toast('Code renvoyé', 'success');
    } catch { toast('Erreur', 'error'); }
  };

  return (
    <div className="mobile-shell flex flex-col bg-white min-h-[100dvh]">
      <TopBar title="Vérification" back />

      <section className="px-5 pt-6 text-center">
        <span className="inline-flex w-16 h-16 rounded-3xl bg-primary-light text-primary items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 7 9-7" />
          </svg>
        </span>
        <h1 className="mt-5 text-2xl font-bold text-ink tracking-tight">Vérifiez votre email</h1>
        <p className="text-[14px] text-muted mt-2">
          Code à 6 chiffres envoyé à<br />
          <span className="font-semibold text-ink-soft">{email || '—'}</span>
        </p>
      </section>

      <section className="px-5 mt-7" onPaste={onPaste}>
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

        <Button size="lg" fullWidth className="mt-6" onClick={submit} loading={loading} disabled={code.length !== 6}>
          Confirmer
        </Button>

        <button
          type="button"
          onClick={resend}
          disabled={!otp.expired}
          className="mt-4 w-full text-[13px] font-semibold text-primary disabled:text-faint"
        >
          {otp.expired ? '↻ Renvoyer le code' : `Renvoyer dans ${otp.seconds}s`}
        </button>
      </section>
    </div>
  );
}
