import { useState, useEffect } from 'react';
import {
  BarChart3, FileText, PenTool, Clock, CheckCircle2,
  Users, XCircle,
  Loader2, AlertCircle, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import Card from '../components/ui/Card';
import { analyticsService, type AnalyticsOverview, type UserStats, type Trends } from '../services/analyticsService';

function GrowthBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const positive = value > 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${positive ? 'text-success' : 'text-danger'}`}>
      <Icon size={12} />
      {positive ? '+' : ''}{value}%
    </span>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full h-2 bg-border rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Jamais';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days}j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function Analytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trendDays, setTrendDays] = useState(30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [o, u, t] = await Promise.all([
          analyticsService.getOverview(),
          analyticsService.getUserStats(),
          analyticsService.getTrends(trendDays),
        ]);
        setOverview(o);
        setUsers(u);
        setTrends(t);
      } catch {
        setError('Impossible de charger les statistiques.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [trendDays]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle size={32} className="text-danger" />
        <p className="text-sm text-txt-secondary">{error}</p>
      </div>
    );
  }

  const metrics = [
    { label: 'Enveloppes totales', value: overview.totalEnvelopes, sub: `${overview.envelopesThisMonth} ce mois`, growth: overview.envelopesGrowth, icon: FileText, color: 'border-primary', iconColor: 'text-primary' },
    { label: 'Signatures', value: overview.totalSignatures, sub: `${overview.signaturesThisMonth} ce mois`, growth: overview.signaturesGrowth, icon: PenTool, color: 'border-accent', iconColor: 'text-accent' },
    { label: 'En attente', value: overview.pending, sub: `${overview.rejected} refusees`, growth: 0, icon: Clock, color: 'border-warning', iconColor: 'text-warning' },
    { label: 'Taux de completion', value: `${overview.completionRate}%`, sub: `${overview.completed} terminees`, growth: 0, icon: CheckCircle2, color: 'border-success', iconColor: 'text-success' },
  ];

  // Simple text-based trend visualization
  const maxEnvCount = trends ? Math.max(...trends.envelopes.map((t) => t.count), 1) : 1;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-txt">Statistiques</h1>
          <span className="bg-primary-light text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {overview.teamSize} membres
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {metrics.map((m) => (
          <Card key={m.label} padding="md" className={`border-l-4 ${m.color}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="uppercase text-[10px] font-semibold text-txt-secondary tracking-wider">{m.label}</p>
              <m.icon size={18} className={m.iconColor} />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-[28px] font-bold text-dark">{m.value}</span>
              <GrowthBadge value={m.growth} />
            </div>
            <p className="text-xs text-txt-muted mt-1">{m.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Trends */}
        <div className="col-span-2">
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-primary" />
                <h2 className="text-base font-semibold text-txt">Tendances</h2>
              </div>
              <select
                value={trendDays}
                onChange={(e) => setTrendDays(Number(e.target.value))}
                className="bg-bg border border-border rounded-lg px-3 py-1.5 text-xs text-txt cursor-pointer focus:outline-none focus:border-primary"
              >
                <option value={7}>7 jours</option>
                <option value={30}>30 jours</option>
                <option value={90}>90 jours</option>
              </select>
            </div>

            {trends && trends.envelopes.length > 0 ? (
              <div className="space-y-1.5">
                {trends.envelopes.slice(-14).map((point) => (
                  <div key={point.date} className="flex items-center gap-3">
                    <span className="text-[10px] text-txt-muted w-16 shrink-0 text-right font-mono">
                      {new Date(point.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                    <div className="flex-1 h-5 bg-bg rounded overflow-hidden flex items-center">
                      <div
                        className="h-full bg-primary/20 rounded flex items-center px-2 transition-all"
                        style={{ width: `${Math.max(2, (point.count / maxEnvCount) * 100)}%` }}
                      >
                        {point.count > 0 && (
                          <span className="text-[10px] font-bold text-primary">{point.count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-primary/20" />
                    <span className="text-[10px] text-txt-muted">Enveloppes creees</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 size={32} className="text-border mx-auto mb-2" />
                <p className="text-sm text-txt-muted">Pas de donnees pour cette periode</p>
              </div>
            )}
          </Card>
        </div>

        {/* Status breakdown */}
        <Card padding="md">
          <h2 className="text-base font-semibold text-txt mb-4">Repartition des statuts</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-txt-secondary flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-success" /> Terminees
                </span>
                <span className="text-xs font-semibold text-txt">{overview.completed}</span>
              </div>
              <MiniBar value={overview.completed} max={overview.totalEnvelopes} color="bg-success" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-txt-secondary flex items-center gap-1.5">
                  <Clock size={12} className="text-warning" /> En attente
                </span>
                <span className="text-xs font-semibold text-txt">{overview.pending}</span>
              </div>
              <MiniBar value={overview.pending} max={overview.totalEnvelopes} color="bg-warning" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-txt-secondary flex items-center gap-1.5">
                  <XCircle size={12} className="text-danger" /> Refusees
                </span>
                <span className="text-xs font-semibold text-txt">{overview.rejected}</span>
              </div>
              <MiniBar value={overview.rejected} max={overview.totalEnvelopes} color="bg-danger" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-txt-secondary">Taux de completion</span>
              <span className="text-lg font-bold text-success">{overview.completionRate}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Per-user stats */}
      <Card padding="sm">
        <div className="flex items-center gap-2 px-4 pt-3 pb-4">
          <Users size={18} className="text-primary" />
          <h2 className="text-base font-semibold text-txt">Performance par membre</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-border text-txt-secondary text-left">
              <th className="px-4 py-3 font-medium">Membre</th>
              <th className="px-4 py-3 font-medium text-center">Enveloppes creees</th>
              <th className="px-4 py-3 font-medium text-center">Signatures</th>
              <th className="px-4 py-3 font-medium text-right">Derniere activite</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => {
              const name = (u.firstName || u.lastName) ? `${u.firstName} ${u.lastName}`.trim() : u.email;
              const initials = (u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '');
              const colors = ['bg-primary', 'bg-accent', 'bg-success', 'bg-[#6C5CE7]', 'bg-danger'];
              const maxEnv = Math.max(...users.map((x) => x.envelopesCreated), 1);
              const maxSig = Math.max(...users.map((x) => x.signaturesDone), 1);

              return (
                <tr key={u.userId || i} className="border-t border-border hover:bg-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${colors[i % colors.length]} flex items-center justify-center text-white text-[10px] font-bold`}>
                        {initials || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-txt">{name}</p>
                        <p className="text-[11px] text-txt-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-txt w-8 text-right">{u.envelopesCreated}</span>
                      <div className="flex-1">
                        <MiniBar value={u.envelopesCreated} max={maxEnv} color="bg-primary" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-txt w-8 text-right">{u.signaturesDone}</span>
                      <div className="flex-1">
                        <MiniBar value={u.signaturesDone} max={maxSig} color="bg-accent" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-txt-muted">{timeAgo(u.lastActivity)}</span>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-txt-muted">
                  Aucun membre trouve.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
