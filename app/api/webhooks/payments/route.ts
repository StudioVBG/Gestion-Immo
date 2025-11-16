import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/webhooks/payments - Handler pour les webhooks de paiement (Stripe/GoCardless)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const signature = request.headers.get("x-signature") || request.headers.get("stripe-signature");
    
    // Lire le body une seule fois
    const rawBody = await request.text();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Body invalide" }, { status: 400 });
    }

    // Vérifier la signature du webhook
    if (signature) {
      const { verifyStripeWebhook, verifyWebhookSignature } = await import("@/lib/middleware/webhook-verification");
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || "";
      
      const isValid = request.headers.get("stripe-signature")
        ? verifyStripeWebhook(rawBody, signature, webhookSecret)
        : verifyWebhookSignature(rawBody, signature, webhookSecret);
      
      if (!isValid) {
        return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
      }
    }

    const eventType = body.type || body.event_type;

    // Traiter selon le type d'événement
    switch (eventType) {
      case "payment_intent.succeeded":
      case "payment.succeeded": {
        const paymentIntentId = body.data?.object?.id || body.payment_intent_id;
        await handlePaymentSucceeded(supabase, paymentIntentId, body);
        break;
      }

      case "payment_intent.payment_failed":
      case "payment.failed": {
        const paymentIntentId = body.data?.object?.id || body.payment_intent_id;
        await handlePaymentFailed(supabase, paymentIntentId, body);
        break;
      }

      case "payment_intent.scheduled":
      case "payment.scheduled": {
        const paymentIntentId = body.data?.object?.id || body.payment_intent_id;
        await handlePaymentScheduled(supabase, paymentIntentId, body);
        break;
      }

      default:
        console.log("Événement non géré:", eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Erreur webhook paiement:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(supabase: any, providerIntentId: string, webhookData: any) {
  // Trouver le payment intent
  const { data: paymentIntent } = await supabase
    .from("payment_intents")
    .select("*")
    .eq("provider_intent_id", providerIntentId)
    .single();

  if (!paymentIntent) {
    console.error("Payment intent non trouvé:", providerIntentId);
    return;
  }

  // Mettre à jour le payment intent
  await supabase
    .from("payment_intents")
    .update({
      status: "succeeded",
      metadata: webhookData.data?.object || webhookData,
    } as any)
    .eq("id", paymentIntent.id);

  // Mettre à jour la part de paiement
  if (paymentIntent.payment_share_id) {
    await supabase
      .from("payment_shares")
      .update({
        status: "paid",
        amount_paid: paymentIntent.amount,
        last_event_at: new Date().toISOString(),
      } as any)
      .eq("id", paymentIntent.payment_share_id);

    // Émettre un événement
    await supabase.from("outbox").insert({
      event_type: "payment.succeeded",
      payload: {
        payment_intent_id: paymentIntent.id,
        payment_share_id: paymentIntent.payment_share_id,
        lease_id: paymentIntent.lease_id,
        amount: paymentIntent.amount,
      },
    } as any);
  }
}

async function handlePaymentFailed(supabase: any, providerIntentId: string, webhookData: any) {
  const { data: paymentIntent } = await supabase
    .from("payment_intents")
    .select("*")
    .eq("provider_intent_id", providerIntentId)
    .single();

  if (!paymentIntent) return;

  await supabase
    .from("payment_intents")
    .update({
      status: "failed",
      metadata: webhookData.data?.object || webhookData,
    } as any)
    .eq("id", paymentIntent.id);

  if (paymentIntent.payment_share_id) {
    await supabase
      .from("payment_shares")
      .update({
        status: "failed",
        last_event_at: new Date().toISOString(),
      } as any)
      .eq("id", paymentIntent.payment_share_id);

    await supabase.from("outbox").insert({
      event_type: "payment.failed",
      payload: {
        payment_intent_id: paymentIntent.id,
        payment_share_id: paymentIntent.payment_share_id,
        lease_id: paymentIntent.lease_id,
      },
    } as any);
  }
}

async function handlePaymentScheduled(supabase: any, providerIntentId: string, webhookData: any) {
  const { data: paymentIntent } = await supabase
    .from("payment_intents")
    .select("*")
    .eq("provider_intent_id", providerIntentId)
    .single();

  if (!paymentIntent) return;

  await supabase
    .from("payment_intents")
    .update({
      status: "scheduled",
      metadata: webhookData.data?.object || webhookData,
    } as any)
    .eq("id", paymentIntent.id);

  if (paymentIntent.payment_share_id) {
    await supabase
      .from("payment_shares")
      .update({
        status: "scheduled",
        last_event_at: new Date().toISOString(),
      } as any)
      .eq("id", paymentIntent.payment_share_id);

    await supabase.from("outbox").insert({
      event_type: "payment.scheduled",
      payload: {
        payment_intent_id: paymentIntent.id,
        payment_share_id: paymentIntent.payment_share_id,
        lease_id: paymentIntent.lease_id,
      },
    } as any);
  }
}

