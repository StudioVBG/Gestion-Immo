import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getRateLimiterByUser, rateLimitPresets } from "@/lib/middleware/rate-limit";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Rate limiting pour les paiements
    const limiter = getRateLimiterByUser(rateLimitPresets.payment);
    const limitResult = limiter(user.id);
    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: "Trop de requêtes. Veuillez réessayer plus tard.",
          resetAt: limitResult.resetAt,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitPresets.payment.maxRequests.toString(),
            "X-RateLimit-Remaining": limitResult.remaining.toString(),
            "X-RateLimit-Reset": limitResult.resetAt.toString(),
          },
        }
      );
    }

    const body = await request.json();
    const { paymentIntentId, invoiceId } = body;

    if (!paymentIntentId || !invoiceId) {
      return NextResponse.json({ error: "paymentIntentId et invoiceId requis" }, { status: 400 });
    }

    // Intégration Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    let paymentAmount = 0;
    let paymentStatus = "succeeded";
    let paymentMethod = "cb";

    if (stripeSecretKey) {
      // TODO: Décommenter quand Stripe est configuré
      // const stripe = require('stripe')(stripeSecretKey);
      // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      // 
      // if (paymentIntent.status !== 'succeeded') {
      //   return NextResponse.json(
      //     { error: `Paiement ${paymentIntent.status}` },
      //     { status: 400 }
      //   );
      // }
      // 
      // paymentAmount = paymentIntent.amount / 100; // Convertir centimes en euros
      // paymentStatus = paymentIntent.status;
      // paymentMethod = paymentIntent.payment_method_types[0] || "cb";
    }

    // Créer l'enregistrement de paiement
    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        invoice_id: invoiceId,
        montant: paymentAmount,
        moyen: paymentMethod,
        provider_ref: paymentIntentId,
        statut: paymentStatus,
        date_paiement: new Date().toISOString(),
      } as any)
      .select()
      .single();

    if (error) throw error;

    // Mettre à jour le statut de la facture
    await supabase
      .from("invoices")
      .update({ statut: "paid" } as any)
      .eq("id", invoiceId as any);

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 });
  }
}

