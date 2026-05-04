import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import TopBar from '../components/layout/TopBar';

export default function Renewal() {
  const { user, logout } = useAuthStore();

  return (
    <div className="mobile-shell flex flex-col bg-white min-h-[100dvh]">
      <TopBar title="Renouvellement" back />

      <section className="px-5 pt-5 flex-1">
        <div className="bg-warning-light border border-warning/25 rounded-3xl p-5 flex items-start gap-3">
          <span className="w-10 h-10 rounded-2xl bg-white text-warning inline-flex items-center justify-center shrink-0 ring-1 ring-warning/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v6M12 16v.5" />
            </svg>
          </span>
          <div>
            <p className="font-bold text-ink">Abonnement expiré</p>
            <p className="text-[13px] text-ink-soft mt-1 leading-relaxed">
              Renouvelez votre plan pour reprendre la création et la signature de vos enveloppes.
            </p>
          </div>
        </div>

        {user && (
          <div className="mt-5 bg-canvas rounded-2xl p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary text-white inline-flex items-center justify-center font-bold text-sm">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink truncate">{user.firstName} {user.lastName}</p>
              <p className="text-[12px] text-muted truncate">{user.email}</p>
            </div>
          </div>
        )}

        <Link
          to="/subscribe/plan"
          className="mt-6 h-14 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/30"
        >
          Choisir un nouveau plan
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </Link>

        <button
          onClick={() => { logout(); window.location.href = '/login'; }}
          className="mt-3 w-full h-12 rounded-2xl text-muted font-medium"
        >
          Se déconnecter
        </button>
      </section>
    </div>
  );
}
