import { useState } from 'react';
import { UserPlus, Key, Users, Mail, Shield, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Hier';
  if (diffD < 7) return `Il y a ${diffD} jours`;
  return date.toLocaleDateString('fr-FR');
}

const AVATAR_COLORS = ['bg-primary', 'bg-accent', 'bg-success', 'bg-[#6C5CE7]', 'bg-danger'];

interface MockMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  envelopeCount: number;
  lastActive: string;
}

const mockMembers: MockMember[] = [
  { id: '1', email: 'kouadio.yao@signtrust.ci', firstName: 'Kouadio', lastName: 'Yao', role: 'Admin', envelopeCount: 45, lastActive: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', email: 'aminata.diallo@signtrust.ci', firstName: 'Aminata', lastName: 'Diallo', role: 'Manager', envelopeCount: 32, lastActive: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', email: 'jean.konan@signtrust.ci', firstName: 'Jean', lastName: 'Konan', role: 'Membre', envelopeCount: 18, lastActive: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', email: 'fatou.coulibaly@signtrust.ci', firstName: 'Fatou', lastName: 'Coulibaly', role: 'Membre', envelopeCount: 12, lastActive: new Date(Date.now() - 172800000).toISOString() },
  { id: '5', email: 'marc.bamba@signtrust.ci', firstName: 'Marc', lastName: 'Bamba', role: 'Manager', envelopeCount: 27, lastActive: new Date(Date.now() - 3600000 * 5).toISOString() },
];

const roleBadgeStyles: Record<string, string> = {
  Admin: 'bg-primary-light text-primary',
  Manager: 'bg-accent-light text-accent',
  Membre: 'bg-bg text-txt-secondary',
};

export default function Team() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', role: 'Membre' });

  const totalEnvelopes = mockMembers.reduce((s, m) => s + m.envelopeCount, 0);
  const quota = 200;
  const quotaPercent = Math.round((totalEnvelopes / quota) * 100);

  const handleInvite = () => {
    setShowInviteModal(false);
    setInviteForm({ firstName: '', lastName: '', email: '', role: 'Membre' });
  };

  return (
    <div className="min-h-screen bg-bg p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-txt">Gestion équipe</h1>
          <span className="bg-primary-light text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {mockMembers.length} membres
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={Key}>Clés API</Button>
          <Button variant="primary" icon={UserPlus} onClick={() => setShowInviteModal(true)}>Inviter</Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card padding="md">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
              <Users size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-txt-secondary">Membres actifs</p>
              <p className="text-2xl font-bold text-primary">{mockMembers.length}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
              <Mail size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-txt-secondary">Enveloppes ce mois</p>
              <p className="text-2xl font-bold text-accent">{totalEnvelopes}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-success-light flex items-center justify-center">
              <Shield size={20} className="text-success" />
            </div>
            <div>
              <p className="text-xs text-txt-secondary">Quota utilisé</p>
              <p className="text-2xl font-bold text-success">{quotaPercent}%</p>
            </div>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div className="bg-success h-2 rounded-full transition-all" style={{ width: `${quotaPercent}%` }} />
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Membre</th>
                <th className="text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Rôle</th>
                <th className="text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Enveloppes</th>
                <th className="text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Dernière activité</th>
                <th className="text-right text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockMembers.map((member, i) => (
                <tr key={member.id} className="border-b border-border last:border-b-0 hover:bg-bg/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold`}>
                        {member.firstName[0]}{member.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-txt">{member.firstName} {member.lastName}</p>
                        <p className="text-xs text-txt-muted">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeStyles[member.role] || 'bg-bg text-txt-secondary'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-txt">{member.envelopeCount}</td>
                  <td className="px-4 py-3 text-sm text-txt-secondary">{relativeTime(member.lastActive)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="outline" size="sm">Modifier</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-txt">Inviter un membre</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-txt-muted hover:text-txt cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                  className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt placeholder:text-txt-muted rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Prénom"
                />
              </div>
              <div>
                <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Nom</label>
                <input
                  type="text"
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                  className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt placeholder:text-txt-muted rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Nom"
                />
              </div>
              <div>
                <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt placeholder:text-txt-muted rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="email@exemple.ci"
                />
              </div>
              <div>
                <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Rôle</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="Membre">Membre</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>Annuler</Button>
              <Button variant="primary" icon={UserPlus} onClick={handleInvite}>Inviter</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
