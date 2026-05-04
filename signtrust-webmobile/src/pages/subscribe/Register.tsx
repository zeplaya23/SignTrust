import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { getErrorMessage } from '../../services/errors';
import { PLANS } from '../../config/plans';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from '../../components/ui/Toast';

export default function Register() {
  const nav = useNavigate();
  const loc = useLocation() as { state?: { planId?: string } };
  const planId = loc.state?.planId ?? 'discovery';
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];

  const [accountType, setAccountType] = useState<'particulier' | 'entreprise'>('particulier');
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.register({
        accountType,
        companyName: accountType === 'entreprise' ? companyName : undefined,
        firstName, lastName, email, phone, password, planId,
      });
      await authService.sendOtp(email);
      nav('/subscribe/verify', { state: { email, planId } });
    } catch (err: unknown) {
      toast(getErrorMessage(err, 'Échec de l\'inscription. Vérifiez vos informations.'), 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="mobile-shell flex flex-col bg-white min-h-[100dvh] pb-28">
      <TopBar title="Créer un compte" back />

      {/* Résumé du plan choisi */}
      <section className="px-5 pt-3">
        <div className="bg-canvas rounded-2xl p-3.5 flex items-center gap-3 relative overflow-hidden">
          <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: plan.color }} aria-hidden />
          <span className="ml-1 w-10 h-10 rounded-xl bg-white text-primary inline-flex items-center justify-center ring-1 ring-line-soft shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12l5 5 9-9" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Plan choisi</p>
            <p className="font-bold text-ink leading-tight">{plan.name}</p>
            <p className="text-[12px] text-muted">
              {plan.contactOnly ? 'Sur devis' : plan.price === 0 ? 'Gratuit · 14 jours' : `${plan.price.toLocaleString('fr-FR')} F/mois`}
            </p>
          </div>
          <Link to="/subscribe/plan" className="text-[12px] font-semibold text-primary px-2 py-1">Changer</Link>
        </div>
      </section>

      {/* Type de compte */}
      <section className="px-5 mt-5">
        <p className="text-[11px] font-bold text-muted uppercase tracking-[0.12em] mb-2">Type de compte</p>
        <div className="grid grid-cols-2 gap-2 bg-canvas rounded-2xl p-1.5">
          {([
            ['particulier', 'Particulier', '👤'],
            ['entreprise', 'Entreprise', '🏢'],
          ] as const).map(([t, label, emoji]) => (
            <button
              key={t}
              type="button"
              onClick={() => setAccountType(t)}
              className={`h-12 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
                accountType === t ? 'bg-white text-primary shadow-sm' : 'text-muted'
              }`}
            >
              <span>{emoji}</span> {label}
            </button>
          ))}
        </div>
      </section>

      {/* Formulaire */}
      <form onSubmit={submit} className="px-5 mt-5 flex flex-col gap-3.5" id="register-form">
        {accountType === 'entreprise' && (
          <Input
            label="Raison sociale"
            placeholder="Cryptoneo SARL"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Prénom"
            placeholder="Jean"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            label="Nom"
            placeholder="Marc"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <Input
          label="Email"
          type="email"
          placeholder="vous@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Téléphone"
          type="tel"
          placeholder="+225 07 00 00 00 00"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <div className="relative">
          <Input
            label="Mot de passe"
            type={showPwd ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint="8 caractères min · 1 majuscule · 1 minuscule · 1 chiffre"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute right-3 top-9 text-xs text-primary font-semibold"
          >
            {showPwd ? 'Masquer' : 'Voir'}
          </button>
        </div>

        <p className="text-[11px] text-muted leading-relaxed mt-1">
          En créant un compte, vous acceptez les{' '}
          <span className="text-primary font-semibold">CGU</span> et la{' '}
          <span className="text-primary font-semibold">politique de confidentialité</span>.
        </p>
      </form>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 mt-auto bg-white border-t border-line-soft px-5 pt-3 pb-3 safe-bottom">
        <Button type="submit" form="register-form" size="lg" fullWidth loading={loading}>
          Continuer
        </Button>
        <p className="text-center text-[11px] text-faint mt-2">
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-primary font-semibold">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
