import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
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
      const e = err as { response?: { data?: { message?: string } } };
      toast(e.response?.data?.message || 'Identifiants incorrects', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-shell flex flex-col">
      <div className="safe-top px-5 pt-6">
        <Link to="/" className="text-muted text-sm">← Accueil</Link>
      </div>

      <div className="px-5 mt-4">
        <span className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </span>
        <h1 className="text-2xl font-bold text-ink">Bon retour</h1>
        <p className="text-muted mt-1">Connectez-vous pour signer vos documents</p>
      </div>

      <form onSubmit={submit} className="px-5 mt-8 flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <Input
            label="Mot de passe"
            type={showPwd ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute right-3 top-9 text-xs text-primary font-medium"
          >
            {showPwd ? 'Masquer' : 'Voir'}
          </button>
        </div>

        <Button type="submit" size="lg" fullWidth loading={loading}>Se connecter</Button>

        <p className="text-center text-sm text-muted mt-4">
          Pas encore de compte ?{' '}
          <Link to="/subscribe/plan" className="text-primary font-semibold">Créer un compte</Link>
        </p>
      </form>
    </div>
  );
}
