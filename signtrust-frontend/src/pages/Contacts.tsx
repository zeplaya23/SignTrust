import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Send, X, Loader2, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { contactService, type Contact } from '../services/contactService';

const AVATAR_COLORS = ['bg-primary', 'bg-accent', 'bg-success', 'bg-[#6C5CE7]', 'bg-danger', 'bg-warning', 'bg-primary', 'bg-accent'];

function getInitials(name: string): string {
  const parts = name.split(' ');
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.substring(0, 2);
}

export default function Contacts() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '' });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await contactService.getAll();
      setContacts(data);
    } catch {
      setError('Impossible de charger les contacts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleAdd = async () => {
    try {
      await contactService.create(addForm);
      setShowAddModal(false);
      setAddForm({ name: '', email: '', phone: '' });
      fetchContacts();
    } catch {
      // Keep modal open on error
    }
  };

  return (
    <div className="min-h-screen bg-bg p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-txt">Contacts</h1>
          <span className="bg-primary-light text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {contacts.length}
          </span>
        </div>
        <Button variant="primary" icon={UserPlus} onClick={() => setShowAddModal(true)}>Ajouter</Button>
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
          <Button variant="outline" size="sm" onClick={fetchContacts}>Réessayer</Button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <Card padding="sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Nom</th>
                  <th className="text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Email</th>
                  <th className="text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Téléphone</th>
                  <th className="text-left text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Enveloppes</th>
                  <th className="text-right text-xs font-semibold text-txt-secondary uppercase tracking-wider px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact, i) => (
                  <tr key={contact.id} className="border-b border-border last:border-b-0 hover:bg-bg/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-bold`}>
                          {getInitials(contact.name)}
                        </div>
                        <span className="text-sm font-semibold text-txt">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-txt-secondary">{contact.email}</td>
                    <td className="px-4 py-3 text-sm text-txt-secondary">{contact.phone}</td>
                    <td className="px-4 py-3 text-sm text-txt">{contact.envelopeCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" icon={Send}>Envoyer</Button>
                    </td>
                  </tr>
                ))}
                {contacts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-txt-muted">
                      Aucun contact trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-txt">Ajouter un contact</h2>
              <button onClick={() => setShowAddModal(false)} className="text-txt-muted hover:text-txt cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Nom complet</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt placeholder:text-txt-muted rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Nom et prénom"
                />
              </div>
              <div>
                <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt placeholder:text-txt-muted rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="email@exemple.ci"
                />
              </div>
              <div>
                <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt placeholder:text-txt-muted rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="+225 07 00 00 00 00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Annuler</Button>
              <Button variant="primary" icon={UserPlus} onClick={handleAdd}>Ajouter</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
