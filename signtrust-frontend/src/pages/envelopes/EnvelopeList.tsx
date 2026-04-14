import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Filter,
  Download,
  PlusCircle,
  FolderOpen,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import type { Envelope, EnvelopeStatus } from '../../types/envelope';

const mockEnvelopes: Envelope[] = [
  { id: 1, name: 'Contrat de bail 2024', status: 'SENT', documentsCount: 2, signatoriesCount: 3, createdAt: '2026-04-12T10:00:00Z', expiresAt: '2026-04-16T10:00:00Z' },
  { id: 2, name: 'NDA - Projet Alpha', status: 'COMPLETED', documentsCount: 1, signatoriesCount: 2, createdAt: '2026-04-11T14:30:00Z', expiresAt: '2026-04-25T14:30:00Z' },
  { id: 3, name: 'Avenant contrat CDI', status: 'DRAFT', documentsCount: 3, signatoriesCount: 1, createdAt: '2026-04-10T09:00:00Z', expiresAt: '2026-04-30T09:00:00Z' },
  { id: 4, name: 'Convention de stage', status: 'SENT', documentsCount: 1, signatoriesCount: 4, createdAt: '2026-04-09T16:00:00Z', expiresAt: '2026-04-18T16:00:00Z' },
  { id: 5, name: 'Procuration notariale', status: 'CANCELLED', documentsCount: 2, signatoriesCount: 2, createdAt: '2026-04-08T11:00:00Z', expiresAt: '2026-04-22T11:00:00Z' },
  { id: 6, name: 'Contrat de prestation', status: 'COMPLETED', documentsCount: 1, signatoriesCount: 3, createdAt: '2026-04-07T08:00:00Z', expiresAt: '2026-05-01T08:00:00Z' },
  { id: 7, name: 'Accord de confidentialité', status: 'SENT', documentsCount: 1, signatoriesCount: 2, createdAt: '2026-04-06T12:00:00Z', expiresAt: '2026-04-15T12:00:00Z' },
  { id: 8, name: 'Mandat de gestion', status: 'DRAFT', documentsCount: 4, signatoriesCount: 1, createdAt: '2026-04-05T15:00:00Z', expiresAt: '2026-04-28T15:00:00Z' },
];

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

  const filtered = activeFilter === 'ALL'
    ? mockEnvelopes
    : mockEnvelopes.filter((e) => e.status === activeFilter);

  const total = filtered.length;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(total / perPage);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === paged.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paged.map((e) => e.id)));
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

      {/* Table */}
      <Card padding="sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-txt-secondary text-left border-b border-border">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.size === paged.length && paged.length > 0}
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
            {paged.map((env) => (
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
                    {env.documentsCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-txt-secondary">
                  <span className="flex items-center gap-1">
                    <Users size={14} /> {env.signatoriesCount}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge status={statusToBadge(env.status)} />
                </td>
                <td className="px-4 py-3 text-txt-secondary">{formatDate(env.createdAt)}</td>
                <td className={`px-4 py-3 ${isExpiringSoon(env.expiresAt) ? 'text-accent font-medium' : 'text-txt-secondary'}`}>
                  {formatDate(env.expiresAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-sm text-txt-secondary">
            {(page - 1) * perPage + 1}-{Math.min(page * perPage, total)} sur {total}
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
    </div>
  );
}
