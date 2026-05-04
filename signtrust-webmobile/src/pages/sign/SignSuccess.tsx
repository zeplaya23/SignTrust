export default function SignSuccess() {
  return (
    <div className="mobile-shell flex flex-col bg-white min-h-[100dvh] px-6 py-12 safe-top">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-accent/15 animate-ping" />
          <span className="relative w-24 h-24 rounded-full bg-accent text-white inline-flex items-center justify-center">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12l5 5 9-9" />
            </svg>
          </span>
        </div>

        <h1 className="text-[28px] font-bold text-ink mt-7 tracking-tight">Document signé !</h1>
        <p className="text-muted mt-2.5 max-w-xs leading-relaxed">
          Votre signature a été enregistrée. Vous recevrez le document final signé par email.
        </p>

        <div className="mt-7 inline-flex items-center gap-2 bg-canvas rounded-full px-4 py-2 text-[13px] text-ink-soft">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent">
            <path d="M5 12l5 5 9-9" />
          </svg>
          Audit horodaté enregistré
        </div>
      </div>

      <p className="text-center text-[11px] text-faint pb-2">
        © Cryptoneo · DigiSign Parapheur
      </p>
    </div>
  );
}
