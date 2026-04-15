import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Filter,
  Download,
  PlusCircle,
  FolderOpen,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { envelopeService } from '../../services/envelopeService';
import type { Envelope, EnvelopeStatus } from '../../types/envelope';

type FilterKey = 'ALL' | 'SENT' | 'COMPLETED' | 'CANCELLED' | 'DRAFT';

const filters: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'SENT', label: 'En attente' },
  { key: 'COMPLETED', label: 'Signées' },
  { key: 'CANCELLED', label: 'Refusées' },
  { key: 'DRAFT', label: 'Brouillons' },
];

function statusToBadge(status: EnvelopeStatus): 'pending' | 'signed' | 'rejected' | 'draft' {
  switch (status) {
    case 'SENT': return 'pending';
    case 'COMPLETED': return 'signed';
    case 'CANCELLED': return 'rejected';
    case 'DRAFT': return 'draft';
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isExpiringSoon(iso: string): boolean {
  const diff = new Date(iso).getTime() - Date.now();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
}

export default function EnvelopeList() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const perPage = 8;

  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvelopes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = activeFilter === 'ALL' ? undefined : activeFilter;
      const result = await envelopeService.getAll(status, page - 1);
      setEnvelopes(result.items);
      setTotal(result.total);
    } catch {
      setError('Impossible de charger les enveloppes.');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, page]);

  useEffect(() => {
    fetchEnvelopes();
  }, [fetchEnvelopes]);

  const totalPages = Math.ceil(total / perPage) || 1;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === envelopes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(envelopes.map((e) => e.id)));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-dark">Enveloppes</h1>
          <span className="inline-flex items-center justify-center bg-primary-light text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {total}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={Filter}>Filtrer</Button>
          <Button variant="outline" size="sm" icon={Download}>Exporter</Button>
          <Button variant="primary" size="sm" icon={PlusCircle} onClick={() => navigate('/envelopes/new')}>
            Nouvelle
          </Button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-5">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => { setActiveFilter(f.key); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeFilter === f.key
                ? 'bg-primary text-white'
                : 'bg-white text-txt-secondary border border-border hover:bg-bg'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertCircle size={32} className="text-danger" />
          <p className="text-sm text-txt-secondary">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchEnvelopes}>Réessayer</Button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <Card padding="sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-txt-secondary text-left border-b border-border">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === envelopes.length && envelopes.length > 0}
                    onChange={toggleAll}
                    className="rounded border-border"
                  />
                </th>
                <th className="px-4 py-3 font-medium">Enveloppe</th>
                <th className="px-4 py-3 font-medium">Docs</th>
                <th className="px-4 py-3 font-medium">Signataires</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Créée le</th>
                <th className="px-4 py-3 font-medium">Expire le</th>
              </tr>
            </thead>
            <tbody>
              {envelopes.map((env) => (
                <tr
                  key={env.id}
                  className="border-t border-border hover:bg-bg/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/envelopes/${env.id}`)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(env.id)}
                      onChange={() => toggleSelect(env.id)}
                      className="rounded border-border"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-txt">
                    <span className="flex items-center gap-2">
                      <FolderOpen size={16} className="text-txt-muted shrink-0" />
                      {env.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center bg-primary-light text-primary text-xs font-semibold w-6 h-6 rounded-full">
                      {env.documentsCount ?? env.documents?.length ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-txt-secondary">
                    <span className="flex items-center gap-1">
                      <Users size={14} /> {env.signatoriesCount ?? env.signatories?.length ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={statusToBadge(env.status)} />
                  </td>
                  <td className="px-4 py-3 text-txt-secondary">{formatDate(env.createdAt)}</td>
                  <td className={`px-4 py-3 ${env.expiresAt && isExpiringSoon(env.expiresAt) ? 'text-accent font-medium' : 'text-txt-secondary'}`}>
                    {env.expiresAt ? formatDate(env.expiresAt) : '\u2014'}
                  </td>
                </tr>
              ))}
              {envelopes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-txt-muted">
                    Aucune enveloppe trouv&#233;e.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-txt-secondary">
              {total > 0 ? `${(page - 1) * perPage + 1}-${Math.min(page * perPage, total)} sur ${total}` : '0 résultat'}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-bg disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === page ? 'bg-primary text-white' : 'hover:bg-bg text-txt-secondary'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-bg disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
