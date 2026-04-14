import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import OtpInput from '../../components/ui/OtpInput';
import Button from '../../components/ui/Button';
import TopBar from '../../components/layout/TopBar';
import { useOtpTimer } from '../../hooks/useOtpTimer';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { authService } from '../../services/authService';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { registrationData, setOtpVerified } = useSubscriptionStore();
  const { seconds, canResend, restart } = useOtpTimer(60);
  const [otpCode, setOtpCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = registrationData?.email || '';

  const handleComplete = (code: string) => {
    setOtpCode(code);
  };

  const handleVerify = async () => {
    if (otpCode.length !== 6) return;
    if (attempts >= 3) return;

    setLoading(true);
    setError(null);
    setAttempts((prev) => prev + 1);

    try {
      await authService.verifyOtp(email, otpCode);
      setOtpVerified(true);
      navigate('/subscribe/payment');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Code invalide ou expiré';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    if (attempts >= 3) return;
    restart();
    setError(null);

    try {
      await authService.sendOtp(email);
    } catch {
      setError('Erreur lors du renvoi du code');
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <TopBar currentStep={3} stepLabel="Vérification" />

      <div className="max-w-md mx-auto px-6 py-10 text-center">
        <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail size={28} className="text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-dark mb-2">Vérification OTP</h1>

        <p className="text-sm text-txt-secondary mb-8">
          Code à 6 chiffres envoyé à{' '}
          <span className="font-medium text-txt">{email}</span>
        </p>

        {error && (
          <div className="bg-danger-light text-danger rounded-xl px-4 py-3 mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="mb-6">
          <OtpInput length={6} onComplete={handleComplete} disabled={attempts >= 3} />
        </div>

        <Button
          variant="accent"
          className="w-full"
          disabled={otpCode.length !== 6 || attempts >= 3 || loading}
          onClick={handleVerify}
        >
          {loading ? 'Vérification...' : 'Vérifier et continuer'}
        </Button>

        <div className="mt-4">
          {attempts >= 3 ? (
            <p className="text-sm text-danger font-medium">
              Nombre maximum de tentatives atteint
            </p>
          ) : canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-accent font-semibold hover:underline cursor-pointer"
            >
              Renvoyer le code
            </button>
          ) : (
            <p className="text-sm text-txt-muted">
              Renvoyer dans {seconds}s
            </p>
          )}
        </div>

        <div className="mt-8">
          <Link
            to="/subscribe/register"
            className="text-sm text-txt-secondary hover:text-primary transition-colors"
          >
            Retour
          </Link>
        </div>
      </div>
    </div>
  );
}
