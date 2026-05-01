import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import TopBar from '../components/layout/TopBar';

export default function Settings() {
  const nav = useNavigate();
  const { user, logout } = useAuthStore();

  const items = [
    { to: '/contacts', label: 'Contacts', icon: '👥' },
    { to: '/notifications', label: 'Notifications', icon: '🔔' },
    { to: '/activity', label: 'Activité', icon: '📊' },
  ];

  return (
    <div className="flex flex-col">
      <TopBar title="Profil" />

      <section className="px-5 pt-4">
        <div className="bg-white rounded-2xl p-5 border border-line-soft flex items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-muted truncate">{user?.email}</p>
            {user?.companyName && <p className="text-xs text-faint truncate">{user.companyName}</p>}
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <h2 className="text-xs uppercase font-semibold text-muted tracking-wider mb-2">Compte</h2>
        <div className="bg-white rounded-2xl border border-line-soft divide-y divide-line-soft overflow-hidden">
          {items.map((it) => (
            <Link key={it.to} to={it.to} className="flex items-center gap-3 px-4 py-3.5 active:bg-line-soft">
              <span className="text-xl">{it.icon}</span>
              <span className="flex-1 text-ink-soft">{it.label}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-faint">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-5 mt-6">
        <h2 className="text-xs uppercase font-semibold text-muted tracking-wider mb-2">Abonnement</h2>
        <Link to="/renewal" className="bg-white rounded-2xl border border-line-soft p-4 flex items-center gap-3 active:bg-line-soft">
          <span className="text-xl">💎</span>
          <div className="flex-1">
            <p className="text-ink-soft font-medium">Mon abonnement</p>
            <p className="text-xs text-muted">Voir les détails et renouveler</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-faint">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Link>
      </section>

      <section className="px-5 mt-6">
        <button
          onClick={() => {
            const target = (import.meta.env.VITE_DESKTOP_URL as string | undefined)?.replace(/\/$/, '')
              || `${window.location.protocol}//${window.location.hostname}:5173`;
            window.location.href = `${target}/?desktop=1`;
          }}
          className="w-full h-12 rounded-2xl bg-white border border-line text-ink-soft font-medium"
        >
          Passer en version desktop
        </button>
      </section>

      <section className="px-5 mt-4 mb-8">
        <button
          onClick={() => { logout(); nav('/login'); }}
          className="w-full h-12 rounded-2xl bg-danger-light text-danger font-medium"
        >
          Se déconnecter
        </button>
      </section>
    </div>
  );
}
