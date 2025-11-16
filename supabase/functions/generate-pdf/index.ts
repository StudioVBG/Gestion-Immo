// Edge Function : Génération PDF (baux, quittances, EDL)
// À déployer avec: supabase functions deploy generate-pdf

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

    const { type, data } = await req.json();

    if (!type || !data) {
      return new Response(
        JSON.stringify({ error: "type et data requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let pdfBuffer: Uint8Array;
    let fileName: string;
    let storagePath: string;

    switch (type) {
      case "lease":
        ({ pdfBuffer, fileName } = await generateLeasePDF(supabaseClient, data));
        storagePath = `leases/${data.lease_id || data.draft_id}/${fileName}`;
        break;

      case "receipt":
        ({ pdfBuffer, fileName } = await generateReceiptPDF(supabaseClient, data));
        storagePath = `receipts/${data.lease_id}/${data.month}/${fileName}`;
        break;

      case "edl":
        ({ pdfBuffer, fileName } = await generateEDLPDF(supabaseClient, data));
        storagePath = `edl/${data.edl_id}/${fileName}`;
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Type de PDF non supporté" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Uploader vers Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from("documents")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Mettre à jour les références selon le type
    if (type === "lease" && data.draft_id) {
      await supabaseClient
        .from("lease_drafts")
        .update({ pdf_url: storagePath } as any)
        .eq("id", data.draft_id);
    }

    // Émettre un événement
    await supabaseClient.from("outbox").insert({
      event_type: "document.generated",
      payload: {
        type,
        storage_path: storagePath,
        ...data,
      },
    } as any);

    return new Response(
      JSON.stringify({
        success: true,
        url: `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/documents/${storagePath}`,
        path: storagePath,
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

// Générer PDF de bail
async function generateLeasePDF(supabase: any, data: any): Promise<{ pdfBuffer: Uint8Array; fileName: string }> {
  // Récupérer le template et les données du bail
  const { data: draft } = await supabase
    .from("lease_drafts")
    .select(`
      *,
      template:lease_templates(template_content, variables),
      lease:leases!inner(
        *,
        property:properties(adresse_complete, surface, nb_pieces),
        signers:lease_signers(
          profile:profiles(prenom, nom)
        )
      )
    `)
    .eq("id", data.draft_id)
    .single();

  if (!draft) {
    throw new Error("Draft de bail non trouvé");
  }

  // Remplacer les variables dans le template
  let html = draft.template?.template_content || "<h1>Bail de location</h1>";
  const variables = { ...draft.variables, ...data };

  for (const [key, value] of Object.entries(variables)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), String(value));
  }

  // Ajouter les styles CSS de base
  html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .section { margin: 20px 0; }
          .signature { margin-top: 50px; }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

  // Utiliser une API externe pour générer le PDF (ex: PDFShift, HTML/CSS to PDF API)
  // Ou utiliser Puppeteer si disponible dans Deno
  // Pour l'instant, créer un PDF simple avec une bibliothèque disponible
  const pdfBuffer = await generatePDFFromHTML(html);
  const fileName = `lease_${data.lease_id || data.draft_id}_${Date.now()}.pdf`;

  return { pdfBuffer, fileName };
}

// Fonction helper pour générer PDF depuis HTML
async function generatePDFFromHTML(html: string): Promise<Uint8Array> {
  // Option 1: Utiliser une API externe (PDFShift, etc.)
  const pdfApiKey = Deno.env.get("PDF_API_KEY");
  if (pdfApiKey) {
    try {
      const response = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`api:${pdfApiKey}`)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: html,
          format: "A4",
        }),
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      }
    } catch (error) {
      console.error("Erreur génération PDF via API:", error);
    }
  }

  // Option 2: Fallback - générer un PDF simple (mock pour l'instant)
  // TODO: Implémenter avec une bibliothèque PDF native si disponible
  return new TextEncoder().encode(html);
}

// Générer PDF de quittance
async function generateReceiptPDF(supabase: any, data: any): Promise<{ pdfBuffer: Uint8Array; fileName: string }> {
  // Récupérer les données de la facture et du bail
  const { data: invoice } = await supabase
    .from("invoices")
    .select(`
      *,
      lease:leases!inner(
        *,
        property:properties(adresse_complete),
        tenant:roommates!inner(
          profile:profiles(prenom, nom)
        )
      )
    `)
    .eq("id", data.invoice_id)
    .single();

  if (!invoice) {
    throw new Error("Facture non trouvée");
  }

  const invoiceData = invoice as any;
  const tenant = invoiceData.lease?.tenant?.[0]?.profile;

  // Template HTML de quittance
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .info { margin: 20px 0; }
          .amount { font-size: 20px; font-weight: bold; text-align: center; margin: 30px 0; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">QUITTANCE DE LOYER</div>
        </div>
        <div class="info">
          <p><strong>Période :</strong> ${data.month}</p>
          <p><strong>Logement :</strong> ${invoiceData.lease?.property?.adresse_complete || ""}</p>
          <p><strong>Locataire :</strong> ${tenant?.prenom || ""} ${tenant?.nom || ""}</p>
        </div>
        <div class="amount">
          <p>Montant reçu : ${data.montant_total}€</p>
          <p>Dont loyer : ${data.montant_loyer || invoiceData.montant_loyer}€</p>
          ${data.montant_charges ? `<p>Dont charges : ${data.montant_charges}€</p>` : ""}
        </div>
        <div class="footer">
          <p>Quittance générée le ${new Date().toLocaleDateString("fr-FR")}</p>
        </div>
      </body>
    </html>
  `;

  const pdfBuffer = await generatePDFFromHTML(html);
  const fileName = `receipt_${data.lease_id}_${data.month?.replace(/-/g, "_")}_${Date.now()}.pdf`;

  return { pdfBuffer, fileName };
}

// Générer PDF d'EDL
async function generateEDLPDF(supabase: any, data: any): Promise<{ pdfBuffer: Uint8Array; fileName: string }> {
  const html = `
    <html>
      <body>
        <h1>État des lieux</h1>
        <p>EDL ID: ${data.edl_id}</p>
        <!-- Contenu de l'EDL -->
      </body>
    </html>
  `;

  const pdfBuffer = new TextEncoder().encode("Mock PDF content");
  const fileName = `edl_${data.edl_id}_${Date.now()}.pdf`;

  return { pdfBuffer, fileName };
}

