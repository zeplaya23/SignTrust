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
  { id: 'SENT', label: 'À signer' },
  { id: 'COMPLETED', label: 'Signées' },
  { id: 'DRAFT', label: 'Brouillons' },
  { id: 'CANCELLED', label: 'Annulées' },
];

export default function EnvelopeList() {
  const [filter, setFilter] = useState<EnvelopeStatus | 'ALL'>('ALL');
  const { data, isLoading } = useQuery({
    queryKey: ['envelopes', filter],
    queryFn: () => envelopeService.getAll(filter === 'ALL' ? undefined : filter),
  });

  return (
    <div className="bg-canvas min-h-[100dvh]">
      <TopBar
        title="Mes enveloppes"
        right={
          <Link
            to="/envelopes/new"
            aria-label="Nouvelle"
            className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-primary text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        }
      />

      <div className="px-4 pt-3">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4 pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={clsx(
                'shrink-0 px-3.5 h-8 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap',
                filter === f.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-muted border border-line',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-6">
        <div className="bg-white rounded-2xl border border-line overflow-hidden">
          {isLoading && (
            <div className="text-center py-12">
              <span className="inline-block w-6 h-6 rounded-full border-2 border-line border-t-primary animate-spin" />
            </div>
          )}
          {!isLoading && data?.items.length === 0 && (
            <div className="text-center py-14 px-6">
              <span className="inline-flex w-14 h-14 rounded-2xl bg-canvas text-faint items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <p className="text-ink font-semibold mt-3">Aucune enveloppe</p>
              <p className="text-sm text-muted mt-1">Créez-en une pour démarrer.</p>
            </div>
          )}
          {data?.items.map((env, i, arr) => (
            <Link
              key={env.id}
              to={`/envelopes/${env.id}`}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 active:bg-line-soft',
                i < arr.length - 1 && 'border-b border-line-soft',
              )}
            >
              <span className="w-10 h-10 rounded-xl bg-primary-light text-primary inline-flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-ink truncate">{env.name}</p>
                <p className="text-[11px] text-faint">
                  {env.documentsCount ?? 0} doc · {env.signatoriesCount ?? 0} signataire(s) · {new Date(env.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </p>
              </div>
              <StatusBadge status={env.status} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
