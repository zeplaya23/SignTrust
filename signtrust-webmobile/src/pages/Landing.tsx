import { Link } from 'react-router-dom';
import { PLANS } from '../config/plans';

export default function Landing() {
  const featuredPlans = PLANS.filter((p) => ['discovery', 'pro', 'business'].includes(p.id));

  return (
    <div className="mobile-shell flex flex-col">
      {/* Hero */}
      <header className="safe-top px-5 pt-6 pb-10 bg-primary text-white relative overflow-hidden rounded-b-[32px]">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -left-12 bottom-4 w-32 h-32 rounded-full bg-accent/30" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12l5 5 9-9" />
                </svg>
              </span>
              <span className="font-semibold tracking-tight">diSign Parapheur</span>
            </div>
            <Link to="/login" className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/15 backdrop-blur">
              Connexion
            </Link>
          </div>

          <h1 className="mt-12 text-3xl font-bold leading-tight">
            Signez vos documents<br /> en toute confiance
          </h1>
          <p className="mt-3 text-white/80 text-base">
            La signature électronique conforme eIDAS, pensée pour votre mobile.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/subscribe/plan"
              className="h-14 rounded-2xl bg-accent text-white font-semibold flex items-center justify-center shadow-lg shadow-black/10"
            >
              Démarrer gratuitement
            </Link>
            <Link
              to="/login"
              className="h-12 rounded-2xl bg-white/10 backdrop-blur text-white font-medium flex items-center justify-center border border-white/20"
            >
              J'ai déjà un compte
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="px-5 mt-8">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Pourquoi diSign</h2>
        <div className="grid grid-cols-1 gap-3">
          {[
            { icon: '🔒', title: 'Conforme eIDAS', desc: 'SES, AES et QES — légalement opposable.' },
            { icon: '⚡', title: 'Signez en 30 sec', desc: 'Recevez, ouvrez, signez, c\'est fait.' },
            { icon: '📋', title: 'Audit complet', desc: 'Piste d\'audit horodatée pour chaque action.' },
            { icon: '👥', title: 'Multi-signataires', desc: 'Séquentiel ou parallèle, à votre rythme.' },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl p-4 flex items-start gap-3 border border-line-soft">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="font-semibold text-ink">{f.title}</p>
                <p className="text-sm text-muted">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="px-5 mt-10">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Plans en vedette</h2>
        <div className="flex flex-col gap-3">
          {featuredPlans.map((p) => (
            <Link
              key={p.id}
              to="/subscribe/plan"
              className="bg-white rounded-2xl p-5 border border-line-soft block relative active:bg-line-soft"
            >
              {p.popular && (
                <span className="absolute -top-2 right-4 text-[10px] font-bold uppercase bg-accent text-white px-2.5 py-1 rounded-full">
                  Le + populaire
                </span>
              )}
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-semibold uppercase" style={{ color: p.color }}>{p.name}</p>
                <p className="text-lg font-bold text-ink">
                  {p.price === 0 ? 'Gratuit' : `${p.price.toLocaleString('fr-FR')} F`}
                  {p.price > 0 && <span className="text-xs text-muted font-normal">/mois</span>}
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
            </Link>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-5 mt-10 mb-12">
        <div className="bg-accent rounded-3xl p-6 text-white text-center">
          <p className="font-semibold text-lg">Prêt à signer plus vite ?</p>
          <p className="text-sm text-white/85 mt-1">14 jours d'essai, sans carte.</p>
          <Link to="/subscribe/plan" className="mt-4 inline-block h-12 px-6 rounded-2xl bg-white text-accent font-semibold leading-[3rem]">
            Créer mon compte
          </Link>
        </div>
        <p className="text-center text-xs text-faint mt-6">© Cryptoneo · diSign Parapheur</p>
      </section>
    </div>
  );
}
