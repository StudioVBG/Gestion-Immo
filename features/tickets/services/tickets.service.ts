import { apiClient } from "@/lib/api-client";
import { ticketSchema } from "@/lib/validations";
import type { Ticket, TicketStatus, TicketPriority } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export interface CreateTicketData {
  property_id: string;
  lease_id?: string | null;
  titre: string;
  description: string;
  priorite: TicketPriority;
}

export interface UpdateTicketData extends Partial<CreateTicketData> {
  statut?: TicketStatus;
}

export class TicketsService {
  private supabase = createClient();

  async getTickets(): Promise<Ticket[]> {
    const response = await apiClient.get<{ tickets: Ticket[] }>("/tickets");
    return response.tickets;
  }

  async getTicketById(id: string): Promise<Ticket> {
    const response = await apiClient.get<{ ticket: Ticket }>(`/tickets/${id}`);
    return response.ticket;
  }

  async getTicketsByProperty(propertyId: string): Promise<Ticket[]> {
    const tickets = await this.getTickets();
    return tickets.filter((t) => t.property_id === propertyId);
  }

  async getTicketsByOwner(ownerId: string): Promise<Ticket[]> {
    const tickets = await this.getTickets();
    // Filtrer les tickets des propriétés du propriétaire
    const { data: properties } = await this.supabase
      .from("properties")
      .select("id")
      .eq("owner_id", ownerId);

    if (!properties || properties.length === 0) return [];
    const propertyIds = properties.map((p) => p.id);
    return tickets.filter((t) => propertyIds.includes(t.property_id));
  }

  async getTicketsByTenant(tenantId: string): Promise<Ticket[]> {
    const tickets = await this.getTickets();
    // Filtrer les tickets créés par le locataire
    const createdTickets = tickets.filter((t) => t.created_by_profile_id === tenantId);
    
    // Récupérer les baux du locataire
    const { data: signers } = await this.supabase
      .from("lease_signers")
      .select("lease_id")
      .eq("profile_id", tenantId)
      .in("role", ["locataire_principal", "colocataire"]);

    if (!signers || signers.length === 0) {
      return createdTickets;
    }

    const leaseIds = signers.map((s) => s.lease_id);
    const leaseTickets = tickets.filter((t) => t.lease_id && leaseIds.includes(t.lease_id));
    
    // Combiner et dédupliquer
    const allTickets = [...createdTickets, ...leaseTickets];
    return Array.from(new Map(allTickets.map((t) => [t.id, t])).values());
  }

  async createTicket(data: CreateTicketData): Promise<Ticket> {
    const validatedData = ticketSchema.parse(data);
    const response = await apiClient.post<{ ticket: Ticket }>("/tickets", validatedData);
    return response.ticket;
  }

  async updateTicket(id: string, data: UpdateTicketData): Promise<Ticket> {
    const validatedData = ticketSchema.partial().parse(data);
    const response = await apiClient.put<{ ticket: Ticket }>(`/tickets/${id}`, validatedData);
    return response.ticket;
  }

  async changeTicketStatus(id: string, status: TicketStatus): Promise<Ticket> {
    return await this.updateTicket(id, { statut: status });
  }

  async deleteTicket(id: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(`/tickets/${id}`);
  }
}

export const ticketsService = new TicketsService();

