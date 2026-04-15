import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Key, Users, Mail, Shield, X, Loader2, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useSubscription } from '../hooks/useSubscription';
import { teamService, type TeamMember } from '../services/teamService';

const AVATAR_COLORS = ['bg-primary', 'bg-accent', 'bg-success', 'bg-[#6C5CE7]', 'bg-danger'];

const roleBadgeStyles: Record<string, string> = {
  Admin: 'bg-primary-light text-primary',
  Manager: 'bg-accent-light text-accent',
  Membre: 'bg-bg text-txt-secondary',
};

export default function Team() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', role: 'Membre' });
  const { info: subInfo } = useSubscription();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await teamService.getAll();
      setMembers(data);
    } catch {
      setError('Impossible de charger les membres.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const quota = subInfo.max;
  const quotaPercent = quota > 0 ? Math.round((members.length / quota) * 100) : 0;

  const handleInvite = async () => {
    try {
      await teamService.invite(inviteForm);
      setShowInviteModal(false);
      setInviteForm({ firstName: '', lastName: '', email: '', role: 'Membre' });
      fetchMembers();
    } catch {
      // Keep modal open on error
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-txt">Gestion équipe</h1>
          <span className="bg-primary-light text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {members.length} membres
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
              <p className="text-2xl font-bold text-primary">{members.length}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
              <Mail size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-xs text-txt-secondary">Membres</p>
              <p className="text-2xl font-bold text-accent">{members.length}</p>
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
          <Button variant="outline" size="sm" onClick={fetchMembers}>Réessayer</Button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <Card padding="sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Membre</th>
                  <th className="text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Rôle</th>
                  <th className="text-right text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member, i) => (
                  <tr key={member.userId} className="border-b border-border last:border-b-0 hover:bg-bg/50 transition-colors">
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
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm">Modifier</Button>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-sm text-txt-muted">
                      Aucun membre trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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
