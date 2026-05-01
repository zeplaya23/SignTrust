import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { signService } from '../../services/signService';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import Sheet from '../../components/ui/Sheet';
import SignaturePad, { type SignaturePadHandle } from '../../components/sign/SignaturePad';
import { toast } from '../../components/ui/Toast';

export default function SignView() {
  const { token } = useParams();
  const nav = useNavigate();
  const padRef = useRef<SignaturePadHandle>(null);
  const [pad, setPad] = useState(false);
  const [reject, setReject] = useState(false);
  const [reason, setReason] = useState('');
  const [signing, setSigning] = useState(false);

  const { data: env } = useQuery({
    queryKey: ['sign-info', token],
    queryFn: () => signService.getEnvelopeByToken(token!),
    enabled: !!token,
  });

  const submit = async () => {
    const sig = padRef.current?.toBase64();
    if (!sig) { toast('Veuillez signer d\'abord', 'error'); return; }
    setSigning(true);
    try {
      await signService.sign(token!, sig);
      nav('/sign/success');
    } catch {
      toast('Échec de la signature', 'error');
    } finally { setSigning(false); }
  };

  const submitReject = async () => {
    try {
      await signService.reject(token!, reason);
      toast('Signature refusée', 'info');
      setReject(false);
    } catch { toast('Erreur', 'error'); }
  };

  if (!env) return <p className="text-center text-muted py-12">Chargement…</p>;

  return (
    <div className="flex flex-col">
      <TopBar title={env.envelopeName} />

      <section className="px-5 pt-4">
        <div className="bg-primary-light rounded-2xl p-4 border border-primary/15">
          <p className="text-xs uppercase font-semibold text-primary">Signataire</p>
          <p className="text-base font-semibold text-ink mt-1">{env.signatoryName}</p>
          <p className="text-sm text-muted">{env.signatoryEmail}</p>
        </div>

        {env.message && (
          <div className="mt-3 bg-white rounded-2xl p-4 border border-line-soft">
            <p className="text-xs uppercase font-semibold text-muted">Message</p>
            <p className="text-sm text-ink mt-1 whitespace-pre-wrap">{env.message}</p>
          </div>
        )}
      </section>

      <section className="px-5 mt-6">
        <h2 className="text-base font-semibold text-ink mb-2">Documents à signer</h2>
        <div className="flex flex-col gap-2">
          {env.documents.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl p-4 border border-line-soft flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-primary-light text-primary flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{d.name}</p>
                <p className="text-xs text-muted">{d.pageCount} page{d.pageCount > 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-line-soft px-5 py-3 safe-bottom z-20">
        <div className="mobile-shell px-0 flex gap-2">
          <Button variant="outline" fullWidth onClick={() => setReject(true)}>Refuser</Button>
          <Button variant="accent" size="lg" fullWidth onClick={() => setPad(true)}>
            Signer
          </Button>
        </div>
      </div>

      <Sheet open={pad} onClose={() => setPad(false)} title="Tracez votre signature">
        <SignaturePad ref={padRef} />
        <div className="flex gap-2 mt-3">
          <Button variant="outline" fullWidth onClick={() => padRef.current?.clear()}>Effacer</Button>
          <Button variant="accent" fullWidth size="lg" loading={signing} onClick={submit}>Valider</Button>
        </div>
        <p className="text-xs text-muted text-center mt-3">
          En signant vous acceptez la valeur juridique de cette signature électronique.
        </p>
      </Sheet>

      <Sheet open={reject} onClose={() => setReject(false)} title="Refuser la signature">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Motif (facultatif)"
          className="w-full p-3 rounded-xl bg-white border border-line outline-none text-base resize-none"
        />
        <Button variant="danger" fullWidth size="lg" className="mt-3" onClick={submitReject}>Confirmer le refus</Button>
      </Sheet>
    </div>
  );
}
