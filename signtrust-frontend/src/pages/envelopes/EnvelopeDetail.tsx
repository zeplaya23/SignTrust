import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  XCircle,
  RefreshCw,
  FileText,
  Loader2,
} from 'lucide-react';
import clsx from 'clsx';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PdfViewer from '../../components/ui/PdfViewer';
import { envelopeService } from '../../services/envelopeService';
import type { EnvelopeDetail as EnvelopeDetailType, EnvelopeStatus } from '../../types/envelope';

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

const ACTION_LABELS: Record<string, string> = {
  ENVELOPE_CREATED: 'Enveloppe créée',
  DOCUMENT_ADDED: 'Document ajouté',
  ENVELOPE_SENT: 'Enveloppe envoyée aux signataires',
  DOCUMENT_SIGNED: 'Document signé',
  DOCUMENT_REJECTED: 'Signature refusée',
  ENVELOPE_COMPLETED: 'Tous les signataires ont signé',
  ENVELOPE_CANCELLED: 'Enveloppe annulée',
  ENVELOPE_DELETED: 'Enveloppe supprimée',
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export default function EnvelopeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeDoc, setActiveDoc] = useState(0);
  const [envelope, setEnvelope] = useState<EnvelopeDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<number | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Fetch envelope detail
  const fetchEnvelope = useCallback(async (envId: string, signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const data = await envelopeService.getById(Number(envId));
      if (!signal.aborted) setEnvelope(data);
    } catch {
      if (!signal.aborted) setError('Impossible de charger l\'enveloppe');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    fetchEnvelope(id, controller.signal);
    return () => controller.abort();
  }, [id, fetchEnvelope]);

  // Fetch PDF blob when active doc changes
  const blobUrlRef = useRef<string | null>(null);
  const fetchPdfBlob = useCallback(async (envId: number, docId: number, signal: AbortSignal) => {
    setPdfLoading(true);
    setPdfBlobUrl(null);
    try {
      const url = await envelopeService.getDocumentBlobUrl(envId, docId);
      if (signal.aborted) { URL.revokeObjectURL(url); return; }
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = url;
      setPdfBlobUrl(url);
    } catch {
      if (!signal.aborted) setPdfBlobUrl(null);
    } finally {
      if (!signal.aborted) setPdfLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!envelope || !envelope.documents[activeDoc]) return;
    const doc = envelope.documents[activeDoc];
    if (doc.contentType !== 'application/pdf') {
      setPdfBlobUrl(null);
      return;
    }
    const controller = new AbortController();
    fetchPdfBlob(envelope.id, doc.id, controller.signal);
    return () => {
      controller.abort();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [envelope, activeDoc, fetchPdfBlob]);

  const handleDownloadDoc = async (docId: number, fileName: string) => {
    if (!envelope) return;
    setDownloadingDocId(docId);
    try {
      await envelopeService.downloadDocument(envelope.id, docId, fileName);
    } catch { /* ignore */ }
    setDownloadingDocId(null);
  };

  const handleDownloadZip = async () => {
    if (!envelope) return;
    setDownloadingZip(true);
    try {
      await envelopeService.downloadAllDocumentsZip(envelope.id, envelope.name);
    } catch { /* ignore */ }
    setDownloadingZip(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !envelope) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-txt-muted">{error || 'Enveloppe introuvable'}</p>
      </div>
    );
  }

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
              Cr&#233;&#233;e le {formatDate(envelope.createdAt)} - {envelope.documents?.length ?? envelope.documentsCount ?? 0} document{(envelope.documents?.length ?? envelope.documentsCount ?? 0) > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={downloadingZip ? Loader2 : Download} onClick={handleDownloadZip} disabled={downloadingZip}>
            {downloadingZip ? 'Téléchargement...' : 'Télécharger ZIP'}
          </Button>
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
          <Card className="min-h-[600px] overflow-hidden relative">
            {/* Download active doc button */}
            {envelope.documents[activeDoc] && (
              <button
                onClick={() => handleDownloadDoc(envelope.documents[activeDoc].id, envelope.documents[activeDoc].name)}
                disabled={downloadingDocId === envelope.documents[activeDoc].id}
                className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur border border-border shadow-sm text-xs font-medium text-txt hover:text-primary hover:border-primary/30 transition-colors disabled:opacity-50"
                title={`Télécharger ${envelope.documents[activeDoc].name}`}
              >
                {downloadingDocId === envelope.documents[activeDoc].id
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Download size={13} />
                }
                Télécharger
              </button>
            )}
            {pdfLoading ? (
              <div className="flex items-center justify-center h-full min-h-[600px]">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : pdfBlobUrl ? (
              <PdfViewer url={pdfBlobUrl} className="min-h-[600px]" />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[600px]">
                <div className="text-center">
                  <FileText size={48} className="mx-auto text-txt-muted mb-3" />
                  <p className="text-sm font-medium text-txt">
                    {envelope.documents[activeDoc]?.name}
                  </p>
                  <p className="text-xs text-txt-muted mt-1">
                    Aper&#231;u non disponible
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-5">
          {/* Documents list */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-dark">Documents</h3>
              {envelope.documents.length > 1 && (
                <button
                  onClick={handleDownloadZip}
                  disabled={downloadingZip}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  {downloadingZip ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  Tout télécharger
                </button>
              )}
            </div>
            <div className="space-y-2">
              {envelope.documents.map((doc, i) => (
                <div
                  key={doc.id}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-xl transition-colors',
                    activeDoc === i
                      ? 'bg-primary-light border border-primary/20'
                      : 'hover:bg-bg border border-transparent'
                  )}
                >
                  <button
                    onClick={() => setActiveDoc(i)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <FileText size={16} className={activeDoc === i ? 'text-primary' : 'text-txt-muted'} />
                    <div className="min-w-0 flex-1">
                      <p className={clsx('text-sm truncate', activeDoc === i ? 'font-semibold text-primary' : 'text-txt')}>
                        {doc.name}
                      </p>
                      <p className="text-xs text-txt-muted">{doc.pageCount} pages</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDownloadDoc(doc.id, doc.name)}
                    disabled={downloadingDocId === doc.id}
                    className="p-2 rounded-lg hover:bg-white text-txt-muted hover:text-primary transition-colors shrink-0 disabled:opacity-50"
                    title={`Télécharger ${doc.name}`}
                  >
                    {downloadingDocId === doc.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Download size={14} />
                    }
                  </button>
                </div>
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
          {(envelope.auditTrail?.length ?? 0) > 0 && (
          <Card padding="md">
            <h3 className="text-sm font-semibold text-dark mb-3">Parcours & Historique</h3>
            <div className="relative">
              {envelope.auditTrail!.map((entry, i) => {
                const isSuccess = entry.action === 'DOCUMENT_SIGNED' || entry.action === 'ENVELOPE_COMPLETED';
                const isError = entry.action === 'DOCUMENT_REJECTED' || entry.action === 'ENVELOPE_CANCELLED';
                const isSend = entry.action === 'ENVELOPE_SENT';
                const dotColor = isSuccess
                  ? 'bg-success'
                  : isError
                    ? 'bg-danger'
                    : isSend
                      ? 'bg-primary'
                      : 'bg-border';
                const label = actionLabel(entry.action);
                return (
                  <div key={entry.id} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={clsx('w-3 h-3 rounded-full shrink-0 mt-1', dotColor)} />
                      {i < envelope.auditTrail!.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-txt">{label}</p>
                      {entry.details && (
                        <p className="text-xs text-txt-secondary">{entry.details}</p>
                      )}
                      <p className="text-[11px] text-txt-muted mt-0.5">{formatDateTime(entry.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          )}
        </div>
      </div>
    </div>
  );
}
