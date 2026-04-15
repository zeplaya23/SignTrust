import { useLocation } from 'react-router-dom';
import { ShieldCheck, XCircle } from 'lucide-react';

interface LocationState {
  documentCount?: number;
  rejected?: boolean;
}

export default function SignSuccess() {
  const location = useLocation();
  const state = (location.state as LocationState) || {};
  const isRejected = state.rejected === true;
  const docCount = state.documentCount ?? 0;

  const timestamp = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isRejected) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-6">
            <XCircle size={40} className="text-danger" />
          </div>
          <h1 className="text-2xl font-bold text-dark mb-2">
            Signature refusée
          </h1>
          <p className="text-sm text-txt-secondary mb-6">
            Votre refus a été enregistré. L'expéditeur sera notifié de votre décision.
          </p>
          <div className="bg-white rounded-2xl border border-border p-5 text-left">
            <p className="text-xs text-txt-muted">Horodatage</p>
            <p className="text-sm font-medium text-txt">{timestamp}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-success-light flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={40} className="text-success" />
        </div>
        <h1 className="text-2xl font-bold text-dark mb-2">
          {docCount > 0 ? `${docCount} document${docCount > 1 ? 's' : ''} signé${docCount > 1 ? 's' : ''} avec succès` : 'Documents signés avec succès'}
        </h1>
        <p className="text-sm text-txt-secondary mb-6">
          Votre signature électronique a été appliquée avec succès. Un email de confirmation
          vous sera envoyé.
        </p>
        <div className="bg-white rounded-2xl border border-border p-5 text-left">
          <p className="text-xs text-txt-secondary uppercase tracking-wider font-semibold mb-2">
            Confirmation
          </p>
          <div>
            <p className="text-xs text-txt-muted">Horodatage</p>
            <p className="text-sm font-medium text-txt">{timestamp}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
