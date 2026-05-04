import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { useAuthStore } from '../stores/useAuthStore';
import StatusBadge from '../components/ui/StatusBadge';

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
  });
  const { data: recent } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: () => dashboardService.getRecent(),
  });

  return (
    <div className="px-5 pt-6 pb-6 bg-white min-h-[100dvh]">
      <div className="safe-top" />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">Bonjour 👋</p>
          <h1 className="text-2xl font-bold text-ink leading-tight tracking-tight">{user?.firstName ?? 'Bienvenue'}</h1>
        </div>
        <Link
          to="/notifications"
          className="relative w-11 h-11 rounded-full bg-canvas inline-flex items-center justify-center text-ink-soft active:bg-line-soft"
          aria-label="Notifications"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 19h12l-2-3v-5a4 4 0 10-8 0v5l-2 3z" />
            <path d="M10 21h4" />
          </svg>
        </Link>
      </div>

      {/* Hero stat — total */}
      <div className="mt-6 bg-ink rounded-3xl p-5 text-white">
        <p className="text-xs uppercase tracking-wider text-white/60 font-semibold">Total enveloppes</p>
        <p className="text-4xl font-bold mt-1.5 tracking-tight">{stats?.totalEnvelopes ?? 0}</p>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            <span className="text-white/80">{stats?.pending ?? 0} en attente</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-white/80">{stats?.signed ?? 0} signées</span>
          </span>
        </div>
      </div>

      {/* Stats secondaires */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatCard label="Taux signature" value={`${stats?.completionRate ?? 0}%`} />
        <StatCard label="En attente" value={stats?.pending ?? 0} />
      </div>

      {/* Quick actions */}
      <div className="mt-5 flex gap-3">
        <Link
          to="/envelopes/new"
          className="flex-1 h-14 rounded-2xl bg-primary text-white font-semibold inline-flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouvelle enveloppe
        </Link>
        <Link
          to="/contacts"
          className="w-14 h-14 rounded-2xl bg-canvas inline-flex items-center justify-center text-ink-soft active:bg-line-soft"
          aria-label="Contacts"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21c0-4 4-7 8-7s8 3 8 7" />
            <circle cx="11" cy="8" r="4" />
          </svg>
        </Link>
      </div>

      {/* Recent */}
      <div className="mt-8 flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-ink tracking-tight">Activité récente</h2>
        <Link to="/envelopes" className="text-sm text-primary font-semibold">Voir tout →</Link>
      </div>
      <div className="flex flex-col gap-2">
        {(recent ?? []).slice(0, 5).map((env) => (
          <Link
            key={env.id}
            to={`/envelopes/${env.id}`}
            className="bg-canvas rounded-2xl p-3.5 flex items-center gap-3 active:bg-line-soft transition-colors"
          >
            <span className="w-10 h-10 rounded-xl bg-white text-primary inline-flex items-center justify-center shrink-0 ring-1 ring-line-soft">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 7 9-7" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink truncate text-[14px]">{env.name}</p>
              <p className="text-xs text-muted">{new Date(env.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
            <StatusBadge status={env.status} />
          </Link>
        ))}
        {!recent?.length && (
          <p className="text-center text-muted text-sm py-12">Aucune enveloppe récente.</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-canvas rounded-2xl p-4">
      <p className="text-[11px] uppercase tracking-wider font-semibold text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-ink tracking-tight">{value}</p>
    </div>
  );
}
