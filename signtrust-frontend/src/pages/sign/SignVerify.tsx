import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Loader2, Mail, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { signService } from '../../services/signService';
import type { SignEnvelopeInfo } from '../../types/envelope';

export default function SignVerify() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState<SignEnvelopeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch signing info to get signatory email
  const fetchInfo = useCallback(async (t: string, signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await signService.getEnvelopeByToken(t);
      if (!signal.aborted) setInfo(data);
    } catch {
      if (!signal.aborted) setError('Lien de signature invalide ou expiré');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    fetchInfo(token, controller.signal);
    return () => controller.abort();
  }, [token, fetchInfo]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!token) return;
    setSending(true);
    setVerifyError(null);
    try {
      await signService.sendOtp(token);
      setOtpSent(true);
      setCountdown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setVerifyError("Erreur lors de l'envoi du code. Veuillez réessayer.");
    } finally {
      setSending(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setVerifyError(null);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newCode.every((d) => d !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (codeStr: string) => {
    if (!token) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      await signService.verifyOtp(token, codeStr);
      // OTP verified — navigate to actual signing page
      navigate(`/sign/${token}/view`, { replace: true });
    } catch {
      setVerifyError('Code invalide ou expiré. Veuillez réessayer.');
      setCode(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setVerifying(false);
    }
  };

  const maskedEmail = info?.signatoryEmail
    ? info.signatoryEmail.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
    : '';

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <AlertCircle size={48} className="mx-auto text-danger mb-4" />
          <h1 className="text-xl font-bold text-dark mb-2">Lien invalide</h1>
          <p className="text-sm text-txt-secondary">{error || 'Informations introuvables'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark mb-2">
            Vérification d'identité
          </h1>
          <p className="text-sm text-txt-secondary">
            Pour signer <span className="font-medium text-txt">{info.envelopeName}</span>,
            nous devons vérifier votre identité.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border p-6">
          {!otpSent ? (
            /* Step 1: Send OTP */
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
                <Mail size={24} className="text-primary" />
              </div>
              <p className="text-sm text-txt mb-1">
                Un code de vérification sera envoyé à :
              </p>
              <p className="text-base font-semibold text-dark mb-6">
                {maskedEmail}
              </p>
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={handleSendOtp}
                disabled={sending}
              >
                {sending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Envoi en cours...
                  </span>
                ) : (
                  'Envoyer le code'
                )}
              </Button>
              {verifyError && (
                <p className="text-sm text-danger mt-3">{verifyError}</p>
              )}
            </div>
          ) : (
            /* Step 2: Enter OTP */
            <div className="text-center">
              <p className="text-sm text-txt-secondary mb-1">
                Code envoyé à <span className="font-medium text-txt">{maskedEmail}</span>
              </p>
              <p className="text-xs text-txt-muted mb-6">
                Saisissez le code à 6 chiffres reçu par email
              </p>

              {/* OTP inputs */}
              <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold border-2 border-border rounded-xl focus:border-primary focus:outline-none transition-colors"
                    disabled={verifying}
                  />
                ))}
              </div>

              {verifyError && (
                <p className="text-sm text-danger mb-3">{verifyError}</p>
              )}

              {verifying && (
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <span className="text-sm text-txt-secondary">Vérification...</span>
                </div>
              )}

              <Button
                variant="primary"
                size="md"
                className="w-full mb-3"
                onClick={() => handleVerify(code.join(''))}
                disabled={verifying || code.some((d) => d === '')}
              >
                Vérifier
              </Button>

              {/* Resend */}
              <div className="text-sm text-txt-muted">
                {countdown > 0 ? (
                  <span>Renvoyer le code dans {countdown}s</span>
                ) : (
                  <button
                    onClick={handleSendOtp}
                    disabled={sending}
                    className="text-primary font-medium hover:underline"
                  >
                    Renvoyer le code
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Security notice */}
        <p className="text-xs text-txt-muted text-center mt-4">
          Signature électronique sécurisée conforme eIDAS
        </p>
      </div>
    </div>
  );
}
