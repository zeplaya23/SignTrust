import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { envelopeService } from '../../services/envelopeService';
import TopBar from '../../components/layout/TopBar';
import StatusBadge from '../../components/ui/StatusBadge';
import Sheet from '../../components/ui/Sheet';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { toast } from '../../components/ui/Toast';
import PdfPreview from '../../components/document/PdfPreview';
import PdfThumbnail from '../../components/document/PdfThumbnail';

/** Traduit un action_type backend en libellé humain. */
function translateAction(action: string): string {
  const map: Record<string, string> = {
    ENVELOPE_CREATED: 'Enveloppe créée',
    ENVELOPE_UPDATED: 'Enveloppe modifiée',
    ENVELOPE_SENT: 'Enveloppe envoyée',
    ENVELOPE_COMPLETED: 'Enveloppe complète',
    ENVELOPE_CANCELLED: 'Enveloppe annulée',
    ENVELOPE_REJECTED: 'Enveloppe refusée',
    ENVELOPE_EXPIRED: 'Enveloppe expirée',
    DOCUMENT_ADDED: 'Document ajouté',
    DOCUMENT_REMOVED: 'Document supprimé',
    DOCUMENT_VIEWED: 'Document consulté',
    SIGNATORY_ADDED: 'Signataire ajouté',
    SIGNATORY_REMOVED: 'Signataire retiré',
    SIGNATORY_SIGNED: 'Signature reçue',
    SIGNATORY_REJECTED: 'Refus de signature',
    SIGNATURE_INVITATION_SENT: 'Invitation envoyée',
    SIGNATURE_REMINDER_SENT: 'Rappel envoyé',
    OTP_SENT: 'Code OTP envoyé',
    OTP_VERIFIED: 'Identité vérifiée',
  };
  return map[action] ?? action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Couleur du marqueur dans la timeline en fonction de l'action. */
function actionColor(action: string): string {
  if (action.includes('SIGNED') || action.includes('COMPLETED') || action.includes('VERIFIED')) return '#177A4B';
  if (action.includes('REJECTED') || action.includes('CANCELLED') || action.includes('EXPIRED')) return '#C0392B';
  if (action.includes('SENT') || action.includes('INVITATION') || action.includes('REMINDER')) return '#0083BF';
  return '#94A3B8';
}
import type { SignatoryRole } from '../../types/envelope';

export default function EnvelopeDetail() {
  const { id } = useParams();
  const envelopeId = Number(id);
  const nav = useNavigate();
  const qc = useQueryClient();
  const [sheet, setSheet] = useState<null | 'addSignatory' | 'upload'>(null);
  const [previewDoc, setPreviewDoc] = useState<{ id: number; name: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data: env, isLoading } = useQuery({
    queryKey: ['envelope', envelopeId],
    queryFn: () => envelopeService.getById(envelopeId),
  });

  const sendMut = useMutation({
    mutationFn: () => envelopeService.send(envelopeId),
    onSuccess: () => {
      toast('Enveloppe envoyée', 'success');
      qc.invalidateQueries({ queryKey: ['envelope', envelopeId] });
    },
    onError: () => toast('Échec de l\'envoi', 'error'),
  });

  const cancelMut = useMutation({
    mutationFn: () => envelopeService.cancel(envelopeId),
    onSuccess: () => {
      toast('Enveloppe annulée', 'success');
      qc.invalidateQueries({ queryKey: ['envelope', envelopeId] });
    },
  });

  if (isLoading || !env) {
    return (
      <>
        <TopBar title="Enveloppe" back />
        <p className="text-center text-muted py-12 text-sm">Chargement…</p>
      </>
    );
  }

  const docCountLabel = env.documents.length
    ? `${env.documents.length} PDF`
    : 'Aucun';
  const expiresLabel = env.expiresAt ? new Date(env.expiresAt).toLocaleDateString('fr-FR') : '—';

  const downloadAll = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      if (env.documents.length === 1) {
        await envelopeService.downloadDocument(envelopeId, env.documents[0].id, env.documents[0].name);
      } else if (env.documents.length > 1) {
        await envelopeService.downloadAllDocumentsZip(envelopeId, env.name);
      } else {
        toast('Aucun document à télécharger', 'error');
      }
    } catch {
      toast('Échec du téléchargement', 'error');
    } finally {
      setDownloading(false);
    }
  };
  const orderLabel = env.signingOrder === 'SEQUENTIAL' ? 'Séquentiel' : 'Parallèle';
  const firstDoc = env.documents[0];

  return (
    <div className="bg-canvas min-h-[100dvh] pb-28">
      <TopBar title={env.name} back right={<StatusBadge status={env.status} />} />

      <div className="px-4 pt-4">
        {/* Aperçu mini (style v2) — vraie 1ère page rendue, touche pour ouvrir en plein écran */}
        <div className="mb-3.5">
          {firstDoc ? (
            <PdfThumbnail
              envelopeId={env.id}
              docId={firstDoc.id}
              onClick={() => setPreviewDoc({ id: firstDoc.id, name: firstDoc.name })}
            />
          ) : (
            <div className="w-full h-[220px] bg-[#F0F0F0] rounded-xl flex items-center justify-center">
              <span className="text-[15px] text-muted">Aucun document</span>
            </div>
          )}
        </div>

        {/* Tableau métadonnées compact — uniquement l'essentiel */}
        <div className="bg-white rounded-xl border border-line px-3.5 py-1 mb-3">
          {([
            ['Documents', docCountLabel],
            ['Ordre', orderLabel],
            ['Créée le', `${new Date(env.createdAt).toLocaleDateString('fr-FR')} à ${new Date(env.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`],
            ...(env.expiresAt ? [['Expire le', expiresLabel] as [string, string]] : []),
          ] as Array<[string, string]>).map(([k, v], i, arr) => (
            <div
              key={k}
              className={`flex items-center justify-between gap-3 py-1.5 ${i < arr.length - 1 ? 'border-b border-line-soft' : ''}`}
            >
              <span className="text-[15px] text-muted shrink-0">{k}</span>
              <span className="text-[15px] font-medium text-ink text-right truncate max-w-[65%]">{v}</span>
            </div>
          ))}
        </div>

        {/* Destinataires — 1 ligne compacte par signataire */}
        {env.signatories.length > 0 && (
          <section className="mb-3">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <h2 className="text-[15px] font-bold text-ink">Destinataires ({env.signatories.length})</h2>
              {env.status === 'DRAFT' && (
                <button onClick={() => setSheet('addSignatory')} className="text-[15px] font-semibold text-primary">+ Ajouter</button>
              )}
            </div>
            <div className="bg-white rounded-xl border border-line overflow-hidden">
              {env.signatories.map((s, i, arr) => {
                const ts = s.signedAt
                  ? `Signé · ${new Date(s.signedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} ${new Date(s.signedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                  : s.status === 'REJECTED'
                    ? 'Refusé'
                    : env.status === 'SENT'
                      ? 'Invitation envoyée'
                      : 'En attente';
                const tsColor =
                  s.status === 'SIGNED' ? 'text-success'
                  : s.status === 'REJECTED' ? 'text-danger'
                  : 'text-muted';
                return (
                  <div
                    key={s.id}
                    className={`px-3 py-2 flex items-center gap-2.5 ${i < arr.length - 1 ? 'border-b border-line-soft' : ''}`}
                  >
                    <span className="w-9 h-9 rounded-full bg-primary-light text-primary inline-flex items-center justify-center font-bold text-[13px] shrink-0">
                      {s.firstName?.[0]}{s.lastName?.[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-ink truncate leading-tight">
                        {s.firstName} {s.lastName}
                        {env.signingOrder === 'SEQUENTIAL' && (
                          <span className="text-[15px] text-faint font-normal ml-1.5">#{s.orderIndex}</span>
                        )}
                      </p>
                      <p className="text-[15px] text-muted truncate">{s.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <StatusBadge status={s.status} kind="signatory" />
                      <span className={`text-[15px] ${tsColor}`}>{ts}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Historique — repliable */}
        {env.auditTrail && env.auditTrail.length > 0 && (
          <section className="mb-3">
            <button
              type="button"
              onClick={() => setHistoryOpen((o) => !o)}
              className="w-full bg-white rounded-xl border border-line px-3.5 py-2.5 flex items-center justify-between active:bg-line-soft"
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <span className="text-[15px] font-semibold text-ink-soft">
                  Historique
                  <span className="text-[15px] text-muted font-normal ml-1.5">({env.auditTrail.length} évènement{env.auditTrail.length > 1 ? 's' : ''})</span>
                </span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`text-muted transition-transform ${historyOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {historyOpen && (
              <div className="bg-white rounded-xl border border-line border-t-0 rounded-t-none px-3 pt-1 pb-3 -mt-px">
                <ol className="relative">
                  <span aria-hidden className="absolute left-[7px] top-3 bottom-2 w-px bg-line" />
                  {[...env.auditTrail]
                    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
                    .map((ev) => {
                      const dt = new Date(ev.createdAt);
                      const dateStr = dt.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
                      const timeStr = dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <li key={ev.id} className="relative pl-5 py-1.5">
                          <span
                            className="absolute left-0 top-[10px] w-[15px] h-[15px] rounded-full bg-white border-2 ring-1 ring-white"
                            style={{ borderColor: actionColor(ev.action) }}
                          />
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="text-[15px] font-semibold text-ink">{translateAction(ev.action)}</p>
                            <span className="text-[15px] text-faint shrink-0">{dateStr} · {timeStr}</span>
                          </div>
                          {ev.details && (
                            <p className="text-[15px] text-muted leading-snug mt-0.5">{ev.details}</p>
                          )}
                        </li>
                      );
                    })}
                </ol>
              </div>
            )}
          </section>
        )}

        {/* Multi-doc : liens d'accès aux autres PDF */}
        {env.documents.length > 1 && (
          <div className="bg-white rounded-xl border border-line overflow-hidden mb-3.5">
            {env.documents.map((d, i, arr) => (
              <button
                key={d.id}
                onClick={() => setPreviewDoc({ id: d.id, name: d.name })}
                className={`w-full px-3.5 py-2.5 flex items-center gap-2.5 active:bg-line-soft text-left ${i < arr.length - 1 ? 'border-b border-line-soft' : ''}`}
              >
                <span className="w-7 h-7 rounded-md bg-primary-light text-primary inline-flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </span>
                <p className="text-[15px] font-medium text-ink truncate flex-1">{d.name}</p>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-faint">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Boutons d'édition légers (DRAFT) */}
        {env.status === 'DRAFT' && (
          <div className="grid grid-cols-2 gap-2 mb-3.5">
            <button
              onClick={() => setSheet('upload')}
              className="h-12 rounded-lg bg-white border border-line text-[15px] font-semibold text-primary active:bg-primary-light inline-flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Document
            </button>
            <button
              onClick={() => setSheet('addSignatory')}
              className="h-12 rounded-lg bg-white border border-line text-[15px] font-semibold text-primary active:bg-primary-light inline-flex items-center justify-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Signataire
            </button>
          </div>
        )}

        {/* CTA principal — adapté au statut */}
        {env.status === 'DRAFT' && (
          <button
            onClick={() => sendMut.mutate()}
            disabled={!env.signatories.length || !env.documents.length || sendMut.isPending}
            className="w-full h-14 rounded-xl bg-accent text-white font-bold text-[15px] disabled:opacity-50 active:translate-y-px transition-transform"
          >
            {sendMut.isPending ? 'Envoi…' : 'Envoyer pour signature'}
          </button>
        )}
        {env.status === 'SENT' && (
          <button
            onClick={() => cancelMut.mutate()}
            className="w-full h-14 rounded-xl bg-danger text-white font-bold text-[15px] shadow-md shadow-danger/30 active:translate-y-px transition-transform inline-flex items-center justify-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 8l8 8M16 8l-8 8" />
            </svg>
            Annuler l'envoi
          </button>
        )}
        {env.status === 'COMPLETED' && (
          <button
            onClick={downloadAll}
            disabled={downloading || env.documents.length === 0}
            className="w-full h-14 rounded-xl bg-success text-white font-bold text-[15px] disabled:opacity-50 active:translate-y-px transition-transform inline-flex items-center justify-center gap-2 shadow-md shadow-success/30"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 4v12" />
              <path d="M6 10l6 6 6-6" />
              <path d="M5 20h14" />
            </svg>
            {downloading ? 'Téléchargement…' : 'Télécharger le document signé'}
          </button>
        )}
      </div>

      <Sheet open={sheet === 'addSignatory'} onClose={() => setSheet(null)} title="Nouveau signataire">
        <AddSignatoryForm envelopeId={env.id} onDone={() => { setSheet(null); qc.invalidateQueries({ queryKey: ['envelope', env.id] }); }} />
      </Sheet>

      <Sheet open={sheet === 'upload'} onClose={() => setSheet(null)} title="Ajouter un document">
        <UploadForm envelopeId={env.id} onDone={() => { setSheet(null); qc.invalidateQueries({ queryKey: ['envelope', env.id] }); }} />
      </Sheet>

      {previewDoc && (
        <PdfPreview
          envelopeId={env.id}
          docId={previewDoc.id}
          docName={previewDoc.name}
          canDownload={env.status === 'COMPLETED'}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      <button onClick={() => nav('/envelopes')} className="hidden">back</button>
    </div>
  );
}

function AddSignatoryForm({ envelopeId, onDone }: { envelopeId: number; onDone: () => void }) {
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<SignatoryRole>('SIGNER');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await envelopeService.addSignatory(envelopeId, {
        email, firstName: first, lastName: last, role, orderIndex: 1,
      });
      toast('Signataire ajouté', 'success');
      onDone();
    } catch {
      toast('Erreur d\'ajout', 'error');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Input label="Prénom" value={first} onChange={(e) => setFirst(e.target.value)} required />
      <Input label="Nom" value={last} onChange={(e) => setLast(e.target.value)} required />
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <div>
        <span className="block text-sm font-medium text-ink-soft mb-2">Rôle</span>
        <div className="grid grid-cols-3 gap-2">
          {(['SIGNER', 'APPROVER', 'CC'] as SignatoryRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`h-11 rounded-xl border text-xs font-medium ${
                role === r ? 'bg-primary-light border-primary text-primary' : 'bg-white border-line text-muted'
              }`}
            >
              {r === 'SIGNER' ? 'Signataire' : r === 'APPROVER' ? 'Approbateur' : 'En copie'}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" size="lg" fullWidth loading={loading}>Ajouter</Button>
    </form>
  );
}

function UploadForm({ envelopeId, onDone }: { envelopeId: number; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    try {
      await envelopeService.uploadDocument(envelopeId, file);
      toast('Document ajouté', 'success');
      onDone();
    } catch {
      toast('Erreur de téléversement', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="block bg-canvas rounded-2xl border-2 border-dashed border-line p-6 text-center">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="text-sm text-ink-soft">{file ? file.name : 'Choisir un PDF…'}</p>
      </label>
      <Button onClick={submit} disabled={!file} loading={loading} size="lg" fullWidth>Téléverser</Button>
    </div>
  );
}
