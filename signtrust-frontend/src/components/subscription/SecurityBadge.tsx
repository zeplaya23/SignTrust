import { Lock } from 'lucide-react';

export default function SecurityBadge() {
  return (
    <div className="bg-success-light rounded-xl p-3 flex items-center gap-3">
      <Lock size={20} className="text-success shrink-0" />
      <span className="text-sm text-success font-medium">
        Paiement sécurisé par Paystack
      </span>
      <span className="ml-auto text-xs font-semibold text-success bg-white px-2 py-0.5 rounded-md border border-success/20">
        SSL 256-bit
      </span>
    </div>
  );
}
