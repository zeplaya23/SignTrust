import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLANS } from '../../config/plans';
import TopBar from '../../components/layout/TopBar';
import Button from '../../components/ui/Button';

export default function ChoosePlan() {
  const nav = useNavigate();
  const [selected, setSelected] = useState<string>('pro');

  const proceed = () => {
    nav('/subscribe/register', { state: { planId: selected } });
  };

  return (
    <div className="flex flex-col pb-32">
      <TopBar title="Choisir un plan" back />
      <div className="px-5 pt-4 flex flex-col gap-3">
        {PLANS.map((p) => {
          const active = selected === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => !p.contactOnly && setSelected(p.id)}
              className={`text-left bg-white rounded-2xl p-5 border-2 transition-colors ${
                active ? 'border-primary' : 'border-line-soft'
              }`}
            >
              {p.popular && (
                <span className="inline-block text-[10px] font-bold uppercase bg-accent text-white px-2 py-0.5 rounded-full mb-2">
                  Populaire
                </span>
              )}
              <div className="flex items-center justify-between">
                <p className="font-bold text-ink">{p.name}</p>
                <p className="text-lg font-bold" style={{ color: p.color }}>
                  {p.contactOnly ? 'Sur devis' : p.price === 0 ? 'Gratuit' : `${p.price.toLocaleString('fr-FR')} F`}
                </p>
              </div>
              <p className="text-sm text-muted mt-1">{p.description}</p>
              <ul className="mt-3 space-y-1.5">
                {p.features.slice(0, 3).map((f) => (
                  <li key={f} className="text-sm flex items-center gap-2 text-ink-soft">
                    <span className="text-accent">✓</span> {f}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <div className="fixed left-0 right-0 bottom-0 bg-white border-t border-line-soft px-5 py-3 safe-bottom">
        <div className="mobile-shell px-0">
          <Button size="lg" fullWidth onClick={proceed}>Continuer</Button>
        </div>
      </div>
    </div>
  );
}
