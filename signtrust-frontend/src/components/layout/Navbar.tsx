import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

const navLinks = [
  { label: 'Fonctionnalités', href: '#features' },
  { label: 'Tarifs', href: '#pricing' },
  { label: 'Sécurité', href: '#security' },
];

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Logo size="md" />

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-txt-secondary hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-white text-primary border border-border hover:bg-bg px-5 py-2.5 text-sm"
          >
            Connexion
          </Link>
          <Link
            to="/subscribe/plan"
            className="rounded-xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer bg-accent text-white hover:opacity-90 px-5 py-2.5 text-sm"
          >
            Souscrire
          </Link>
        </div>
      </div>
    </nav>
  );
}
