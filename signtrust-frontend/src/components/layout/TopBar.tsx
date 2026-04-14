import Logo from '../ui/Logo';

interface TopBarProps {
  currentStep: number;
  stepLabel: string;
}

export default function TopBar({ currentStep, stepLabel }: TopBarProps) {
  return (
    <div className="bg-white border-b border-border px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Logo size="sm" />
        <div className="w-px h-6 bg-border" />
        <span className="text-sm font-semibold text-dark">SignTrust</span>
      </div>

      <span className="text-sm text-txt-secondary">
        Étape {currentStep} sur 4 — {stepLabel}
      </span>
    </div>
  );
}
