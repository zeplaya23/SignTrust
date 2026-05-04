/**
 * Extrait un message lisible depuis n'importe quel type d'erreur axios / fetch.
 * Gère : erreurs réseau, validation Spring (errors[]), {message}, {error},
 * statuts HTTP (400, 401, 403, 404, 409, 422, 429, 500, 503).
 */
type AxiosLikeError = {
  code?: string;
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
      errors?:
        | Array<{ field?: string; defaultMessage?: string; message?: string }>
        | Record<string, string | string[]>;
      detail?: string;
    };
  };
};

export function getErrorMessage(err: unknown, fallback = 'Une erreur est survenue. Réessayez.'): string {
  const e = err as AxiosLikeError;

  // Réseau / offline
  if (e.code === 'ERR_NETWORK' || (!e.response && /Network/i.test(e.message ?? ''))) {
    return 'Connexion impossible. Vérifiez votre connexion internet.';
  }
  if (e.code === 'ECONNABORTED') {
    return 'La requête a pris trop de temps. Réessayez.';
  }

  const data = e.response?.data;
  if (data) {
    // Validation Spring : { errors: [{ defaultMessage: '...' }] }
    if (Array.isArray(data.errors)) {
      const messages = data.errors
        .map((er) => er.defaultMessage || er.message)
        .filter((m): m is string => !!m);
      if (messages.length) return messages.join(' · ');
    }
    // Validation Spring alt : { errors: { email: '...', phone: '...' } }
    if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
      const messages = Object.values(data.errors)
        .flatMap((v) => (Array.isArray(v) ? v : [v]))
        .filter((m): m is string => typeof m === 'string' && !!m);
      if (messages.length) return messages.join(' · ');
    }
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (data.detail) return data.detail;
  }

  switch (e.response?.status) {
    case 400: return 'Données invalides. Vérifiez les informations saisies.';
    case 401: return 'Identifiants incorrects.';
    case 403: return 'Action non autorisée.';
    case 404: return 'Ressource introuvable.';
    case 409: return 'Cet email ou téléphone est déjà utilisé.';
    case 422: return 'Format invalide. Vérifiez vos saisies.';
    case 429: return 'Trop de tentatives. Patientez quelques instants.';
    case 500: return 'Erreur serveur. Réessayez dans un instant.';
    case 502:
    case 503:
    case 504: return 'Service temporairement indisponible.';
  }

  return fallback;
}
