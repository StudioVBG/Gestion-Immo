/**
 * Tests unitaires - Rate Limiting
 * 
 * Sources:
 * - Vitest: https://vitest.dev/guide/
 * - Rate Limiting Patterns: https://en.wikipedia.org/wiki/Rate_limiting
 */

import { describe, it, expect, beforeEach } from "vitest";

// Simuler le rate limiter
function createRateLimiter(windowMs: number, maxRequests: number) {
  const store: Record<string, { count: number; resetAt: number }> = {};

  return (identifier: string) => {
    const now = Date.now();
    const key = identifier;
    const record = store[key];

    if (record && record.resetAt < now) {
      delete store[key];
    }

    const current = store[key];

    if (!current) {
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
      return {
        allowed: false,
        remaining: 0,
        resetAt: current.resetAt,
      };
    }

    current.count++;
    return {
      allowed: true,
      remaining: maxRequests - current.count,
      resetAt: current.resetAt,
    };
  };
}

describe("Rate Limiting", () => {
  let limiter: ReturnType<typeof createRateLimiter>;

  beforeEach(() => {
    // Rate limiter pour paiements: 5 requêtes/minute
    limiter = createRateLimiter(60 * 1000, 5);
  });

  it("Autoriser les 5 premières requêtes", () => {
    for (let i = 0; i < 5; i++) {
      const result = limiter("user-123");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5 - i - 1);
    }
  });

  it("Bloquer la 6ème requête", () => {
    // Faire 5 requêtes
    for (let i = 0; i < 5; i++) {
      limiter("user-123");
    }

    // La 6ème devrait être bloquée
    const result = limiter("user-123");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("Différencier les utilisateurs", () => {
    // User 1 fait 5 requêtes
    for (let i = 0; i < 5; i++) {
      limiter("user-1");
    }

    // User 2 devrait pouvoir faire des requêtes
    const result = limiter("user-2");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("Rate limiting API: 60 requêtes/minute", () => {
    const apiLimiter = createRateLimiter(60 * 1000, 60);
    
    for (let i = 0; i < 60; i++) {
      const result = apiLimiter("user-123");
      expect(result.allowed).toBe(true);
    }

    const blocked = apiLimiter("user-123");
    expect(blocked.allowed).toBe(false);
  });

  it("Rate limiting Upload: 10 requêtes/minute", () => {
    const uploadLimiter = createRateLimiter(60 * 1000, 10);
    
    for (let i = 0; i < 10; i++) {
      const result = uploadLimiter("user-123");
      expect(result.allowed).toBe(true);
    }

    const blocked = uploadLimiter("user-123");
    expect(blocked.allowed).toBe(false);
  });
});

