import { apiClient } from "@/lib/api-client";
import { createClient } from "@/lib/supabase/client";
import { leaseSchema } from "@/lib/validations";
import type { Lease, LeaseSigner, LeaseType, LeaseStatus } from "@/lib/types";

export interface CreateLeaseData {
  property_id?: string | null;
  unit_id?: string | null;
  type_bail: LeaseType;
  loyer: number;
  charges_forfaitaires: number;
  depot_de_garantie: number;
  date_debut: string;
  date_fin?: string | null;
}

export interface UpdateLeaseData extends Partial<CreateLeaseData> {
  statut?: LeaseStatus;
}

export interface AddSignerData {
  profile_id: string;
  role: "proprietaire" | "locataire_principal" | "colocataire" | "garant";
}

export class LeasesService {
  private supabase = createClient();
  async getLeases() {
    const response = await apiClient.get<{ leases: Lease[] }>("/leases");
    return response.leases;
  }

  async getLeaseById(id: string) {
    const response = await apiClient.get<{ lease: Lease }>(`/leases/${id}`);
    return response.lease;
  }

  async getLeasesByProperty(propertyId: string) {
    const response = await apiClient.get<{ leases: Lease[] }>(
      `/leases?property_id=${encodeURIComponent(propertyId)}`
    );
    return response.leases;
  }

  async getLeasesByOwner(ownerId: string) {
    const response = await apiClient.get<{ leases: Lease[] }>(
      `/leases?owner_id=${encodeURIComponent(ownerId)}`
    );
    return response.leases;
  }

  async getLeasesByTenant(tenantId: string) {
    const response = await apiClient.get<{ leases: Lease[] }>(
      `/leases?tenant_id=${encodeURIComponent(tenantId)}`
    );
    return response.leases;
  }

  async createLease(data: CreateLeaseData) {
    const validatedData = leaseSchema.parse(data);
    const response = await apiClient.post<{ lease: Lease }>(
      "/leases",
      validatedData
    );
    return response.lease;
  }

  async updateLease(id: string, data: UpdateLeaseData) {
    const validatedData = leaseSchema.partial().parse(data);

    const { data: lease, error } = await (this.supabase
      .from("leases") as any)
      .update(validatedData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return lease as Lease;
  }

  async deleteLease(id: string) {
    const { error } = await this.supabase.from("leases").delete().eq("id", id);

    if (error) throw error;
  }

  async getLeaseSigners(leaseId: string) {
    const { data, error } = await this.supabase
      .from("lease_signers")
      .select(`
        *,
        profiles!inner(id, prenom, nom, user_id)
      `)
      .eq("lease_id", leaseId);

    if (error) throw error;
    return data as (LeaseSigner & { profiles: any })[];
  }

  async addSigner(leaseId: string, signerData: AddSignerData) {
    const { data, error } = await this.supabase
      .from("lease_signers")
      .insert({
        lease_id: leaseId,
        profile_id: signerData.profile_id,
        role: signerData.role,
        signature_status: "pending",
      } as any)
      .select()
      .single();

    if (error) throw error;
    return data as LeaseSigner;
  }

  async removeSigner(signerId: string) {
    const { error } = await this.supabase
      .from("lease_signers")
      .delete()
      .eq("id", signerId);

    if (error) throw error;
  }

  async signLease(signerId: string) {
    const { data, error } = await (this.supabase
      .from("lease_signers") as any)
      .update({
        signature_status: "signed",
        signed_at: new Date().toISOString(),
      })
      .eq("id", signerId)
      .select()
      .single();

    if (error) throw error;

    // Vérifier si tous les signataires ont signé pour activer le bail
    const leaseId = (data as any).lease_id;
    const signers = await this.getLeaseSigners(leaseId);
    const allSigned = signers.every((s) => s.signature_status === "signed");

    if (allSigned && signers.length > 0) {
      await this.updateLease(leaseId, { statut: "active" });
    }

    return data as LeaseSigner;
  }

  async refuseLease(signerId: string) {
    const { data, error } = await (this.supabase
      .from("lease_signers") as any)
      .update({
        signature_status: "refused",
      })
      .eq("id", signerId)
      .select()
      .single();

    if (error) throw error;
    return data as LeaseSigner;
  }

  async changeLeaseStatus(leaseId: string, status: LeaseStatus) {
    return await this.updateLease(leaseId, { statut: status });
  }
}

export const leasesService = new LeasesService();

