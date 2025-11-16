// Edge Function : Worker pour traiter les événements de l'outbox
// À déployer avec: supabase functions deploy process-outbox
// À appeler périodiquement via cron ou webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Récupérer les événements en attente (max 50 par batch)
    const { data: events, error: fetchError } = await supabaseClient
      .from("outbox")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ message: "Aucun événement à traiter", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processed = 0;
    let failed = 0;

    for (const event of events) {
      try {
        // Marquer comme en traitement
        await supabaseClient
          .from("outbox")
          .update({ status: "processing", processed_at: new Date().toISOString() } as any)
          .eq("id", event.id);

        // Traiter l'événement selon son type
        await processEvent(supabaseClient, event);

        // Marquer comme complété
        await supabaseClient
          .from("outbox")
          .update({ status: "completed" } as any)
          .eq("id", event.id);

        processed++;
      } catch (error) {
        console.error(`Erreur traitement événement ${event.id}:`, error);

        // Incrémenter le compteur de retry
        const retryCount = (event.retry_count || 0) + 1;
        const maxRetries = event.max_retries || 3;

        if (retryCount >= maxRetries) {
          // Marquer comme échoué définitivement
          await supabaseClient
            .from("outbox")
            .update({
              status: "failed",
              error_message: error.message,
            } as any)
            .eq("id", event.id);
        } else {
          // Réessayer plus tard (backoff exponentiel)
          const backoffDelay = Math.pow(2, retryCount) * 60; // 2, 4, 8 minutes
          const nextScheduled = new Date(Date.now() + backoffDelay * 1000).toISOString();

          await supabaseClient
            .from("outbox")
            .update({
              status: "pending",
              retry_count: retryCount,
              scheduled_at: nextScheduled,
              error_message: error.message,
            } as any)
            .eq("id", event.id);
        }

        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        failed,
        total: events.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processEvent(supabase: any, event: any) {
  const { event_type, payload } = event;

  switch (event_type) {
    // Notifications
    case "Rent.InvoiceIssued":
      await sendNotification(supabase, {
        type: "invoice_issued",
        user_id: payload.tenant_id,
        title: "Nouvelle facture de loyer",
        message: `Une facture de ${payload.montant_total}€ a été émise pour ${payload.month}`,
        metadata: { invoice_id: payload.invoice_id },
      });
      break;

    case "Payment.Succeeded":
      await sendNotification(supabase, {
        type: "payment_succeeded",
        user_id: payload.tenant_id,
        title: "Paiement confirmé",
        message: `Votre paiement de ${payload.amount}€ a été confirmé`,
        metadata: { payment_id: payload.payment_id },
      });
      break;

    case "Ticket.Opened":
      await sendNotification(supabase, {
        type: "ticket_opened",
        user_id: payload.owner_id,
        title: "Nouveau ticket",
        message: `Un nouveau ticket a été ouvert: ${payload.title}`,
        metadata: { ticket_id: payload.ticket_id },
      });
      break;

    case "Lease.Activated":
      await sendNotification(supabase, {
        type: "lease_activated",
        user_id: payload.tenant_id,
        title: "Bail activé",
        message: "Votre bail a été activé avec succès",
        metadata: { lease_id: payload.lease_id },
      });
      break;

    // Calcul d'âge depuis OCR
    case "application.ocr.completed":
      if (payload.extracted_fields?.birthdate) {
        await calculateAndStoreAge(supabase, payload.application_id, payload.extracted_fields.birthdate);
      }
      break;

    // Génération automatique de quittance après paiement
    case "Payment.Succeeded":
      if (payload.invoice_id) {
        await generateReceiptAutomatically(supabase, payload.invoice_id, payload.payment_id);
      }
      break;

    // Autres événements (à étendre selon besoins)
    default:
      console.log(`Événement non géré: ${event_type}`);
  }
}

async function sendNotification(supabase: any, notification: any) {
  // Créer la notification dans la table
  await supabase.from("notifications").insert({
    user_id: notification.user_id,
    type: notification.type,
    title: notification.title,
    body: notification.message,
    metadata: notification.metadata,
    read: false,
  } as any);

  // TODO: Envoyer email/push selon les préférences utilisateur
  // const { data: settings } = await supabase
  //   .from("notification_settings")
  //   .select("*")
  //   .eq("user_id", notification.user_id)
  //   .single();
}

async function calculateAndStoreAge(supabase: any, applicationId: string, birthdate: string) {
  // Récupérer le profile_id depuis l'application
  const { data: application } = await supabase
    .from("tenant_applications")
    .select("tenant_profile_id")
    .eq("id", applicationId)
    .single();

  if (!application) return;

  // Calculer l'âge
  const birth = new Date(birthdate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) ? age - 1 : age;

  // Stocker dans user_ages
  await supabase.from("user_ages").upsert({
    profile_id: application.tenant_profile_id,
    birthdate: birthdate,
    age: actualAge,
    source: "ocr",
    confidence: 90, // À récupérer depuis l'OCR
    extracted_at: new Date().toISOString(),
  } as any, {
    onConflict: "profile_id",
  });
}

async function generateReceiptAutomatically(supabase: any, invoiceId: string, paymentId: string) {
  // Récupérer les données de la facture
  const { data: invoice } = await supabase
    .from("invoices")
    .select(`
      *,
      lease:leases!inner(id, property:properties(adresse_complete))
    `)
    .eq("id", invoiceId)
    .single();

  if (!invoice) return;

  // Appeler l'Edge Function generate-pdf
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const functionUrl = `${supabaseUrl}/functions/v1/generate-pdf`;

  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({
      type: "receipt",
      data: {
        invoice_id: invoiceId,
        payment_id: paymentId,
        lease_id: invoice.lease_id,
        month: invoice.periode,
        montant_total: invoice.montant_total,
        montant_loyer: invoice.montant_loyer,
        montant_charges: invoice.montant_charges,
      },
    }),
  });

  if (response.ok) {
    const result = await response.json();
    // Créer le document dans la table documents
    await supabase.from("documents").insert({
      type: "quittance",
      lease_id: invoice.lease_id,
      storage_path: result.path,
      metadata: {
        invoice_id: invoiceId,
        payment_id: paymentId,
        month: invoice.periode,
      },
    } as any);
  }
}





