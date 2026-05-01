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
    <div className="px-5 pt-6 pb-6">
      <div className="safe-top" />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Bonjour</p>
          <h1 className="text-2xl font-bold text-ink leading-tight">{user?.firstName ?? 'Bienvenue'} 👋</h1>
        </div>
        <Link
          to="/notifications"
          className="w-11 h-11 rounded-full bg-white border border-line-soft flex items-center justify-center text-ink-soft"
          aria-label="Notifications"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 19h12l-2-3v-5a4 4 0 10-8 0v5l-2 3z" />
            <path d="M10 21h4" />
          </svg>
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatCard label="Total" value={stats?.totalEnvelopes ?? 0} accent="primary" />
        <StatCard label="En attente" value={stats?.pending ?? 0} accent="warning" />
        <StatCard label="Signées" value={stats?.signed ?? 0} accent="accent" />
        <StatCard label="Taux signa." value={`${stats?.completionRate ?? 0}%`} accent="primary" />
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex gap-3">
        <Link
          to="/envelopes/new"
          className="flex-1 h-14 rounded-2xl bg-primary text-white font-semibold flex items-center justify-center gap-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouvelle enveloppe
        </Link>
        <Link
          to="/contacts"
          className="w-14 h-14 rounded-2xl bg-white border border-line-soft flex items-center justify-center"
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
        <h2 className="text-lg font-semibold text-ink">Activité récente</h2>
        <Link to="/envelopes" className="text-sm text-primary font-medium">Tout voir</Link>
      </div>
      <div className="flex flex-col gap-2">
        {(recent ?? []).slice(0, 5).map((env) => (
          <Link
            key={env.id}
            to={`/envelopes/${env.id}`}
            className="bg-white rounded-2xl p-4 border border-line-soft flex items-center gap-3 active:bg-line-soft"
          >
            <span className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 7 9-7" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink truncate">{env.name}</p>
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

function StatCard({ label, value, accent }: { label: string; value: number | string; accent: 'primary' | 'accent' | 'warning' }) {
  const palette = {
    primary: 'bg-primary-light text-primary',
    accent: 'bg-accent-light text-accent-dark',
    warning: 'bg-warning-light text-warning',
  }[accent];
  return (
    <div className="bg-white rounded-2xl p-4 border border-line-soft">
      <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${palette}`}>{label}</span>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
