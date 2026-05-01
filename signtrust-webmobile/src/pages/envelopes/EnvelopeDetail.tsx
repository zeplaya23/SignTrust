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
import type { SignatoryRole } from '../../types/envelope';

export default function EnvelopeDetail() {
  const { id } = useParams();
  const envelopeId = Number(id);
  const nav = useNavigate();
  const qc = useQueryClient();
  const [sheet, setSheet] = useState<null | 'addSignatory' | 'upload'>(null);

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

  return (
    <div className="flex flex-col pb-32">
      <TopBar
        title={env.name}
        back
        right={<StatusBadge status={env.status} />}
      />

      <section className="px-5 pt-4">
        <div className="bg-white rounded-2xl p-4 border border-line-soft">
          <p className="text-xs uppercase font-semibold text-muted">Message</p>
          <p className="text-sm text-ink mt-1">{env.message || '—'}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted">Ordre</p>
              <p className="font-medium text-ink">{env.signingOrder === 'SEQUENTIAL' ? 'Séquentiel' : 'Parallèle'}</p>
            </div>
            <div>
              <p className="text-muted">Créée le</p>
              <p className="font-medium text-ink">{new Date(env.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-ink">Documents</h2>
          {env.status === 'DRAFT' && (
            <button onClick={() => setSheet('upload')} className="text-sm text-primary font-medium">+ Ajouter</button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {env.documents.map((d) => (
            <button
              key={d.id}
              onClick={() => envelopeService.downloadDocument(env.id, d.id, d.name)}
              className="bg-white rounded-2xl p-4 border border-line-soft flex items-center gap-3 active:bg-line-soft text-left"
            >
              <span className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{d.name}</p>
                <p className="text-xs text-muted">{d.pageCount} page{d.pageCount > 1 ? 's' : ''}</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-faint">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
          {!env.documents.length && <p className="text-center text-muted text-sm py-6">Aucun document.</p>}
        </div>
      </section>

      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-ink">Signataires</h2>
          {env.status === 'DRAFT' && (
            <button onClick={() => setSheet('addSignatory')} className="text-sm text-primary font-medium">+ Ajouter</button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {env.signatories.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-4 border border-line-soft flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-line-soft flex items-center justify-center font-semibold text-muted shrink-0">
                {s.firstName?.[0]}{s.lastName?.[0]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{s.firstName} {s.lastName}</p>
                <p className="text-xs text-muted truncate">{s.email}</p>
              </div>
              <StatusBadge status={s.status} kind="signatory" />
            </div>
          ))}
          {!env.signatories.length && <p className="text-center text-muted text-sm py-6">Aucun signataire.</p>}
        </div>
      </section>

      {/* Bottom action bar */}
      {env.status === 'DRAFT' && (
        <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-line-soft px-5 py-3 safe-bottom z-20">
          <div className="mobile-shell px-0 flex gap-2">
            <Button variant="outline" fullWidth onClick={() => cancelMut.mutate()}>Annuler</Button>
            <Button
              fullWidth
              size="lg"
              onClick={() => sendMut.mutate()}
              loading={sendMut.isPending}
              disabled={!env.signatories.length || !env.documents.length}
            >
              Envoyer
            </Button>
          </div>
        </div>
      )}
      {env.status === 'SENT' && (
        <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-line-soft px-5 py-3 safe-bottom z-20">
          <div className="mobile-shell px-0">
            <Button variant="danger" fullWidth onClick={() => cancelMut.mutate()}>Annuler l'envoi</Button>
          </div>
        </div>
      )}

      <Sheet open={sheet === 'addSignatory'} onClose={() => setSheet(null)} title="Nouveau signataire">
        <AddSignatoryForm envelopeId={env.id} onDone={() => { setSheet(null); qc.invalidateQueries({ queryKey: ['envelope', env.id] }); }} />
      </Sheet>

      <Sheet open={sheet === 'upload'} onClose={() => setSheet(null)} title="Ajouter un document">
        <UploadForm envelopeId={env.id} onDone={() => { setSheet(null); qc.invalidateQueries({ queryKey: ['envelope', env.id] }); }} />
      </Sheet>

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
