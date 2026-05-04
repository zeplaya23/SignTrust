import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PLANS } from '../config/plans';

const STEPS = [
  {
    title: 'Ajoutez votre PDF',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M12 18v-6" />
        <path d="M9 15l3-3 3 3" />
      </svg>
    ),
  },
  {
    title: 'Invitez les signataires',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="8" r="4" />
        <path d="M3 21c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <path d="M19 8v6M16 11h6" />
      </svg>
    ),
  },
  {
    title: 'Recevez le document signé',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
];

export default function Landing() {
  const featured = PLANS;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const pausedRef = useRef(false);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const tick = () => {
      if (pausedRef.current) return;
      const next = (indexRef.current + 1) % featured.length;
      const target = scroller.children[next] as HTMLElement | undefined;
      if (!target) return;
      scroller.scrollTo({ left: target.offsetLeft - 20, behavior: 'smooth' });
      indexRef.current = next;
      setActiveIdx(next);
    };
    const id = window.setInterval(tick, 3500);
    return () => window.clearInterval(id);
  }, [featured.length]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let resume: number | undefined;
    const onScroll = () => {
      pausedRef.current = true;
      const card = scroller.children[0] as HTMLElement | undefined;
      if (card) {
        const idx = Math.round(scroller.scrollLeft / (card.offsetWidth + 12));
        const clamped = Math.max(0, Math.min(featured.length - 1, idx));
        indexRef.current = clamped;
        setActiveIdx(clamped);
      }
      window.clearTimeout(resume);
      resume = window.setTimeout(() => { pausedRef.current = false; }, 6000);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      window.clearTimeout(resume);
    };
  }, [featured.length]);

  return (
    <div className="mobile-shell flex flex-col bg-white min-h-[100dvh]">
      {/* Header */}
      <header className="safe-top px-5 pt-4 pb-3 flex items-center justify-between border-b border-line-soft">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-lg bg-primary text-white inline-flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12l5 5 9-9" />
            </svg>
          </span>
          <p className="font-bold text-ink text-[16px]">DigiSign Parapheur</p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center text-[14px] font-bold text-primary px-4 h-10 rounded-full border-2 border-primary active:bg-primary-light"
        >
          Connexion
        </Link>
      </header>

      {/* Hero compact */}
      <section className="px-5 pt-3">
        <h1 className="text-[26px] leading-[1.15] font-bold text-ink tracking-tight">
          Signez vos documents <span className="text-primary">en toute confiance.</span>
        </h1>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {['Devis', 'Contrats', 'Bons de commande', 'NDA', 'Lettres de mission', 'Reçus'].map((t) => (
            <li
              key={t}
              className="text-[12px] font-semibold text-primary bg-primary-light px-2.5 py-1 rounded-full"
            >
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* Étapes — flèches alignées entre les icônes */}
      <section className="px-5 mt-5">
        <div className="bg-canvas rounded-3xl px-3 py-4">
          <ol className="grid grid-cols-[1fr_28px_1fr_28px_1fr] gap-y-2.5 items-center">
            {STEPS.map((s, i) => (
              <Fragment key={s.title}>
                {/* Pastille icône (Row 1) */}
                <li
                  className="flex justify-center"
                  style={{ gridColumn: i * 2 + 1, gridRow: 1 }}
                >
                  <div className="relative">
                    <span className="inline-flex w-14 h-14 rounded-2xl bg-white text-primary items-center justify-center ring-1 ring-line shadow-sm">
                      {s.icon}
                    </span>
                    <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-primary text-white text-[11px] font-bold inline-flex items-center justify-center ring-2 ring-canvas">
                      {i + 1}
                    </span>
                  </div>
                </li>

                {/* Flèche entre les icônes (Row 1) */}
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="inline-flex items-center justify-center text-primary"
                    style={{ gridColumn: i * 2 + 2, gridRow: 1 }}
                  >
                    <span className="w-1 h-1 rounded-full bg-primary/30" />
                    <span className="w-1 h-1 rounded-full bg-primary/50 mx-0.5" />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                )}

                {/* Titre (Row 2) */}
                <p
                  className="text-center text-[13.5px] font-bold text-ink leading-tight px-1"
                  style={{ gridColumn: i * 2 + 1, gridRow: 2 }}
                >
                  {s.title}
                </p>
              </Fragment>
            ))}
          </ol>
        </div>
      </section>

      {/* Plans */}
      <section className="mt-6">
        <div className="px-5 flex items-baseline justify-between mb-3">
          <h2 className="text-[13px] font-bold text-muted uppercase tracking-[0.12em]">Choisissez votre plan</h2>
          <Link to="/subscribe/plan" className="text-[12px] font-semibold text-primary">Tout voir →</Link>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory px-5 pb-3"
        >
          {featured.map((p) => {
            const popular = p.popular;
            return (
              <Link
                key={p.id}
                to="/subscribe/register"
                state={{ planId: p.id }}
                className={`relative rounded-2xl shrink-0 w-[80%] snap-start block overflow-hidden ${
                  popular
                    ? 'bg-white border-2 border-primary shadow-lg shadow-primary/15'
                    : 'bg-white border border-line shadow-sm'
                }`}
              >
                <span className="block h-1.5 w-full" style={{ backgroundColor: p.color }} aria-hidden />
                {popular && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-primary text-white px-2 py-0.5 rounded-full">
                    Populaire
                  </span>
                )}
                <div className="p-4">
                  <p className="text-[16px] font-bold text-ink">{p.name}</p>
                  <p className="text-[13px] text-muted mt-0.5 line-clamp-1">{p.description}</p>
                  <p className="text-[26px] font-bold mt-3 leading-none" style={{ color: p.color }}>
                    {p.contactOnly
                      ? <span className="text-base">Sur devis</span>
                      : p.price === 0
                        ? 'Gratuit'
                        : <>{p.price.toLocaleString('fr-FR')}<span className="text-[12px] text-muted font-medium ml-1">F/mois</span></>
                    }
                  </p>
                  <div className="my-3 h-px bg-line-soft" aria-hidden />
                  <ul className="space-y-2">
                    {p.features.slice(0, 3).map((f) => (
                      <li key={f} className="text-[13px] flex items-start gap-2 text-ink-soft">
                        <span className="w-4 h-4 rounded-full bg-accent-light text-accent-dark inline-flex items-center justify-center shrink-0 mt-0.5">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                            <path d="M5 12l5 5 9-9" />
                          </svg>
                        </span>
                        <span className="line-clamp-1">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            );
          })}
          <span aria-hidden className="shrink-0 w-2" />
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-1">
          {featured.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === activeIdx ? 'w-5 bg-primary' : 'w-1.5 bg-line'
              }`}
            />
          ))}
        </div>
      </section>

      {/* CTA sticky */}
      <div className="sticky bottom-0 bg-white border-t border-line-soft px-5 pt-3 pb-3 safe-bottom">
        <Link
          to="/subscribe/plan"
          className="h-14 rounded-2xl bg-primary text-white font-bold flex items-center justify-center gap-2 text-[16px] shadow-md shadow-primary/30 active:translate-y-px transition-transform"
        >
          Démarrer gratuitement
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14" />
            <path d="M13 6l6 6-6 6" />
          </svg>
        </Link>
        <p className="text-center text-[12px] text-faint mt-2">
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-primary font-semibold">Se connecter</Link>
          {' · '}© Cryptoneo
        </p>
      </div>
    </div>
  );
}
