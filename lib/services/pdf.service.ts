/**
 * Service de génération PDF
 * Utilise une Edge Function Supabase ou un service externe
 */

interface PDFGenerationOptions {
  template: "receipt" | "lease" | "edl" | "invoice";
  data: Record<string, any>;
}

class PDFService {
  /**
   * Générer un PDF de quittance
   */
  async generateReceiptPDF(data: {
    invoiceId: string;
    periode: string;
    montant_total: number;
    montant_loyer: number;
    montant_charges: number;
    tenantName: string;
    propertyAddress: string;
    paidAt: string;
    paymentMethod: string;
  }): Promise<{ url: string; path: string }> {
    // Appel à une Edge Function Supabase ou service externe
    const response = await fetch("/api/pdf/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template: "receipt",
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la génération du PDF");
    }

    return response.json();
  }

  /**
   * Générer un PDF de bail
   */
  async generateLeasePDF(data: {
    leaseId: string;
    leaseData: Record<string, any>;
  }): Promise<{ url: string; path: string }> {
    const response = await fetch("/api/pdf/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template: "lease",
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la génération du PDF");
    }

    return response.json();
  }

  /**
   * Générer un PDF d'état des lieux
   */
  async generateEDLPDF(data: {
    edlId: string;
    edlData: Record<string, any>;
  }): Promise<{ url: string; path: string }> {
    const response = await fetch("/api/pdf/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template: "edl",
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la génération du PDF");
    }

    return response.json();
  }

  /**
   * Générer un PDF de facture
   */
  async generateInvoicePDF(data: {
    invoiceId: string;
    invoiceData: Record<string, any>;
  }): Promise<{ url: string; path: string }> {
    const response = await fetch("/api/pdf/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template: "invoice",
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la génération du PDF");
    }

    return response.json();
  }
}

export const pdfService = new PDFService();

