import { useState, useEffect, useCallback } from 'react';
import {
  ScrollText, Filter, ChevronLeft, ChevronRight,
  FileText, Send, PenTool, UserPlus, Trash2, XCircle,
  Upload, Eye, RefreshCw, Loader2, AlertCircle,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { auditService, type AuditLog } from '../services/auditService';
import { teamService, type TeamMember } from '../services/teamService';

const ACTION_LABELS: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  ENVELOPE_CREATED: { label: 'Enveloppe creee', icon: FileText, color: 'text-primary bg-primary-light' },
  ENVELOPE_SENT: { label: 'Enveloppe envoyee', icon: Send, color: 'text-accent bg-accent-light' },
  ENVELOPE_COMPLETED: { label: 'Enveloppe terminee', icon: FileText, color: 'text-success bg-success-light' },
  ENVELOPE_CANCELLED: { label: 'Enveloppe annulee', icon: XCircle, color: 'text-danger bg-danger-light' },
  SIGNATURE_SIGNED: { label: 'Document signe', icon: PenTool, color: 'text-success bg-success-light' },
  SIGNATURE_REJECTED: { label: 'Signature refusee', icon: XCircle, color: 'text-danger bg-danger-light' },
  DOCUMENT_UPLOADED: { label: 'Document uploade', icon: Upload, color: 'text-primary bg-primary-light' },
  DOCUMENT_DOWNLOADED: { label: 'Document telecharge', icon: Eye, color: 'text-txt-secondary bg-bg' },
  DOCUMENT_DELETED: { label: 'Document supprime', icon: Trash2, color: 'text-danger bg-danger-light' },
  USER_INVITED: { label: 'Membre invite', icon: UserPlus, color: 'text-accent bg-accent-light' },
  USER_ROLE_CHANGED: { label: 'Role modifie', icon: UserPlus, color: 'text-warning bg-warning-light' },
  LOGIN: { label: 'Connexion', icon: Eye, color: 'text-txt-secondary bg-bg' },
};

function getActionInfo(action: string) {
  return ACTION_LABELS[action] ?? { label: action, icon: FileText, color: 'text-txt-secondary bg-bg' };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "A l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days}j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Activity() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterDays, setFilterDays] = useState(30);
  const [actions, setActions] = useState<string[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);

  const size = 20;

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditService.list({
        page,
        size,
        userId: filterUser || undefined,
        action: filterAction || undefined,
        days: filterDays,
      });
      setLogs(data.items);
      setTotal(data.total);
    } catch {
      setError('Impossible de charger le journal.');
    } finally {
      setLoading(false);
    }
  }, [page, filterUser, filterAction, filterDays]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    auditService.getActions().then(setActions).catch(() => {});
    teamService.getAll().then(setMembers).catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / size);

  const getUserName = (userId: string) => {
    const m = members.find((mb) => mb.userId === userId);
    if (m) return `${m.firstName} ${m.lastName}`;
    return userId ? userId.slice(0, 8) + '...' : 'Systeme';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-txt">Journal d'activite</h1>
          <span className="bg-primary-light text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {total} evenements
          </span>
        </div>
        <Button variant="outline" icon={RefreshCw} onClick={() => fetch()}>Actualiser</Button>
      </div>

      {/* Filters */}
      <Card padding="md" className="mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-txt-secondary" />
            <span className="text-xs font-semibold text-txt-secondary uppercase">Filtres</span>
          </div>

          <select
            value={filterUser}
            onChange={(e) => { setFilterUser(e.target.value); setPage(0); }}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-xs text-txt cursor-pointer focus:outline-none focus:border-primary"
          >
            <option value="">Tous les membres</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>{m.firstName} {m.lastName}</option>
            ))}
          </select>

          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(0); }}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-xs text-txt cursor-pointer focus:outline-none focus:border-primary"
          >
            <option value="">Toutes les actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>{getActionInfo(a).label}</option>
            ))}
          </select>

          <select
            value={filterDays}
            onChange={(e) => { setFilterDays(Number(e.target.value)); setPage(0); }}
            className="bg-bg border border-border rounded-lg px-3 py-2 text-xs text-txt cursor-pointer focus:outline-none focus:border-primary"
          >
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
            <option value={90}>90 derniers jours</option>
            <option value={365}>12 derniers mois</option>
          </select>
        </div>
      </Card>

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
          <Button variant="outline" size="sm" onClick={fetch}>Reessayer</Button>
        </div>
      )}

      {/* Logs */}
      {!loading && !error && (
        <>
          <Card padding="sm">
            {logs.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <ScrollText size={40} className="text-border mx-auto mb-3" />
                <p className="text-sm text-txt-muted">Aucune activite pour cette periode</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {logs.map((log) => {
                  const info = getActionInfo(log.action);
                  const Icon = info.icon;
                  return (
                    <div key={log.id} className="flex items-center gap-4 px-4 py-3 hover:bg-bg/50 transition-colors">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${info.color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-txt">{info.label}</span>
                          {log.entityType && (
                            <span className="text-[10px] bg-bg border border-border rounded px-1.5 py-0.5 text-txt-muted uppercase">
                              {log.entityType}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-txt-secondary">{getUserName(log.userId)}</span>
                          {log.details && (
                            <>
                              <span className="text-xs text-border">-</span>
                              <span className="text-xs text-txt-muted truncate">{log.details}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-txt-muted">{timeAgo(log.createdAt)}</span>
                        {log.ipAddress && (
                          <p className="text-[10px] text-txt-muted mt-0.5">{log.ipAddress}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <span className="text-xs text-txt-muted">
                Page {page + 1} sur {totalPages} ({total} resultats)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 rounded-lg border border-border hover:bg-bg disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 rounded-lg border border-border hover:bg-bg disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
