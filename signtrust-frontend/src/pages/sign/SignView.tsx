import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FileText,
  Check,
  Shield,
  PenTool,
  Type,
  Eraser,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import clsx from 'clsx';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { signService } from '../../services/signService';
import { ENV } from '../../config/env';
import type { Document as DocType, SignatureField } from '../../types/envelope';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface SigningInfo {
  envelopeName: string;
  message: string;
  signatoryName: string;
  signatoryEmail: string;
  signatoryStatus: string;
  documents: DocType[];
  fields: SignatureField[];
}

type SignMode = 'draw' | 'text';

async function fetchSignDocumentBlobUrl(token: string, docId: number): Promise<string> {
  const { data } = await axios.get(`${ENV.API_BASE_URL}/sign/${token}/documents/${docId}`, {
    responseType: 'blob',
  });
  return URL.createObjectURL(data);
}

export default function SignView() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [activeDoc, setActiveDoc] = useState(0);
  const [signMode, setSignMode] = useState<SignMode>('draw');
  const [signedDocs, setSignedDocs] = useState<Set<number>>(new Set());
  const [info, setInfo] = useState<SigningInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // PDF viewer state
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Field drawing state
  const [activeFieldId, setActiveFieldId] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [fieldSignatures, setFieldSignatures] = useState<Record<number, string>>({}); // fieldId → base64
  const [textSignature, setTextSignature] = useState('');
  const fieldCanvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reject state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);

  // Fetch signing info
  const fetchInfo = useCallback(async (t: string, signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${ENV.API_BASE_URL}/sign/${t}`);
      if (!signal.aborted) setInfo(data);
    } catch {
      if (!signal.aborted) setError('Impossible de charger les informations de signature');
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    fetchInfo(token, controller.signal);
    return () => controller.abort();
  }, [token, fetchInfo]);

  // Fetch PDF blob when active doc changes
  const blobUrlRef = useRef<string | null>(null);
  const fetchBlob = useCallback(async (t: string, docId: number, signal: AbortSignal) => {
    setPdfLoading(true);
    setPdfBlobUrl(null);
    try {
      const url = await fetchSignDocumentBlobUrl(t, docId);
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
    if (!token || !info || !info.documents[activeDoc]) return;
    const doc = info.documents[activeDoc];
    if (doc.contentType !== 'application/pdf') {
      setPdfBlobUrl(null);
      return;
    }
    setPageNumber(1);
    setNumPages(0);
    const controller = new AbortController();
    fetchBlob(token, doc.id, controller.signal);
    return () => {
      controller.abort();
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [token, info, activeDoc, fetchBlob]);

  // Initialize canvas when a field becomes active for drawing
  const initFieldCanvas = useCallback((fieldId: number) => {
    const canvas = fieldCanvasRefs.current[fieldId];
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#1E3A5F';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (activeFieldId !== null && signMode === 'draw') {
      // Small delay to let the canvas render
      const timer = setTimeout(() => initFieldCanvas(activeFieldId), 50);
      return () => clearTimeout(timer);
    }
  }, [activeFieldId, signMode, initFieldCanvas]);

  // Drawing handlers for field canvas
  const getFieldCanvasPoint = (fieldId: number, e: React.MouseEvent | React.TouchEvent) => {
    const canvas = fieldCanvasRefs.current[fieldId];
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startFieldDrawing = (fieldId: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const point = getFieldCanvasPoint(fieldId, e);
    if (!point) return;
    const ctx = fieldCanvasRefs.current[fieldId]?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    setIsDrawing(true);
  };

  const fieldDraw = (fieldId: number, e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const point = getFieldCanvasPoint(fieldId, e);
    if (!point) return;
    const ctx = fieldCanvasRefs.current[fieldId]?.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopFieldDrawing = (fieldId: number) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    // Save the canvas content as base64
    const canvas = fieldCanvasRefs.current[fieldId];
    if (canvas) {
      const data = canvas.toDataURL('image/png');
      setFieldSignatures((prev) => ({ ...prev, [fieldId]: data }));
    }
  };

  const clearFieldCanvas = (fieldId: number) => {
    const canvas = fieldCanvasRefs.current[fieldId];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFieldSignatures((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  // Apply text signature to a field
  const applyTextToField = (fieldId: number) => {
    if (!textSignature.trim()) return;
    const canvas = document.createElement('canvas');
    // Use field's actual rendered dimensions for proper aspect ratio
    const fieldEl = document.querySelector(`[data-field-id="${fieldId}"]`) as HTMLElement;
    const w = fieldEl?.offsetWidth || 300;
    const h = fieldEl?.offsetHeight || 100;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    // Transparent background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1E3A5F';
    // Auto-size font to fit
    const fontSize = Math.min(h * 0.5, w / textSignature.trim().length * 1.5);
    ctx.font = `italic ${fontSize}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textSignature.trim(), w / 2, h / 2);
    const data = canvas.toDataURL('image/png');
    setFieldSignatures((prev) => ({ ...prev, [fieldId]: data }));
    setActiveFieldId(null);
  };

  // Get the first signature base64 for submission (backend applies to all fields)
  const getSignatureBase64 = (): string | null => {
    const values = Object.values(fieldSignatures);
    return values.length > 0 ? values[0] : null;
  };

  const hasSignature = Object.keys(fieldSignatures).length > 0;

  // Fields for current page and document
  const currentDocId = info?.documents[activeDoc]?.id;
  const currentPageFields = info?.fields.filter(
    (f) => f.documentId === currentDocId && f.pageNumber === pageNumber
  ) ?? [];

  const openPreview = () => {
    if (!hasSignature) return;
    setShowPreview(true);
  };

  const handleSign = async () => {
    if (!token) return;
    const sig = getSignatureBase64();
    if (!sig) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await signService.sign(token, sig);
      navigate('/sign/success', {
        state: { documentCount: info?.documents.length ?? 0 },
        replace: true,
      });
    } catch {
      setSubmitError('Erreur lors de la signature. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
      setShowPreview(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;
    setRejecting(true);
    try {
      await signService.reject(token, rejectReason.trim() || undefined);
      navigate('/sign/success', {
        state: { rejected: true },
        replace: true,
      });
    } catch {
      setSubmitError('Erreur lors du refus. Veuillez réessayer.');
    } finally {
      setRejecting(false);
      setShowRejectDialog(false);
    }
  };

  const toggleDocSigned = (docId: number) => {
    setSignedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-sm text-txt-muted">{error || 'Informations introuvables'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Header */}
      <div className="bg-white border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-dark">{info.envelopeName}</h1>
            <p className="text-sm text-txt-secondary">
              {info.signatoryName} - {info.documents.length} document{info.documents.length > 1 ? 's' : ''}
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
        {submitError && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-danger/10 border border-danger/20 rounded-xl">
            <AlertCircle size={16} className="text-danger shrink-0" />
            <p className="text-sm text-danger">{submitError}</p>
          </div>
        )}

        <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 300px' }}>
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

            {/* Document preview with interactive signature fields */}
            <Card className="min-h-[600px] overflow-hidden">
              {pdfLoading ? (
                <div className="flex items-center justify-center h-full min-h-[600px]">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : pdfBlobUrl ? (
                <div className="flex flex-col h-full">
                  {/* PDF toolbar */}
                  <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                        disabled={pageNumber <= 1}
                        className="p-1.5 rounded-lg hover:bg-bg disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-sm text-txt-secondary min-w-[80px] text-center">
                        {pageNumber} / {numPages}
                      </span>
                      <button
                        onClick={() => setPageNumber((p) => Math.min(numPages, p + 1))}
                        disabled={pageNumber >= numPages}
                        className="p-1.5 rounded-lg hover:bg-bg disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
                        className="p-1.5 rounded-lg hover:bg-bg transition-colors"
                      >
                        <ZoomOut size={16} />
                      </button>
                      <span className="text-sm text-txt-secondary min-w-[50px] text-center">
                        {Math.round(scale * 100)}%
                      </span>
                      <button
                        onClick={() => setScale((s) => Math.min(2.5, s + 0.25))}
                        className="p-1.5 rounded-lg hover:bg-bg transition-colors"
                      >
                        <ZoomIn size={16} />
                      </button>
                    </div>
                  </div>

                  {/* PDF page with interactive field overlays */}
                  <div className="flex-1 overflow-auto flex justify-center bg-bg/50 p-4">
                    <div ref={pageContainerRef} className="relative inline-block">
                      <Document
                        file={pdfBlobUrl}
                        onLoadSuccess={({ numPages: n }) => { setNumPages(n); }}
                        loading=""
                      >
                        <Page
                          pageNumber={pageNumber}
                          scale={scale}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                        />
                      </Document>

                      {/* Signature field overlays */}
                      {currentPageFields.map((field) => {
                        const isSigned = !!fieldSignatures[field.id];
                        const isActive = activeFieldId === field.id;

                        return (
                          <div
                            key={field.id}
                            data-field-id={field.id}
                            className={clsx(
                              'absolute rounded-lg z-10 overflow-hidden',
                              isActive
                                ? 'border-2 border-primary ring-2 ring-primary/30'
                                : isSigned
                                  ? 'border-2 border-success/50'
                                  : 'border-2 border-dashed border-primary cursor-pointer hover:bg-primary/20 transition-colors',
                            )}
                            style={{
                              left: `${field.x}%`,
                              top: `${field.y}%`,
                              width: `${field.width}%`,
                              height: `${field.height}%`,
                            }}
                            onClick={() => {
                              if (!isActive && !isSigned) {
                                setActiveFieldId(field.id);
                              }
                            }}
                          >
                            {/* Not signed yet, not active: show placeholder */}
                            {!isSigned && !isActive && (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <div className="flex flex-col items-center gap-0.5">
                                  <PenTool size={14} className="text-primary" />
                                  <span className="text-[10px] font-semibold text-primary leading-tight">
                                    Cliquez pour signer
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Active: drawing canvas */}
                            {isActive && signMode === 'draw' && (
                              <canvas
                                ref={(el) => { fieldCanvasRefs.current[field.id] = el; }}
                                className="w-full h-full cursor-crosshair touch-none bg-white/80"
                                onMouseDown={(e) => startFieldDrawing(field.id, e)}
                                onMouseMove={(e) => fieldDraw(field.id, e)}
                                onMouseUp={() => stopFieldDrawing(field.id)}
                                onMouseLeave={() => stopFieldDrawing(field.id)}
                                onTouchStart={(e) => startFieldDrawing(field.id, e)}
                                onTouchMove={(e) => fieldDraw(field.id, e)}
                                onTouchEnd={() => stopFieldDrawing(field.id)}
                              />
                            )}

                            {/* Active: text mode */}
                            {isActive && signMode === 'text' && (
                              <div className="w-full h-full flex items-center justify-center bg-white/80 p-1">
                                <span
                                  className="text-center font-serif italic text-[#1E3A5F] leading-tight"
                                  style={{ fontSize: `${Math.min(field.height * 0.4, 2)}vw` }}
                                >
                                  {textSignature || 'Tapez votre signature →'}
                                </span>
                              </div>
                            )}

                            {/* Signed: show the signature image */}
                            {isSigned && !isActive && (
                              <img
                                src={fieldSignatures[field.id]}
                                alt="Signature"
                                className="w-full h-full object-contain bg-white/50"
                              />
                            )}
                          </div>
                        );
                      })}

                      {/* Mini toolbar near active field */}
                      {activeFieldId !== null && currentPageFields.some((f) => f.id === activeFieldId) && (() => {
                        const field = currentPageFields.find((f) => f.id === activeFieldId)!;
                        return (
                          <div
                            className="absolute z-20 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-border px-2 py-1"
                            style={{
                              left: `${field.x}%`,
                              top: `calc(${field.y}% + ${field.height}% + 4px)`,
                            }}
                          >
                            {signMode === 'draw' ? (
                              <>
                                <button
                                  onClick={() => clearFieldCanvas(activeFieldId)}
                                  className="p-1.5 rounded hover:bg-bg text-txt-muted transition-colors"
                                  title="Effacer"
                                >
                                  <Eraser size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (fieldSignatures[activeFieldId]) {
                                      setActiveFieldId(null);
                                    }
                                  }}
                                  disabled={!fieldSignatures[activeFieldId]}
                                  className="px-2 py-1 rounded text-xs font-medium bg-success text-white hover:bg-success/90 disabled:opacity-40 transition-colors"
                                >
                                  <Check size={12} className="inline mr-1" />
                                  OK
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => applyTextToField(activeFieldId)}
                                disabled={!textSignature.trim()}
                                className="px-2 py-1 rounded text-xs font-medium bg-success text-white hover:bg-success/90 disabled:opacity-40 transition-colors"
                              >
                                <Check size={12} className="inline mr-1" />
                                Appliquer
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[600px]">
                  <div className="text-center">
                    <FileText size={48} className="mx-auto text-txt-muted mb-3" />
                    <p className="text-sm text-txt-muted">
                      {info.documents[activeDoc]?.name}
                    </p>
                    <p className="text-xs text-txt-muted mt-1">
                      Aperçu non disponible
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right panel */}
          <div className="space-y-5">
            {/* Signature mode selector */}
            <Card padding="md">
              <h3 className="text-sm font-semibold text-dark mb-3">Mode de signature</h3>
              <div className="flex border border-border rounded-xl overflow-hidden mb-3">
                <button
                  onClick={() => setSignMode('draw')}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors',
                    signMode === 'draw' ? 'bg-primary text-white' : 'bg-white text-txt-muted hover:bg-bg'
                  )}
                >
                  <PenTool size={14} />
                  Dessiner
                </button>
                <button
                  onClick={() => setSignMode('text')}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors',
                    signMode === 'text' ? 'bg-primary text-white' : 'bg-white text-txt-muted hover:bg-bg'
                  )}
                >
                  <Type size={14} />
                  Texte
                </button>
              </div>

              {signMode === 'text' && (
                <input
                  type="text"
                  value={textSignature}
                  onChange={(e) => setTextSignature(e.target.value)}
                  placeholder="Tapez votre signature..."
                  className="w-full text-center text-lg font-serif italic text-dark bg-bg border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                />
              )}

              <p className="text-xs text-txt-muted mt-3">
                {signMode === 'draw'
                  ? 'Cliquez sur un champ "Signez ici" sur le document puis dessinez votre signature.'
                  : 'Tapez votre signature ci-dessus, puis cliquez sur un champ du document pour l\'appliquer.'}
              </p>
            </Card>

            {/* Security info */}
            <Card padding="md">
              <div className="flex items-center gap-3">
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-6 py-4 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button
            variant="danger"
            size="md"
            onClick={() => setShowRejectDialog(true)}
            disabled={submitting}
          >
            Refuser
          </Button>
          <Button
            variant="accent"
            size="md"
            onClick={openPreview}
            disabled={submitting || !hasSignature}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Signature en cours...
              </span>
            ) : (
              `Signer les ${info.documents.length} documents`
            )}
          </Button>
        </div>
      </div>

      {/* Reject dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-dark mb-2">Refuser de signer</h2>
            <p className="text-sm text-txt-secondary mb-4">
              Vous pouvez indiquer une raison pour votre refus (optionnel).
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Raison du refus..."
              className="w-full h-24 p-3 border border-border rounded-xl text-sm resize-none focus:outline-none focus:border-primary"
            />
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setShowRejectDialog(false)}
                disabled={rejecting}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={handleReject}
                disabled={rejecting}
              >
                {rejecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Refus en cours...
                  </span>
                ) : (
                  'Confirmer le refus'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Signature confirmation modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h2 className="text-lg font-bold text-dark mb-1">Confirmer la signature</h2>
            <p className="text-sm text-txt-secondary mb-4">
              Votre signature a été apposée sur le document.
            </p>

            {/* Show signature preview */}
            <div className="border-2 border-dashed border-border rounded-xl p-4 bg-bg mb-4 flex items-center justify-center">
              <img
                src={Object.values(fieldSignatures)[0]}
                alt="Aperçu signature"
                className="max-h-[120px] max-w-full object-contain"
              />
            </div>

            <div className="bg-primary/5 rounded-xl p-4 mb-4">
              <p className="text-sm text-txt">
                <span className="font-semibold">{info.signatoryName}</span>, vous êtes sur le point de signer{' '}
                <span className="font-semibold">{info.documents.length} document{info.documents.length > 1 ? 's' : ''}</span>{' '}
                de l'enveloppe <span className="font-semibold">"{info.envelopeName}"</span>.
              </p>
              <p className="text-xs text-txt-muted mt-2">
                Cette action est définitive et vaut consentement légal.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setShowPreview(false)}
                disabled={submitting}
              >
                Modifier
              </Button>
              <Button
                variant="accent"
                size="md"
                className="flex-1"
                onClick={handleSign}
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Signature en cours...
                  </span>
                ) : (
                  'Confirmer la signature'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
