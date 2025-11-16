// Edge Function : Analyse OCR/IDP des documents
// À déployer avec: supabase functions deploy analyze-documents

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { application_id, files } = await req.json();

    if (!application_id || !files || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "application_id et files requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Récupérer les fichiers depuis Storage
    const extractedFields: Record<string, any> = {};
    let totalConfidence = 0;
    let processedFiles = 0;

    for (const file of files) {
      try {
        // Télécharger le fichier depuis Storage
        const { data: fileData, error: downloadError } = await supabaseClient.storage
          .from("documents")
          .download(file.storage_path);

        if (downloadError) {
          console.error(`Erreur téléchargement ${file.storage_path}:`, downloadError);
          continue;
        }

        // Convertir en buffer
        const arrayBuffer = await fileData.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Appeler le service OCR/IDP (Google Vision, AWS Textract, etc.)
        // TODO: Intégrer avec le provider OCR configuré côté Admin
        const ocrResult = await analyzeDocumentWithOCR(buffer, file.kind);

        // Extraire les champs selon le type de document
        const fields = extractFieldsFromOCR(ocrResult, file.kind);

        // Sauvegarder les champs extraits
        for (const [fieldName, fieldData] of Object.entries(fields)) {
          const { error: insertError } = await supabaseClient
            .from("extracted_fields")
            .upsert({
              application_id,
              file_id: file.id,
              field_name: fieldName,
              field_value: fieldData.value,
              confidence: fieldData.confidence,
              source: "ocr",
            } as any, {
              onConflict: "application_id,field_name",
            });

          if (!insertError) {
            extractedFields[fieldName] = fieldData.value;
            totalConfidence += fieldData.confidence;
            processedFiles++;
          }
        }

        // Mettre à jour le fichier
        await supabaseClient
          .from("application_files")
          .update({
            analyzed_at: new Date().toISOString(),
            ocr_result: ocrResult,
            confidence: fields.averageConfidence || 0,
          } as any)
          .eq("id", file.id);

      } catch (error) {
        console.error(`Erreur traitement ${file.id}:`, error);
      }
    }

    // Calculer la confiance globale
    const globalConfidence = processedFiles > 0 ? totalConfidence / processedFiles : 0;

    // Mettre à jour l'application
    await supabaseClient
      .from("tenant_applications")
      .update({
        extracted_json: extractedFields,
        confidence: globalConfidence,
        status: globalConfidence >= 70 ? "review" : "docs_pending",
      } as any)
      .eq("id", application_id);

    // Émettre un événement
    await supabaseClient.from("outbox").insert({
      event_type: "application.ocr.completed",
      payload: {
        application_id,
        confidence: globalConfidence,
        fields_count: Object.keys(extractedFields).length,
      },
    } as any);

    return new Response(
      JSON.stringify({
        success: true,
        application_id,
        confidence: globalConfidence,
        extracted_fields: extractedFields,
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

// Fonction mock pour OCR (à remplacer par l'intégration réelle)
async function analyzeDocumentWithOCR(buffer: Uint8Array, kind: string): Promise<any> {
  // TODO: Intégrer avec Google Vision API, AWS Textract, ou autre
  // Pour l'instant, retourner un résultat mock
  return {
    text: "Mock OCR result",
    confidence: 85.5,
    fields: {},
  };
}

// Extraire les champs selon le type de document
function extractFieldsFromOCR(ocrResult: any, kind: string): Record<string, { value: string; confidence: number }> {
  const fields: Record<string, { value: string; confidence: number }> = {};

  // Si l'OCR retourne des champs structurés, les utiliser
  if (ocrResult.fields && typeof ocrResult.fields === "object") {
    for (const [key, value] of Object.entries(ocrResult.fields)) {
      if (typeof value === "object" && value !== null && "value" in value) {
        fields[key] = {
          value: String(value.value),
          confidence: value.confidence || ocrResult.confidence || 80,
        };
      } else {
        fields[key] = {
          value: String(value),
          confidence: ocrResult.confidence || 80,
        };
      }
    }
  }

  // Extraction spécifique selon le type de document
  switch (kind) {
    case "identity":
      // Extraire depuis le texte brut si pas de champs structurés
      if (ocrResult.text && !fields.birthdate) {
        // Chercher une date de naissance (format DD/MM/YYYY ou DD-MM-YYYY)
        const datePattern = /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/g;
        const dates = ocrResult.text.match(datePattern);
        if (dates && dates.length > 0) {
          // Convertir en format ISO (YYYY-MM-DD)
          const [day, month, year] = dates[0].split(/[\/\-]/);
          fields.birthdate = {
            value: `${year}-${month}-${day}`,
            confidence: 85,
          };
        }

        // Extraire nom et prénom depuis le texte
        if (!fields.first_name || !fields.last_name) {
          const lines = ocrResult.text.split("\n");
          // Généralement le nom est sur les premières lignes
          for (const line of lines.slice(0, 5)) {
            const words = line.trim().split(/\s+/);
            if (words.length >= 2 && !fields.last_name) {
              fields.last_name = { value: words[words.length - 1], confidence: 75 };
              fields.first_name = { value: words.slice(0, -1).join(" "), confidence: 75 };
              break;
            }
          }
        }
      }
      break;

    case "income":
      // Extraire montant de revenus
      if (ocrResult.text && !fields.income) {
        const amountPattern = /(\d{1,3}(?:\s?\d{3})*(?:[,\.]\d{2})?)\s*€?/g;
        const amounts = ocrResult.text.match(amountPattern);
        if (amounts && amounts.length > 0) {
          // Prendre le montant le plus élevé (probablement le revenu)
          const amountsNum = amounts.map((a: string) => parseFloat(a.replace(/\s/g, "").replace(",", ".")));
          const maxAmount = Math.max(...amountsNum);
          fields.income = {
            value: String(maxAmount),
            confidence: 80,
          };
        }
      }
      break;

    case "address":
      // Extraire adresse complète
      if (ocrResult.text && !fields.address) {
        // Chercher des patterns d'adresse (numéro + rue)
        const addressPattern = /(\d+[,\s]+[A-Za-zÀ-ÿ\s]+(?:rue|avenue|boulevard|place|chemin|impasse|allée)[A-Za-zÀ-ÿ\s,]+)/gi;
        const addresses = ocrResult.text.match(addressPattern);
        if (addresses && addresses.length > 0) {
          fields.address = {
            value: addresses[0].trim(),
            confidence: 75,
          };
        }
      }
      break;
  }

  return fields;
}

