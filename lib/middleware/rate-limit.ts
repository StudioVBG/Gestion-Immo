/**
 * Rate limiting simple en mémoire
 * Pour la production, utiliser Redis ou un service dédié
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  windowMs: number; // Fenêtre de temps en millisecondes
  maxRequests: number; // Nombre maximum de requêtes
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests } = options;

  return (identifier: string): { allowed: boolean; remaining: number; resetAt: number } => {
    const now = Date.now();
    const key = identifier;
    const record = store[key];

    // Nettoyer les anciennes entrées
    if (record && record.resetAt < now) {
      delete store[key];
    }

    const current = store[key];

    if (!current) {
      // Première requête
      store[key] = {
        count: 1,
        resetAt: now + windowMs,
      };
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: now + windowMs,
      };
    }

    if (current.count >= maxRequests) {
      // Limite atteinte
      return {
        allowed: false,
        remaining: 0,
        resetAt: current.resetAt,
      };
    }

    // Incrémenter le compteur
    current.count++;
    return {
      allowed: true,
      remaining: maxRequests - current.count,
      resetAt: current.resetAt,
    };
  };
}

/**
 * Rate limiter par IP
 */
export function getRateLimiterByIP(options: RateLimitOptions) {
  const limiter = rateLimit(options);
  return (request: Request) => {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    return limiter(ip);
  };
}

/**
 * Rate limiter par utilisateur
 */
export function getRateLimiterByUser(options: RateLimitOptions) {
  const limiter = rateLimit(options);
  return (userId: string) => {
    return limiter(`user:${userId}`);
  };
}

/**
 * Presets de rate limiting
 */
export const rateLimitPresets = {
  // Limite stricte pour les paiements
  payment: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
  // Limite pour les authentifications
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  // Limite générale pour les API
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  // Limite pour les uploads
  upload: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
};

