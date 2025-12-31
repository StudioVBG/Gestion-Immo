import { createClient } from "@/lib/supabase/server";

export type ExportScope = 'owner' | 'tenant' | 'admin' | 'provider';

/**
 * Service de gestion des politiques d'accès pour les exports.
 */
export class ExportPolicy {
  /**
   * Vérifie si l'utilisateur a le droit d'exporter une ressource spécifique.
   */
  static async canExport(userId: string, type: string, filters: any): Promise<boolean> {
    const supabase = await createClient();

    // 1. Récupérer le profil
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("user_id", userId)
      .single();

    if (!profile) return false;
    const isAdmin = profile.role === "admin";

    // 2. Logique par type
    switch (type) {
      case 'accounting':
        // Seul l'admin peut faire un export global
        if (filters?.scope === 'global' && !isAdmin) return false;
        // Les owners peuvent exporter leur propre compta
        if (filters?.scope === 'owner' || !filters?.scope) return true; // Le filtrage effectif se fera dans la requête
        return isAdmin;

      case 'invoice':
        if (isAdmin) return true;
        const invoiceId = filters?.invoiceId;
        if (!invoiceId) return false;

        // Vérifier si owner du bien lié à la facture
        const { data: invoice } = await supabase
          .from("invoices")
          .select(`
            lease:leases(property:properties(owner_id))
          `)
          .eq("id", invoiceId)
          .single();

        if (!invoice) return false;
        
        const isOwner = (invoice.lease as any)?.property?.owner_id === profile.id;
        if (isOwner) return true;

        // Vérifier si locataire du bail lié
        // TODO: Ajouter check locataire via roommates ou lease_signers
        return false;

      case 'portability':
        // L'utilisateur peut toujours exporter ses propres données
        return true;

      default:
        return isAdmin;
    }
  }
}

