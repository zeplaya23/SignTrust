import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { getErrorMessage } from '../services/errors';
import { useAuthStore } from '../stores/useAuthStore';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from '../components/ui/Toast';
import type { SubscriptionStatus } from '../types/subscription';

export default function Login() {
  const nav = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await authService.login({ email, password });
      const status = (r.user.subscriptionStatus as SubscriptionStatus) || 'NONE';
      setAuth(r.accessToken, r.refreshToken, { ...r.user }, status);
      if (status === 'EXPIRED' || status === 'CANCELLED') nav('/renewal');
      else nav('/home');
    } catch (err: unknown) {
      toast(getErrorMessage(err, 'Identifiants incorrects.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-shell flex flex-col bg-white min-h-[100dvh]">
      <div className="safe-top px-5 pt-5">
        <Link to="/" className="inline-flex items-center gap-1 text-muted text-sm font-medium active:text-ink">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Accueil
        </Link>
      </div>

      <div className="px-5 mt-8">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-primary text-white inline-flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12l5 5 9-9" />
            </svg>
          </span>
          <p className="font-bold text-ink">DigiSign Parapheur</p>
        </div>

        <h1 className="mt-8 text-3xl font-bold text-ink tracking-tight leading-tight">Bon retour 👋</h1>
        <p className="text-muted mt-2 text-[15px]">Connectez-vous pour signer vos documents.</p>
      </div>

      <form onSubmit={submit} className="px-5 mt-8 flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="vous@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <Input
            label="Mot de passe"
            type={showPwd ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute right-3 top-9 text-xs text-primary font-semibold"
          >
            {showPwd ? 'Masquer' : 'Voir'}
          </button>
        </div>

        <Button type="submit" size="lg" fullWidth loading={loading}>Se connecter</Button>
      </form>

      <div className="mt-auto px-5 py-8">
        <p className="text-center text-sm text-muted">
          Pas encore de compte ?{' '}
          <Link to="/subscribe/plan" className="text-primary font-semibold">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
