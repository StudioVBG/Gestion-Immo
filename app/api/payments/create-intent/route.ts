import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Note: Cette route nécessite l'installation de Stripe
// npm install stripe
// import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, amount, currency = "eur" } = body;

    // TODO: Intégrer Stripe
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amount, // en centimes
    //   currency: currency,
    //   metadata: {
    //     invoiceId: invoiceId,
    //     userId: user.id,
    //   },
    // });

    // Pour l'instant, retourner une structure mockée
    return NextResponse.json({
      clientSecret: "mock_client_secret",
      paymentIntentId: "mock_payment_intent_id",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

