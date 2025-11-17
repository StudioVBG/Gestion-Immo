"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, FileText, Users, Euro, Home } from "lucide-react";
import { useProperty, useLeases } from "@/lib/hooks";
import { formatCurrency } from "@/lib/helpers/format";

export default function OwnerPropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id as string;
  const { data: property, isLoading: loadingProperty } = useProperty(propertyId);
  const { data: leases = [] } = useLeases(propertyId);

  const activeLease = leases.find((l: any) => l.statut === "active");
  const allLeases = leases;

  if (loadingProperty) {
    return (
      <ProtectedRoute allowedRoles={["owner"]}>
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!property) {
    return (
      <ProtectedRoute allowedRoles={["owner"]}>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Bien non trouvé</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/app/owner/properties">Retour à la liste</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      appartement: "Appartement",
      maison: "Maison",
      colocation: "Colocation",
      saisonnier: "Saisonnier",
      commercial: "Local commercial",
      bureau: "Bureau",
      parking: "Parking",
    };
    return labels[type || ""] || type;
  };

  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/app/owner/properties">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {property.adresse_complete || "Sans adresse"}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{getTypeLabel(property.type || "")}</Badge>
                {property.surface && (
                  <span className="text-sm text-muted-foreground">
                    {property.surface} m²
                  </span>
                )}
                {property.nb_pieces && (
                  <span className="text-sm text-muted-foreground">
                    · {property.nb_pieces} pièces
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {!activeLease ? (
                <Button asChild>
                  <Link href={`/leases/new?property_id=${propertyId}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un bail
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link href={`/app/owner/contracts/${activeLease.id}`}>
                    Voir les baux
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="leases">Baux & occupation</TabsTrigger>
            <TabsTrigger value="tenants">Locataires & garants</TabsTrigger>
            <TabsTrigger value="revenue">Loyers & revenus</TabsTrigger>
            <TabsTrigger value="documents">Documents & diagnostics</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Bail actif</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeLease ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Loyer actuel
                      </p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(
                          Number(activeLease.loyer || 0) +
                            Number(activeLease.charges_forfaitaires || 0)
                        )}
                      </p>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/app/owner/contracts/${activeLease.id}`}>
                          Voir le bail
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">Vacant</p>
                      <Button asChild>
                        <Link href={`/leases/new?property_id=${propertyId}`}>
                          Créer un bail
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alertes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Aucune alerte spécifique pour ce logement.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Baux & occupation */}
          <TabsContent value="leases">
            <Card>
              <CardHeader>
                <CardTitle>Historique des baux</CardTitle>
              </CardHeader>
              <CardContent>
                {allLeases.length > 0 ? (
                  <div className="space-y-4">
                    {allLeases.map((lease: any) => (
                      <div
                        key={lease.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            Bail {lease.type_bail || "non spécifié"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Du {new Date(lease.date_debut).toLocaleDateString("fr-FR")}
                            {lease.date_fin &&
                              ` au ${new Date(lease.date_fin).toLocaleDateString("fr-FR")}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge>{lease.statut}</Badge>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/app/owner/contracts/${lease.id}`}>
                              Voir
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Aucun bail pour ce logement
                    </p>
                    <Button asChild>
                      <Link href={`/leases/new?property_id=${propertyId}`}>
                        Créer un bail
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locataires & garants */}
          <TabsContent value="tenants">
            <Card>
              <CardHeader>
                <CardTitle>Locataires & garants</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Les personnes ayant occupé ce bien apparaîtront ici.
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href={`/app/owner/contracts?property_id=${propertyId}`}>
                    Voir dans Baux & locataires
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyers & revenus */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Loyers & revenus</CardTitle>
                <CardDescription>
                  Pour ce logement uniquement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Les loyers dus, encaissés et impayés pour ce logement.
                </p>
                <Button asChild variant="outline">
                  <Link href={`/app/owner/money?property_id=${propertyId}`}>
                    Voir dans Loyers & revenus
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents & diagnostics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Baux, avenants, EDL, DPE, etc.
                </p>
                <Button asChild variant="outline">
                  <Link href={`/app/owner/documents?property_id=${propertyId}`}>
                    Voir dans Documents
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}

