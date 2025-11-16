export interface AdminStats {
  totalUsers: number;
  totalProperties: number;
  totalLeases: number;
  activeLeases: number;
  totalInvoices: number;
  unpaidInvoices: number;
  totalTickets: number;
  openTickets: number;
  totalDocuments: number;
  totalBlogPosts: number;
  publishedBlogPosts: number;
  usersByRole: {
    admin: number;
    owner: number;
    tenant: number;
    provider: number;
  };
  propertiesByType: {
    appartement: number;
    maison: number;
    colocation: number;
    saisonnier: number;
  };
  leasesByStatus: {
    draft: number;
    pending_signature: number;
    active: number;
    terminated: number;
  };
  invoicesByStatus: {
    draft: number;
    sent: number;
    paid: number;
    late: number;
  };
  ticketsByStatus: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    date: string;
  }>;
}

export class StatsService {
  /**
   * Récupère les headers d'authentification avec le token
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    
    return headers;
  }

  async getAdminStats(): Promise<AdminStats> {
    // Utiliser l'API serveur au lieu d'appeler directement Supabase
    const headers = await this.getAuthHeaders();
    const response = await fetch("/api/admin/stats", {
      credentials: "include", // Important : inclure les cookies pour l'authentification
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la récupération des statistiques");
    }

    return await response.json();
  }
}

export const statsService = new StatsService();

