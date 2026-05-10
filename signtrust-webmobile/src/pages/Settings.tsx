import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import TopBar from '../components/layout/TopBar';

export default function Settings() {
  const nav = useNavigate();
  const { user, subscriptionStatus, logout } = useAuthStore();

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}` || '?';
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Profil';

  const planLabel = (() => {
    switch (subscriptionStatus) {
      case 'TRIAL': return 'Plan Découverte (essai)';
      case 'ACTIVE': return 'Plan actif';
      case 'EXPIRED': return 'Plan expiré';
      case 'CANCELLED': return 'Plan annulé';
      default: return 'Aucun plan';
    }
  })();

  const sections: Array<{ title: string; items: Array<[string, string]> }> = [
    {
      title: 'Compte',
      items: [
        ['Email', user?.email ?? '—'],
        ['Téléphone', user?.phone ?? '—'],
        ['Type', user?.accountType === 'entreprise' ? 'Entreprise' : 'Particulier'],
        ...(user?.companyName ? [['Société', user.companyName]] as [string, string][] : []),
      ],
    },
    {
      title: 'Abonnement',
      items: [
        ['Statut', planLabel],
      ],
    },
    {
      title: 'Sécurité',
      items: [
        ['2FA', '—'],
        ['Mot de passe', '••••••••'],
      ],
    },
  ];

  return (
    <div className="bg-canvas min-h-[100dvh]">
      <TopBar title="Profil" />

      <div className="px-4 pt-4 pb-6">
        {/* Avatar header */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-primary inline-flex items-center justify-center text-white text-[24px] font-bold mb-2">
            {initials.toUpperCase()}
          </div>
          <p className="text-[18px] font-bold text-ink">{fullName}</p>
          <p className="text-[12px] text-muted">{planLabel}</p>
        </div>

        {/* Sections */}
        {sections.map((sec) => (
          <div key={sec.title} className="bg-white rounded-2xl border border-line p-4 mb-3">
            <p className="text-[13px] font-bold text-ink mb-2">{sec.title}</p>
            {sec.items.map(([k, v], j, arr) => (
              <div
                key={k}
                className={`flex items-center justify-between gap-3 py-1.5 ${j < arr.length - 1 ? 'border-b border-line-soft' : ''}`}
              >
                <span className="text-[12px] text-muted shrink-0">{k}</span>
                <span className="text-[12px] text-ink truncate text-right max-w-[60%]">{v}</span>
              </div>
            ))}
          </div>
        ))}

        {/* Repasser desktop */}
        <button
          onClick={() => {
            const target = (import.meta.env.VITE_DESKTOP_URL as string | undefined)?.replace(/\/$/, '')
              || `${window.location.protocol}//${window.location.hostname}:5173`;
            window.location.href = `${target}/?desktop=1`;
          }}
          className="w-full h-11 rounded-xl border border-line bg-white text-ink-soft text-[13px] font-semibold mb-2"
        >
          Passer en version desktop
        </button>

        {/* Déconnexion */}
        <button
          onClick={() => { logout(); nav('/login'); }}
          className="w-full h-11 rounded-xl border border-danger bg-danger-light text-danger text-[13px] font-semibold"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}
