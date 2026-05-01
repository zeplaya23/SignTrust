import type { EnvelopeStatus, SignatoryStatus } from '../../types/envelope';
import { clsx } from 'clsx';

const ENVELOPE_LABELS: Record<EnvelopeStatus, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyée',
  COMPLETED: 'Signée',
  CANCELLED: 'Annulée',
};

const SIGNATORY_LABELS: Record<SignatoryStatus, string> = {
  PENDING: 'En attente',
  SIGNED: 'Signé',
  REJECTED: 'Refusé',
};

const STYLES: Record<string, string> = {
  DRAFT: 'bg-line-soft text-muted',
  SENT: 'bg-primary-light text-primary',
  COMPLETED: 'bg-accent-light text-accent-dark',
  CANCELLED: 'bg-danger-light text-danger',
  PENDING: 'bg-warning-light text-warning',
  SIGNED: 'bg-accent-light text-accent-dark',
  REJECTED: 'bg-danger-light text-danger',
};

interface Props {
  status: EnvelopeStatus | SignatoryStatus;
  kind?: 'envelope' | 'signatory';
}

export default function StatusBadge({ status, kind = 'envelope' }: Props) {
  const label = kind === 'envelope'
    ? ENVELOPE_LABELS[status as EnvelopeStatus] ?? status
    : SIGNATORY_LABELS[status as SignatoryStatus] ?? status;
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', STYLES[status])}>
      {label}
    </span>
  );
}
