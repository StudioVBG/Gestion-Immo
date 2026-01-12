/**
 * GET /api/export/accounting
 *
 * Export comptable des paiements
 * Formats supportés:
 * - FEC (Fichier des Écritures Comptables - format légal français)
 * - CSV (tableur)
 * - JSON (données brutes)
 *
 * Query params:
 * - format: "fec" | "csv" | "json" (défaut: csv)
 * - year: année fiscale (défaut: année courante)
 * - siren: numéro SIREN (requis pour FEC)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateFEC, convertPaymentsToFEC, generateCSV, generateJSON } from "@/lib/services/export-service";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Récupérer le profil propriétaire
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nom, prenom, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    return NextResponse.json({ error: "Réservé aux propriétaires" }, { status: 403 });
  }

  // Paramètres de requête
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") || "csv";
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
  const siren = searchParams.get("siren") || "000000000";

  // Validation
  if (!["fec", "csv", "json"].includes(format)) {
    return NextResponse.json({ error: "Format invalide. Utilisez: fec, csv, json" }, { status: 400 });
  }

  if (format === "fec" && (!siren || siren === "000000000")) {
    return NextResponse.json(
      { error: "Le numéro SIREN est requis pour l'export FEC" },
      { status: 400 }
    );
  }

  try {
    // Récupérer les paiements de l'année
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: payments, error: paymentsError } = await supabase
      .from("payments")
      .select(`
        id,
        invoice_id,
        montant,
        moyen,
        provider_ref,
        statut,
        date_paiement,
        created_at,
        invoice:invoices (
          id,
          periode,
          montant_loyer,
          montant_charges,
          montant_total,
          tenant_id,
          owner_id,
          lease:leases (
            id,
            property:properties (
              adresse_complete
            ),
            signers:lease_signers (
              profile:profiles (
                prenom,
                nom
              ),
              role
            )
          )
        )
      `)
      .eq("statut", "succeeded")
      .gte("date_paiement", startDate)
      .lte("date_paiement", endDate)
      .eq("invoice.owner_id", profile.id);

    if (paymentsError) {
      throw new Error(`Erreur récupération paiements: ${paymentsError.message}`);
    }

    // Enrichir les données
    const enrichedPayments = (payments || []).map((p: any) => {
      const tenant = p.invoice?.lease?.signers?.find((s: any) => s.role === "locataire_principal")?.profile;
      return {
        ...p,
        periode: p.invoice?.periode,
        montant_loyer: p.invoice?.montant_loyer,
        montant_charges: p.invoice?.montant_charges,
        tenant_id: p.invoice?.tenant_id,
        tenant_name: tenant ? `${tenant.prenom} ${tenant.nom}` : "N/A",
        property_address: p.invoice?.lease?.property?.adresse_complete || "N/A",
      };
    });

    // Générer l'export selon le format
    let content: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case "fec":
        const fecEntries = convertPaymentsToFEC(enrichedPayments, year);
        content = generateFEC(fecEntries, siren, `${year}1231`);
        contentType = "text/plain;charset=utf-8";
        filename = `${siren}_FEC_${year}1231.txt`;
        break;

      case "json":
        content = generateJSON(enrichedPayments, {
          filename: `paiements_${year}`,
          format: "json",
          columns: [
            { key: "date_paiement", header: "Date", format: "date" },
            { key: "tenant_name", header: "Locataire", format: "text" },
            { key: "property_address", header: "Bien", format: "text" },
            { key: "periode", header: "Période", format: "text" },
            { key: "montant", header: "Montant", format: "currency" },
            { key: "moyen", header: "Moyen", format: "text" },
            { key: "provider_ref", header: "Référence", format: "text" },
          ],
          title: `Export comptable ${year}`,
          includeTimestamp: true,
        });
        contentType = "application/json";
        filename = `comptabilite_${year}.json`;
        break;

      case "csv":
      default:
        content = generateCSV(enrichedPayments, {
          filename: `paiements_${year}`,
          format: "csv",
          columns: [
            { key: "date_paiement", header: "Date paiement", format: "date" },
            { key: "periode", header: "Période", format: "text" },
            { key: "tenant_name", header: "Locataire", format: "text" },
            { key: "property_address", header: "Bien", format: "text" },
            { key: "montant_loyer", header: "Loyer", format: "currency" },
            { key: "montant_charges", header: "Charges", format: "currency" },
            { key: "montant", header: "Total payé", format: "currency" },
            { key: "moyen", header: "Moyen paiement", format: "text" },
            { key: "provider_ref", header: "Référence Stripe", format: "text" },
          ],
          includeTimestamp: true,
        });
        contentType = "text/csv;charset=utf-8";
        filename = `comptabilite_${year}.csv`;
        break;
    }

    // Retourner le fichier
    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("[Export Accounting] Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'export" },
      { status: 500 }
    );
  }
}
