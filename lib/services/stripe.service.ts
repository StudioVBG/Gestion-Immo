/**
 * Service Stripe pour les paiements
 * Note: Nécessite STRIPE_SECRET_KEY dans les variables d'environnement
 */

interface StripeConfig {
  secretKey: string;
  publishableKey: string;
}

class StripeService {
  private config: StripeConfig | null = null;

  constructor() {
    // Les clés Stripe doivent être dans les variables d'environnement
    if (typeof window === "undefined") {
      // Côté serveur uniquement
      this.config = {
        secretKey: process.env.STRIPE_SECRET_KEY || "",
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
      };
    }
  }

  /**
   * Créer un Payment Intent
   */
  async createPaymentIntent(params: {
    amount: number; // en centimes
    currency?: string;
    metadata?: Record<string, string>;
    customerId?: string;
  }): Promise<{ clientSecret: string; paymentIntentId: string }> {
    if (!this.config?.secretKey) {
      throw new Error("Stripe n'est pas configuré. Vérifiez STRIPE_SECRET_KEY.");
    }

    // Appel à l'API Stripe via route API Next.js
    const response = await fetch("/api/payments/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency || "eur",
        metadata: params.metadata,
        customer_id: params.customerId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la création du Payment Intent");
    }

    return response.json();
  }

  /**
   * Confirmer un paiement
   */
  async confirmPayment(paymentIntentId: string): Promise<{ status: string }> {
    const response = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_intent_id: paymentIntentId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la confirmation du paiement");
    }

    return response.json();
  }

  /**
   * Rembourser un paiement
   */
  async refundPayment(paymentIntentId: string, amount?: number): Promise<{ id: string }> {
    // TODO: Implémenter le remboursement
    throw new Error("Remboursement non implémenté");
  }
}

export const stripeService = new StripeService();

