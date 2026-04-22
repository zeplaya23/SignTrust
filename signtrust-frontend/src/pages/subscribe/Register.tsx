import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import {
  Building2,
  User,
  Shield,
  ArrowLeft,
  ArrowRight,
  Check,
  Zap,
} from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { useSubscriptionStore } from '../../stores/useSubscriptionStore';
import { authService } from '../../services/authService';

const registerSchema = z
  .object({
    companyName: z.string().optional(),
    fullName: z.string().min(2, 'Nom complet requis'),
    email: z.string().email('Email invalide'),
    phone: z.string().min(8, 'Numéro de téléphone invalide'),
    password: z
      .string()
      .min(8, 'Min 8 caractères')
      .regex(/[A-Z]/, 'Au moins 1 majuscule')
      .regex(/[0-9]/, 'Au moins 1 chiffre'),
    passwordConfirm: z.string(),
    cgv: z.boolean(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['passwordConfirm'],
  })
  .refine((data) => data.cgv === true, {
    message: 'Vous devez accepter les CGV',
    path: ['cgv'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const passwordRules = [
  { label: 'Min 8 caractères', test: (v: string) => v.length >= 8 },
  { label: '1 majuscule', test: (v: string) => /[A-Z]/.test(v) },
  { label: '1 chiffre', test: (v: string) => /[0-9]/.test(v) },
];

export default function Register() {
  const navigate = useNavigate();
  const { accountType, setAccountType, setRegistrationData, selectedPlan } = useSubscriptionStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      cgv: false,
    },
  });

  const passwordValue = watch('password') || '';

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);

    const [firstName, ...rest] = data.fullName.split(' ');
    const regData = {
      companyName: accountType === 'entreprise' ? data.companyName : undefined,
      firstName,
      lastName: rest.join(' ') || '',
      email: data.email,
      phone: data.phone,
      password: data.password,
    };

    setRegistrationData(regData);

    try {
      const resp = await authService.register({
        accountType,
        companyName: regData.companyName,
        firstName: regData.firstName,
        lastName: regData.lastName,
        email: regData.email,
        phone: regData.phone,
        password: regData.password,
        planId: selectedPlan?.id,
      });

      useSubscriptionStore.setState({ userId: resp.userId });
      navigate('/subscribe/verify');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; error?: string } } };
      const msg = axiosErr.response?.data?.message || axiosErr.response?.data?.error || 'Erreur lors de l\'inscription';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <TopBar currentStep={2} stepLabel="Inscription" />

      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">

        {/* ── Formulaire (gauche) ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-border p-6 md:p-8">
            <h1 className="text-xl font-bold text-dark mb-1">
              Créez votre compte
            </h1>
            <p className="text-sm text-txt-secondary mb-6">
              Remplissez vos informations pour commencer à utiliser diSign Parapheur.
            </p>

            {error && (
              <div className="bg-danger-light text-danger rounded-xl px-4 py-3 mb-5 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Account type toggle */}
            <div className="flex gap-3 mb-6">
              {([
                { key: 'particulier' as const, label: 'Particulier', icon: User },
                { key: 'entreprise' as const, label: 'Entreprise', icon: Building2 },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAccountType(key)}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer border',
                    accountType === key
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-txt-secondary border-border hover:border-primary/30 hover:bg-primary-light'
                  )}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              {accountType === 'entreprise' && (
                <Field
                  label="Nom de l'entreprise"
                  placeholder="Votre entreprise"
                  register={register('companyName')}
                  error={errors.companyName?.message}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Nom complet"
                  placeholder="Jean Kouamé"
                  register={register('fullName')}
                  error={errors.fullName?.message}
                />
                <Field
                  label="Téléphone"
                  type="tel"
                  prefix="+225"
                  placeholder="07 XX XX XX XX"
                  register={register('phone')}
                  error={errors.phone?.message}
                />
              </div>

              <Field
                label="Email professionnel"
                type="email"
                placeholder="vous@entreprise.ci"
                register={register('email')}
                error={errors.email?.message}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Mot de passe"
                  type="password"
                  placeholder="Votre mot de passe"
                  register={register('password')}
                  error={errors.password?.message}
                />
                <Field
                  label="Confirmation"
                  type="password"
                  placeholder="Confirmez le mot de passe"
                  register={register('passwordConfirm')}
                  error={errors.passwordConfirm?.message}
                />
              </div>

              {/* Password strength indicators */}
              <div className="flex flex-wrap gap-3">
                {passwordRules.map(({ label, test }) => {
                  const ok = test(passwordValue);
                  return (
                    <span
                      key={label}
                      className={clsx(
                        'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors',
                        ok ? 'bg-success-light text-success' : 'bg-bg text-txt-muted'
                      )}
                    >
                      <Check size={12} />
                      {label}
                    </span>
                  );
                })}
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  {...register('cgv')}
                  className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <span className="text-sm text-txt-secondary leading-snug">
                  J'accepte les{' '}
                  <a href="#" className="text-primary font-medium hover:underline">
                    CGV
                  </a>{' '}
                  et la{' '}
                  <a href="#" className="text-primary font-medium hover:underline">
                    Politique de confidentialité
                  </a>
                </span>
              </label>
              {errors.cgv && (
                <p className="text-danger text-xs -mt-2">{errors.cgv.message}</p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-xl font-semibold text-txt-secondary hover:text-primary transition-colors px-4 py-2.5 text-sm"
                >
                  <ArrowLeft size={16} />
                  Retour
                </Link>
                <Button type="submit" variant="accent" disabled={loading}>
                  {loading ? 'Inscription...' : (
                    <span className="inline-flex items-center gap-2">
                      Continuer
                      <ArrowRight size={16} />
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Sidebar récapitulatif (droite) ── */}
        <div className="w-full lg:w-72 shrink-0">
          {/* Plan sélectionné */}
          {selectedPlan && (
            <div className="bg-white rounded-2xl border border-border p-5 mb-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-txt-muted mb-3">
                Plan sélectionné
              </p>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: selectedPlan.color + '18' }}
                >
                  <Zap size={18} style={{ color: selectedPlan.color }} />
                </div>
                <div>
                  <p className="font-bold text-dark text-sm">{selectedPlan.name}</p>
                  <p className="text-xs text-txt-secondary">{selectedPlan.description}</p>
                </div>
              </div>
              <div className="border-t border-border pt-3">
                {selectedPlan.price === 0 && !selectedPlan.contactOnly ? (
                  <p className="text-lg font-bold text-accent">Gratuit</p>
                ) : selectedPlan.contactOnly ? (
                  <p className="text-sm font-medium text-txt-muted">Sur devis</p>
                ) : (
                  <p className="text-lg font-bold text-dark">
                    {selectedPlan.price.toLocaleString('fr-FR')} <span className="text-xs font-normal text-txt-secondary">FCFA/mois</span>
                  </p>
                )}
              </div>
              <ul className="mt-3 flex flex-col gap-1.5">
                {selectedPlan.features.slice(0, 3).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-txt-secondary">
                    <Check size={12} className="text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/subscribe/plan"
                className="block text-center text-xs text-primary font-medium mt-3 hover:underline"
              >
                Changer de plan
              </Link>
            </div>
          )}

          {/* Sécurité */}
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-primary" />
              <p className="text-xs font-bold uppercase tracking-wider text-txt-muted">
                Sécurité
              </p>
            </div>
            <ul className="flex flex-col gap-2.5">
              {[
                'Données chiffrées AES-256',
                'Conforme eIDAS & UEMOA',
                'Aucun partage de données',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-txt-secondary">
                  <Check size={12} className="text-accent shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
