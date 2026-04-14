import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
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

export default function Register() {
  const navigate = useNavigate();
  const { accountType, setAccountType, setRegistrationData, selectedPlan } = useSubscriptionStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      cgv: false,
    },
  });

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

      // Store userId for later payment
      useSubscriptionStore.setState({ userId: resp.userId });

      navigate('/subscribe/verify');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Erreur lors de l\'inscription';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <TopBar currentStep={2} stepLabel="Inscription" />

      <div className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-dark text-center mb-8">
          Créez votre compte
        </h1>

        {error && (
          <div className="bg-danger-light text-danger rounded-xl px-4 py-3 mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Account type toggle */}
        <div className="flex rounded-xl overflow-hidden border border-border mb-6">
          {(['particulier', 'entreprise'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              className={clsx(
                'flex-1 py-2.5 text-sm font-semibold transition-colors cursor-pointer',
                accountType === type
                  ? 'bg-primary text-white'
                  : 'bg-white text-txt-secondary hover:bg-bg'
              )}
            >
              {type === 'particulier' ? 'Particulier' : 'Entreprise'}
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

          <Field
            label="Nom complet"
            placeholder="Jean Kouamé"
            register={register('fullName')}
            error={errors.fullName?.message}
          />

          <Field
            label="Email professionnel"
            type="email"
            placeholder="vous@entreprise.ci"
            register={register('email')}
            error={errors.email?.message}
          />

          <Field
            label="Téléphone"
            type="tel"
            prefix="+225"
            placeholder="07 XX XX XX XX"
            register={register('phone')}
            error={errors.phone?.message}
          />

          <div>
            <Field
              label="Mot de passe"
              type="password"
              placeholder="Votre mot de passe"
              register={register('password')}
              error={errors.password?.message}
            />
            <p className="text-xs text-txt-muted mt-1">
              Min 8 car., 1 majuscule, 1 chiffre
            </p>
          </div>

          <Field
            label="Confirmation mot de passe"
            type="password"
            placeholder="Confirmez votre mot de passe"
            register={register('passwordConfirm')}
            error={errors.passwordConfirm?.message}
          />

          <label className="flex items-start gap-2 cursor-pointer mt-2">
            <input
              type="checkbox"
              {...register('cgv')}
              className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <span className="text-sm text-txt-secondary">
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

          <div className="mt-6 flex items-center justify-between">
            <Link
              to="/subscribe/plan"
              className="rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-white text-primary border border-border hover:bg-bg px-5 py-2.5 text-sm"
            >
              Retour
            </Link>
            <Button type="submit" variant="accent" disabled={loading}>
              {loading ? 'Inscription...' : 'Continuer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
