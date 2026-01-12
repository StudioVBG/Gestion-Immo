export const runtime = 'nodejs';

/**
 * GET /api/cron/process-sepa-payments
 *
 * Cron job pour déclencher les prélèvements SEPA automatiques
 * Exécuté le 5 de chaque mois (ou configurable par bail)
 *
 * Flux:
 * 1. Récupère les baux avec prélèvement SEPA actif
 * 2. Vérifie que le mandat SEPA est valide
 * 3. Crée la facture si elle n'existe pas
 * 4. Déclenche le prélèvement via Stripe
 * 5. Met à jour le statut et envoie les notifications
 */

import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createSepaPayment, getPaymentStatus } from "@/lib/stripe/sepa.service";
import { sendEmail } from "@/lib/services/email-service";

// Vérifier le secret CRON
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET) {
    console.warn("CRON_SECRET non configuré - accès autorisé en dev");
    return process.env.NODE_ENV === "development";
  }
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

interface SepaMandate {
  id: string;
  lease_id: string;
  stripe_customer_id: string;
  stripe_payment_method_id: string;
  stripe_mandate_id: string;
  status: string;
  iban_last4: string;
  lease: {
    id: string;
    loyer: number;
    charges_forfaitaires: number;
    jour_paiement: number;
    property_id: string;
    property: {
      id: string;
      adresse_complete: string;
      owner_id: string;
      owner: {
        id: string;
        prenom: string;
        nom: string;
        email: string;
        user_id: string;
      };
    };
    signers: Array<{
      profile_id: string;
      role: string;
      profile: {
        id: string;
        prenom: string;
        nom: string;
        email: string;
        user_id: string;
      };
    }>;
  };
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const dayOfMonth = today.getDate();

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  try {
    console.log(`[SEPA Cron] Démarrage - Jour ${dayOfMonth}, Période ${currentMonth}`);

    // 1. Récupérer les mandats SEPA actifs
    const { data: activeMandates, error: mandateError } = await supabase
      .from("sepa_mandates")
      .select(`
        id,
        lease_id,
        stripe_customer_id,
        stripe_payment_method_id,
        stripe_mandate_id,
        status,
        iban_last4,
        lease:leases (
          id,
          loyer,
          charges_forfaitaires,
          jour_paiement,
          property_id,
          property:properties (
            id,
            adresse_complete,
            owner_id,
            owner:profiles!properties_owner_id_fkey (
              id,
              prenom,
              nom,
              email,
              user_id
            )
          ),
          signers:lease_signers (
            profile_id,
            role,
            profile:profiles (
              id,
              prenom,
              nom,
              email,
              user_id
            )
          )
        )
      `)
      .eq("status", "active");

    if (mandateError) {
      throw new Error(`Erreur récupération mandats: ${mandateError.message}`);
    }

    if (!activeMandates || activeMandates.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun mandat SEPA actif",
        ...results,
      });
    }

    console.log(`[SEPA Cron] ${activeMandates.length} mandats actifs trouvés`);

    // 2. Traiter chaque mandat
    for (const mandate of activeMandates as unknown as SepaMandate[]) {
      const lease = mandate.lease;
      if (!lease) {
        results.skipped++;
        continue;
      }

      // Vérifier si c'est le bon jour de prélèvement
      const paymentDay = lease.jour_paiement || 5;
      if (dayOfMonth !== paymentDay) {
        // Pas le bon jour pour ce bail
        results.skipped++;
        continue;
      }

      // Trouver le locataire principal
      const tenantSigner = lease.signers?.find((s) => s.role === "locataire_principal");
      const tenant = tenantSigner?.profile;
      const owner = lease.property?.owner;

      if (!tenant || !owner) {
        results.errors.push(`Mandat ${mandate.id}: Locataire ou propriétaire manquant`);
        results.skipped++;
        continue;
      }

      try {
        // 3. Vérifier si la facture existe déjà pour ce mois
        const { data: existingInvoice } = await supabase
          .from("invoices")
          .select("id, statut")
          .eq("lease_id", lease.id)
          .eq("periode", currentMonth)
          .maybeSingle();

        let invoiceId: string;
        let amount: number;

        if (existingInvoice) {
          // Facture existe - vérifier si déjà payée
          if (existingInvoice.statut === "paid") {
            results.skipped++;
            continue;
          }
          invoiceId = existingInvoice.id;
          amount = lease.loyer + (lease.charges_forfaitaires || 0);
        } else {
          // Créer la facture
          amount = lease.loyer + (lease.charges_forfaitaires || 0);

          const { data: newInvoice, error: invoiceError } = await supabase
            .from("invoices")
            .insert({
              lease_id: lease.id,
              owner_id: owner.id,
              tenant_id: tenant.id,
              periode: currentMonth,
              montant_loyer: lease.loyer,
              montant_charges: lease.charges_forfaitaires || 0,
              montant_total: amount,
              statut: "sent",
            })
            .select("id")
            .single();

          if (invoiceError || !newInvoice) {
            throw new Error(`Erreur création facture: ${invoiceError?.message}`);
          }

          invoiceId = newInvoice.id;
        }

        // 4. Déclencher le prélèvement SEPA
        console.log(`[SEPA Cron] Prélèvement ${amount}€ pour ${tenant.prenom} ${tenant.nom}`);

        const paymentResult = await createSepaPayment({
          customerId: mandate.stripe_customer_id,
          paymentMethodId: mandate.stripe_payment_method_id,
          amount: Math.round(amount * 100), // En centimes
          currency: "eur",
          description: `Loyer ${currentMonth} - ${lease.property?.adresse_complete}`,
          metadata: {
            invoice_id: invoiceId,
            lease_id: lease.id,
            tenant_id: tenant.id,
            periode: currentMonth,
          },
          mandateId: mandate.stripe_mandate_id,
        });

        // 5. Enregistrer le paiement
        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .insert({
            invoice_id: invoiceId,
            montant: amount,
            moyen: "prelevement",
            provider_ref: paymentResult.id,
            statut: paymentResult.status === "succeeded" ? "succeeded" : "pending",
            date_paiement: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (paymentError) {
          console.error(`[SEPA Cron] Erreur enregistrement paiement:`, paymentError);
        }

        // 6. Mettre à jour la facture avec le payment intent
        await supabase
          .from("invoices")
          .update({
            stripe_payment_intent_id: paymentResult.id,
            // SEPA peut prendre quelques jours, on garde en "sent" jusqu'à confirmation webhook
          })
          .eq("id", invoiceId);

        // 7. Notifications
        // Notifier le locataire
        await supabase.from("notifications").insert({
          user_id: tenant.user_id,
          type: "sepa_payment_initiated",
          title: "Prélèvement SEPA initié",
          message: `Un prélèvement de ${amount.toFixed(2)}€ a été initié pour le loyer de ${currentMonth}.`,
          data: {
            invoice_id: invoiceId,
            amount,
            iban_last4: mandate.iban_last4,
          },
        });

        // Email au locataire
        if (tenant.email) {
          await sendEmail({
            to: tenant.email,
            subject: `Prélèvement SEPA - Loyer ${currentMonth}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3b82f6;">🏦 Prélèvement SEPA initié</h2>
                <p>Bonjour ${tenant.prenom},</p>
                <p>Un prélèvement SEPA de <strong>${amount.toFixed(2)} €</strong> a été initié pour le loyer de <strong>${currentMonth}</strong>.</p>
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Bien :</strong> ${lease.property?.adresse_complete}</p>
                  <p style="margin: 5px 0 0;"><strong>IBAN :</strong> ****${mandate.iban_last4}</p>
                  <p style="margin: 5px 0 0;"><strong>Délai :</strong> 3-5 jours ouvrés</p>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Le prélèvement sera visible sur votre compte sous 3 à 5 jours ouvrés.</p>
              </div>
            `,
          }).catch((err) => console.error("[SEPA Cron] Erreur email locataire:", err));
        }

        results.processed++;
        results.succeeded++;

      } catch (error: any) {
        console.error(`[SEPA Cron] Erreur mandat ${mandate.id}:`, error);
        results.errors.push(`Mandat ${mandate.id}: ${error.message}`);
        results.failed++;

        // Notifier le propriétaire en cas d'échec
        if (owner?.user_id) {
          await supabase.from("notifications").insert({
            user_id: owner.user_id,
            type: "sepa_payment_failed",
            title: "Échec prélèvement SEPA",
            message: `Le prélèvement pour ${tenant?.prenom} ${tenant?.nom} (${currentMonth}) a échoué: ${error.message}`,
            data: {
              lease_id: lease.id,
              error: error.message,
            },
          });
        }
      }
    }

    // Log audit
    await supabase.from("audit_log").insert({
      action: "cron_sepa_payments",
      entity_type: "cron",
      metadata: {
        ...results,
        executed_at: new Date().toISOString(),
        period: currentMonth,
        day_of_month: dayOfMonth,
      },
    }).catch(() => {});

    console.log(`[SEPA Cron] Terminé - ${results.succeeded} réussis, ${results.failed} échoués`);

    return NextResponse.json({
      success: true,
      message: `${results.succeeded} prélèvements initiés`,
      ...results,
    });

  } catch (error: any) {
    console.error("[SEPA Cron] Erreur globale:", error);

    await supabase.from("audit_log").insert({
      action: "cron_sepa_payments_error",
      entity_type: "cron",
      metadata: {
        error: error.message,
        executed_at: new Date().toISOString(),
      },
    }).catch(() => {});

    return NextResponse.json(
      { success: false, error: error.message, ...results },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
