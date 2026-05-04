import { useState } from 'react';
import LandingA from './LandingA';
import LandingB from './LandingB';
import LandingC from './LandingC';

const versions = [
  { key: 'A', label: 'A — Hero immersif + Social Proof', color: '#0083BF' },
  { key: 'B', label: 'B — SaaS minimaliste + FAQ', color: '#4E901F' },
  { key: 'C', label: 'C — Conversion-first + Avant/Après', color: '#E67E22' },
] as const;

type VersionKey = typeof versions[number]['key'];

export default function Landing() {
  const [version, setVersion] = useState<VersionKey>('A');

  return (
    <>
      {/* Sélecteur de version — barre fixe en haut */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-dark/95 backdrop-blur-sm text-white px-4 py-2.5 flex items-center justify-center gap-3 shadow-lg">
        <span className="text-xs font-medium text-white/60 mr-2 hidden sm:inline">Version :</span>
        {versions.map((v) => (
          <button
            key={v.key}
            onClick={() => setVersion(v.key)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border"
            style={{
              backgroundColor: version === v.key ? v.color : 'transparent',
              borderColor: version === v.key ? v.color : 'rgba(255,255,255,0.2)',
              color: version === v.key ? '#fff' : 'rgba(255,255,255,0.7)',
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Spacer pour compenser la barre fixe */}
      <div className="h-11" />

      {/* Rendu de la version sélectionnée */}
      {version === 'A' && <LandingA />}
      {version === 'B' && <LandingB />}
      {version === 'C' && <LandingC />}
    </>
  );
}
