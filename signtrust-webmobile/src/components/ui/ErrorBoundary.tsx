import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  fallback?: ReactNode;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Capture toute exception runtime d'un sous-arbre React et affiche
 * un message au lieu d'une page totalement blanche.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="px-5 py-10 text-center min-h-[60vh] flex flex-col items-center justify-center">
          <span className="w-14 h-14 rounded-full bg-danger-light text-danger inline-flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v6M12 16v.5" />
            </svg>
          </span>
          <h2 className="mt-4 text-lg font-bold text-ink">Un problème est survenu</h2>
          <p className="text-sm text-muted mt-2 max-w-xs leading-relaxed">
            La page n'a pas pu être affichée. Réessayez ou retournez à l'accueil.
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-4 text-[11px] text-danger bg-danger-light p-2 rounded-lg max-w-full overflow-auto whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-2 mt-6">
            <button
              onClick={this.reset}
              className="h-11 px-4 rounded-2xl bg-primary text-white font-semibold"
            >
              Réessayer
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="h-11 px-4 rounded-2xl bg-canvas text-ink-soft font-semibold"
            >
              Accueil
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
