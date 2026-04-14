import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Download } from 'lucide-react';
import Button from '../../components/ui/Button';

export default function SignSuccess() {
  const navigate = useNavigate();

  const mockHash = 'a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1';
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0] + ' UTC';

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-success-light flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={40} className="text-success" />
        </div>

        <h1 className="text-2xl font-bold text-dark mb-2">
          2 documents signés avec succès
        </h1>
        <p className="text-sm text-txt-secondary mb-6">
          Votre signature électronique a été appliquée avec succès. Un email de confirmation
          vous sera envoyé.
        </p>

        {/* Proof */}
        <div className="bg-white rounded-2xl border border-border p-5 mb-6 text-left">
          <p className="text-xs text-txt-secondary uppercase tracking-wider font-semibold mb-2">
            Preuve de signature
          </p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-txt-muted">SHA-256</p>
              <p className="text-xs font-mono text-txt break-all">{mockHash}</p>
            </div>
            <div>
              <p className="text-xs text-txt-muted">Horodatage</p>
              <p className="text-sm font-medium text-txt">{timestamp}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" icon={Download}>
            Télécharger ZIP
          </Button>
          <Button variant="primary" onClick={() => navigate('/dashboard')}>
            Retour au dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
