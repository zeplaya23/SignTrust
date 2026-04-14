import { useState } from 'react';
import { User, Lock, CreditCard, BellRing, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuthStore } from '../stores/useAuthStore';

export default function Settings() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Profile
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || 'Kouadio',
    lastName: user?.lastName || 'Yao',
    email: user?.email || 'kouadio.yao@signtrust.ci',
    phone: user?.phone || '+225 07 08 09 10 11',
  });

  // Security
  const [editSecurity, setEditSecurity] = useState(false);
  const [securityForm, setSecurityForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState({
    email: true,
    push: true,
    sms: false,
    reminderFrequency: '24h',
  });

  // Subscription mock
  const subscription = {
    plan: 'Professionnel',
    price: 15000,
    paymentMethod: 'Mobile Money (Orange)',
    nextBilling: '15 mai 2026',
    used: 134,
    max: 200,
  };
  const usagePercent = Math.round((subscription.used / subscription.max) * 100);

  return (
    <div className="min-h-screen bg-bg p-6 lg:p-10">
      {/* Header */}
      <h1 className="text-2xl font-bold text-txt mb-8">Paramètres</h1>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Section 1: Profile */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <h2 className="text-lg font-bold text-txt">Profil</h2>
          </div>

          {!editProfile ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Prénom</p>
                  <p className="text-sm font-medium text-txt">{profileForm.firstName}</p>
                </div>
                <div>
                  <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Nom</p>
                  <p className="text-sm font-medium text-txt">{profileForm.lastName}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Email</p>
                <p className="text-sm font-medium text-txt">{profileForm.email}</p>
              </div>
              <div>
                <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Téléphone</p>
                <p className="text-sm font-medium text-txt">{profileForm.phone}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditProfile(true)}>Modifier</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Prénom</label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Nom</label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  disabled
                  className="w-full bg-border/30 border border-border px-4 py-3 text-sm text-txt-muted rounded-xl cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setEditProfile(false)}>Annuler</Button>
                <Button variant="primary" size="sm" icon={Save} onClick={() => setEditProfile(false)}>Enregistrer</Button>
              </div>
            </div>
          )}
        </Card>

        {/* Section 2: Security */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-danger-light flex items-center justify-center">
              <Lock size={20} className="text-danger" />
            </div>
            <h2 className="text-lg font-bold text-txt">Sécurité</h2>
          </div>

          {!editSecurity ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Mot de passe</p>
                <p className="text-sm text-txt">••••••••••</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Authentification 2FA (TOTP)</p>
                  <p className="text-sm text-txt">{twoFAEnabled ? 'Activée' : 'Désactivée'}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={twoFAEnabled}
                    onChange={() => setTwoFAEnabled(!twoFAEnabled)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>
              <div>
                <p className="text-xs text-txt-muted uppercase tracking-wider mb-2">Sessions actives</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-bg rounded-xl px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-txt">Chrome - macOS</p>
                      <p className="text-xs text-txt-muted">Abidjan, CI - Session actuelle</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-success" />
                  </div>
                  <div className="flex items-center justify-between bg-bg rounded-xl px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-txt">Safari - iPhone</p>
                      <p className="text-xs text-txt-muted">Abidjan, CI - Il y a 2 jours</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-txt-muted" />
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditSecurity(true)}>Modifier le mot de passe</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Ancien mot de passe</label>
                <input
                  type="password"
                  value={securityForm.oldPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, oldPassword: e.target.value })}
                  className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                  className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                  className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={() => setEditSecurity(false)}>Annuler</Button>
                <Button variant="primary" size="sm" icon={Save} onClick={() => setEditSecurity(false)}>Enregistrer</Button>
              </div>
            </div>
          )}
        </Card>

        {/* Section 3: Subscription & Billing */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
              <CreditCard size={20} className="text-accent" />
            </div>
            <h2 className="text-lg font-bold text-txt">Abonnement & Facturation</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Plan actuel</p>
                <p className="text-sm font-medium text-txt">{subscription.plan}</p>
              </div>
              <p className="text-lg font-bold text-accent">{subscription.price.toLocaleString('fr-FR')} <span className="text-sm font-normal text-txt-secondary">FCFA/mois</span></p>
            </div>
            <div>
              <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Moyen de paiement</p>
              <p className="text-sm font-medium text-txt">{subscription.paymentMethod}</p>
            </div>
            <div>
              <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Prochaine facturation</p>
              <p className="text-sm font-medium text-txt">{subscription.nextBilling}</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-txt-muted uppercase tracking-wider">Utilisation</p>
                <p className="text-sm font-medium text-txt">{subscription.used}/{subscription.max} enveloppes</p>
              </div>
              <div className="w-full bg-border rounded-full h-2.5">
                <div
                  className="bg-accent h-2.5 rounded-full transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/subscribe/plan')}>Changer de plan</Button>
          </div>
        </Card>

        {/* Section 4: Notifications */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center">
              <BellRing size={20} className="text-success" />
            </div>
            <h2 className="text-lg font-bold text-txt">Notifications</h2>
          </div>

          <div className="space-y-5">
            {/* Email toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-txt">Notifications par email</p>
                <p className="text-xs text-txt-muted">Recevoir les notifications par email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.email}
                  onChange={() => setNotifPrefs({ ...notifPrefs, email: !notifPrefs.email })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>

            {/* Push toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-txt">Notifications push</p>
                <p className="text-xs text-txt-muted">Recevoir les notifications dans le navigateur</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.push}
                  onChange={() => setNotifPrefs({ ...notifPrefs, push: !notifPrefs.push })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>

            {/* SMS toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-txt">Notifications SMS</p>
                <p className="text-xs text-txt-muted">Recevoir les rappels par SMS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.sms}
                  onChange={() => setNotifPrefs({ ...notifPrefs, sms: !notifPrefs.sms })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
              </label>
            </div>

            {/* Reminder frequency */}
            <div>
              <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Fréquence des rappels</label>
              <select
                value={notifPrefs.reminderFrequency}
                onChange={(e) => setNotifPrefs({ ...notifPrefs, reminderFrequency: e.target.value })}
                className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="6h">Toutes les 6 heures</option>
                <option value="12h">Toutes les 12 heures</option>
                <option value="24h">Toutes les 24 heures</option>
                <option value="48h">Toutes les 48 heures</option>
                <option value="never">Ne pas envoyer de rappels</option>
              </select>
            </div>

            <Button variant="primary" size="sm" icon={Save}>Enregistrer</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
