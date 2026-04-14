import { Link } from 'react-router-dom';
import { FileCheck, Layers, Shield, Zap, Code, Users } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import PlanCard from '../components/subscription/PlanCard';
import Logo from '../components/ui/Logo';
import { PLANS } from '../config/plans';

const metrics = [
  { value: '45 000+', label: 'Documents signés' },
  { value: '99,9%', label: 'Disponibilité' },
  { value: '<5 sec', label: 'Temps de signature' },
  { value: 'eIDAS', label: 'Conforme' },
];

const features = [
  { icon: FileCheck, label: 'Signature légale' },
  { icon: Layers, label: 'Multi-documents' },
  { icon: Shield, label: 'Sécurité avancée' },
  { icon: Zap, label: 'Ultra rapide' },
  { icon: Code, label: 'API REST' },
  { icon: Users, label: 'Multi-utilisateurs' },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-dark py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            La signature électronique de confiance pour l'Afrique
          </h1>
          <p className="mt-4 text-lg text-txt-muted max-w-2xl mx-auto">
            Signez, certifiez et archivez vos documents en toute sécurité.
            Conforme aux normes eIDAS et à la réglementation UEMOA.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/subscribe/plan"
              className="rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-accent text-white hover:opacity-90 px-7 py-3 text-base"
            >
              Commencer gratuitement
            </Link>
            <Link
              to="/login"
              className="rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-transparent text-white border border-white/30 hover:bg-white/10 px-7 py-3 text-base"
            >
              Se connecter
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"
              >
                <div className="text-2xl font-bold text-accent">{m.value}</div>
                <div className="text-sm text-txt-muted mt-1">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Bar */}
      <section className="bg-white border-y border-border py-6">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 md:grid-cols-6 gap-6">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <Icon size={24} className="text-primary" />
              <span className="text-xs font-medium text-txt-secondary">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-bg py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-dark text-center mb-10">Nos offres</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <Link key={plan.id} to="/subscribe/plan" className="block">
                <PlanCard
                  plan={plan}
                  selected={false}
                  onSelect={() => {}}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="md" />
          <p className="text-sm text-txt-muted">&copy; 2026 Cryptoneo — Côte d'Ivoire</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-txt-muted hover:text-white transition-colors">
              Mentions légales
            </a>
            <a href="#" className="text-sm text-txt-muted hover:text-white transition-colors">
              CGV
            </a>
            <a href="#" className="text-sm text-txt-muted hover:text-white transition-colors">
              Confidentialité
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
