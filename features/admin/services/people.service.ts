export interface OwnerRow {
  id: string;
  name: string;
  type: "particulier" | "societe";
  email?: string;
  units_count: number;
  active_leases: number;
  age_years?: number | null;
}

export interface TenantRow {
  id: string;
  profile_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  age_years?: number | null;
  property_id?: string;
  property_address?: string;
  lease_id?: string;
  lease_status?: string;
}

export interface VendorRow {
  id: string;
  profile_id: string;
  name: string;
  email?: string;
  phone?: string;
  type_services: string[];
  zones_intervention?: string;
}

export interface PropertyRow {
  id: string;
  ref: string;
  address: string;
  status: string;
  tenants_count: number;
  owner_id: string;
  owner_name?: string;
}

export interface AgeAnalytics {
  role: "owner" | "tenant";
  buckets: Array<{
    bucket: string;
    count: number;
  }>;
  avg?: number;
  median?: number;
}

export class PeopleService {
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

  /**
   * Liste des propriétaires avec statistiques
   */
  async getOwners(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: OwnerRow[]; total: number }> {
    const { search = "", page = 1, limit = 50 } = params || {};

    // Utiliser l'API serveur au lieu d'appeler directement Supabase
    const searchParams = new URLSearchParams({
      search,
      page: page.toString(),
      limit: limit.toString(),
    });

    const headers = await this.getAuthHeaders();
    const response = await fetch(`/api/admin/people/owners?${searchParams.toString()}`, {
      credentials: "include", // Important : inclure les cookies pour l'authentification
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la récupération des propriétaires");
    }

    return await response.json();
  }

  /**
   * Détails d'un propriétaire
   * Note: Cette méthode nécessite encore le client Supabase direct
   * TODO: Créer une route API pour cette méthode
   */
  async getOwner(id: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`/api/admin/people/owners/${id}`, {
      credentials: "include",
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Erreur lors de la récupération du propriétaire");
    }

    return response.json();
  }

  /**
   * Liste des locataires
   */
  async getTenants(params?: {
    search?: string;
    page?: number;
    limit?: number;
    status?: "active" | "all";
  }): Promise<{ items: TenantRow[]; total: number }> {
    const { search = "", page = 1, limit = 50, status = "all" } = params || {};

    // Utiliser l'API serveur au lieu d'appeler directement Supabase
    const searchParams = new URLSearchParams({
      search,
      page: page.toString(),
      limit: limit.toString(),
      status,
    });

    const headers = await this.getAuthHeaders();
    const response = await fetch(`/api/admin/people/tenants?${searchParams.toString()}`, {
      credentials: "include", // Important : inclure les cookies pour l'authentification
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la récupération des locataires");
    }

    return await response.json();
  }

  /**
   * Liste des prestataires
   */
  async getVendors(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: VendorRow[]; total: number }> {
    const { search = "", page = 1, limit = 50 } = params || {};

    // Utiliser l'API serveur au lieu d'appeler directement Supabase
    const searchParams = new URLSearchParams({
      search,
      page: page.toString(),
      limit: limit.toString(),
    });

    const headers = await this.getAuthHeaders();
    const response = await fetch(`/api/admin/people/vendors?${searchParams.toString()}`, {
      credentials: "include", // Important : inclure les cookies pour l'authentification
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur lors de la récupération des prestataires");
    }

    return await response.json();
  }

  /**
   * Détail d'un prestataire
   */
  async getVendor(id: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`/api/admin/people/vendors/${id}`, {
      credentials: "include",
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Erreur lors de la récupération du prestataire");
    }

    return response.json();
  }

  /**
   * Logements d'un propriétaire
   * Note: Cette méthode nécessite encore le client Supabase direct
   * TODO: Créer une route API pour cette méthode
   */
  async getOwnerProperties(ownerId: string) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("properties")
      .select(
        `
        *,
        leases!inner(
          id,
          statut,
          lease_signers!inner(
            profile_id,
            role
          )
        )
      `
      )
      .eq("owner_id", ownerId);

    if (error) throw error;

    const dataArray4 = data as any[];
    return (
      dataArray4?.map((property) => {
        const activeLeases = property.leases?.filter((l: any) =>
          ["active", "pending_signature"].includes(l.statut)
        ) || [];
        const tenantsCount = new Set(
          activeLeases.flatMap((l: any) =>
            l.lease_signers
              ?.filter((ls: any) =>
                ["locataire_principal", "colocataire"].includes(ls.role)
              )
              .map((ls: any) => ls.profile_id)
          )
        ).size;

        return {
          id: property.id,
          ref: property.unique_code,
          address: property.adresse_complete,
          status: "active", // TODO: déterminer le statut
          tenants_count: tenantsCount,
          owner_id: ownerId,
        };
      }) || []
    );
  }

  /**
   * Locataires d'un logement
   * Note: Cette méthode nécessite encore le client Supabase direct
   * TODO: Créer une route API pour cette méthode
   */
  async getPropertyTenants(propertyId: string) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("leases")
      .select(
        `
        id,
        statut,
        lease_signers!inner(
          profile_id,
          role,
          profiles!inner(
            id,
            prenom,
            nom,
            telephone,
            user_id
          )
        )
      `
      )
      .eq("property_id", propertyId)
      .in("statut", ["active", "pending_signature"]);

    if (error) throw error;

    const dataArray6 = data as any[];
    const profileIds =
      dataArray6?.flatMap((lease: any) =>
        lease.lease_signers
          ?.filter((ls: any) =>
            ["locataire_principal", "colocataire"].includes(ls.role)
          )
          .map((ls: any) => ls.profiles?.id)
          .filter(Boolean)
      ) || [];

    // Récupérer les âges
    const { data: ages } = await supabase
      .from("v_person_age")
      .select("person_id, age_years")
      .in("person_id", profileIds);

    const agesArray3 = ages as any[];
    const ageMap = new Map(
      agesArray3?.map((a) => [a.person_id, a.age_years]) || []
    );

    // Les emails seront récupérés via une route API si nécessaire

    const dataArray5 = data as any[];
    return (
      dataArray5?.flatMap((lease: any) =>
        lease.lease_signers
          ?.filter((ls: any) =>
            ["locataire_principal", "colocataire"].includes(ls.role)
          )
          .map((ls: any) => {
            const profile = ls.profiles;
            const fullName = `${profile?.prenom || ""} ${profile?.nom || ""}`.trim();

            return {
              id: profile?.id,
              full_name: fullName || "Sans nom",
              email: undefined, // Récupéré via API si nécessaire
              phone: profile?.telephone || undefined,
              age_years: ageMap.get(profile?.id) ?? null,
              lease_id: lease.id,
              lease_status: lease.statut,
            };
          })
      ) || []
    );
  }

  /**
   * Analytics d'âge
   * Note: Cette méthode nécessite encore le client Supabase direct
   * TODO: Créer une route API pour cette méthode
   */
  async getAgeAnalytics(role: "owner" | "tenant"): Promise<AgeAnalytics> {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("v_portfolio_age_buckets")
      .select("*")
      .eq("role", role);

    if (error) throw error;

    const dataArray7 = data as any[];
    const buckets =
      dataArray7?.map((row: any) => ({
        bucket: row.bucket,
        count: row.persons,
      })) || [];

    // Calculer moyenne et médiane (approximatif)
    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    const avg =
      buckets.length > 0
        ? buckets.reduce((sum, b) => {
            const midAge = getMidAge(b.bucket);
            return sum + (midAge || 0) * b.count;
          }, 0) / total
        : undefined;

    return {
      role,
      buckets,
      avg: avg ? Math.round(avg) : undefined,
    };
  }
}

function getMidAge(bucket: string): number | null {
  if (bucket === "unknown" || bucket === "<18") return null;
  const match = bucket.match(/(\d+)-(\d+)/);
  if (match) {
    return (parseInt(match[1]) + parseInt(match[2])) / 2;
  }
  if (bucket === "65+") return 70;
  return null;
}

export const peopleService = new PeopleService();

