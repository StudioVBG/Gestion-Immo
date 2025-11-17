/**
 * Utilitaires pour gérer les URLs de redirection
 * Détecte automatiquement l'URL correcte selon l'environnement
 */

/**
 * Obtient l'URL de base de l'application
 * En production sur Vercel, utilise l'URL Vercel
 * En développement, utilise localhost
 */
export function getAppUrl(): string {
  // En production sur Vercel, utiliser l'URL Vercel depuis les headers
  if (typeof window !== "undefined") {
    // Côté client
    const hostname = window.location.hostname;
    
    // Si on est sur Vercel (production)
    if (hostname.includes("vercel.app") || hostname.includes("gestion-immo-nine")) {
      return `https://${hostname}`;
    }
    
    // Sinon, utiliser l'URL actuelle (localhost en dev)
    return window.location.origin;
  }
  
  // Côté serveur
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // En production sur Vercel, utiliser VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Fallback par défaut
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Obtient l'URL de callback pour l'authentification
 */
export function getAuthCallbackUrl(): string {
  return `${getAppUrl()}/auth/callback`;
}

/**
 * Obtient l'URL de redirection pour la réinitialisation de mot de passe
 */
export function getResetPasswordUrl(): string {
  return `${getAppUrl()}/auth/reset-password`;
}

