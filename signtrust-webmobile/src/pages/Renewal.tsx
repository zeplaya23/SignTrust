import { Link } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';

export default function Renewal() {
  return (
    <div className="flex flex-col">
      <TopBar title="Renouvellement" back />
      <div className="px-5 pt-4">
        <div className="bg-warning-light border border-warning/30 rounded-2xl p-5">
          <p className="font-semibold text-warning">Abonnement expiré</p>
          <p className="text-sm text-ink-soft mt-1">Renouvelez votre plan pour continuer à signer vos documents.</p>
        </div>

        <Link
          to="/subscribe/plan"
          className="mt-6 h-14 rounded-2xl bg-primary text-white font-semibold flex items-center justify-center"
        >
          Choisir un plan
        </Link>
      </div>
    </div>
  );
}
