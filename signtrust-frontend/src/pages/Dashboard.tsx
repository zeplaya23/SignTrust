import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
  PenTool,
  Copy,
  FolderOpen,
  Users,
  Inbox,
  Activity,
  Send,
  XCircle,
  Eye,
  Trash2,
  Edit3,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { dashboardService, type QuotaInfo } from '../services/dashboardService';
import { auditService, type AuditLog } from '../services/auditService';
import type { Envelope, EnvelopeStatus } from '../types/envelope';

function statusToBadge(status: EnvelopeStatus): 'pending' | 'signed' | 'rejected' | 'draft' {
  switch (status) {
    case 'SENT': return 'pending';
    case 'COMPLETED': return 'signed';
    case 'CANCELLED': return 'rejected';
    case 'DRAFT': return 'draft';
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

interface Stats {
  totalEnvelopes: number;
  pending: number;
  signed: number;
  completionRate: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ totalEnvelopes: 0, pending: 0, signed: 0, completionRate: 0 });
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [recent, setRecent] = useState<Envelope[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r, a] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecent(),
          auditService.list({ page: 0, size: 8 }).catch(() => ({ items: [] })),
        ]);
        setStats(s);
        setQuota(s.quota ?? null);
        setRecent(r);
        setAuditLogs(a.items ?? []);
      } catch {
        // API error — keep defaults (zeros)
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const metrics = [
    { label: 'Total enveloppes', value: stats.totalEnvelopes, color: 'border-primary', icon: FileText, iconColor: 'text-primary' },
    { label: 'En attente', value: stats.pending, color: 'border-warning', icon: Clock, iconColor: 'text-warning' },
    { label: 'Signees', value: stats.signed, color: 'border-success', icon: CheckCircle2, iconColor: 'text-success' },
    { label: 'Taux completion', value: `${stats.completionRate}%`, color: 'border-accent', icon: TrendingUp, iconColor: 'text-accent' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-dark">Tableau de bord</h1>
      </div>

      {/* Quota warning */}
      {quota && !quota.canCreate && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3">
          <AlertCircle size={18} className="text-warning shrink-0" />
          <p className="text-sm text-txt">
            {quota.message || `Vous avez atteint la limite de ${quota.envelopesMax} enveloppes de votre plan "${quota.plan}".`}
            {' '}
            <button onClick={() => navigate('/settings')} className="text-primary font-semibold hover:underline">
              Mettre à niveau
            </button>
          </p>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {metrics.map((m) => (
          <Card key={m.label} padding="md" className={`border-l-4 ${m.color}`}>
            <p className="uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1">
              {m.label}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[28px] font-bold text-dark">{m.value}</span>
              <m.icon size={24} className={m.iconColor} />
            </div>
          </Card>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Recent envelopes */}
        <div className="col-span-2">
          <Card padding="sm">
            <div className="flex items-center justify-between px-4 pt-3 pb-4">
              <h2 className="text-base font-semibold text-dark">Enveloppes recentes</h2>
              <button
                onClick={() => navigate('/envelopes')}
                className="text-sm text-primary font-medium hover:underline"
              >
                Tout voir
              </button>
            </div>

            {loading ? (
              <div className="px-4 pb-6 text-sm text-txt-muted">Chargement...</div>
            ) : recent.length === 0 ? (
              <div className="px-4 pb-8 text-center">
                <Inbox size={40} className="text-border mx-auto mb-3" />
                <p className="text-sm text-txt-muted mb-1">Aucune enveloppe</p>
                <p className="text-xs text-txt-muted mb-4">Creez votre premiere enveloppe pour commencer</p>
                {quota?.canCreate !== false && (
                  <button
                    onClick={() => navigate('/envelopes/new')}
                    className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                  >
                    <PlusCircle size={16} /> Nouvelle enveloppe
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-border text-txt-secondary text-left">
                    <th className="px-4 py-3 font-medium">Enveloppe</th>
                    <th className="px-4 py-3 font-medium">Docs</th>
                    <th className="px-4 py-3 font-medium">Signataires</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((env) => (
                    <tr
                      key={env.id}
                      className="border-t border-border hover:bg-bg/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/envelopes/${env.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-txt flex items-center gap-2">
                        <FolderOpen size={16} className="text-txt-muted shrink-0" />
                        {env.name}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Quick actions */}
          <Card padding="md">
            <h3 className="text-base font-semibold text-dark mb-4">Actions rapides</h3>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => quota?.canCreate !== false ? navigate('/envelopes/new') : navigate('/settings')}
                disabled={quota?.canCreate === false}
                className={`flex items-center gap-3 p-3 rounded-xl border border-border transition-colors text-left ${
                  quota?.canCreate === false ? 'opacity-50 cursor-not-allowed' : 'hover:bg-bg'
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center">
                  <PlusCircle size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-txt">Nouvelle enveloppe</p>
                  <p className="text-xs text-txt-muted">
                    {quota?.canCreate === false ? 'Quota atteint' : 'Creer et envoyer'}
                  </p>
                </div>
              </button>
              <button
                onClick={() => navigate('/envelopes')}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-bg transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center">
                  <PenTool size={18} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-txt">Signer</p>
                  <p className="text-xs text-txt-muted">Documents en attente</p>
                </div>
              </button>
              <button
                onClick={() => navigate('/templates')}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-bg transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-success-light flex items-center justify-center">
                  <Copy size={18} className="text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-txt">Modele</p>
                  <p className="text-xs text-txt-muted">Utiliser un template</p>
                </div>
              </button>
            </div>
          </Card>

          {/* Activity log */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-dark flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                Journal d'activité
              </h3>
            </div>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-txt-muted text-center py-4">Aucune activité récente</p>
            ) : (
              <div className="space-y-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-bg/50 transition-colors">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${actionStyle(log.action).bg}`}>
                      {actionStyle(log.action).icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-txt leading-tight">
                        <span className="font-medium">{actionLabel(log.action)}</span>
                        {log.entityType && (
                          <span className="text-txt-muted"> · {log.entityType}</span>
                        )}
                      </p>
                      <p className="text-xs text-txt-muted truncate">{log.details}</p>
                      <p className="text-[10px] text-txt-muted mt-0.5">{formatDate(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    ENVELOPE_CREATED: 'Enveloppe créée',
    ENVELOPE_SENT: 'Enveloppe envoyée',
    ENVELOPE_COMPLETED: 'Enveloppe complétée',
    ENVELOPE_CANCELLED: 'Enveloppe annulée',
    DOCUMENT_SIGNED: 'Document signé',
    DOCUMENT_REJECTED: 'Document refusé',
    SIGNATORY_ADDED: 'Signataire ajouté',
    SIGNATURE_REQUESTED: 'Signature demandée',
    ENVELOPE_VIEWED: 'Enveloppe consultée',
    ENVELOPE_DELETED: 'Enveloppe supprimée',
    ENVELOPE_UPDATED: 'Enveloppe modifiée',
  };
  return labels[action] || action.replace(/_/g, ' ').toLowerCase();
}

function actionStyle(action: string): { bg: string; icon: React.ReactNode } {
  if (action.includes('SIGN')) return { bg: 'bg-success-light', icon: <PenTool size={14} className="text-success" /> };
  if (action.includes('SENT') || action.includes('REQUESTED')) return { bg: 'bg-primary-light', icon: <Send size={14} className="text-primary" /> };
  if (action.includes('COMPLETED')) return { bg: 'bg-success-light', icon: <CheckCircle2 size={14} className="text-success" /> };
  if (action.includes('CANCEL') || action.includes('REJECT')) return { bg: 'bg-danger-light', icon: <XCircle size={14} className="text-danger" /> };
  if (action.includes('CREATED')) return { bg: 'bg-accent-light', icon: <PlusCircle size={14} className="text-accent" /> };
  if (action.includes('VIEW')) return { bg: 'bg-primary-light', icon: <Eye size={14} className="text-primary" /> };
  if (action.includes('DELETE')) return { bg: 'bg-danger-light', icon: <Trash2 size={14} className="text-danger" /> };
  if (action.includes('UPDATE')) return { bg: 'bg-warning-light', icon: <Edit3 size={14} className="text-warning" /> };
  if (action.includes('SIGNATORY')) return { bg: 'bg-accent-light', icon: <UserPlus size={14} className="text-accent" /> };
  return { bg: 'bg-bg', icon: <Activity size={14} className="text-txt-muted" /> };
}
