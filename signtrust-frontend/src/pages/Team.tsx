import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Key, Users, Mail, Shield, X, Loader2, AlertCircle, Copy, Check, Trash2, Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useSubscription } from '../hooks/useSubscription';
import { teamService, type TeamMember } from '../services/teamService';
import { apiKeyService, type ApiKey, type ApiKeyCreated } from '../services/apiKeyService';

const AVATAR_COLORS = ['bg-primary', 'bg-accent', 'bg-success', 'bg-[#6C5CE7]', 'bg-danger'];

const roleBadgeStyles: Record<string, string> = {
  Admin: 'bg-primary-light text-primary',
  Manager: 'bg-accent-light text-accent',
  Membre: 'bg-bg text-txt-secondary',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Team() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', role: 'Membre' });
  const { info: subInfo } = useSubscription();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

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

  const fetchApiKeys = useCallback(async () => {
    setApiKeysLoading(true);
    try {
      const data = await apiKeyService.getAll();
      setApiKeys(data);
    } catch { /* ignore */ }
    setApiKeysLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchApiKeys();
  }, [fetchMembers, fetchApiKeys]);

  const handleOpenApiKeys = () => {
    setShowApiKeysModal(true);
    setCreatedKey(null);
    setNewKeyLabel('');
    fetchApiKeys();
  };

  const handleCreateKey = async () => {
    if (!newKeyLabel.trim()) return;
    setCreating(true);
    try {
      const created = await apiKeyService.create(newKeyLabel.trim());
      setCreatedKey(created);
      setNewKeyLabel('');
      fetchApiKeys();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleRevokeKey = async (id: number) => {
    try {
      await apiKeyService.revoke(id);
      fetchApiKeys();
    } catch { /* ignore */ }
  };

  const handleToggleKey = async (id: number) => {
    try {
      await apiKeyService.toggle(id);
      fetchApiKeys();
    } catch { /* ignore */ }
  };

  const handleCopyKey = () => {
    if (!createdKey) return;
    const text = createdKey.fullKey;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
        <Button variant="primary" icon={UserPlus} onClick={() => setShowInviteModal(true)}>Inviter</Button>
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
              <p className="text-xs text-txt-secondary">Clés API actives</p>
              <p className="text-2xl font-bold text-accent">{apiKeys.filter(k => k.active).length}</p>
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

      {/* API Keys Section */}
      {!loading && !error && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-txt">Clés API</h2>
              <span className="bg-accent-light text-accent text-xs font-semibold px-2 py-0.5 rounded-full">
                {apiKeys.filter(k => k.active).length} active{apiKeys.filter(k => k.active).length > 1 ? 's' : ''}
              </span>
            </div>
            <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenApiKeys}>Nouvelle clé</Button>
          </div>

          {/* Created key alert */}
          {createdKey && (
            <div className="bg-accent-light border border-accent/20 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-accent mb-2">Clé créée — copiez-la maintenant, elle ne sera plus affichée.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white rounded-lg px-3 py-2 text-xs font-mono text-txt break-all border border-border">
                  {createdKey.fullKey}
                </code>
                <button
                  onClick={handleCopyKey}
                  className="shrink-0 p-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors cursor-pointer"
                  title="Copier"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}

          <Card padding="sm">
            {apiKeysLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key size={32} className="mx-auto text-txt-muted mb-2" />
                <p className="text-sm text-txt-muted">Aucune clé API créée.</p>
                <p className="text-xs text-txt-muted mt-1">Les clés API permettent d'intégrer DigiSign Parapheur dans vos applications.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Nom</th>
                      <th className="text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Préfixe</th>
                      <th className="text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Appels</th>
                      <th className="text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Créée le</th>
                      <th className="text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Statut</th>
                      <th className="text-right text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((key) => (
                      <tr key={key.id} className={`border-b border-border last:border-b-0 hover:bg-bg/50 transition-colors ${key.revokedAt ? 'opacity-40' : !key.enabled ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-txt">{key.label}</p>
                        </td>
                        <td className="px-4 py-3">
                          <code className="text-xs font-mono text-txt-muted bg-bg px-2 py-1 rounded">{key.keyPrefix}••••</code>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-txt">{key.usageCount}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-txt-muted">{formatDate(key.createdAt)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {key.revokedAt ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger-light text-danger">Révoquée</span>
                          ) : key.enabled ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-light text-success">Active</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#D97706]">Désactivée</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!key.revokedAt && (
                            <div className="inline-flex items-center gap-3">
                              <button
                                onClick={() => handleToggleKey(key.id)}
                                className="relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                                style={{ backgroundColor: key.enabled ? '#22c55e' : '#f59e0b' }}
                                title={key.enabled ? 'Désactiver' : 'Activer'}
                              >
                                <span
                                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200"
                                  style={{ transform: key.enabled ? 'translateX(20px)' : 'translateX(0)' }}
                                />
                              </button>
                              <button
                                onClick={() => handleRevokeKey(key.id)}
                                className="p-1.5 rounded-lg text-txt-muted hover:text-danger hover:bg-danger-light transition-colors cursor-pointer"
                                title="Révoquer définitivement"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <p className="text-[11px] text-txt-muted mt-2">
            Chaque appel via clé API est décompté du quota d'enveloppes de votre compte.
          </p>
        </div>
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

      {/* Create API Key Modal */}
      {showApiKeysModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Key size={20} className="text-primary" />
                <h2 className="text-lg font-bold text-txt">Nouvelle clé API</h2>
              </div>
              <button onClick={() => { setShowApiKeysModal(false); setCreatedKey(null); }} className="text-txt-muted hover:text-txt cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {!createdKey ? (
              <div className="space-y-4">
                <div>
                  <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Nom de la clé</label>
                  <input
                    type="text"
                    value={newKeyLabel}
                    onChange={(e) => setNewKeyLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
                    placeholder="Ex: App mobile, ERP, CRM..."
                    className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt placeholder:text-txt-muted rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowApiKeysModal(false)}>Annuler</Button>
                  <Button variant="primary" icon={creating ? Loader2 : Plus} onClick={handleCreateKey} disabled={creating || !newKeyLabel.trim()}>
                    Créer
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-accent-light border border-accent/20 rounded-xl p-4 mb-4">
                  <p className="text-xs font-semibold text-accent mb-2">Clé créée — copiez-la maintenant, elle ne sera plus affichée.</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white rounded-lg px-3 py-2 text-xs font-mono text-txt break-all border border-border">
                      {createdKey.fullKey}
                    </code>
                    <button
                      onClick={handleCopyKey}
                      className="shrink-0 p-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors cursor-pointer"
                      title="Copier"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => { setShowApiKeysModal(false); setCreatedKey(null); }}>Fermer</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
