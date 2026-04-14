import { CreditCard, Smartphone, Building2 } from 'lucide-react';
import clsx from 'clsx';
import type { PaymentMethod } from '../../types/subscription';

interface PaymentMethodTabsProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

const methods: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: 'card', label: 'Carte bancaire', icon: CreditCard },
  { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
  { id: 'virement', label: 'Virement bancaire', icon: Building2 },
];

export default function PaymentMethodTabs({ selected, onSelect }: PaymentMethodTabsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {methods.map(({ id, label, icon: Icon }) => {
        const isSelected = selected === id;
        return (
          <div
            key={id}
            onClick={() => onSelect(id)}
            className={clsx(
              'rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center gap-2 text-center',
              isSelected
                ? 'border-2 border-primary bg-primary-light'
                : 'border border-border bg-white hover:border-primary/30',
            )}
          >
            <Icon
              size={24}
              className={clsx(isSelected ? 'text-primary' : 'text-txt-secondary')}
            />
            <span
              className={clsx(
                'text-sm font-medium',
                isSelected ? 'text-primary' : 'text-txt-secondary',
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
