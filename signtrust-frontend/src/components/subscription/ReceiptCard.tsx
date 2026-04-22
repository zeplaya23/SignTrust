interface ReceiptCardProps {
  reference: string;
  plan: string;
  method: string;
  renewDate?: string;
  status: 'active' | 'discovery';
}

const statusLabels: Record<ReceiptCardProps['status'], string> = {
  active: 'Actif',
  discovery: 'Découverte',
};

export default function ReceiptCard({
  reference,
  plan,
  method,
  renewDate,
  status,
}: ReceiptCardProps) {
  const isDiscovery = status === 'discovery';

  const lines: { label: string; value: React.ReactNode }[] = [
    { label: 'Référence', value: reference },
    { label: 'Plan', value: plan },
    { label: 'Méthode', value: method },
    ...(isDiscovery
      ? [{ label: 'Essai gratuit', value: '14 jours' }]
      : [{ label: 'Prochain renouvellement', value: renewDate || '—' }]),
    {
      label: 'Statut',
      value: (
        <span className="inline-flex items-center bg-success-light text-success text-xs font-semibold px-2.5 py-1 rounded-full">
          {statusLabels[status]}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex flex-col gap-3">
        {lines.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-sm text-txt-secondary">{label}</span>
            <span className="text-sm font-medium text-txt">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
