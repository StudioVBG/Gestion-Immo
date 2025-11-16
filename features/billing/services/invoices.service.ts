import { apiClient } from "@/lib/api-client";
import { invoiceSchema } from "@/lib/validations";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export interface CreateInvoiceData {
  lease_id: string;
  periode: string; // Format "YYYY-MM"
  montant_loyer: number;
  montant_charges: number;
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {
  statut?: InvoiceStatus;
}

export class InvoicesService {
  private supabase = createClient();

  async getInvoices(): Promise<Invoice[]> {
    const response = await apiClient.get<{ invoices: Invoice[] }>("/invoices");
    return response.invoices;
  }

  async getInvoiceById(id: string): Promise<Invoice> {
    const response = await apiClient.get<{ invoice: Invoice }>(`/invoices/${id}`);
    return response.invoice;
  }

  async getInvoicesByLease(leaseId: string): Promise<Invoice[]> {
    const invoices = await this.getInvoices();
    return invoices.filter((inv) => inv.lease_id === leaseId);
  }

  async getInvoicesByOwner(ownerId: string): Promise<Invoice[]> {
    const invoices = await this.getInvoices();
    return invoices.filter((inv) => inv.owner_id === ownerId);
  }

  async getInvoicesByTenant(tenantId: string): Promise<Invoice[]> {
    const invoices = await this.getInvoices();
    return invoices.filter((inv) => inv.tenant_id === tenantId);
  }

  async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
    const validatedData = invoiceSchema.parse(data);
    const response = await apiClient.post<{ invoice: Invoice }>("/invoices", validatedData);
    return response.invoice;
  }

  async generateMonthlyInvoice(leaseId: string, periode: string) {
    // Récupérer le bail
    const { data: lease, error: leaseError } = await this.supabase
      .from("leases")
      .select("*")
      .eq("id", leaseId)
      .single();

    if (leaseError || !lease) throw new Error("Lease not found");

    const leaseData = lease as any;

    // Vérifier si une facture existe déjà pour cette période
    const { data: existing } = await this.supabase
      .from("invoices")
      .select("id")
      .eq("lease_id", leaseId as any)
      .eq("periode", periode as any)
      .single();

    if (existing) {
      throw new Error("Une facture existe déjà pour cette période");
    }

    // Créer la facture avec les montants du bail
    return await this.createInvoice({
      lease_id: leaseId,
      periode,
      montant_loyer: leaseData.loyer,
      montant_charges: leaseData.charges_forfaitaires,
    });
  }

  async updateInvoice(id: string, data: UpdateInvoiceData): Promise<Invoice> {
    const validatedData = invoiceSchema.partial().parse(data);
    const response = await apiClient.put<{ invoice: Invoice }>(`/invoices/${id}`, validatedData);
    return response.invoice;
  }

  async sendInvoice(id: string): Promise<Invoice> {
    return await this.updateInvoice(id, { statut: "sent" });
  }

  async deleteInvoice(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`/invoices/${id}`);
  }
}

export const invoicesService = new InvoicesService();

