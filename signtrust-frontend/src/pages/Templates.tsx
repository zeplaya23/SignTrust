import { useState, useEffect, useCallback } from 'react';
import { Plus, FolderOpen, X, Loader2, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { templateService, type Template } from '../services/templateService';

const ICON_COLORS = [
  { bg: 'bg-primary-light', text: 'text-primary' },
  { bg: 'bg-accent-light', text: 'text-accent' },
  { bg: 'bg-success-light', text: 'text-success' },
  { bg: 'bg-[#6C5CE7]/10', text: 'text-[#6C5CE7]' },
];

function getDocumentsCount(tpl: Template): number {
  if (!tpl.documentsJson) return 0;
  try {
    const parsed = JSON.parse(tpl.documentsJson);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export default function Templates() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await templateService.getAll();
      setTemplates(data);
    } catch {
      setError('Impossible de charger les modèles.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreate = async () => {
    try {
      await templateService.create(createForm);
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '' });
      fetchTemplates();
    } catch {
      // Keep modal open on error
    }
  };

  return (
    <div className="min-h-screen bg-bg p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-txt">Modèles</h1>
          <span className="bg-primary-light text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {templates.length}
          </span>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowCreateModal(true)}>Créer un modèle</Button>
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
          <Button variant="outline" size="sm" onClick={fetchTemplates}>Réessayer</Button>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.length === 0 && (
            <p className="text-sm text-txt-muted col-span-full text-center py-12">Aucun modèle trouvé.</p>
          )}
          {templates.map((tpl, i) => {
            const color = ICON_COLORS[i % ICON_COLORS.length];
            const docsCount = getDocumentsCount(tpl);
            return (
              <Card key={tpl.id} padding="md" className="flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className={`w-12 h-12 rounded-xl ${color.bg} flex items-center justify-center mb-4`}>
                    <FolderOpen size={24} className={color.text} />
                  </div>
                  <h3 className="text-base font-bold text-txt mb-1">{tpl.name}</h3>
                  <p className="text-sm text-txt-secondary mb-4 line-clamp-2">{tpl.description}</p>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-primary-light text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                      {docsCount} document{docsCount > 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-txt-muted">
                      Utilisé {tpl.usageCount} fois
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">Utiliser</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-txt">Créer un modèle</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-txt-muted hover:text-txt cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Nom du modèle</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt placeholder:text-txt-muted rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Ex: Contrat de prestation"
                />
              </div>
              <div>
                <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt placeholder:text-txt-muted rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Description du modèle..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Annuler</Button>
              <Button variant="primary" icon={Plus} onClick={handleCreate}>Créer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
