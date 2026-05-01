export default function SignSuccess() {
  return (
    <div className="mobile-shell flex flex-col items-center justify-center px-6 py-12 text-center min-h-[100dvh]">
      <span className="w-20 h-20 rounded-full bg-accent text-white flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12l5 5 9-9" />
        </svg>
      </span>
      <h1 className="text-2xl font-bold text-ink mt-6">Document signé !</h1>
      <p className="text-muted mt-2 max-w-xs">
        Votre signature a été enregistrée. Le document signé vous sera envoyé par email.
      </p>
    </div>
  );
}
