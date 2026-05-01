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
    <div className="flex flex-col">
      <TopBar
        title="Enveloppes"
        right={
          <Link to="/envelopes/new" aria-label="Nouvelle" className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-primary text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
        }
      />

      <div className="px-5 pt-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={clsx(
                'shrink-0 px-4 h-9 rounded-full text-sm font-medium transition-colors',
                filter === f.id ? 'bg-primary text-white' : 'bg-white text-muted border border-line-soft',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2 pb-4">
          {isLoading && <p className="text-center text-muted py-12 text-sm">Chargement…</p>}
          {!isLoading && data?.items.length === 0 && (
            <p className="text-center text-muted py-12 text-sm">Aucune enveloppe.</p>
          )}
          {data?.items.map((env) => (
            <Link
              key={env.id}
              to={`/envelopes/${env.id}`}
              className="bg-white rounded-2xl p-4 border border-line-soft active:bg-line-soft"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-ink truncate">{env.name}</p>
                <StatusBadge status={env.status} />
              </div>
              <div className="mt-2 text-xs text-muted flex items-center gap-3">
                <span>{env.documentsCount ?? 0} doc.</span>
                <span>·</span>
                <span>{env.signatoriesCount ?? 0} signataire(s)</span>
                <span>·</span>
                <span>{new Date(env.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
