import { createClient } from "@/lib/supabase/server";

export async function getOwnerInvoices(limit = 50) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return [];

  const { data } = await supabase
    .from("invoices")
    .select(`
      *,
      lease:leases(
        property:properties(adresse_complete),
        signers:lease_signers(
          role,
          profile:profiles(nom, prenom)
        )
      )
    `)
    .eq("owner_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Transformation des données pour correspondre à l'interface Invoice
  return (data || []).map((inv: any) => {
    // Trouver le nom du locataire principal
    const tenantSigner = inv.lease?.signers?.find((s: any) => s.role === 'locataire_principal');
    const tenantName = tenantSigner?.profile 
      ? `${tenantSigner.profile.prenom} ${tenantSigner.profile.nom}` 
      : "Locataire inconnu";

    return {
      id: inv.id,
      periode: inv.periode,
      montant_total: inv.montant_total,
      statut: inv.statut as "draft" | "sent" | "paid" | "late" | "cancelled",
      created_at: inv.created_at,
      lease: {
        property: {
          adresse_complete: inv.lease?.property?.adresse_complete
        },
        tenant_name: tenantName
      }
    };
  });
}

export async function getTenantInvoices() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Trouver le profil tenant
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return [];

  // On cherche les factures où le tenant_id correspond
  // OU les factures liées à un bail où je suis signataire (fallback)
  const { data } = await supabase
    .from("invoices")
    .select(`
      *,
      lease:leases(
        property:properties(adresse_complete)
      )
    `)
    .eq("tenant_id", profile.id) // La liaison directe est plus fiable grâce à nos correctifs
    .order("created_at", { ascending: false });

  return (data || []).map((inv: any) => ({
    id: inv.id,
    periode: inv.periode,
    montant_total: inv.montant_total,
    statut: inv.statut as "draft" | "sent" | "paid" | "late" | "cancelled",
    created_at: inv.created_at,
    lease: {
      property: {
        adresse_complete: inv.lease?.property?.adresse_complete
      }
    }
  }));
}
