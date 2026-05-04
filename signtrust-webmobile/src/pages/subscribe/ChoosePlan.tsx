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
    <div className="mobile-shell flex flex-col bg-white min-h-[100dvh] pb-28">
      <TopBar title="Choisir un plan" back />

      <div className="px-5 pt-4 flex flex-col gap-3">
        {PLANS.map((p) => {
          const active = selected === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => !p.contactOnly && setSelected(p.id)}
              className={`text-left bg-white rounded-2xl p-4 border-2 transition-colors relative overflow-hidden ${
                active ? 'border-primary shadow-md shadow-primary/15' : 'border-line'
              }`}
            >
              <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: p.color }} aria-hidden />

              {p.popular && (
                <span className="absolute top-3 right-3 inline-block text-[10px] font-bold uppercase tracking-wider bg-primary text-white px-2 py-0.5 rounded-full">
                  Populaire
                </span>
              )}

              <div className="pl-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-bold text-ink text-base">{p.name}</p>
                  <p className="text-lg font-bold" style={{ color: p.color }}>
                    {p.contactOnly ? 'Sur devis' : p.price === 0 ? 'Gratuit' : `${p.price.toLocaleString('fr-FR')} F`}
                    {p.price > 0 && !p.contactOnly && <span className="text-[11px] text-muted font-medium ml-1">/mois</span>}
                  </p>
                </div>
                <p className="text-[13px] text-muted mt-0.5">{p.description}</p>
                <ul className="mt-2.5 space-y-1.5">
                  {p.features.slice(0, 3).map((f) => (
                    <li key={f} className="text-[13px] flex items-center gap-2 text-ink-soft">
                      <span className="w-4 h-4 rounded-full bg-accent-light text-accent-dark inline-flex items-center justify-center shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                          <path d="M5 12l5 5 9-9" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* indicateur actif */}
              {active && (
                <span className="absolute right-3 bottom-3 w-6 h-6 rounded-full bg-primary text-white inline-flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12l5 5 9-9" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-0 mt-auto bg-white border-t border-line-soft px-5 pt-3 pb-3 safe-bottom">
        <Button size="lg" fullWidth onClick={proceed}>Continuer</Button>
      </div>
    </div>
  );
}
