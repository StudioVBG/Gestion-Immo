import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/pdf/generate - Générer un PDF
 * TODO: Implémenter avec une Edge Function Supabase ou service externe (Puppeteer, PDFKit, etc.)
 * Configuration Vercel: maxDuration: 10s
 */
export const maxDuration = 10;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { template, data } = body;

    if (!template || !data) {
      return NextResponse.json(
        { error: "template et data requis" },
        { status: 400 }
      );
    }

    // Appeler l'Edge Function pour génération PDF
    try {
      const { data: pdfResult, error: functionError } = await supabase.functions.invoke(
        "generate-pdf",
        {
          body: { type: template, data },
        }
      );

      if (functionError) {
        console.error("Erreur Edge Function PDF:", functionError);
        return NextResponse.json(
          {
            error: "Erreur lors de la génération du PDF",
            details: functionError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        url: pdfResult?.url,
        path: pdfResult?.path,
        success: true,
      });
    } catch (error: any) {
      console.error("Erreur appel Edge Function PDF:", error);
      return NextResponse.json(
        {
          error: "Erreur lors de la génération du PDF",
          details: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

