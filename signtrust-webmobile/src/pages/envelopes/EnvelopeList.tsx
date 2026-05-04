import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { envelopeService } from '../../services/envelopeService';
import TopBar from '../../components/layout/TopBar';
import StatusBadge from '../../components/ui/StatusBadge';
import { clsx } from 'clsx';
import type { EnvelopeStatus } from '../../types/envelope';

const FILTERS: { id: EnvelopeStatus | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'Toutes' },
  { id: 'DRAFT', label: 'Brouillons' },
  { id: 'SENT', label: 'Envoyées' },
  { id: 'COMPLETED', label: 'Signées' },
  { id: 'CANCELLED', label: 'Annulées' },
];

export default function EnvelopeList() {
  const [filter, setFilter] = useState<EnvelopeStatus | 'ALL'>('ALL');
  const { data, isLoading } = useQuery({
    queryKey: ['envelopes', filter],
    queryFn: () => envelopeService.getAll(filter === 'ALL' ? undefined : filter),
  });

  return (
    <div className="flex flex-col bg-white min-h-[100dvh]">
      <TopBar
        title="Enveloppes"
        right={
          <Link
            to="/envelopes/new"
            aria-label="Nouvelle"
            className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-primary text-white shadow-sm shadow-primary/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        }
      />

      <div className="px-5 pt-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={clsx(
                'shrink-0 px-4 h-9 rounded-full text-[13px] font-semibold transition-colors',
                filter === f.id
                  ? 'bg-ink text-white'
                  : 'bg-canvas text-muted active:bg-line-soft',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-col gap-2 pb-4">
          {isLoading && (
            <div className="text-center py-12">
              <span className="inline-block w-6 h-6 rounded-full border-2 border-line border-t-primary animate-spin" />
            </div>
          )}
          {!isLoading && data?.items.length === 0 && (
            <div className="text-center py-16 px-6">
              <span className="inline-flex w-14 h-14 rounded-2xl bg-canvas text-faint items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 7 9-7" />
                </svg>
              </span>
              <p className="text-ink font-semibold mt-3">Aucune enveloppe</p>
              <p className="text-sm text-muted mt-1">Créez-en une pour démarrer.</p>
            </div>
          )}
          {data?.items.map((env) => (
            <Link
              key={env.id}
              to={`/envelopes/${env.id}`}
              className="bg-canvas rounded-2xl p-4 active:bg-line-soft transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-ink truncate">{env.name}</p>
                <StatusBadge status={env.status} />
              </div>
              <div className="mt-2 text-[11px] text-muted flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                  {env.documentsCount ?? 0}
                </span>
                <span className="inline-flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
                  </svg>
                  {env.signatoriesCount ?? 0}
                </span>
                <span className="ml-auto">{new Date(env.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
