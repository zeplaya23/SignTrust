import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { envelopeService } from '../../services/envelopeService';
import { useAuthStore } from '../../stores/useAuthStore';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from '../../components/ui/Toast';
import PositionFields, { type PositionedField } from '../../components/envelopes/PositionFields';

type Source = 'scan' | 'image' | 'pdf';

interface DraftSignatory {
  firstName: string;
  lastName: string;
  email: string;
}

/** Format Doc_jj-mm-aaaa-hhmmss (sans extension). */
function defaultDocName(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `Doc_${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export default function NewEnvelope() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const currentUser = useAuthStore((s) => s.user);
  const [name, setName] = useState(() => defaultDocName());
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [activeSource, setActiveSource] = useState<Source | null>(null);
  const [signingOrder, setSigningOrder] = useState<'PARALLEL' | 'SEQUENTIAL'>('PARALLEL');
  const [signatories, setSignatories] = useState<DraftSignatory[]>([]);
  const [step, setStep] = useState<'form' | 'positions'>('form');
  const [sigFirst, setSigFirst] = useState('');
  const [sigLast, setSigLast] = useState('');
  const [sigEmail, setSigEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const scanRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const addSignatory = () => {
    const first = sigFirst.trim();
    const last = sigLast.trim();
    const email = sigEmail.trim().toLowerCase();
    if (!first || !last || !email) {
      toast('Renseignez prénom, nom et email', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast('Email invalide', 'error');
      return;
    }
    if (signatories.some((s) => s.email === email)) {
      toast('Ce signataire est déjà ajouté', 'error');
      return;
    }
    setSignatories((prev) => [...prev, { firstName: first, lastName: last, email }]);
    setSigFirst('');
    setSigLast('');
    setSigEmail('');
  };

  const removeSignatory = (i: number) => {
    setSignatories((prev) => prev.filter((_, idx) => idx !== i));
  };

  const addMyselfAsSignatory = () => {
    if (!currentUser) return;
    if (signatories.some((s) => s.email === currentUser.email.toLowerCase())) {
      toast('Vous êtes déjà dans la liste', 'info');
      return;
    }
    setSignatories((prev) => [
      ...prev,
      {
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email.toLowerCase(),
      },
    ]);
  };

  const onPickPdf = (f: File | null) => {
    setImageFiles([]);
    setPdfFile(f);
  };

  const onPickImages = (files: FileList | null) => {
    if (!files || !files.length) return;
    setPdfFile(null);
    const arr = Array.from(files);
    setImageFiles((prev) => [...prev, ...arr]);
  };

  const removeImage = (i: number) => setImageFiles((prev) => prev.filter((_, idx) => idx !== i));

  const open = (which: Source) => {
    setActiveSource(which);
    if (which === 'scan') scanRef.current?.click();
    if (which === 'image') imageRef.current?.click();
    if (which === 'pdf') pdfRef.current?.click();
  };

  const backToActionMenu = () => {
    setActiveSource(null);
    setPdfFile(null);
    setImageFiles([]);
  };

  // Auto-déclenchement si ?mode=scan|image|pdf dans l'URL (depuis Dashboard)
  useEffect(() => {
    const mode = params.get('mode');
    if (mode === 'scan' || mode === 'image' || mode === 'pdf') {
      const t = setTimeout(() => open(mode as Source), 80);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const docReady = !!pdfFile || imageFiles.length > 0;


  // Continue : si signataires présents → étape de positionnement, sinon submit direct
  const onContinue = () => {
    if (!name.trim()) { toast('Donnez un nom au document', 'error'); return; }
    if (!docReady) { toast('Ajoutez d\'abord un document', 'error'); return; }
    if (signatories.length > 0) {
      setStep('positions');
    } else {
      submit([]);
    }
  };

  const submit = async (fieldPositions: PositionedField[]) => {
    if (!name.trim()) { toast('Donnez un nom au document', 'error'); return; }
    if (!docReady) { toast('Ajoutez d\'abord un document', 'error'); return; }
    setBusy(true);
    let envelopeId: number | null = null;
    try {
      const env = await envelopeService.create({
        name: name.trim(),
        message: '',
        signingOrder,
      });
      envelopeId = env.id;

      // Nom de fichier (commun)
      const safeName = name.trim().replace(/[^a-zA-Z0-9_\-.]/g, '_') || defaultDocName();
      const fname = safeName.toLowerCase().endsWith('.pdf') ? safeName : `${safeName}.pdf`;

      // Upload avec retry automatique : si 413 ou erreur, on réduit et on retente
      let uploadOk = false;
      let uploadErrorMsg = '';

      // Qualités calibrées pour impression A4 (ratio px → DPI sur A4 long bord ≈ 595 pt = 8.27 in) :
      // 1600 → ~193 DPI (impression bureautique correcte)
      // 1200 → ~145 DPI (impression écran/lecture OK)
      //  900 → ~109 DPI (lecture seule, dépannage)
      const attempts: PdfGenOpts[] = pdfFile
        ? [{}] // 1 seule tentative pour un PDF utilisateur (on ne peut pas le compresser)
        : [
            { maxDim: 1600, quality: 0.85 }, // tentative 1 : qualité impression
            { maxDim: 1200, quality: 0.75 }, // tentative 2 : si trop gros
            { maxDim: 900, quality: 0.65 },  // tentative 3 : dernier recours
          ];

      for (let i = 0; i < attempts.length; i++) {
        try {
          let file: File;
          if (pdfFile) {
            file = pdfFile;
          } else {
            const blob = await imagesToPdfBlob(imageFiles, attempts[i]);
            file = new File([blob], fname, { type: 'application/pdf' });
          }
          await envelopeService.uploadDocument(env.id, file);
          uploadOk = true;
          if (i > 0) {
            toast(`Document optimisé et envoyé (tentative ${i + 1})`, 'info');
          }
          break;
        } catch (uploadErr) {
          const e = uploadErr as { response?: { status?: number; data?: { message?: string } }; message?: string };
          const status = e.response?.status;
          const isLast = i === attempts.length - 1;

          // Si pas 413 ni erreur réseau → on n'insiste pas
          if (status && status !== 413 && status < 500) {
            uploadErrorMsg = e.response?.data?.message || `HTTP ${status}`;
            break;
          }

          if (isLast) {
            if (status === 413) {
              uploadErrorMsg = 'Document trop volumineux même après compression. Utilisez moins de pages.';
            } else {
              uploadErrorMsg = e.response?.data?.message || e.message || 'erreur réseau';
            }
          }
          // Sinon on continue la boucle (tentative plus petite)
        }
      }

      // Si l'upload a échoué après tous les retries → on annule TOUT
      if (!uploadOk) {
        toast(
          `Échec de l'envoi du document : ${uploadErrorMsg}. Aucun signataire n'a été ajouté, vous pouvez recommencer.`,
          'error',
        );
        // Rollback : on supprime l'enveloppe vide pour ne pas polluer la liste
        try {
          await envelopeService.remove(env.id);
        } catch {
          // si la suppression échoue ce n'est pas grave — l'enveloppe vide reste mais
          // l'utilisateur n'a pas perdu son travail, il peut refaire.
        }
        return; // sort du try, finally reset busy=false → l'utilisateur peut réessayer
      }

      // Ajout des signataires uniquement si upload OK
      let added = 0;
      const sigIdToBackendId = new Map<number, number>(); // index UI → id backend
      for (let i = 0; i < signatories.length; i++) {
        const s = signatories[i];
        try {
          const created = await envelopeService.addSignatory(env.id, {
            email: s.email,
            firstName: s.firstName,
            lastName: s.lastName,
            role: 'SIGNER',
            orderIndex: i + 1,
          });
          sigIdToBackendId.set(i, created.id);
          added++;
        } catch (sigErr) {
          const e = sigErr as { response?: { data?: { message?: string } } };
          toast(`Échec ajout ${s.email} : ${e.response?.data?.message || 'erreur'}`, 'error');
        }
      }

      // Récupère l'enveloppe créée pour avoir les IDs documents/signataires côté serveur
      // puis pose les champs de signature aux positions choisies par l'utilisateur.
      // ⚠ Le backend stocke les positions en POURCENTAGES (0-100), pas en points PDF.
      if (added > 0 && fieldPositions.length > 0) {
        try {
          const fullEnv = await envelopeService.getById(env.id);
          for (const fp of fieldPositions) {
            const sigId = sigIdToBackendId.get(fp.signatoryIndex);
            // L'envelope a généralement 1 seul document (PDF combiné). Tous les champs
            // y sont posés ; le pageIndex distingue les pages de ce PDF unique.
            const doc = fullEnv.documents[0];
            if (!sigId || !doc) continue;
            try {
              await envelopeService.addField(env.id, {
                documentId: doc.id,
                signatoryId: sigId,
                type: 'SIGNATURE',
                pageNumber: fp.pageIndex + 1,
                x: +(fp.relX * 100).toFixed(2),
                y: +(fp.relY * 100).toFixed(2),
                width: +(fp.relW * 100).toFixed(2),
                height: +(fp.relH * 100).toFixed(2),
              });
            } catch {
              // on continue même si un champ rate
            }
          }
        } catch {
          // si get échoue, on n'ajoute pas de champs — l'envoi se fera quand même
        }
      }

      // Envoi automatique si au moins un signataire ajouté (upload est nécessairement OK ici)
      if (added > 0) {
        try {
          await envelopeService.send(env.id);
          const orderHint = signingOrder === 'SEQUENTIAL'
            ? ' (séquentiel : 1er signataire averti)'
            : added > 1 ? ' (parallèle : tous avertis)' : '';
          toast(`Enveloppe envoyée à ${added} signataire${added > 1 ? 's' : ''}${orderHint}`, 'success');
        } catch (sendErr) {
          const e = sendErr as { response?: { data?: { message?: string } } };
          toast(`Envoi échoué : ${e.response?.data?.message || 'erreur'}. Réessayez depuis le détail.`, 'error');
        }
      } else if (signatories.length === 0) {
        toast('Enveloppe créée — ajoutez des signataires pour envoyer', 'info');
      } else {
        toast('Enveloppe créée — aucun signataire n\'a pu être ajouté', 'error');
      }
      nav(`/envelopes/${env.id}`);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast(e.response?.data?.message || e.message || 'Erreur', 'error');
      if (envelopeId) nav(`/envelopes/${envelopeId}`);
    } finally {
      setBusy(false);
    }
  };

  // Étape de positionnement des signatures
  if (step === 'positions') {
    return (
      <PositionFields
        imageFiles={imageFiles}
        pdfFile={pdfFile}
        signatories={signatories}
        onBack={() => setStep('form')}
        onConfirm={(fields) => submit(fields)}
        busy={busy}
      />
    );
  }

  return (
    <div className="bg-canvas min-h-[100dvh]">
      <TopBar title={docReady ? 'Nouvelle enveloppe' : 'Nouveau document'} back />

      {/* inputs invisibles, un par source */}
      <input
        ref={scanRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPickImages(e.target.files)}
      />
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onPickImages(e.target.files)}
      />
      <input
        ref={pdfRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => onPickPdf(e.target.files?.[0] ?? null)}
      />

      <div className="px-5 py-5 flex flex-col gap-5">
        {/* Nom */}
        <Input
          label="Nom du document"
          placeholder="Ex : Contrat de bail"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* ActionMenu (v2 style) — visible tant qu'aucune source n'est sélectionnée */}
        {!activeSource && (
          <div>
            <p className="text-[14px] text-muted mb-3">Comment souhaitez-vous ajouter votre document ?</p>
            <div className="flex flex-col gap-2.5">
              <ActionCard
                onClick={() => open('scan')}
                title="Scanner un document"
                desc="Numérisez un document papier avec l'appareil photo. Conversion PDF automatique."
                bg="bg-primary-light"
                color="text-primary"
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 3H5a2 2 0 00-2 2v2m14-4h2a2 2 0 012 2v2M3 17v2a2 2 0 002 2h2m14 0h2a2 2 0 002-2v-2M8 12h8" />
                  </svg>
                }
              />
              <ActionCard
                onClick={() => open('image')}
                title="Image vers PDF"
                desc="Sélectionnez une ou plusieurs images de votre galerie."
                bg="bg-purple-light"
                color="text-purple"
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
              <ActionCard
                onClick={() => open('pdf')}
                title="Charger un PDF"
                desc="Importez un PDF déjà présent sur votre téléphone."
                bg="bg-accent-light"
                color="text-accent-dark"
                icon={
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                }
              />
              <Link
                to="/envelopes"
                className="bg-white rounded-2xl border border-line p-4 flex items-start gap-3 active:bg-line-soft"
              >
                <span className="w-12 h-12 rounded-2xl bg-success-light text-success inline-flex items-center justify-center shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-ink">Mes enveloppes</p>
                  <p className="text-[12px] text-muted leading-snug mt-0.5">Reprendre un brouillon ou consulter mes enveloppes existantes.</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Mode "Scanner" — style v2 (primary) */}
        {activeSource === 'scan' && (
          <div>
            <button
              type="button"
              onClick={backToActionMenu}
              className="inline-flex items-center gap-1 text-[12px] text-muted mb-2 active:text-ink-soft"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Changer de source
            </button>

            <div className="bg-white rounded-2xl border-2 border-dashed border-primary/30 px-4 py-8 text-center mb-4">
              <span className="w-14 h-14 rounded-2xl bg-primary-light text-primary inline-flex items-center justify-center mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </span>
              <p className="text-[15px] font-bold text-ink">Scannez votre document</p>
              <p className="text-[12px] text-muted mt-1">Avec l'appareil photo</p>
              <button
                type="button"
                onClick={() => open('scan')}
                className="mt-3.5 px-7 h-10 rounded-xl bg-primary text-white text-[13px] font-semibold"
              >
                {imageFiles.length > 0 ? '+ Ajouter une page' : 'Ouvrir la caméra'}
              </button>
            </div>

            {imageFiles.length > 0 && (
              <>
                <p className="text-[13px] font-bold text-ink mb-2.5">
                  {imageFiles.length} page{imageFiles.length > 1 ? 's' : ''} scannée{imageFiles.length > 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {imageFiles.map((f, i) => (
                    <div
                      key={i}
                      className="relative aspect-[3/4] bg-line-soft rounded-lg border-2 border-primary overflow-hidden"
                    >
                      <img
                        src={URL.createObjectURL(f)}
                        alt={`Page ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold inline-flex items-center justify-center">
                        {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        aria-label="Supprimer"
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-danger text-white inline-flex items-center justify-center"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Mode "Charger PDF" — style v2 (accent) */}
        {activeSource === 'pdf' && (
          <div>
            <button
              type="button"
              onClick={backToActionMenu}
              className="inline-flex items-center gap-1 text-[12px] text-muted mb-2 active:text-ink-soft"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Changer de source
            </button>

            <div className="bg-white rounded-2xl border-2 border-dashed border-accent/30 px-4 py-8 text-center mb-4">
              <span className="w-14 h-14 rounded-2xl bg-accent-light text-accent-dark inline-flex items-center justify-center mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </span>
              <p className="text-[15px] font-bold text-ink">Importez votre PDF</p>
              <p className="text-[12px] text-muted mt-1">Document existant sur le téléphone</p>
              <button
                type="button"
                onClick={() => open('pdf')}
                className="mt-3.5 px-7 h-10 rounded-xl bg-accent text-white text-[13px] font-semibold"
              >
                {pdfFile ? 'Changer le PDF' : 'Parcourir'}
              </button>
            </div>

            {pdfFile && (
              <>
                <p className="text-[13px] font-bold text-ink mb-2">Fichier sélectionné</p>
                <div className="bg-white rounded-xl border border-line p-3.5 flex items-center gap-3 mb-4">
                  <span className="w-11 h-13 rounded-md bg-danger-light text-danger inline-flex items-center justify-center text-[11px] font-bold">PDF</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-ink truncate">{pdfFile.name}</p>
                    <p className="text-[11px] text-muted">{Math.round(pdfFile.size / 1024)} Ko</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPdfFile(null)}
                    aria-label="Retirer"
                    className="w-9 h-9 inline-flex items-center justify-center rounded-full text-danger active:bg-danger-light"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Mode "Image vers PDF" — style v2 strict */}
        {activeSource === 'image' && (
          <div>
            {/* En-tête avec bouton retour */}
            <button
              type="button"
              onClick={backToActionMenu}
              className="inline-flex items-center gap-1 text-[12px] text-muted mb-2 active:text-ink-soft"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Changer de source
            </button>

            {/* Drop zone purple style v2 */}
            <div className="bg-white rounded-2xl border-2 border-dashed border-purple/30 px-4 py-8 text-center mb-4">
              <span className="w-14 h-14 rounded-2xl bg-purple-light text-purple inline-flex items-center justify-center mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <p className="text-[15px] font-bold text-ink">Sélectionnez des images</p>
              <p className="text-[12px] text-muted mt-1">Depuis la galerie</p>
              <button
                type="button"
                onClick={() => open('image')}
                className="mt-3.5 px-7 h-10 rounded-xl bg-purple text-white text-[13px] font-semibold"
              >
                {imageFiles.length > 0 ? '+ Ajouter des images' : 'Ouvrir la galerie'}
              </button>
            </div>

            {/* Grille 3-cols purple style v2 */}
            {imageFiles.length > 0 && (
              <>
                <p className="text-[13px] font-bold text-ink mb-2.5">
                  {imageFiles.length} image{imageFiles.length > 1 ? 's' : ''} sélectionnée{imageFiles.length > 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {imageFiles.map((f, i) => (
                    <div
                      key={i}
                      className="relative aspect-[3/4] bg-line-soft rounded-lg border-2 border-purple overflow-hidden"
                    >
                      <img
                        src={URL.createObjectURL(f)}
                        alt={`Page ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-purple text-white text-[10px] font-bold inline-flex items-center justify-center">
                        {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        aria-label="Supprimer"
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-danger text-white inline-flex items-center justify-center"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Signataires */}
        {docReady && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-ink-soft">
                Signataires {signatories.length > 0 && <span className="text-muted font-normal">({signatories.length})</span>}
              </p>
              {currentUser && !signatories.some((s) => s.email === currentUser.email.toLowerCase()) && (
                <button
                  type="button"
                  onClick={addMyselfAsSignatory}
                  className="text-[12px] font-bold text-primary"
                >
                  + Moi-même
                </button>
              )}
            </div>

            {/* Mode séquentiel / parallèle (uniquement si ≥ 2 signataires) */}
            {signatories.length >= 2 && (
              <div className="bg-canvas rounded-2xl p-3 mb-3">
                <p className="text-[12px] font-semibold text-ink-soft mb-2">Mode d'envoi des invitations</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSigningOrder('PARALLEL')}
                    className={`h-10 rounded-lg text-[12px] font-bold ${
                      signingOrder === 'PARALLEL' ? 'bg-primary text-white' : 'bg-white text-muted border border-line'
                    }`}
                  >
                    Parallèle (tous)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSigningOrder('SEQUENTIAL')}
                    className={`h-10 rounded-lg text-[12px] font-bold ${
                      signingOrder === 'SEQUENTIAL' ? 'bg-primary text-white' : 'bg-white text-muted border border-line'
                    }`}
                  >
                    Séquentiel (1 par 1)
                  </button>
                </div>
                <p className="text-[10.5px] text-muted mt-1.5 leading-snug">
                  {signingOrder === 'PARALLEL'
                    ? 'Tous les signataires reçoivent l\'invitation en même temps.'
                    : 'Le signataire suivant reçoit l\'invitation après le précédent.'}
                </p>
              </div>
            )}

            {/* Liste des signataires */}
            {signatories.length > 0 && (
              <ul className="flex flex-col gap-2 mb-3">
                {signatories.map((s, i) => (
                  <li key={i} className="bg-canvas rounded-2xl p-3 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-primary text-white inline-flex items-center justify-center font-bold text-[13px] shrink-0">
                      {s.firstName[0]}{s.lastName[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{s.firstName} {s.lastName}</p>
                      <p className="text-[12px] text-muted truncate">{s.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSignatory(i)}
                      aria-label="Retirer"
                      className="w-9 h-9 inline-flex items-center justify-center rounded-full text-danger active:bg-danger-light"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Mini-formulaire d'ajout */}
            <div className="bg-canvas rounded-2xl p-3 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Prénom"
                  value={sigFirst}
                  onChange={(e) => setSigFirst(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-white border border-line focus:border-primary outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder="Nom"
                  value={sigLast}
                  onChange={(e) => setSigLast(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-white border border-line focus:border-primary outline-none text-sm"
                />
              </div>
              <input
                type="email"
                placeholder="email@exemple.com"
                value={sigEmail}
                onChange={(e) => setSigEmail(e.target.value)}
                className="h-11 px-3 rounded-xl bg-white border border-line focus:border-primary outline-none text-sm"
              />
              <button
                type="button"
                onClick={addSignatory}
                disabled={!sigFirst.trim() || !sigLast.trim() || !sigEmail.trim()}
                className="h-11 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 active:translate-y-px"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Ajouter ce signataire
              </button>
            </div>
          </div>
        )}

        <Button
          size="lg"
          fullWidth
          loading={busy}
          disabled={!docReady || !name.trim()}
          onClick={onContinue}
          className="mt-1"
        >
          {signatories.length > 0
            ? 'Continuer →'
            : 'Créer l\'enveloppe'}
        </Button>
        {docReady && signatories.length === 0 && (
          <p className="text-[11px] text-center text-faint -mt-1">
            Aucun signataire — l'enveloppe restera en brouillon.
          </p>
        )}
        {docReady && signatories.length > 0 && (
          <p className="text-[11px] text-center text-faint -mt-1">
            Étape suivante : positionner les signatures sur le document
          </p>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  onClick,
  title,
  desc,
  bg,
  color,
  icon,
}: {
  onClick: () => void;
  title: string;
  desc: string;
  bg: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white border border-line rounded-2xl p-4 flex items-start gap-3 active:bg-line-soft text-left"
    >
      <span className={`w-12 h-12 rounded-2xl ${bg} ${color} inline-flex items-center justify-center shrink-0`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-ink">{title}</p>
        <p className="text-[12px] text-muted leading-snug mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

interface PdfGenOpts {
  /** Plus grand côté autorisé (px). 1024 par défaut. */
  maxDim?: number;
  /** Qualité JPEG (0..1). 0.75 par défaut. */
  quality?: number;
}

/** Convertit une liste d'images en un seul PDF A4 multi-pages.
 *  Image embarquée en JPEG (DCTDecode) — léger pour upload mobile.
 */
async function imagesToPdfBlob(files: File[], opts: PdfGenOpts = {}): Promise<Blob> {
  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: [595, 842] });
  const W = 595;
  const H = 842;
  const margin = 16;
  const maxW = W - margin * 2;
  const maxH = H - margin * 2;

  for (let i = 0; i < files.length; i++) {
    if (i > 0) pdf.addPage([W, H]);
    const { dataUrl, w, h } = await imageToJpegDataUrl(files[i], opts);
    const ratio = Math.min(maxW / w, maxH / h);
    const renderW = w * ratio;
    const renderH = h * ratio;
    const x = (W - renderW) / 2;
    const y = (H - renderH) / 2;
    pdf.addImage(dataUrl, 'JPEG', x, y, renderW, renderH);
  }

  const blob = pdf.output('blob');
  if (!blob || blob.size < 200) throw new Error('PDF généré invalide');
  return blob;
}

async function imageToJpegDataUrl(
  file: File,
  opts: PdfGenOpts = {},
): Promise<{ dataUrl: string; w: number; h: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error(`Format non supporté : ${file.name}`));
      im.src = url;
    });

    const MAX = opts.maxDim ?? 1024;
    const Q = opts.quality ?? 0.75;

    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > MAX || h > MAX) {
      const r = Math.min(MAX / w, MAX / h);
      w = Math.round(w * r);
      h = Math.round(h * r);
    }
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponible');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return { dataUrl: canvas.toDataURL('image/jpeg', Q), w, h };
  } finally {
    URL.revokeObjectURL(url);
  }
}
