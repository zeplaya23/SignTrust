import { useState } from 'react';
import { Plus, FolderOpen, X } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

interface MockTemplate {
  id: number;
  name: string;
  description: string;
  documentsCount: number;
  usageCount: number;
  createdAt: string;
}

const ICON_COLORS = [
  { bg: 'bg-primary-light', text: 'text-primary' },
  { bg: 'bg-accent-light', text: 'text-accent' },
  { bg: 'bg-success-light', text: 'text-success' },
  { bg: 'bg-[#6C5CE7]/10', text: 'text-[#6C5CE7]' },
];

const mockTemplates: MockTemplate[] = [
  { id: 1, name: 'Contrat commercial', description: 'Modèle standard pour les contrats commerciaux entre entreprises avec clauses générales.', documentsCount: 3, usageCount: 24, createdAt: '2025-12-01' },
  { id: 2, name: 'NDA - Accord de confidentialité', description: 'Accord de non-divulgation pour protéger les informations sensibles entre partenaires.', documentsCount: 1, usageCount: 18, createdAt: '2025-11-15' },
  { id: 3, name: 'Avenant de contrat', description: "Modification ou ajout de clauses à un contrat existant déjà signé par les parties.", documentsCount: 2, usageCount: 11, createdAt: '2025-10-20' },
  { id: 4, name: 'PV Assemblée Générale', description: "Procès-verbal d'assemblée générale ordinaire ou extraordinaire pour les sociétés.", documentsCount: 4, usageCount: 8, createdAt: '2026-01-10' },
  { id: 5, name: 'Contrat de bail', description: 'Modèle de contrat de location pour les baux commerciaux et résidentiels.', documentsCount: 2, usageCount: 15, createdAt: '2026-02-05' },
  { id: 6, name: 'Bon de commande', description: 'Document standard pour les commandes fournisseurs avec détails des produits et tarifs.', documentsCount: 1, usageCount: 31, createdAt: '2026-03-01' },
];

export default function Templates() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });

  const handleCreate = () => {
    setShowCreateModal(false);
    setCreateForm({ name: '', description: '' });
  };

  return (
    <div className="min-h-screen bg-bg p-6 lg:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-txt">Modèles</h1>
          <span className="bg-primary-light text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {mockTemplates.length}
          </span>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowCreateModal(true)}>Créer un modèle</Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mockTemplates.map((tpl, i) => {
          const color = ICON_COLORS[i % ICON_COLORS.length];
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
                    {tpl.documentsCount} document{tpl.documentsCount > 1 ? 's' : ''}
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
