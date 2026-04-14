import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import OtpInput from '../../components/ui/OtpInput';
import Button from '../../components/ui/Button';
import TopBar from '../../components/layout/TopBar';
import { useOtpTimer } from '../../hooks/useOtpTimer';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const { registrationData, setOtpVerified } = useSubscriptionStore();
  const { seconds, canResend, restart } = useOtpTimer(60);
  const [otpCode, setOtpCode] = useState('');
  const [attempts, setAttempts] = useState(0);

  const phone = registrationData?.phone || '07 XX XX XX XX';

  const handleComplete = (code: string) => {
    setOtpCode(code);
  };

  const handleVerify = () => {
    if (otpCode.length !== 6) return;
    if (attempts >= 3) return;

    setAttempts((prev) => prev + 1);
    // TODO: integrate OTP verification API
    setOtpVerified(true);
    navigate('/subscribe/payment');
  };

  const handleResend = () => {
    if (!canResend) return;
    if (attempts >= 3) return;
    restart();
    // TODO: call resend OTP API
  };

  return (
    <div className="min-h-screen bg-bg">
      <TopBar currentStep={3} stepLabel="Vérification" />

      <div className="max-w-md mx-auto px-6 py-10 text-center">
        <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
          <Smartphone size={28} className="text-primary" />
        </div>

        <h1 className="text-2xl font-bold text-dark mb-2">Vérification OTP</h1>

        <p className="text-sm text-txt-secondary mb-8">
          Code à 6 chiffres envoyé au{' '}
          <span className="font-medium text-txt">+225 {phone}</span>
        </p>

        <div className="mb-6">
          <OtpInput length={6} onComplete={handleComplete} disabled={attempts >= 3} />
        </div>

        <Button
          variant="accent"
          className="w-full"
          disabled={otpCode.length !== 6 || attempts >= 3}
          onClick={handleVerify}
        >
          Vérifier et continuer
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
