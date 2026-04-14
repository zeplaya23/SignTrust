import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Check,
  Shield,
  PenTool,
  Type,
  Save,
  Eraser,
} from 'lucide-react';
import clsx from 'clsx';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import type { SignEnvelopeInfo } from '../../types/envelope';

// Mock data
const mockSignInfo: SignEnvelopeInfo = {
  envelopeId: 1,
  envelopeName: 'Contrat de bail 2024',
  senderName: 'Alice Morel',
  documents: [
    { id: 1, name: 'Contrat_bail.pdf', contentType: 'application/pdf', pageCount: 8, orderIndex: 1 },
    { id: 2, name: 'Annexe_etat_lieux.pdf', contentType: 'application/pdf', pageCount: 4, orderIndex: 2 },
  ],
  signatories: [
    { id: 1, email: 'jean.dupont@email.com', firstName: 'Jean', lastName: 'Dupont', role: 'SIGNER', orderIndex: 1, status: 'PENDING' },
  ],
  fields: [
    { id: 1, documentId: 1, signatoryId: 1, type: 'SIGNATURE', pageNumber: 8, x: 100, y: 400, width: 200, height: 80 },
    { id: 2, documentId: 2, signatoryId: 1, type: 'SIGNATURE', pageNumber: 4, x: 100, y: 350, width: 200, height: 80 },
  ],
  currentSignatory: {
    id: 1,
    email: 'jean.dupont@email.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'SIGNER',
    orderIndex: 1,
    status: 'PENDING',
  },
};

type SignTab = 'draw' | 'text' | 'saved';

export default function SignView() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [activeDoc, setActiveDoc] = useState(0);
  const [activeTab, setActiveTab] = useState<SignTab>('draw');
  const [signedDocs, setSignedDocs] = useState<Set<number>>(new Set());
  const info = mockSignInfo;

  const tabs: { key: SignTab; label: string; icon: typeof PenTool }[] = [
    { key: 'draw', label: 'Dessiner', icon: PenTool },
    { key: 'text', label: 'Texte', icon: Type },
    { key: 'saved', label: 'Sauvegardée', icon: Save },
  ];

  const toggleDocSigned = (docId: number) => {
    setSignedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const handleSign = () => {
    navigate('/sign/success');
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-dark">{info.envelopeName}</h1>
            <p className="text-sm text-txt-secondary">
              Envoyé par {info.senderName} - {info.documents.length} document{info.documents.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-success" />
            <span className="text-sm font-medium text-success">Signature sécurisée</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-6" style={{ gridTemplateColumns: '1fr 340px' }}>
          {/* Left: document area */}
          <div>
            {/* Document tabs */}
            <div className="flex gap-2 mb-4">
              {info.documents.map((doc, i) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(i)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                    activeDoc === i
                      ? 'bg-primary text-white'
                      : 'bg-white text-txt-secondary border border-border hover:bg-bg'
                  )}
                >
                  {signedDocs.has(doc.id) && <Check size={14} />}
                  <FileText size={14} />
                  {doc.name}
                </button>
              ))}
            </div>

            {/* Document preview with signature fields */}
            <Card className="min-h-[600px] relative">
              <div className="absolute inset-0 p-6">
                {info.fields
                  .filter((f) => f.documentId === info.documents[activeDoc]?.id)
                  .map((field) => (
                    <div
                      key={field.id}
                      className="absolute border-2 border-dashed border-accent rounded-lg flex items-center justify-center bg-accent-light/50 cursor-pointer hover:bg-accent-light transition-colors"
                      style={{
                        left: field.x,
                        top: field.y,
                        width: field.width,
                        height: field.height,
                      }}
                    >
                      <span className="text-xs font-medium text-accent">
                        Votre signature ici
                      </span>
                    </div>
                  ))}
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText size={48} className="mx-auto text-txt-muted mb-3" />
                    <p className="text-sm text-txt-muted">
                      {info.documents[activeDoc]?.name}
                    </p>
                    <p className="text-xs text-txt-muted mt-1">
                      {info.documents[activeDoc]?.pageCount} pages
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right panel */}
          <div className="space-y-5">
            {/* Signature tabs */}
            <Card padding="md">
              <div className="flex border-b border-border mb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={clsx(
                      'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                      activeTab === tab.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-txt-muted hover:text-txt-secondary'
                    )}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Canvas placeholder */}
              <div className="h-[200px] border-2 border-dashed border-border rounded-xl flex items-center justify-center bg-bg mb-3">
                {activeTab === 'draw' && (
                  <p className="text-sm text-txt-muted">Signez ici</p>
                )}
                {activeTab === 'text' && (
                  <input
                    type="text"
                    placeholder="Tapez votre signature..."
                    className="text-center text-2xl font-serif text-txt bg-transparent focus:outline-none w-full px-4"
                  />
                )}
                {activeTab === 'saved' && (
                  <p className="text-sm text-txt-muted">Aucune signature sauvegardée</p>
                )}
              </div>

              <Button variant="outline" size="sm" icon={Eraser} className="w-full">
                Effacer
              </Button>
            </Card>

            {/* Security info */}
            <Card padding="md">
              <div className="flex items-center gap-3 mb-3">
                <Shield size={20} className="text-success" />
                <div>
                  <p className="text-sm font-semibold text-txt">Signature électronique avancée</p>
                  <p className="text-xs text-txt-muted">Conforme eIDAS / Niveau avancé</p>
                </div>
              </div>
            </Card>

            {/* Document progress */}
            <Card padding="md">
              <h3 className="text-sm font-semibold text-dark mb-3">Documents à signer</h3>
              <div className="space-y-2">
                {info.documents.map((doc) => (
                  <label
                    key={doc.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={signedDocs.has(doc.id)}
                      onChange={() => toggleDocSigned(doc.id)}
                      className="accent-success rounded"
                    />
                    <FileText size={14} className="text-txt-muted" />
                    <span className={clsx('text-sm', signedDocs.has(doc.id) ? 'text-success line-through' : 'text-txt')}>
                      {doc.name}
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button variant="danger" size="md">
            Refuser
          </Button>
          <Button variant="accent" size="md" onClick={handleSign}>
            Signer les {info.documents.length} documents
          </Button>
        </div>
      </div>
    </div>
  );
}
