import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  X,
  FileText,
  GripVertical,
  PlusCircle,
  Check,
  PenTool,
  Calendar,
  Type,
  Hash,
  CheckSquare,
  CheckCircle2,
  Send,
} from 'lucide-react';
import clsx from 'clsx';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
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
  const [step, setStep] = useState(0);
  const [documents, setDocuments] = useState<LocalDoc[]>([]);
  const [signatories, setSignatories] = useState<LocalSignatory[]>([]);
  const [signingOrder, setSigningOrder] = useState<SigningOrder>('SEQUENTIAL');
  const [fields, setFields] = useState<LocalField[]>([]);
  const [activeDocTab, setActiveDocTab] = useState(0);
  const [envelopeName, setEnvelopeName] = useState('');
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nextDocId = useRef(1);
  const nextSigId = useRef(1);
  const nextFieldId = useRef(1);

  // Step 1: Documents
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newDocs: LocalDoc[] = Array.from(files).map((file) => ({
      id: nextDocId.current++,
      file,
      name: file.name,
      size: formatFileSize(file.size),
      pages: Math.max(1, Math.floor(Math.random() * 10) + 1), // mock page count
    }));
    setDocuments((prev) => [...prev, ...newDocs]);
  }, []);

  const removeDocument = (id: number) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // Step 2: Signatories
  const addSignatory = () => {
    setSignatories((prev) => [
      ...prev,
      {
        id: nextSigId.current++,
        firstName: '',
        lastName: '',
        email: '',
        role: 'SIGNER',
        orderIndex: prev.length + 1,
      },
    ]);
  };

  const updateSignatory = (id: number, field: keyof LocalSignatory, value: string) => {
    setSignatories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const removeSignatory = (id: number) => {
    setSignatories((prev) => prev.filter((s) => s.id !== id).map((s, i) => ({ ...s, orderIndex: i + 1 })));
  };

  // Step 3: Fields
  const fieldTools: { type: FieldType; label: string; icon: typeof PenTool }[] = [
    { type: 'SIGNATURE', label: 'Signature', icon: PenTool },
    { type: 'DATE', label: 'Date', icon: Calendar },
    { type: 'INITIALS', label: 'Initiales', icon: Hash },
    { type: 'TEXT', label: 'Texte', icon: Type },
    { type: 'CHECKBOX', label: 'Case à cocher', icon: CheckSquare },
  ];

  const addField = (type: FieldType) => {
    if (documents.length === 0 || signatories.length === 0) return;
    const doc = documents[activeDocTab] || documents[0];
    setFields((prev) => [
      ...prev,
      {
        id: nextFieldId.current++,
        documentId: doc.id,
        signatoryId: signatories[0].id,
        type,
        pageNumber: 1,
        x: 50 + Math.random() * 200,
        y: 100 + Math.random() * 300,
        width: type === 'CHECKBOX' ? 30 : 200,
        height: type === 'CHECKBOX' ? 30 : type === 'SIGNATURE' ? 80 : 40,
      },
    ]);
  };

  const removeField = (id: number) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const canNext = () => {
    if (step === 0) return documents.length > 0;
    if (step === 1) return signatories.length > 0 && signatories.every((s) => s.email && s.firstName);
    if (step === 2) return true;
    if (step === 3) return true;
    return false;
  };

  const handleNext = () => {
    if (step === 3) {
      // Simulate sending
      setStep(4);
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
            <div className="mb-4">
              <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">
                Nom de l'enveloppe
              </label>
              <input
                type="text"
                value={envelopeName}
                onChange={(e) => setEnvelopeName(e.target.value)}
                placeholder="Ex: Contrat de bail 2026"
                className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt placeholder:text-txt-muted rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary hover:bg-primary-light/30 transition-colors cursor-pointer mb-4"
            >
              <Upload size={32} className="mx-auto text-txt-muted mb-3" />
              <p className="text-sm font-medium text-txt mb-1">
                Glissez vos fichiers ici ou cliquez pour parcourir
              </p>
              <p className="text-xs text-txt-muted">PDF, Word, Images (max 10MB)</p>
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
                        {doc.size} - {doc.pages} page{doc.pages > 1 ? 's' : ''}
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

          {/* Document preview placeholder */}
          <Card className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <FileText size={48} className="mx-auto text-txt-muted mb-3" />
              <p className="text-sm text-txt-muted">
                {documents.length > 0
                  ? 'Aperçu du document'
                  : 'Ajoutez un document pour le prévisualiser'}
              </p>
            </div>
          </Card>
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <Card padding="md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-dark">Signataires</h2>
                <Button variant="outline" size="sm" icon={PlusCircle} onClick={addSignatory}>
                  Ajouter
                </Button>
              </div>

              {signatories.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-txt-muted mb-3">Aucun signataire ajouté</p>
                  <Button variant="primary" size="sm" icon={PlusCircle} onClick={addSignatory}>
                    Ajouter un signataire
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {signatories.map((sig, idx) => (
                    <div
                      key={sig.id}
                      className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-border"
                    >
                      <GripVertical size={16} className="text-txt-muted shrink-0 cursor-grab" />
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                        style={{ backgroundColor: SIGNATORY_COLORS[idx % SIGNATORY_COLORS.length] }}
                      >
                        {sig.orderIndex}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-xs font-semibold text-txt-secondary shrink-0">
                        {(sig.firstName?.charAt(0) || '').toUpperCase()}
                        {(sig.lastName?.charAt(0) || '').toUpperCase()}
                      </div>
                      <input
                        type="text"
                        placeholder="Prénom"
                        value={sig.firstName}
                        onChange={(e) => updateSignatory(sig.id, 'firstName', e.target.value)}
                        className="flex-1 bg-white border border-border rounded-lg px-3 py-2 text-sm text-txt placeholder:text-txt-muted focus:outline-none focus:border-primary"
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
                      <select
                        value={sig.role}
                        onChange={(e) => updateSignatory(sig.id, 'role', e.target.value)}
                        className="bg-white border border-border rounded-lg px-3 py-2 text-sm text-txt focus:outline-none focus:border-primary"
                      >
                        <option value="SIGNER">Signataire</option>
                        <option value="APPROVER">Approbateur</option>
                        <option value="CC">Copie</option>
                      </select>
                      <button
                        onClick={() => removeSignatory(sig.id)}
                        className="p-1.5 rounded-lg hover:bg-danger-light text-txt-muted hover:text-danger transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right: order + summary */}
          <div className="space-y-5">
            <Card padding="md">
              <h3 className="text-sm font-semibold text-dark mb-3">Ordre de signature</h3>
              <div className="space-y-2">
                {(['SEQUENTIAL', 'PARALLEL'] as SigningOrder[]).map((order) => (
                  <label
                    key={order}
                    className={clsx(
                      'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                      signingOrder === order
                        ? 'border-primary bg-primary-light'
                        : 'border-border hover:bg-bg'
                    )}
                  >
                    <input
                      type="radio"
                      name="signingOrder"
                      value={order}
                      checked={signingOrder === order}
                      onChange={() => setSigningOrder(order)}
                      className="accent-primary"
                    />
                    <div>
                      <p className="text-sm font-medium text-txt">
                        {order === 'SEQUENTIAL' ? 'Séquentiel' : 'Parallèle'}
                      </p>
                      <p className="text-xs text-txt-muted">
                        {order === 'SEQUENTIAL'
                          ? 'Un par un, dans l\'ordre'
                          : 'Tous en même temps'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            <Card padding="md">
              <h3 className="text-sm font-semibold text-dark mb-3">Résumé</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-txt-secondary">Documents</span>
                  <span className="font-medium text-txt">{documents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-txt-secondary">Signataires</span>
                  <span className="font-medium text-txt">{signatories.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-txt-secondary">Ordre</span>
                  <span className="font-medium text-txt">
                    {signingOrder === 'SEQUENTIAL' ? 'Séquentiel' : 'Parallèle'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-3">
            {/* Document tabs */}
            {documents.length > 0 && (
              <div className="flex gap-2 mb-4">
                {documents.map((doc, i) => (
                  <button
                    key={doc.id}
                    onClick={() => setActiveDocTab(i)}
                    className={clsx(
                      'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                      activeDocTab === i
                        ? 'bg-primary text-white'
                        : 'bg-white text-txt-secondary border border-border hover:bg-bg'
                    )}
                  >
                    {doc.name}
                  </button>
                ))}
              </div>
            )}

            {/* Canvas area */}
            <Card className="min-h-[500px] relative">
              <div className="absolute inset-0 p-6">
                {/* Placed fields */}
                {fields
                  .filter((f) => documents[activeDocTab] && f.documentId === documents[activeDocTab].id)
                  .map((field) => {
                    const sigIdx = signatories.findIndex((s) => s.id === field.signatoryId);
                    const color = SIGNATORY_COLORS[sigIdx >= 0 ? sigIdx % SIGNATORY_COLORS.length : 0];
                    return (
                      <div
                        key={field.id}
                        className="absolute border-2 border-dashed rounded-lg flex items-center justify-center text-xs font-medium cursor-move group"
                        style={{
                          left: field.x,
                          top: field.y,
                          width: field.width,
                          height: field.height,
                          borderColor: color,
                          backgroundColor: color + '15',
                          color: color,
                        }}
                      >
                        {field.type === 'SIGNATURE' && 'Signature'}
                        {field.type === 'DATE' && 'Date'}
                        {field.type === 'INITIALS' && 'Initiales'}
                        {field.type === 'TEXT' && 'Texte'}
                        {field.type === 'CHECKBOX' && <CheckSquare size={14} />}
                        <button
                          onClick={() => removeField(field.id)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                {fields.length === 0 && (
                  <div className="flex items-center justify-center h-full text-txt-muted text-sm">
                    Placez les champs depuis la palette à droite
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Tool palette */}
          <div>
            <Card padding="md">
              <h3 className="text-sm font-semibold text-dark mb-4">Outils</h3>
              <div className="space-y-2">
                {fieldTools.map((tool) => (
                  <button
                    key={tool.type}
                    onClick={() => addField(tool.type)}
                    disabled={documents.length === 0 || signatories.length === 0}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-primary-light hover:border-primary transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <tool.icon size={18} className="text-primary" />
                    <span className="text-sm font-medium text-txt">{tool.label}</span>
                  </button>
                ))}
              </div>

              {signatories.length > 0 && (
                <div className="mt-5 pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
                    Signataires
                  </h4>
                  <div className="space-y-2">
                    {signatories.map((sig, idx) => (
                      <div key={sig.id} className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: SIGNATORY_COLORS[idx % SIGNATORY_COLORS.length] }}
                        />
                        <span className="text-sm text-txt truncate">
                          {sig.firstName} {sig.lastName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-2xl mx-auto">
          <Card padding="lg">
            <h2 className="text-lg font-semibold text-dark mb-6">Récapitulatif</h2>

            <div className="mb-5">
              <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">
                Nom de l'enveloppe
              </label>
              <p className="text-sm font-medium text-txt">{envelopeName || 'Sans nom'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-bg rounded-xl">
                <p className="text-xs text-txt-secondary uppercase tracking-wider mb-1">Documents</p>
                <p className="text-xl font-bold text-dark">{documents.length}</p>
              </div>
              <div className="p-4 bg-bg rounded-xl">
                <p className="text-xs text-txt-secondary uppercase tracking-wider mb-1">Signataires</p>
                <p className="text-xl font-bold text-dark">{signatories.length}</p>
              </div>
              <div className="p-4 bg-bg rounded-xl">
                <p className="text-xs text-txt-secondary uppercase tracking-wider mb-1">Champs</p>
                <p className="text-xl font-bold text-dark">{fields.length}</p>
              </div>
              <div className="p-4 bg-bg rounded-xl">
                <p className="text-xs text-txt-secondary uppercase tracking-wider mb-1">Ordre</p>
                <p className="text-xl font-bold text-dark">
                  {signingOrder === 'SEQUENTIAL' ? 'Séquentiel' : 'Parallèle'}
                </p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">
                Date d'expiration
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="bg-bg border border-border px-4 py-3 text-sm text-txt rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            <div>
              <label className="block uppercase text-[11px] font-semibold text-txt-secondary tracking-wider mb-1.5">
                Message aux signataires
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message optionnel..."
                rows={3}
                className="w-full bg-bg border border-border px-4 py-3 text-sm text-txt placeholder:text-txt-muted rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
              />
            </div>

            {/* Signatories recap */}
            <div className="mt-6 pt-5 border-t border-border">
              <h3 className="text-sm font-semibold text-dark mb-3">Signataires</h3>
              <div className="space-y-2">
                {signatories.map((sig, idx) => (
                  <div key={sig.id} className="flex items-center gap-3 p-2">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                      style={{ backgroundColor: SIGNATORY_COLORS[idx % SIGNATORY_COLORS.length] }}
                    >
                      {sig.orderIndex}
                    </span>
                    <span className="text-sm text-txt">
                      {sig.firstName} {sig.lastName}
                    </span>
                    <span className="text-sm text-txt-muted">{sig.email}</span>
                    <span className="text-xs bg-bg px-2 py-0.5 rounded text-txt-secondary font-medium">
                      {sig.role === 'SIGNER' ? 'Signataire' : sig.role === 'APPROVER' ? 'Approbateur' : 'Copie'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
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

      {/* Navigation buttons */}
      {step < 4 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <div>
            {step > 0 && (
              <Button variant="outline" onClick={handlePrev}>
                Précédent
              </Button>
            )}
          </div>
          <Button
            variant={step === 3 ? 'accent' : 'primary'}
            icon={step === 3 ? Send : undefined}
            onClick={handleNext}
            disabled={!canNext()}
          >
            {step === 3 ? 'Envoyer' : 'Suivant'}
          </Button>
        </div>
      )}
    </div>
  );
}
