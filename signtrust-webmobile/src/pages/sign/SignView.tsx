import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pdfjs } from 'react-pdf';
import { signService } from '../../services/signService';
import { api } from '../../services/api';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import Sheet from '../../components/ui/Sheet';
import SignaturePad, { type SignaturePadHandle } from '../../components/sign/SignaturePad';
import { toast } from '../../components/ui/Toast';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export default function SignView() {
  const { token } = useParams();
  const nav = useNavigate();
  const padRef = useRef<SignaturePadHandle>(null);
  const [pad, setPad] = useState(false);
  const [reject, setReject] = useState(false);
  const [reason, setReason] = useState('');
  const [signing, setSigning] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [pages, setPages] = useState<string[]>([]);

  // OTP — déclenché APRÈS que la signature soit tracée et validée par l'utilisateur
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const { data: env } = useQuery({
    queryKey: ['sign-info', token],
    queryFn: () => signService.getEnvelopeByToken(token!),
    enabled: !!token,
  });

  // Rendu PDF.js du 1er document (l'enveloppe a généralement 1 seul PDF combiné)
  useEffect(() => {
    if (!env || !env.documents.length || !token) return;
    let cancelled = false;
    setPages([]);

    (async () => {
      try {
        const doc = env.documents[0];
        // L'endpoint sign accepte le token en URL — pas besoin d'auth Bearer ici
        const resp = await api.get(`/sign/${token}/documents/${doc.id}`, {
          responseType: 'blob',
        });
        const blob: Blob = resp.data;
        const ab = await blob.arrayBuffer();
        if (cancelled) return;

        const pdf = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
        if (cancelled) { pdf.destroy(); return; }
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const targetWidth = Math.min(window.innerWidth - 16, 480);
        const out: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) { pdf.destroy(); return; }
          const page = await pdf.getPage(i);
          const baseVp = page.getViewport({ scale: 1 });
          const scale = targetWidth / baseVp.width;
          const vp = page.getViewport({ scale: scale * dpr });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(vp.width);
          canvas.height = Math.floor(vp.height);
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('canvas');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
          out.push(canvas.toDataURL('image/jpeg', 0.85));
          setPages([...out]);
        }
        pdf.destroy();
      } catch {
        // on laisse pages vide → fallback sans aperçu
      }
    })();

    return () => { cancelled = true; };
  }, [env, token]);

  // Étape 1 : valider le tracé → ferme le pad, montre l'aperçu dans les overlays
  const onSignaturePadValidate = () => {
    const sig = padRef.current?.toBase64();
    if (!sig) { toast('Veuillez signer d\'abord', 'error'); return; }
    setSignaturePreview(`data:image/png;base64,${sig}`);
    setPad(false);
  };

  // Étape 2 : "Valider la signature" → envoie l'OTP au signataire et ouvre la sheet
  const startOtp = async () => {
    if (!signaturePreview) { toast('Veuillez signer d\'abord', 'error'); return; }
    setSendingOtp(true);
    try {
      await signService.sendOtp(token!);
      setOtpCode('');
      setOtpOpen(true);
      toast('Code envoyé par email', 'success');
    } catch {
      toast('Échec de l\'envoi du code', 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  // Étape 3 : vérifier l'OTP puis envoyer la signature
  const confirmOtpAndSign = async () => {
    if (otpCode.length !== 6) { toast('Code à 6 chiffres requis', 'error'); return; }
    setVerifying(true);
    try {
      await signService.verifyOtp(token!, otpCode);
    } catch {
      toast('Code invalide', 'error');
      setVerifying(false);
      return;
    }

    // OTP OK → on envoie la signature
    setSigning(true);
    try {
      const sig = signaturePreview!.split(',')[1]; // retire le préfixe data:image/png;base64,
      await signService.sign(token!, sig);
      setOtpOpen(false);
      nav('/sign/success');
    } catch {
      toast('Échec de la signature', 'error');
      setSigning(false);
      setVerifying(false);
    }
  };

  const submitReject = async () => {
    try {
      await signService.reject(token!, reason);
      toast('Signature refusée', 'info');
      setReject(false);
      nav('/sign/success');
    } catch {
      toast('Erreur', 'error');
    }
  };

  if (!env) return <p className="text-center text-muted py-12">Chargement…</p>;

  const fieldsForMe = env.fields ?? [];

  return (
    <div className="bg-canvas min-h-[100dvh] pb-32">
      <TopBar title={env.envelopeName} />

      <section className="px-4 pt-3">
        <div className="bg-primary-light rounded-2xl p-3 border border-primary/15 mb-3">
          <p className="text-[11px] uppercase font-semibold text-primary">Signataire</p>
          <p className="text-[15px] font-semibold text-ink mt-0.5">{env.signatoryName}</p>
          <p className="text-[13px] text-muted">{env.signatoryEmail}</p>
        </div>

        {env.message && (
          <div className="bg-white rounded-2xl p-3 border border-line mb-3">
            <p className="text-[11px] uppercase font-semibold text-muted">Message</p>
            <p className="text-[13px] text-ink mt-0.5 whitespace-pre-wrap">{env.message}</p>
          </div>
        )}

        {/* Pages avec overlays des champs */}
        {pages.length === 0 && (
          <div className="bg-white rounded-2xl py-12 flex flex-col items-center gap-2">
            <span className="w-7 h-7 rounded-full border-2 border-line border-t-primary animate-spin" />
            <p className="text-[12px] text-muted">Chargement du document…</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {pages.map((src, pageIdx) => {
            const pageFields = fieldsForMe.filter((f) => f.pageNumber === pageIdx + 1);
            return (
              <div key={pageIdx} className="relative">
                <div className="relative w-full bg-white rounded-xl overflow-hidden shadow-sm">
                  <img
                    src={src}
                    alt={`Page ${pageIdx + 1}`}
                    className="block w-full h-auto pointer-events-none"
                    draggable={false}
                  />
                  {pageFields.map((f) => (
                    <div
                      key={f.id}
                      className={`absolute rounded-md flex items-center justify-center overflow-hidden border-2 ${
                        signaturePreview
                          ? 'border-success bg-white/80'
                          : 'border-dashed border-primary bg-primary/10'
                      }`}
                      style={{
                        left: `${f.x}%`,
                        top: `${f.y}%`,
                        width: `${f.width}%`,
                        height: `${f.height}%`,
                      }}
                    >
                      {signaturePreview ? (
                        <img
                          src={signaturePreview}
                          alt="Signature"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-0.5 text-primary">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span className="text-[10px] font-bold">Signez ici</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-faint text-center mt-1">Page {pageIdx + 1}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Action bar fixe — pas de mobile-shell ici sinon min-height 100dvh casse la barre */}
      <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-line-soft px-4 pt-3 pb-3 safe-bottom z-20">
        <div className="max-w-[480px] mx-auto flex flex-col gap-2">
          {!signaturePreview ? (
            <button
              onClick={() => setPad(true)}
              className="w-full h-14 rounded-xl bg-accent text-white font-bold text-[15px] active:translate-y-px transition-transform inline-flex items-center justify-center gap-2 shadow-md shadow-accent/30"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Signer
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setPad(true)}
                className="flex-1 h-12 rounded-xl bg-white border border-line text-ink-soft font-semibold text-[14px]"
              >
                Modifier
              </button>
              <button
                onClick={startOtp}
                disabled={sendingOtp || signing}
                className="flex-[2] h-12 rounded-xl bg-success text-white font-bold text-[14px] disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-md shadow-success/30"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12l5 5 9-9" />
                </svg>
                {sendingOtp ? 'Envoi du code…' : 'Valider la signature'}
              </button>
            </div>
          )}
          <button
            onClick={() => setReject(true)}
            className="w-full h-10 rounded-lg text-danger font-semibold text-[13px]"
          >
            Refuser de signer
          </button>
        </div>
      </div>

      <Sheet open={pad} onClose={() => setPad(false)} title="Tracez votre signature">
        <SignaturePad ref={padRef} />
        <div className="flex gap-2 mt-3">
          <Button variant="outline" fullWidth onClick={() => padRef.current?.clear()}>Effacer</Button>
          <Button variant="accent" fullWidth size="lg" onClick={onSignaturePadValidate}>Valider</Button>
        </div>
        <p className="text-[12px] text-muted text-center mt-3">
          Votre signature apparaîtra à toutes les positions prévues sur le document.
        </p>
      </Sheet>

      <Sheet
        open={otpOpen}
        onClose={() => { if (!verifying && !signing) setOtpOpen(false); }}
        title="Confirmation par code"
      >
        <p className="text-[13px] text-muted mb-3">
          Pour finaliser votre signature, entrez le code à 6 chiffres reçu sur votre boîte email
          (<span className="font-semibold text-ink-soft">{env.signatoryEmail}</span>).
        </p>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
          maxLength={6}
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          className="w-full h-14 text-center text-2xl font-bold rounded-xl bg-canvas border-2 border-line focus:border-primary outline-none tracking-[0.4em]"
        />
        <Button
          variant="accent"
          fullWidth
          size="lg"
          className="mt-3"
          loading={verifying || signing}
          onClick={confirmOtpAndSign}
          disabled={otpCode.length !== 6}
        >
          {signing ? 'Apposition de la signature…' : verifying ? 'Vérification…' : 'Confirmer et signer'}
        </Button>
        <button
          type="button"
          onClick={startOtp}
          disabled={sendingOtp}
          className="mt-3 w-full text-[13px] font-semibold text-primary disabled:text-faint"
        >
          {sendingOtp ? 'Renvoi du code…' : '↻ Renvoyer le code'}
        </button>
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
