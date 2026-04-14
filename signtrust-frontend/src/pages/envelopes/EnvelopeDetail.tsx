import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  XCircle,
  RefreshCw,
  FileText,
} from 'lucide-react';
import clsx from 'clsx';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import type { EnvelopeDetail as EnvelopeDetailType, EnvelopeStatus } from '../../types/envelope';

// Mock data
const mockDetail: EnvelopeDetailType = {
  id: 1,
  name: 'Contrat de bail 2024',
  status: 'SENT',
  documentsCount: 2,
  signatoriesCount: 3,
  createdAt: '2026-04-12T10:00:00Z',
  expiresAt: '2026-04-20T10:00:00Z',
  message: 'Merci de signer ce contrat de bail avant la date limite.',
  signingOrder: 'SEQUENTIAL',
  documents: [
    { id: 1, name: 'Contrat_bail.pdf', contentType: 'application/pdf', pageCount: 8, orderIndex: 1 },
    { id: 2, name: 'Annexe_etat_lieux.pdf', contentType: 'application/pdf', pageCount: 4, orderIndex: 2 },
  ],
  signatories: [
    { id: 1, email: 'jean.dupont@email.com', firstName: 'Jean', lastName: 'Dupont', role: 'SIGNER', orderIndex: 1, status: 'SIGNED', signedAt: '2026-04-13T09:30:00Z' },
    { id: 2, email: 'marie.martin@email.com', firstName: 'Marie', lastName: 'Martin', role: 'SIGNER', orderIndex: 2, status: 'PENDING' },
    { id: 3, email: 'paul.bernard@email.com', firstName: 'Paul', lastName: 'Bernard', role: 'APPROVER', orderIndex: 3, status: 'PENDING' },
  ],
  fields: [],
  auditTrail: [
    { id: 1, action: 'CREATED', userId: 'system', details: 'Enveloppe créée', createdAt: '2026-04-12T10:00:00Z' },
    { id: 2, action: 'SENT', userId: 'system', details: 'Enveloppe envoyée aux signataires', createdAt: '2026-04-12T10:05:00Z' },
    { id: 3, action: 'SIGNED', userId: 'jean.dupont@email.com', details: 'Jean Dupont a signé', createdAt: '2026-04-13T09:30:00Z' },
    { id: 4, action: 'VIEWED', userId: 'marie.martin@email.com', details: 'Marie Martin a consulté l\'enveloppe', createdAt: '2026-04-13T14:00:00Z' },
  ],
};

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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EnvelopeDetail() {
  const { id: _id } = useParams();
  const navigate = useNavigate();
  const [activeDoc, setActiveDoc] = useState(0);
  const envelope = mockDetail; // Would fetch by _id

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/envelopes')}
            className="p-2 rounded-xl hover:bg-white border border-border transition-colors"
          >
            <ArrowLeft size={18} className="text-txt-secondary" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-dark">{envelope.name}</h1>
              <Badge status={statusToBadge(envelope.status)} />
            </div>
            <p className="text-sm text-txt-secondary mt-0.5">
              Créée le {formatDate(envelope.createdAt)} - {envelope.documentsCount} document{envelope.documentsCount > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={Download}>Télécharger ZIP</Button>
          {envelope.status === 'SENT' && (
            <>
              <Button variant="outline" size="sm" icon={XCircle}>Annuler</Button>
              <Button variant="primary" size="sm" icon={RefreshCw}>Relance</Button>
            </>
          )}
        </div>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: document area */}
        <div className="col-span-2">
          {/* Document tabs */}
          <div className="flex gap-2 mb-4">
            {envelope.documents.map((doc, i) => (
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
                <FileText size={14} />
                {doc.name}
              </button>
            ))}
          </div>

          {/* Document preview */}
          <Card className="min-h-[600px] flex items-center justify-center">
            <div className="text-center">
              <FileText size={48} className="mx-auto text-txt-muted mb-3" />
              <p className="text-sm font-medium text-txt">
                {envelope.documents[activeDoc]?.name}
              </p>
              <p className="text-xs text-txt-muted mt-1">
                {envelope.documents[activeDoc]?.pageCount} pages - Aperçu du document
              </p>
            </div>
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-5">
          {/* Documents list */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-dark mb-3">Documents</h3>
            <div className="space-y-2">
              {envelope.documents.map((doc, i) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(i)}
                  className={clsx(
                    'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors',
                    activeDoc === i
                      ? 'bg-primary-light border border-primary/20'
                      : 'hover:bg-bg border border-transparent'
                  )}
                >
                  <FileText size={16} className={activeDoc === i ? 'text-primary' : 'text-txt-muted'} />
                  <div className="min-w-0 flex-1">
                    <p className={clsx('text-sm truncate', activeDoc === i ? 'font-semibold text-primary' : 'text-txt')}>
                      {doc.name}
                    </p>
                    <p className="text-xs text-txt-muted">{doc.pageCount} pages</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Signatories */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-dark mb-3">Signataires</h3>
            <div className="space-y-3">
              {envelope.signatories.map((sig) => (
                <div key={sig.id} className="flex items-start gap-3 p-3 bg-bg rounded-xl">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {sig.firstName.charAt(0)}{sig.lastName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-txt">
                      {sig.firstName} {sig.lastName}
                    </p>
                    <p className="text-xs text-txt-muted truncate">{sig.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge
                        status={
                          sig.status === 'SIGNED'
                            ? 'signed'
                            : sig.status === 'REJECTED'
                              ? 'rejected'
                              : 'pending'
                        }
                      />
                      {sig.signedAt && (
                        <span className="text-[10px] text-txt-muted">
                          {formatDateTime(sig.signedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Audit trail */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-dark mb-3">Historique</h3>
            <div className="relative">
              {envelope.auditTrail.map((entry, i) => {
                const isSuccess = entry.action === 'SIGNED' || entry.action === 'COMPLETED';
                return (
                  <div key={entry.id} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div
                        className={clsx(
                          'w-3 h-3 rounded-full shrink-0 mt-1',
                          isSuccess ? 'bg-success' : 'bg-border'
                        )}
                      />
                      {i < envelope.auditTrail.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-txt">{entry.details}</p>
                      <p className="text-xs text-txt-muted">{formatDateTime(entry.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
