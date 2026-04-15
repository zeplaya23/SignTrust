import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  X,
  FileText,
  PlusCircle,
  Check,
  PenTool,
  Calendar,
  Type,
  Hash,
  CheckSquare,
  CheckCircle2,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ZoomIn,
  ZoomOut,
  Trash2,
  Clock,
  Users,
  Layers,
  ArrowRightLeft,
  MessageSquare,
  Shield,
  UserPlus,
  RefreshCw,
  Settings as SettingsIcon,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import PdfViewer from '../../components/ui/PdfViewer';
import { useAuthStore } from '../../stores/useAuthStore';
import { envelopeService } from '../../services/envelopeService';
import { contactService, type Contact } from '../../services/contactService';
import type { SignatoryRole, SigningOrder, FieldType } from '../../types/envelope';

const STEPS = ['Documents', 'Signataires', 'Champs', 'Résumé', 'Envoi'];

interface LocalDoc {
  id: number;
  file: File;
  name: string;
  size: string;
  pages: number;
}

interface LocalSignatory {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: SignatoryRole;
  orderIndex: number;
}

interface LocalField {
  id: number;
  documentId: number;
  signatoryId: number;
  type: FieldType;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const SIGNATORY_COLORS = ['#1E3A5F', '#C87B2E', '#177A4B', '#6C5CE7', '#C0392B'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function NewEnvelope() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [documents, setDocuments] = useState<LocalDoc[]>([]);
  const [signatories, setSignatories] = useState<LocalSignatory[]>([]);
  const [signingOrder, setSigningOrder] = useState<SigningOrder>('SEQUENTIAL');
  const [fields, setFields] = useState<LocalField[]>([]);
  const [activeDocTab, setActiveDocTab] = useState(0);
  const [envelopeName, setEnvelopeName] = useState('');
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [expirationEnabled, setExpirationEnabled] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState(3);
  const [previewDocIdx, setPreviewDocIdx] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextDocId = useRef(1);
  const nextSigId = useRef(1);
  const nextFieldId = useRef(1);

  // Step 2 - field editor state
  const [activeSignatoryId, setActiveSignatoryId] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<FieldType | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [fieldCurrentPage, setFieldCurrentPage] = useState(1);
  const [fieldNumPages, setFieldNumPages] = useState(0);
  const [fieldScale, setFieldScale] = useState(1.0);
  const draggingRef = useRef<{ fieldId: number; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizingRef = useRef<{ fieldId: number; startX: number; startY: number; origW: number; origH: number } | null>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Contacts for search/add
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sigSearch, setSigSearch] = useState('');
  const [sigSearchFocused, setSigSearchFocused] = useState(false);
  const [editingSigId, setEditingSigId] = useState<number | null>(null);
  const sigSearchRef = useRef<HTMLInputElement>(null);
  const sigDropdownRef = useRef<HTMLDivElement>(null);

  // Drag & drop reorder
  const [dragSigId, setDragSigId] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Load contacts
  useEffect(() => {
    contactService.getAll().then(setContacts).catch(() => {});
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sigDropdownRef.current && !sigDropdownRef.current.contains(e.target as Node) &&
          sigSearchRef.current && !sigSearchRef.current.contains(e.target as Node)) {
        setSigSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Generate blob URL for step 0 preview
  const previewDoc = documents[previewDocIdx];
  const previewDocId = previewDoc?.id;
  useEffect(() => {
    if (!previewDoc || previewDoc.file.type !== 'application/pdf') {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(previewDoc.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewDocId, previewDocIdx, previewDoc]);

  // Blob URL for step 2 (fields) active doc
  const [fieldsPreviewUrl, setFieldsPreviewUrl] = useState<string | null>(null);
  const fieldsDoc = documents[activeDocTab];
  const fieldsDocId = fieldsDoc?.id;
  useEffect(() => {
    if (!fieldsDoc || fieldsDoc.file.type !== 'application/pdf') {
      setFieldsPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(fieldsDoc.file);
    setFieldsPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [fieldsDocId, activeDocTab, fieldsDoc]);

  // Auto-select first signatory when entering step 2
  useEffect(() => {
    if (step === 2 && signatories.length > 0 && activeSignatoryId === null) {
      setActiveSignatoryId(signatories[0].id);
    }
  }, [step, signatories, activeSignatoryId]);

  // Keyboard shortcuts for field editor
  useEffect(() => {
    if (step !== 2) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedFieldId !== null && !(e.target instanceof HTMLInputElement)) {
          setFields((prev) => prev.filter((f) => f.id !== selectedFieldId));
          setSelectedFieldId(null);
        }
      }
      if (e.key === 'Escape') {
        setActiveTool(null);
        setSelectedFieldId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, selectedFieldId]);

  // Step 1: Documents — add files instantly, resolve page count in background
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    const newDocs: LocalDoc[] = fileArray.map((file) => ({
      id: nextDocId.current++,
      file,
      name: file.name,
      size: formatFileSize(file.size),
      pages: 0, // 0 = loading
    }));

    setDocuments((prev) => [...prev, ...newDocs]);

    // Count pages for each PDF in background
    const pdfs = newDocs.filter((d) => d.file.type === 'application/pdf');
    if (pdfs.length === 0) {
      // Non-PDF files: set pages to 1 immediately
      setDocuments((prev) =>
        prev.map((d) => (d.pages === 0 ? { ...d, pages: 1 } : d))
      );
      return;
    }

    setUploading(true);
    let remaining = pdfs.length;

    for (const doc of pdfs) {
      setUploadingFileName(doc.name);
      const docId = doc.id;
      doc.file.arrayBuffer().then((buffer) => {
        const task = pdfjs.getDocument({ data: buffer });
        // Timeout: abort if it takes more than 5 seconds
        const timer = setTimeout(() => { try { task.destroy(); } catch { /* timeout cleanup */ } }, 5000);
        return task.promise
          .then((pdf) => {
            clearTimeout(timer);
            return pdf.numPages;
          })
          .catch(() => {
            clearTimeout(timer);
            return 1;
          });
      }).then((pages) => {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, pages } : d))
        );
      }).catch(() => {
        setDocuments((prev) =>
          prev.map((d) => (d.id === docId ? { ...d, pages: 1 } : d))
        );
      }).finally(() => {
        remaining--;
        if (remaining <= 0) {
          setUploading(false);
          setUploadingFileName('');
        }
      });
    }

    // Also set non-PDF docs to 1 page
    const nonPdfIds = new Set(newDocs.filter((d) => d.file.type !== 'application/pdf').map((d) => d.id));
    if (nonPdfIds.size > 0) {
      setDocuments((prev) =>
        prev.map((d) => (nonPdfIds.has(d.id) && d.pages === 0 ? { ...d, pages: 1 } : d))
      );
    }
  }, []);

  const removeDocument = (id: number) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // Step 2: Signatories
  const addSelfAsSignatory = () => {
    if (!user) return;
    const alreadyAdded = signatories.some((s) => s.email === user.email);
    if (alreadyAdded) return;
    setSignatories((prev) => [
      ...prev,
      {
        id: nextSigId.current++,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: 'SIGNER',
        orderIndex: prev.length + 1,
      },
    ]);
  };

  const isSelfAdded = signatories.some((s) => s.email === user?.email);

  const updateSignatory = (id: number, field: keyof LocalSignatory, value: string) => {
    setSignatories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const removeSignatory = (id: number) => {
    setSignatories((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, orderIndex: i + 1 })));
    if (editingSigId === id) setEditingSigId(null);
  };

  const handleSigDragStart = (id: number) => {
    setDragSigId(id);
  };

  const handleSigDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleSigDrop = (targetIdx: number) => {
    if (dragSigId === null) return;
    setSignatories((prev) => {
      const fromIdx = prev.findIndex((s) => s.id === dragSigId);
      if (fromIdx < 0 || fromIdx === targetIdx) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(targetIdx, 0, moved);
      return copy.map((s, i) => ({ ...s, orderIndex: i + 1 }));
    });
    setDragSigId(null);
    setDragOverIdx(null);
  };

  const handleSigDragEnd = () => {
    setDragSigId(null);
    setDragOverIdx(null);
  };

  const addSignatoryFromContact = (contact: Contact) => {
    const alreadyAdded = signatories.some((s) => s.email === contact.email);
    if (alreadyAdded) return;
    const [firstName, ...rest] = contact.name.split(' ');
    const lastName = rest.join(' ');
    setSignatories((prev) => [
      ...prev,
      {
        id: nextSigId.current++,
        firstName: firstName || '',
        lastName: lastName || '',
        email: contact.email,
        role: 'SIGNER' as SignatoryRole,
        orderIndex: prev.length + 1,
      },
    ]);
    setSigSearch('');
    setSigSearchFocused(false);
  };

  const addManualSignatory = () => {
    const newId = nextSigId.current++;
    setSignatories((prev) => [
      ...prev,
      {
        id: newId,
        firstName: '',
        lastName: '',
        email: '',
        role: 'SIGNER' as SignatoryRole,
        orderIndex: prev.length + 1,
      },
    ]);
    setEditingSigId(newId);
  };

  const sigSearchResults = (() => {
    const query = sigSearch.toLowerCase().trim();
    const addedEmails = new Set(signatories.map((s) => s.email.toLowerCase()));
    const available = contacts.filter((c) => !addedEmails.has(c.email.toLowerCase()));
    if (!query) return available.slice(0, 6);
    return available.filter(
      (c) =>
        c.email.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query)
    ).slice(0, 6);
  })();

  // Step 3: Fields
  const fieldTools: { type: FieldType; label: string; icon: typeof PenTool }[] = [
    { type: 'SIGNATURE', label: 'Signature', icon: PenTool },
    { type: 'DATE', label: 'Date', icon: Calendar },
    { type: 'INITIALS', label: 'Initiales', icon: Hash },
    { type: 'TEXT', label: 'Texte', icon: Type },
    { type: 'CHECKBOX', label: 'Case à cocher', icon: CheckSquare },
  ];

  // Place a field on the PDF page where the user clicks
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeTool || !activeSignatoryId) {
      setSelectedFieldId(null);
      return;
    }

    const container = pageContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    const defaults: Record<FieldType, { w: number; h: number }> = {
      SIGNATURE: { w: 25, h: 8 },
      DATE: { w: 20, h: 5 },
      INITIALS: { w: 10, h: 5 },
      TEXT: { w: 25, h: 5 },
      CHECKBOX: { w: 4, h: 4 },
    };

    const doc = documents[activeDocTab] || documents[0];
    const size = defaults[activeTool];

    // Check if this signatory already has this tool type
    const alreadyUsed = fields.some(
      (f) => f.signatoryId === activeSignatoryId && f.type === activeTool
    );
    if (alreadyUsed) {
      setActiveTool(null);
      return;
    }

    setFields((prev) => [
      ...prev,
      {
        id: nextFieldId.current++,
        documentId: doc.id,
        signatoryId: activeSignatoryId,
        type: activeTool,
        pageNumber: fieldCurrentPage,
        x: Math.min(xPct, 100 - size.w),
        y: Math.min(yPct, 100 - size.h),
        width: size.w,
        height: size.h,
      },
    ]);

    setActiveTool(null);
  };

  // Drag to move field
  const handleFieldMouseDown = (e: React.MouseEvent, fieldId: number) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedFieldId(fieldId);

    const container = pageContainerRef.current;
    if (!container) return;

    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    draggingRef.current = {
      fieldId,
      startX: e.clientX,
      startY: e.clientY,
      origX: field.x,
      origY: field.y,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const rect = container.getBoundingClientRect();
      const dx = ((ev.clientX - draggingRef.current.startX) / rect.width) * 100;
      const dy = ((ev.clientY - draggingRef.current.startY) / rect.height) * 100;

      setFields((prev) =>
        prev.map((f) => {
          if (f.id !== draggingRef.current!.fieldId) return f;
          return {
            ...f,
            x: Math.max(0, Math.min(100 - f.width, draggingRef.current!.origX + dx)),
            y: Math.max(0, Math.min(100 - f.height, draggingRef.current!.origY + dy)),
          };
        })
      );
    };

    const handleMouseUp = () => {
      draggingRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Resize field via bottom-right handle
  const handleResizeMouseDown = (e: React.MouseEvent, fieldId: number) => {
    e.stopPropagation();
    e.preventDefault();

    const container = pageContainerRef.current;
    if (!container) return;

    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    resizingRef.current = {
      fieldId,
      startX: e.clientX,
      startY: e.clientY,
      origW: field.width,
      origH: field.height,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const rect = container.getBoundingClientRect();
      const dw = ((ev.clientX - resizingRef.current.startX) / rect.width) * 100;
      const dh = ((ev.clientY - resizingRef.current.startY) / rect.height) * 100;

      setFields((prev) =>
        prev.map((f) => {
          if (f.id !== resizingRef.current!.fieldId) return f;
          return {
            ...f,
            width: Math.max(3, Math.min(100 - f.x, resizingRef.current!.origW + dw)),
            height: Math.max(3, Math.min(100 - f.y, resizingRef.current!.origH + dh)),
          };
        })
      );
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const removeField = (id: number) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const canNext = () => {
    if (step === 0) return documents.length > 0 && envelopeName.trim().length > 0;
    if (step === 1) return signatories.length > 0 && signatories.every((s) => s.email && s.firstName);
    if (step === 2) return true;
    if (step === 3) return true;
    return false;
  };

  const handleNext = async () => {
    if (step === 3) {
      setSending(true);
      setSendError(null);
      try {
        // 1. Create envelope
        const envelope = await envelopeService.create({
          name: envelopeName.trim(),
          message: message.trim() || undefined,
          signingOrder: signingOrder,
          expiresAt: expirationEnabled && expiresAt ? expiresAt : undefined,
        });
        const envId = envelope.id;

        // 2. Upload documents — map local doc IDs to backend IDs
        const docIdMap = new Map<number, number>();
        for (const doc of documents) {
          const backendDoc = await envelopeService.uploadDocument(envId, doc.file);
          docIdMap.set(doc.id, backendDoc.id);
        }

        // 3. Add signatories — map local sig IDs to backend IDs
        const sigIdMap = new Map<number, number>();
        for (const sig of signatories) {
          const backendSig = await envelopeService.addSignatory(envId, {
            email: sig.email,
            firstName: sig.firstName,
            lastName: sig.lastName,
            role: sig.role,
            orderIndex: sig.orderIndex,
          });
          sigIdMap.set(sig.id, backendSig.id);
        }

        // 4. Add fields — translate local IDs to backend IDs
        for (const field of fields) {
          const backendDocId = docIdMap.get(field.documentId);
          const backendSigId = sigIdMap.get(field.signatoryId);
          if (backendDocId && backendSigId) {
            await envelopeService.addField(envId, {
              documentId: backendDocId,
              signatoryId: backendSigId,
              type: field.type,
              pageNumber: field.pageNumber,
              x: field.x,
              y: field.y,
              width: field.width,
              height: field.height,
            });
          }
        }

        // 5. Send the envelope
        await envelopeService.send(envId);

        // 6. Auto-add new signatories to contacts (fire & forget)
        const existingEmails = new Set(contacts.map((c) => c.email.toLowerCase()));
        for (const sig of signatories) {
          if (sig.email && !existingEmails.has(sig.email.toLowerCase()) && sig.email !== user?.email) {
            contactService.create({
              name: `${sig.firstName} ${sig.lastName}`.trim(),
              email: sig.email,
            }).catch(() => {});
          }
        }

        setStep(4);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
        const msg = axiosErr.response?.data?.message || axiosErr.message || "Erreur lors de l'envoi de l'enveloppe";
        setSendError(msg);
      } finally {
        setSending(false);
      }
      return;
    }
    if (step < 4) setStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark">Nouvelle enveloppe</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                  i < step
                    ? 'bg-success text-white'
                    : i === step
                      ? 'bg-primary text-white'
                      : 'bg-border text-txt-muted'
                )}
              >
                {i < step ? <Check size={16} /> : i + 1}
              </div>
              <span
                className={clsx(
                  'text-xs mt-1.5',
                  i === step ? 'text-primary font-semibold' : 'text-txt-muted'
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={clsx(
                  'w-16 h-0.5 mx-2 mt-[-18px]',
                  i < step ? 'bg-success' : 'bg-border'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {step === 0 && (
        <div className="grid grid-cols-2 gap-6">
          <div>
            {/* Envelope name */}
            <div className="mb-5 p-4 bg-white rounded-2xl border-2 border-primary/20 shadow-sm">
              <label className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
                <Shield size={16} className="text-primary" />
                Nom de l'enveloppe <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={envelopeName}
                onChange={(e) => setEnvelopeName(e.target.value)}
                placeholder="Ex: Contrat de bail 2026"
                className={clsx(
                  'w-full border px-4 py-3 text-sm text-txt placeholder:text-txt-muted rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors',
                  !envelopeName.trim() ? 'bg-danger-light/30 border-danger/30' : 'bg-bg border-border'
                )}
              />
              {!envelopeName.trim() && (
                <p className="text-xs text-danger mt-1.5">Ce champ est obligatoire</p>
              )}
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={clsx(
                'border-2 border-dashed rounded-2xl p-8 text-center transition-colors mb-4',
                uploading
                  ? 'border-primary bg-primary-light/30 cursor-wait'
                  : 'border-border hover:border-primary hover:bg-primary-light/30 cursor-pointer'
              )}
            >
              {uploading ? (
                <>
                  <Loader2 size={32} className="mx-auto text-primary mb-3 animate-spin" />
                  <p className="text-sm font-medium text-txt mb-1">
                    Analyse en cours…
                  </p>
                  {uploadingFileName && (
                    <p className="text-xs text-primary font-medium truncate max-w-[300px] mx-auto">{uploadingFileName}</p>
                  )}
                </>
              ) : (
                <>
                  <Upload size={32} className="mx-auto text-txt-muted mb-3" />
                  <p className="text-sm font-medium text-txt mb-1">
                    Glissez vos fichiers ici ou cliquez pour parcourir
                  </p>
                  <p className="text-xs text-txt-muted">PDF, Word, Images (max 10MB)</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {/* Document list */}
            {documents.length > 0 && (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border"
                  >
                    <FileText size={18} className="text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-txt truncate">{doc.name}</p>
                      <p className="text-xs text-txt-muted">
                        {doc.size} -{' '}
                        {doc.pages === 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <Loader2 size={10} className="animate-spin" /> analyse…
                          </span>
                        ) : (
                          <>{doc.pages} page{doc.pages > 1 ? 's' : ''}</>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="p-1 rounded-lg hover:bg-danger-light text-txt-muted hover:text-danger transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document preview */}
          <Card className="min-h-[400px] overflow-hidden">
            {documents.length > 1 && (
              <div className="flex gap-2 px-4 pt-3 pb-2 border-b border-border">
                {documents.map((doc, i) => (
                  <button
                    key={doc.id}
                    onClick={() => setPreviewDocIdx(i)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      previewDocIdx === i
                        ? 'bg-primary text-white'
                        : 'bg-bg text-txt-secondary hover:bg-border/50'
                    )}
                  >
                    {doc.name}
                  </button>
                ))}
              </div>
            )}
            {previewUrl ? (
              <PdfViewer url={previewUrl} className="min-h-[400px]" />
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <FileText size={48} className="mx-auto text-txt-muted mb-3" />
                  <p className="text-sm text-txt-muted">
                    {documents.length > 0
                      ? 'Apercu non disponible (format non PDF)'
                      : 'Ajoutez un document pour le previsualiser'}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <Card padding="md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-dark">Signataires</h2>
                {!isSelfAdded && (
                  <Button variant="outline" size="sm" icon={UserPlus} onClick={addSelfAsSignatory}>
                    M'ajouter
                  </Button>
                )}
              </div>

              {/* Signatory list */}
              {signatories.length > 0 && (
                <div className="space-y-1 mb-4">
                  {signatories.map((sig, idx) => {
                    const isSelf = sig.email === user?.email;
                    const isEditing = editingSigId === sig.id;
                    const isDragging = dragSigId === sig.id;
                    const isDropTarget = dragOverIdx === idx && dragSigId !== sig.id;
                    const isIncomplete = !sig.firstName.trim() || !sig.lastName.trim() || !sig.email.trim() || (sig.email.trim() && !sig.email.includes('@'));
                    return (
                      <div
                        key={sig.id}
                        tabIndex={-1}
                        draggable
                        onDragStart={() => handleSigDragStart(sig.id)}
                        onDragOver={(e) => handleSigDragOver(e, idx)}
                        onDrop={() => handleSigDrop(idx)}
                        onDragEnd={handleSigDragEnd}
                        onBlur={(e) => {
                          if (isEditing && !e.currentTarget.contains(e.relatedTarget as Node)) {
                            setEditingSigId(null);
                          }
                        }}
                        className={clsx(
                          'rounded-xl border transition-all outline-none',
                          isDragging && 'opacity-40',
                          isDropTarget && 'border-primary border-2 shadow-md',
                          !isDragging && !isDropTarget && isIncomplete && !isSelf && 'bg-warning-light/30 border-warning/40',
                          !isDragging && !isDropTarget && !isIncomplete && (isSelf ? 'bg-primary-light/40 border-primary/20' : 'bg-bg border-border'),
                          !isDragging && !isDropTarget && isSelf && 'bg-primary-light/40 border-primary/20'
                        )}
                      >
                        {/* Compact view */}
                        <div className="flex items-center gap-3 p-3">
                          <div className="cursor-grab active:cursor-grabbing shrink-0 text-txt-muted hover:text-primary transition-colors">
                            <GripVertical size={16} />
                          </div>
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                            style={{ backgroundColor: SIGNATORY_COLORS[idx % SIGNATORY_COLORS.length] }}
                          >
                            {sig.orderIndex}
                          </span>
                          <div className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                            {(sig.firstName?.charAt(0) || '?').toUpperCase()}
                            {(sig.lastName?.charAt(0) || '').toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-txt truncate">
                                {sig.firstName && sig.lastName
                                  ? `${sig.firstName} ${sig.lastName}`
                                  : sig.email || 'Nouveau signataire'}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">Vous</span>
                              )}
                              {isIncomplete && !isSelf && !isEditing && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded-full shrink-0">
                                  <AlertTriangle size={10} />
                                  Incomplet
                                </span>
                              )}
                            </div>
                            {(sig.firstName || sig.lastName) && sig.email && (
                              <p className="text-xs text-txt-muted truncate">{sig.email}</p>
                            )}
                          </div>
                          <select
                            value={sig.role}
                            onChange={(e) => updateSignatory(sig.id, 'role', e.target.value)}
                            className="bg-white border border-border rounded-lg px-2 py-1.5 text-xs text-txt focus:outline-none focus:border-primary shrink-0"
                          >
                            <option value="SIGNER">Signataire</option>
                            <option value="APPROVER">Approbateur</option>
                            <option value="CC">Copie</option>
                          </select>
                          {!isSelf && (
                            <button
                              onClick={() => setEditingSigId(isEditing ? null : sig.id)}
                              className={clsx(
                                'p-1.5 rounded-lg transition-colors shrink-0',
                                isEditing
                                  ? 'bg-primary/10 text-primary'
                                  : 'hover:bg-bg text-txt-muted hover:text-txt'
                              )}
                              title="Modifier"
                            >
                              <SettingsIcon size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => removeSignatory(sig.id)}
                            className="p-1.5 rounded-lg hover:bg-danger-light text-txt-muted hover:text-danger transition-colors shrink-0"
                            title="Supprimer"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        {/* Edit panel (expanded) */}
                        {isEditing && !isSelf && (
                          <div className="px-3 pb-3 pt-0">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Prénom"
                                value={sig.firstName}
                                onChange={(e) => updateSignatory(sig.id, 'firstName', e.target.value)}
                                className="flex-1 bg-white border border-border rounded-lg px-3 py-2 text-sm text-txt placeholder:text-txt-muted focus:outline-none focus:border-primary"
                                autoFocus
                              />
                              <input
                                type="text"
                                placeholder="Nom"
                                value={sig.lastName}
                                onChange={(e) => updateSignatory(sig.id, 'lastName', e.target.value)}
                                className="flex-1 bg-white border border-border rounded-lg px-3 py-2 text-sm text-txt placeholder:text-txt-muted focus:outline-none focus:border-primary"
                              />
                              <input
                                type="email"
                                placeholder="Email"
                                value={sig.email}
                                onChange={(e) => updateSignatory(sig.id, 'email', e.target.value)}
                                className="flex-1 bg-white border border-border rounded-lg px-3 py-2 text-sm text-txt placeholder:text-txt-muted focus:outline-none focus:border-primary"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add signatory actions */}
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={addManualSignatory}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 border-dashed border-primary/40 bg-primary-light/20 hover:bg-primary-light/40 hover:border-primary transition-colors"
                >
                  <UserPlus size={18} className="text-primary" />
                  <span className="text-sm font-semibold text-primary">Nouveau signataire</span>
                </button>

                {contacts.length > 0 && (
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => { setSigSearchFocused(!sigSearchFocused); setSigSearch(''); }}
                      className={clsx(
                        'w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border-2 border-dashed transition-colors',
                        sigSearchFocused
                          ? 'border-primary bg-primary-light/20'
                          : 'border-border hover:border-primary/40 bg-white hover:bg-primary-light/10'
                      )}
                    >
                      <Users size={18} className={sigSearchFocused ? 'text-primary' : 'text-txt-muted'} />
                      <span className={clsx('text-sm font-semibold', sigSearchFocused ? 'text-primary' : 'text-txt-secondary')}>
                        Depuis les contacts
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Contact search panel */}
              {sigSearchFocused && contacts.length > 0 && (
                <div className="relative" ref={sigDropdownRef}>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-t-xl border border-border border-b-0 bg-white">
                    <Users size={16} className="text-primary shrink-0" />
                    <input
                      ref={sigSearchRef}
                      type="text"
                      value={sigSearch}
                      onChange={(e) => setSigSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && sigSearchResults.length > 0) {
                          e.preventDefault();
                          addSignatoryFromContact(sigSearchResults[0]);
                        }
                        if (e.key === 'Escape') {
                          setSigSearchFocused(false);
                          setSigSearch('');
                        }
                      }}
                      placeholder="Rechercher par nom ou email..."
                      className="flex-1 bg-transparent text-sm text-txt placeholder:text-txt-muted focus:outline-none"
                      autoFocus
                    />
                    {sigSearch && (
                      <button
                        onClick={() => setSigSearch('')}
                        className="p-1 rounded-lg hover:bg-bg text-txt-muted"
                      >
                        <X size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => { setSigSearchFocused(false); setSigSearch(''); }}
                      className="p-1 rounded-lg hover:bg-bg text-txt-muted"
                      title="Fermer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="border border-border border-t-0 rounded-b-xl bg-white max-h-56 overflow-y-auto">
                    {sigSearchResults.length > 0 ? (
                      sigSearchResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => addSignatoryFromContact(c)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-primary-light transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-txt">{c.name}</p>
                            <p className="text-xs text-txt-muted">{c.email}</p>
                          </div>
                          <PlusCircle size={16} className="text-primary shrink-0" />
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-center">
                        <p className="text-sm text-txt-muted">Aucun contact trouvé</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right: options */}
          <div className="space-y-4">
            {/* Signing order */}
            <Card padding="md">
              <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">Ordre de signature</h3>
              <div className="flex rounded-xl bg-bg p-1 gap-1">
                {(['SEQUENTIAL', 'PARALLEL'] as SigningOrder[]).map((order) => (
                  <button
                    key={order}
                    onClick={() => setSigningOrder(order)}
                    className={clsx(
                      'flex-1 flex flex-col items-center gap-1 py-3 rounded-lg text-center transition-all',
                      signingOrder === order
                        ? 'bg-white shadow-sm text-primary'
                        : 'text-txt-muted hover:text-txt'
                    )}
                  >
                    {order === 'SEQUENTIAL' ? <ArrowRightLeft size={18} /> : <Users size={18} />}
                    <span className="text-xs font-semibold">{order === 'SEQUENTIAL' ? 'Séquentiel' : 'Parallèle'}</span>
                    <span className="text-[10px] opacity-70">{order === 'SEQUENTIAL' ? 'Un par un' : 'Tous en même temps'}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Expiration */}
            <Card padding="md">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-primary" />
                  <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">Expiration</h3>
                </div>
                <button
                  type="button"
                  onClick={() => { setExpirationEnabled((v) => !v); if (expirationEnabled) setExpiresAt(''); }}
                  className={clsx(
                    'relative w-10 h-[22px] rounded-full transition-colors',
                    expirationEnabled ? 'bg-primary' : 'bg-border'
                  )}
                >
                  <span className={clsx(
                    'absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                    expirationEnabled ? 'left-[22px]' : 'left-[3px]'
                  )} />
                </button>
              </div>
              {expirationEnabled ? (
                <div className="mt-3">
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-bg border border-border px-3 py-2 text-sm text-txt rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  />
                  <p className="text-[10px] text-txt-muted mt-1.5">Annulation auto après cette date</p>
                </div>
              ) : (
                <p className="text-[10px] text-txt-muted mt-1">Pas de date limite</p>
              )}
            </Card>

            {/* Reminders */}
            <Card padding="md">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className="text-primary" />
                  <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">Relances</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRemindersEnabled((v) => !v)}
                  className={clsx(
                    'relative w-10 h-[22px] rounded-full transition-colors',
                    remindersEnabled ? 'bg-primary' : 'bg-border'
                  )}
                >
                  <span className={clsx(
                    'absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform',
                    remindersEnabled ? 'left-[22px]' : 'left-[3px]'
                  )} />
                </button>
              </div>
              {remindersEnabled ? (
                <div className="mt-3">
                  <div className="flex rounded-lg bg-bg p-0.5 gap-0.5">
                    {[1, 2, 3, 5, 7].map((d) => (
                      <button
                        key={d}
                        onClick={() => setReminderDays(d)}
                        className={clsx(
                          'flex-1 py-1.5 rounded-md text-xs font-semibold transition-all text-center',
                          reminderDays === d
                            ? 'bg-white shadow-sm text-primary'
                            : 'text-txt-muted hover:text-txt'
                        )}
                      >
                        {d}j
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-txt-muted mt-1.5">Rappel tous les {reminderDays} jour{reminderDays > 1 ? 's' : ''}</p>
                </div>
              ) : (
                <p className="text-[10px] text-txt-muted mt-1">Relance manuelle uniquement</p>
              )}
            </Card>

            {/* Summary */}
            <Card padding="md">
              <h3 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">Résumé</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-txt-secondary">Documents</span>
                  <span className="font-medium text-txt">{documents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-txt-secondary">Signataires</span>
                  <span className="font-medium text-txt">{signatories.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex gap-5" style={{ height: 'calc(100vh - 280px)' }}>
          {/* LEFT SIDEBAR */}
          <div className="w-60 shrink-0 space-y-4 overflow-y-auto">
            {/* Signatory selector */}
            <Card padding="sm">
              <h3 className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider mb-2 px-1">
                Signataire actif
              </h3>
              <div className="space-y-1">
                {signatories.map((sig, idx) => {
                  const color = SIGNATORY_COLORS[idx % SIGNATORY_COLORS.length];
                  const isActive = activeSignatoryId === sig.id;
                  return (
                    <button
                      key={sig.id}
                      onClick={() => { setActiveSignatoryId(sig.id); setActiveTool(null); }}
                      className={clsx(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm transition-all',
                        isActive ? 'font-semibold shadow-sm' : 'hover:bg-bg'
                      )}
                      style={isActive ? {
                        backgroundColor: color + '15',
                        color: color,
                        outline: `2px solid ${color}`,
                        outlineOffset: '-2px',
                      } : undefined}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {sig.orderIndex}
                      </span>
                      <span className="truncate">
                        {sig.firstName || '…'} {sig.lastName || ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Tool palette */}
            <Card padding="sm">
              <h3 className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider mb-2 px-1">
                Outils
              </h3>
              <div className="space-y-1">
                {fieldTools.map((tool) => {
                  const isToolActive = activeTool === tool.type;
                  const alreadyUsed = activeSignatoryId
                    ? fields.some((f) => f.signatoryId === activeSignatoryId && f.type === tool.type)
                    : false;
                  return (
                    <button
                      key={tool.type}
                      onClick={() => !alreadyUsed && setActiveTool(isToolActive ? null : tool.type)}
                      disabled={!activeSignatoryId || alreadyUsed}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors text-left',
                        isToolActive
                          ? 'bg-primary text-white shadow-sm'
                          : alreadyUsed
                            ? 'border border-border bg-bg/50 cursor-not-allowed'
                            : 'border border-border hover:bg-primary-light hover:border-primary',
                        !activeSignatoryId && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {alreadyUsed ? <Check size={16} className="text-success" /> : <tool.icon size={16} />}
                      <span className={clsx('font-medium flex-1', alreadyUsed && 'text-txt-muted')}>{tool.label}</span>
                      {alreadyUsed && <span className="text-[10px] text-success font-semibold">Placé</span>}
                    </button>
                  );
                })}
              </div>
              {activeTool && (
                <p className="text-xs text-primary mt-3 px-1 font-medium">
                  Cliquez sur la page pour placer le champ
                </p>
              )}
            </Card>

            {/* Placed fields list */}
            {(() => {
              const doc = documents[activeDocTab];
              const docFields = doc ? fields.filter((f) => f.documentId === doc.id && f.pageNumber === fieldCurrentPage) : [];
              return docFields.length > 0 ? (
                <Card padding="sm">
                  <h3 className="text-[11px] font-semibold text-txt-secondary uppercase tracking-wider mb-2 px-1">
                    Champs sur cette page ({docFields.length})
                  </h3>
                  <div className="space-y-1">
                    {docFields.map((field) => {
                      const sigIdx = signatories.findIndex((s) => s.id === field.signatoryId);
                      const sig = signatories[sigIdx];
                      const color = SIGNATORY_COLORS[sigIdx >= 0 ? sigIdx % SIGNATORY_COLORS.length : 0];
                      const isSelected = selectedFieldId === field.id;
                      return (
                        <div
                          key={field.id}
                          onClick={() => setSelectedFieldId(field.id)}
                          className={clsx(
                            'flex items-center gap-2 px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors',
                            isSelected ? 'bg-bg' : 'hover:bg-bg/50'
                          )}
                          style={isSelected ? { outline: `2px solid ${color}`, outlineOffset: '-2px' } : undefined}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="font-medium text-txt flex-1 truncate">
                            {field.type === 'SIGNATURE' ? 'Signature' : field.type === 'DATE' ? 'Date' : field.type === 'INITIALS' ? 'Initiales' : field.type === 'TEXT' ? 'Texte' : 'Case'}
                            {sig ? ` — ${sig.firstName}` : ''}
                          </span>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); removeField(field.id); }}
                            className="p-0.5 rounded hover:bg-danger-light text-txt-muted hover:text-danger transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ) : null;
            })()}
          </div>

          {/* CENTER: PDF + overlays */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white rounded-t-2xl border border-border border-b-0 shrink-0">
              {/* Document tabs */}
              <div className="flex gap-2 min-w-0 overflow-x-auto">
                {documents.map((doc, i) => (
                  <button
                    key={doc.id}
                    onClick={() => { setActiveDocTab(i); setFieldCurrentPage(1); }}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0',
                      activeDocTab === i
                        ? 'bg-primary text-white'
                        : 'bg-bg text-txt-secondary hover:bg-border/50'
                    )}
                  >
                    {doc.name}
                  </button>
                ))}
              </div>
              {/* Page navigation */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setFieldCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={fieldCurrentPage <= 1}
                  className="p-1 rounded-lg hover:bg-bg disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-txt-secondary min-w-[60px] text-center">
                  {fieldCurrentPage} / {fieldNumPages || '…'}
                </span>
                <button
                  onClick={() => setFieldCurrentPage((p) => Math.min(fieldNumPages, p + 1))}
                  disabled={fieldCurrentPage >= fieldNumPages}
                  className="p-1 rounded-lg hover:bg-bg disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              {/* Zoom */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setFieldScale((s) => Math.max(0.5, s - 0.25))}
                  className="p-1 rounded-lg hover:bg-bg transition-colors"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs text-txt-secondary min-w-[40px] text-center">
                  {Math.round(fieldScale * 100)}%
                </span>
                <button
                  onClick={() => setFieldScale((s) => Math.min(2, s + 0.25))}
                  className="p-1 rounded-lg hover:bg-bg transition-colors"
                >
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>

            {/* PDF page area */}
            <div className="flex-1 overflow-auto bg-bg/50 border border-border rounded-b-2xl flex justify-center p-6">
              {fieldsPreviewUrl ? (
                <Document
                  file={fieldsPreviewUrl}
                  onLoadSuccess={({ numPages: n }) => setFieldNumPages(n)}
                  loading=""
                >
                  <div
                    ref={pageContainerRef}
                    className="relative inline-block shadow-lg"
                    style={{ cursor: activeTool ? 'crosshair' : 'default' }}
                    onClick={handlePageClick}
                  >
                    <Page
                      pageNumber={fieldCurrentPage}
                      scale={fieldScale}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading=""
                    />

                    {/* Field overlays */}
                    {fields
                      .filter((f) => {
                        const doc = documents[activeDocTab];
                        return doc && f.documentId === doc.id && f.pageNumber === fieldCurrentPage;
                      })
                      .map((field) => {
                        const sigIdx = signatories.findIndex((s) => s.id === field.signatoryId);
                        const color = SIGNATORY_COLORS[sigIdx >= 0 ? sigIdx % SIGNATORY_COLORS.length : 0];
                        const isSelected = selectedFieldId === field.id;

                        return (
                          <div
                            key={field.id}
                            className={clsx(
                              'absolute border-2 rounded flex items-center justify-center text-xs font-medium select-none',
                              isSelected ? 'border-solid shadow-md' : 'border-dashed'
                            )}
                            style={{
                              left: `${field.x}%`,
                              top: `${field.y}%`,
                              width: `${field.width}%`,
                              height: `${field.height}%`,
                              borderColor: color,
                              backgroundColor: color + '20',
                              color: color,
                              cursor: activeTool ? 'crosshair' : 'move',
                              zIndex: isSelected ? 10 : 1,
                            }}
                            onMouseDown={(e) => !activeTool && handleFieldMouseDown(e, field.id)}
                            onClick={(e) => { e.stopPropagation(); setSelectedFieldId(field.id); }}
                          >
                            <span className="pointer-events-none truncate px-1">
                              {field.type === 'SIGNATURE' && 'Signature'}
                              {field.type === 'DATE' && 'Date'}
                              {field.type === 'INITIALS' && 'Initiales'}
                              {field.type === 'TEXT' && 'Texte'}
                              {field.type === 'CHECKBOX' && <CheckSquare size={14} />}
                            </span>

                            {/* Delete button */}
                            {isSelected && (
                              <button
                                onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                                className="absolute -top-3 -right-3 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center shadow-sm hover:bg-danger/80 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            )}

                            {/* Resize handle */}
                            {isSelected && (
                              <div
                                className="absolute -bottom-1 -right-1 w-3 h-3 rounded-sm cursor-se-resize"
                                style={{ backgroundColor: color }}
                                onMouseDown={(e) => handleResizeMouseDown(e, field.id)}
                              />
                            )}
                          </div>
                        );
                      })}
                  </div>
                </Document>
              ) : (
                <div className="flex items-center justify-center h-full text-txt-muted text-sm">
                  Apercu non disponible
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header banner */}
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Shield size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold">{envelopeName || 'Sans nom'}</h2>
                <p className="text-sm text-white/80 mt-0.5">
                  Vérifiez les informations avant l'envoi
                </p>
              </div>
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4 mt-5">
              <div className="bg-white/15 rounded-xl px-4 py-3 text-center">
                <FileText size={18} className="mx-auto mb-1 opacity-80" />
                <p className="text-xl font-bold">{documents.length}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-70">Document{documents.length > 1 ? 's' : ''}</p>
              </div>
              <div className="bg-white/15 rounded-xl px-4 py-3 text-center">
                <Users size={18} className="mx-auto mb-1 opacity-80" />
                <p className="text-xl font-bold">{signatories.length}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-70">Signataire{signatories.length > 1 ? 's' : ''}</p>
              </div>
              <div className="bg-white/15 rounded-xl px-4 py-3 text-center">
                <Layers size={18} className="mx-auto mb-1 opacity-80" />
                <p className="text-xl font-bold">{fields.length}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-70">Champ{fields.length > 1 ? 's' : ''}</p>
              </div>
              <div className="bg-white/15 rounded-xl px-4 py-3 text-center">
                <ArrowRightLeft size={18} className="mx-auto mb-1 opacity-80" />
                <p className="text-sm font-bold mt-1">{signingOrder === 'SEQUENTIAL' ? 'Séquentiel' : 'Parallèle'}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-70">Ordre</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-5">
              {/* Documents */}
              <Card padding="md">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-dark">Documents</h3>
                </div>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 bg-bg rounded-xl">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-txt truncate">{doc.name}</p>
                        <p className="text-xs text-txt-muted">{doc.size} — {doc.pages} page{doc.pages > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Signatories */}
              <Card padding="md">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-dark">Signataires</h3>
                </div>
                <div className="space-y-2">
                  {signatories.map((sig, idx) => {
                    const color = SIGNATORY_COLORS[idx % SIGNATORY_COLORS.length];
                    const sigFields = fields.filter((f) => f.signatoryId === sig.id);
                    return (
                      <div key={sig.id} className="p-3 bg-bg rounded-xl">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: color }}
                          >
                            {sig.orderIndex}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-txt">
                              {sig.firstName} {sig.lastName}
                            </p>
                            <p className="text-xs text-txt-muted truncate">{sig.email}</p>
                          </div>
                          <span className="text-[10px] font-semibold uppercase px-2 py-1 rounded-full" style={{ backgroundColor: color + '15', color }}>
                            {sig.role === 'SIGNER' ? 'Signataire' : sig.role === 'APPROVER' ? 'Approbateur' : 'Copie'}
                          </span>
                        </div>
                        {sigFields.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2 ml-12">
                            {sigFields.map((f) => (
                              <span
                                key={f.id}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-md"
                                style={{ backgroundColor: color + '15', color }}
                              >
                                {f.type === 'SIGNATURE' ? 'Signature' : f.type === 'DATE' ? 'Date' : f.type === 'INITIALS' ? 'Initiales' : f.type === 'TEXT' ? 'Texte' : 'Case'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Options summary (read-only recap of step 1 choices) */}
              <Card padding="md">
                <div className="flex items-center gap-2 mb-4">
                  <SettingsIcon size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-dark">Options</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-bg rounded-xl">
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft size={14} className="text-txt-muted" />
                      <span className="text-sm text-txt">Ordre</span>
                    </div>
                    <span className="text-sm font-medium text-txt">
                      {signingOrder === 'SEQUENTIAL' ? 'Séquentiel' : 'Parallèle'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-bg rounded-xl">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-txt-muted" />
                      <span className="text-sm text-txt">Expiration</span>
                    </div>
                    <span className={clsx('text-sm font-medium', expirationEnabled ? 'text-txt' : 'text-txt-muted')}>
                      {expirationEnabled ? (expiresAt || 'Date non définie') : 'Désactivée'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-bg rounded-xl">
                    <div className="flex items-center gap-2">
                      <RefreshCw size={14} className="text-txt-muted" />
                      <span className="text-sm text-txt">Relances</span>
                    </div>
                    <span className={clsx('text-sm font-medium', remindersEnabled ? 'text-txt' : 'text-txt-muted')}>
                      {remindersEnabled ? `Tous les ${reminderDays}j` : 'Désactivées'}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Message */}
              <Card padding="md">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={16} className="text-primary" />
                  <h3 className="text-sm font-semibold text-dark">Message aux signataires</h3>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ajoutez un message personnalisé qui sera inclus dans l'email d'invitation..."
                  rows={4}
                  className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt placeholder:text-txt-muted rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
                />
              </Card>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-success" />
          </div>
          <h2 className="text-xl font-bold text-dark mb-2">Enveloppe envoyée !</h2>
          <p className="text-sm text-txt-secondary mb-6">
            Votre enveloppe a été envoyée avec succès aux {signatories.length} signataire{signatories.length > 1 ? 's' : ''}.
            Ils recevront un email avec le lien de signature.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/envelopes')}>
              Voir mes enveloppes
            </Button>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Tableau de bord
            </Button>
          </div>
        </div>
      )}

      {/* Navigation bar — fixed bottom */}
      {step < 4 && (
        <div className="fixed bottom-0 left-[250px] right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between px-6 py-3">
            <div>
              {step > 0 ? (
                <Button variant="outline" icon={ChevronLeft} onClick={handlePrev}>
                  Précédent
                </Button>
              ) : (
                <Button variant="outline" onClick={() => navigate('/envelopes')}>
                  Annuler
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-txt-muted">
              Étape {step + 1} sur {STEPS.length}
            </div>
            <div className="flex items-center gap-3">
              {sendError && (
                <span className="text-danger text-sm font-medium max-w-xs truncate">{sendError}</span>
              )}
              <Button
                variant={step === 3 ? 'accent' : 'primary'}
                icon={step === 3 ? (sending ? Loader2 : Send) : ChevronRight}
                onClick={handleNext}
                disabled={!canNext() || sending}
              >
                {step === 3 ? (sending ? 'Envoi en cours...' : 'Envoyer') : 'Suivant'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom spacer so content isn't hidden behind the fixed bar */}
      {step < 4 && <div className="h-20" />}
    </div>
  );
}
