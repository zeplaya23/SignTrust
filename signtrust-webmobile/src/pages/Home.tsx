import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { envelopeService } from '../services/envelopeService';
import { useAuthStore } from '../stores/useAuthStore';
import StatusBadge from '../components/ui/StatusBadge';

export default function Home() {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),
  });
  const { data: recent } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: () => dashboardService.getRecent(),
  });
  const { data: cancelled } = useQuery({
    queryKey: ['envelopes-cancelled'],
    queryFn: () => envelopeService.getAll('CANCELLED'),
  });

  const total = stats?.totalEnvelopes ?? 0;
  const pending = stats?.pending ?? 0;
  const signed = stats?.signed ?? 0;
  const refused = cancelled?.total ?? 0;

  return (
    <div className="bg-canvas min-h-[100dvh]">
      {/* Header SignTrust */}
      <header className="safe-top px-4 pt-3 pb-2 bg-white border-b border-line-soft flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-primary text-white inline-flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12l5 5 9-9" /></svg>
          </span>
          <span className="text-[14px] font-bold text-primary">DigiSign Parapheur</span>
        </div>
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="relative w-10 h-10 inline-flex items-center justify-center text-muted active:bg-line-soft rounded-full"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-danger ring-2 ring-white" />
        </Link>
      </header>

      <div className="px-4 pt-4 pb-6">
        {/* Greeting */}
        <div className="mb-4">
          <p className="text-[13px] text-muted">Bonjour</p>
          <p className="text-[22px] font-bold text-ink leading-tight tracking-tight">
            {user?.firstName ?? '—'} {user?.lastName ?? ''}
          </p>
        </div>

        {/* 4 stats grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <StatTile label="Enveloppes" value={total} bg="bg-primary-light" color="text-primary" />
          <StatTile label="À signer" value={pending} bg="bg-warning-light" color="text-warning" />
          <StatTile label="Signées" value={signed} bg="bg-accent-light" color="text-accent-dark" />
          <StatTile label="Refusées" value={refused} bg="bg-danger-light" color="text-danger" />
        </div>

        {/* Actions rapides */}
        <div className="bg-white rounded-2xl border border-line p-4 mb-4">
          <p className="text-[14px] font-bold text-ink mb-3">Actions rapides</p>
          <div className="grid grid-cols-3 gap-2.5">
            <QuickAction
              onClick={() => nav('/envelopes/new?mode=scan')}
              label="Scanner"
              bg="bg-primary-light"
              color="text-primary"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 3H5a2 2 0 00-2 2v2m14-4h2a2 2 0 012 2v2M3 17v2a2 2 0 002 2h2m14 0h2a2 2 0 002-2v-2M8 12h8"/>
                </svg>
              }
            />
            <QuickAction
              onClick={() => nav('/envelopes/new?mode=image')}
              label="Image → PDF"
              bg="bg-purple-light"
              color="text-purple"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              }
            />
            <QuickAction
              onClick={() => nav('/envelopes/new?mode=pdf')}
              label="Charger PDF"
              bg="bg-accent-light"
              color="text-accent-dark"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"/>
                </svg>
              }
            />
          </div>
        </div>

        {/* Récents */}
        <div className="bg-white rounded-2xl border border-line p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[14px] font-bold text-ink">Récents</p>
            <Link to="/envelopes" className="text-[12px] font-semibold text-primary">Tout voir</Link>
          </div>
          {(recent ?? []).slice(0, 4).map((env, i, arr) => (
            <Link
              key={env.id}
              to={`/envelopes/${env.id}`}
              className={`flex items-center gap-3 py-2.5 ${i < arr.length - 1 ? 'border-b border-line-soft' : ''} active:bg-line-soft rounded-lg -mx-1 px-1`}
            >
              <span className="w-10 h-10 rounded-xl bg-primary-light text-primary inline-flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-ink truncate">{env.name}</p>
                <p className="text-[11px] text-faint">
                  {env.documentsCount ?? 0} doc · {new Date(env.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </p>
              </div>
              <StatusBadge status={env.status} />
            </Link>
          ))}
          {!recent?.length && (
            <p className="text-center text-muted text-[12px] py-6">Aucune enveloppe récente.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, bg, color }: { label: string; value: number | string; bg: string; color: string }) {
  return (
    <div className={`${bg} rounded-2xl p-3.5`}>
      <p className={`text-[22px] font-bold ${color} leading-none`}>{value}</p>
      <p className="text-[11px] text-muted mt-1">{label}</p>
    </div>
  );
}

function QuickAction({
  onClick,
  label,
  bg,
  color,
  icon,
}: {
  onClick: () => void;
  label: string;
  bg: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-center"
    >
      <span className={`w-12 h-12 rounded-2xl ${bg} ${color} inline-flex items-center justify-center mb-1.5 mx-auto`}>
        {icon}
      </span>
      <span className="block text-[11px] font-semibold text-ink leading-tight">{label}</span>
    </button>
  );
}
