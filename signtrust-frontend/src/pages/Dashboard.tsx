import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  PlusCircle,
  PenTool,
  Copy,
  FolderOpen,
  Users,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useAuthStore } from '../stores/useAuthStore';
import type { Envelope, EnvelopeStatus } from '../types/envelope';

// Mock data
const mockStats = {
  totalEnvelopes: 24,
  pending: 8,
  signed: 14,
  completionRate: 58,
};

const mockRecent: Envelope[] = [
  { id: 1, name: 'Contrat de bail 2024', status: 'SENT', documentsCount: 2, signatoriesCount: 3, createdAt: '2026-04-12T10:00:00Z', expiresAt: '2026-04-20T10:00:00Z' },
  { id: 2, name: 'NDA - Projet Alpha', status: 'COMPLETED', documentsCount: 1, signatoriesCount: 2, createdAt: '2026-04-11T14:30:00Z', expiresAt: '2026-04-25T14:30:00Z' },
  { id: 3, name: 'Avenant contrat CDI', status: 'DRAFT', documentsCount: 3, signatoriesCount: 1, createdAt: '2026-04-10T09:00:00Z', expiresAt: '2026-04-30T09:00:00Z' },
  { id: 4, name: 'Convention de stage', status: 'SENT', documentsCount: 1, signatoriesCount: 4, createdAt: '2026-04-09T16:00:00Z', expiresAt: '2026-04-18T16:00:00Z' },
  { id: 5, name: 'Procuration notariale', status: 'CANCELLED', documentsCount: 2, signatoriesCount: 2, createdAt: '2026-04-08T11:00:00Z', expiresAt: '2026-04-22T11:00:00Z' },
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

export default function Dashboard() {
  const navigate = useNavigate();
  const subscriptionStatus = useAuthStore((s) => s.subscriptionStatus);
  const [stats] = useState(mockStats);
  const [recent] = useState(mockRecent);

  const metrics = [
    { label: 'Total enveloppes', value: stats.totalEnvelopes, color: 'border-primary', icon: FileText, iconColor: 'text-primary' },
    { label: 'En attente', value: stats.pending, color: 'border-warning', icon: Clock, iconColor: 'text-warning' },
    { label: 'Signées', value: stats.signed, color: 'border-success', icon: CheckCircle2, iconColor: 'text-success' },
    { label: 'Taux completion', value: `${stats.completionRate}%`, color: 'border-accent', icon: TrendingUp, iconColor: 'text-accent' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-dark">Tableau de bord</h1>
        <button className="relative p-2 rounded-xl hover:bg-white transition-colors">
          <Bell size={20} className="text-txt-secondary" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>
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
              <h2 className="text-base font-semibold text-dark">Enveloppes récentes</h2>
              <button
                onClick={() => navigate('/envelopes')}
                className="text-sm text-primary font-medium hover:underline"
              >
                Tout voir
              </button>
            </div>
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
                  </tr>
                ))}
              </tbody>
            </table>
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
                  <p className="text-xs text-txt-muted">Créer et envoyer</p>
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
                  <p className="text-sm font-medium text-txt">Modèle</p>
                  <p className="text-xs text-txt-muted">Utiliser un template</p>
                </div>
              </button>
            </div>
          </Card>

          {/* Subscription card */}
          <Card padding="md" className="bg-accent-light border-accent/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-dark">Abonnement</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-white px-2 py-0.5 rounded-full">
                {subscriptionStatus === 'ACTIVE' ? 'Pro' : subscriptionStatus === 'TRIAL' ? 'Essai' : 'Gratuit'}
              </span>
            </div>
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-txt-secondary mb-1">
                <span>Enveloppes utilisées</span>
                <span className="font-semibold text-txt">24 / 50</span>
              </div>
              <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: '48%' }} />
              </div>
            </div>
            <p className="text-xs text-txt-secondary mb-3">
              Renouvellement : <span className="font-medium text-txt">15 mai 2026</span>
            </p>
            <Button
              variant="accent"
              size="sm"
              className="w-full"
              onClick={() => navigate('/renewal')}
            >
              Gérer
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
