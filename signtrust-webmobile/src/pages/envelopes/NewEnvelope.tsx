import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { envelopeService } from '../../services/envelopeService';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { toast } from '../../components/ui/Toast';
import type { SigningOrder } from '../../types/envelope';

export default function NewEnvelope() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [order, setOrder] = useState<SigningOrder>('SEQUENTIAL');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const env = await envelopeService.create({ name, message, signingOrder: order });
      if (file) {
        await envelopeService.uploadDocument(env.id, file);
      }
      toast('Enveloppe créée', 'success');
      nav(`/envelopes/${env.id}`);
    } catch {
      toast('Impossible de créer l\'enveloppe', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <TopBar title="Nouvelle enveloppe" back />
      <form onSubmit={submit} className="px-5 py-4 flex flex-col gap-4 pb-24">
        <Input
          label="Nom de l'enveloppe"
          placeholder="Contrat de prestation…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="block">
          <span className="block text-sm font-medium text-ink-soft mb-1.5">Message (facultatif)</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Bonjour, merci de signer ce document…"
            className="w-full p-3 rounded-xl bg-white border border-line focus:border-primary outline-none text-base resize-none"
          />
        </label>

        <div>
          <span className="block text-sm font-medium text-ink-soft mb-2">Ordre de signature</span>
          <div className="grid grid-cols-2 gap-2">
            {(['SEQUENTIAL', 'PARALLEL'] as SigningOrder[]).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOrder(o)}
                className={`h-12 rounded-xl border text-sm font-medium ${
                  order === o ? 'bg-primary-light border-primary text-primary' : 'bg-white border-line text-muted'
                }`}
              >
                {o === 'SEQUENTIAL' ? 'Séquentiel' : 'Parallèle'}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted mt-1">
            {order === 'SEQUENTIAL' ? 'Signature dans l\'ordre défini.' : 'Tous les signataires en même temps.'}
          </p>
        </div>

        <div>
          <span className="block text-sm font-medium text-ink-soft mb-2">Document (PDF)</span>
          <label className="block bg-white rounded-2xl border-2 border-dashed border-line p-6 text-center active:bg-line-soft">
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <svg className="mx-auto" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 16V4M6 10l6-6 6 6" />
              <path d="M4 20h16" />
            </svg>
            <p className="mt-2 text-sm text-ink-soft font-medium">{file ? file.name : 'Téléverser un PDF'}</p>
            <p className="text-xs text-muted">Vous pourrez en ajouter d'autres ensuite.</p>
          </label>
        </div>

        <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-line-soft px-5 py-3 safe-bottom">
          <div className="mobile-shell px-0">
            <Button type="submit" size="lg" fullWidth loading={loading} disabled={!name}>
              Créer l'enveloppe
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
