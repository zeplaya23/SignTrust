import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from '../../components/ui/Toast';

export default function Register() {
  const nav = useNavigate();
  const loc = useLocation() as { state?: { planId?: string } };
  const planId = loc.state?.planId ?? 'discovery';

  const [accountType, setAccountType] = useState<'particulier' | 'entreprise'>('particulier');
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.register({
        accountType, companyName: accountType === 'entreprise' ? companyName : undefined,
        firstName, lastName, email, phone, password, planId,
      });
      await authService.sendOtp(email);
      nav('/subscribe/verify', { state: { email, planId } });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast(e.response?.data?.message || 'Échec de l\'inscription', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col pb-8">
      <TopBar title="Créer un compte" back />
      <form onSubmit={submit} className="px-5 pt-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {(['particulier', 'entreprise'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setAccountType(t)}
              className={`h-12 rounded-xl border text-sm font-medium ${
                accountType === t ? 'bg-primary-light border-primary text-primary' : 'bg-white border-line text-muted'
              }`}
            >
              {t === 'particulier' ? 'Particulier' : 'Entreprise'}
            </button>
          ))}
        </div>

        {accountType === 'entreprise' && (
          <Input label="Raison sociale" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input label="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          <Input label="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Téléphone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <Input
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="8 caractères minimum"
          required
        />

        <Button type="submit" size="lg" fullWidth loading={loading}>Continuer</Button>
        <p className="text-xs text-muted text-center">
          En créant un compte vous acceptez nos CGU et notre politique de confidentialité.
        </p>
      </form>
    </div>
  );
}
