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
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { dashboardService } from '../services/dashboardService';
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
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
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
  const [recent, setRecent] = useState<Envelope[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRecent(),
        ]);
        setStats(s);
        setRecent(r);
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
                <button
                  onClick={() => navigate('/envelopes/new')}
                  className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                >
                  <PlusCircle size={16} /> Nouvelle enveloppe
                </button>
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
                onClick={() => navigate('/envelopes/new')}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-bg transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center">
                  <PlusCircle size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-txt">Nouvelle enveloppe</p>
                  <p className="text-xs text-txt-muted">Creer et envoyer</p>
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
        </div>
      </div>
    </div>
  );
}
