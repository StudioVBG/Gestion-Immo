"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { formatDateShort } from "@/lib/helpers/format";

export default function OwnerDetailPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <OwnerDetailContent ownerId={params.id} />
    </ProtectedRoute>
  );
}

function OwnerDetailContent({ ownerId }: { ownerId: string }) {
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || profile?.role !== "admin") {
      router.push("/admin/people");
      return;
    }

    fetchOwner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, authLoading, ownerId]);

  async function fetchOwner() {
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      // Utiliser le service people pour récupérer les détails
      const { peopleService } = await import("@/features/admin/services/people.service");
      const ownerData = await peopleService.getOwner(ownerId);
      setOwner(ownerData);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les détails du propriétaire.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Propriétaire non trouvé</p>
        <Link href="/admin/people">
          <Button variant="outline">Retour à l'annuaire</Button>
        </Link>
      </div>
    );
  }

  const ownerName = `${owner.prenom || ""} ${owner.nom || ""}`.trim() || "Sans nom";
  const properties = Array.isArray(owner.properties) ? owner.properties : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/people">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{ownerName}</h1>
          <p className="text-muted-foreground">Détails du propriétaire</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nom complet</p>
              <p className="font-medium">{ownerName}</p>
            </div>
            {owner.telephone && (
              <div>
                <p className="text-sm text-muted-foreground">Téléphone</p>
                <p className="font-medium">{owner.telephone}</p>
              </div>
            )}
            {owner.age_years !== null && owner.age_years !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Âge</p>
                <p className="font-medium">{owner.age_years} ans</p>
              </div>
            )}
            {owner.owner_profiles && (
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium capitalize">
                  {owner.owner_profiles.type === "societe" ? "Société" : "Particulier"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre de logements</p>
              <p className="text-2xl font-bold">{properties.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Membre depuis</p>
              <p className="font-medium">
                {owner.created_at ? formatDateShort(owner.created_at) : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Logements</CardTitle>
          <CardDescription>Liste des logements de ce propriétaire</CardDescription>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun logement enregistré
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {properties.map((property: any) => (
                <Link key={property.id} href={`/properties/${property.id}`}>
                  <Card className="hover:bg-accent transition-colors cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <h4 className="font-medium line-clamp-1">
                          {property.adresse_complete || "Adresse non renseignée"}
                        </h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {property.type}
                        </p>
                        {property.surface && (
                          <p className="text-sm text-muted-foreground">
                            {property.surface} m² • {property.nb_pieces} pièces
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





