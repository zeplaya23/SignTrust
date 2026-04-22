import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Logo from '../components/ui/Logo';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';
import { useAuthStore } from '../stores/useAuthStore';
import { authService } from '../services/authService';
import type { SubscriptionStatus } from '../types/subscription';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      const resp = await authService.login(data);
      setAuth(
        resp.accessToken,
        resp.refreshToken,
        {
          id: resp.user.id,
          email: resp.user.email,
          firstName: resp.user.firstName,
          lastName: resp.user.lastName,
          phone: resp.user.phone,
          role: resp.user.role,
          tenantId: resp.user.tenantId,
          accountType: resp.user.accountType || null,
          companyName: resp.user.companyName || null,
        },
        (resp.user.subscriptionStatus || 'NONE') as SubscriptionStatus
      );
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr.response?.data?.message || 'Email ou mot de passe incorrect';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden md:flex w-1/2 bg-dark relative overflow-hidden items-center justify-center">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative z-10 text-center">
          <Logo size="lg" />
          <p className="mt-4 text-xl font-semibold text-white">DigiSign <span className="font-normal text-white/60">Parapheur</span></p>
          <p className="mt-2 text-sm text-txt-muted">
            La signature électronique de confiance
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-8">
            <Logo size="md" />
          </div>

          <h1 className="text-2xl font-bold text-dark mb-6">Connexion</h1>

          {error && (
            <div className="bg-danger-light text-danger rounded-xl px-4 py-3 mb-4 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Field
              label="Email"
              type="email"
              placeholder="vous@exemple.com"
              register={register('email')}
              error={errors.email?.message}
            />

            <Field
              label="Mot de passe"
              type="password"
              placeholder="Votre mot de passe"
              register={register('password')}
              error={errors.password?.message}
            />

            <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-4">
            <Link
              to="/subscribe/plan"
              className="rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-white text-primary border border-border hover:bg-bg px-5 py-2.5 text-sm w-full"
            >
              Créer un compte
            </Link>
          </div>

          <div className="mt-6 bg-warning-light rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-warning font-medium">Abonnement expiré ?</p>
              <Link to="/renewal" className="text-accent font-semibold hover:underline">
                Renouveler mon abonnement
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-txt-secondary hover:text-primary transition-colors">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
