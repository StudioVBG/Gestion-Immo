// Service pour l'intégration Stripe
// Note: Nécessite l'installation de stripe: npm install stripe

import type { Payment, Invoice } from "@/lib/types";

export interface CreatePaymentIntentData {
  invoiceId: string;
  amount: number; // en centimes
  currency?: string;
}

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
}

export class StripeService {
  private config: StripeConfig | null = null;

  constructor() {
    // Les clés Stripe doivent être dans les variables d'environnement
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ) {
      this.config = {
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY || "",
      };
    }
  }

  async createPaymentIntent(data: CreatePaymentIntentData) {
    // Cette fonction devrait appeler une API route Next.js qui utilise la clé secrète
    // Pour des raisons de sécurité, on ne peut pas utiliser la clé secrète côté client
    const response = await fetch("/api/payments/create-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create payment intent");
    }

    return await response.json();
  }

  async confirmPayment(paymentIntentId: string) {
    const response = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentIntentId }),
    });

    if (!response.ok) {
      throw new Error("Failed to confirm payment");
    }

    return await response.json();
  }
}

export const stripeService = new StripeService();

