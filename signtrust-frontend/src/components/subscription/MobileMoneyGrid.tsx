import clsx from 'clsx';
import type { MobileOperator } from '../../types/subscription';

interface MobileMoneyGridProps {
  selected: MobileOperator | null;
  onSelect: (operator: MobileOperator) => void;
}

const operators: { id: MobileOperator; label: string; color: string }[] = [
  { id: 'orange', label: 'Orange Money', color: '#FF6600' },
  { id: 'mtn', label: 'MTN MoMo', color: '#FFCC00' },
  { id: 'moov', label: 'Moov Money', color: '#0066CC' },
  { id: 'wave', label: 'Wave', color: '#1DC4E9' },
];

export default function MobileMoneyGrid({ selected, onSelect }: MobileMoneyGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {operators.map(({ id, label, color }) => {
        const isSelected = selected === id;
        return (
          <div
            key={id}
            onClick={() => onSelect(id)}
            className={clsx(
              'rounded-xl p-3 cursor-pointer text-center font-medium text-sm transition-all',
              isSelected ? 'border-2' : 'border border-border bg-white hover:shadow-sm',
            )}
            style={
              isSelected
                ? {
                    borderColor: color,
                    backgroundColor: `${color}1A`,
                    color,
                  }
                : { color }
            }
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}
