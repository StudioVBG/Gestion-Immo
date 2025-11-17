"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, Euro, FileText, Calendar, TrendingUp } from "lucide-react";
import { useLease, useProperties } from "@/lib/hooks";
import { formatCurrency, formatDateShort } from "@/lib/helpers/format";

export default function OwnerContractDetailPage() {
  const params = useParams();
  const leaseId = params.id as string;
  const { data: lease, isLoading } = useLease(leaseId);
  const { data: properties = [] } = useProperties();

  if (isLoading) {
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

  if (!lease) {
    return (
      <ProtectedRoute allowedRoles={["owner"]}>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Bail non trouvé</p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/app/owner/contracts">Retour à la liste</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  const property = properties.find((p: any) => p.id === (lease as any).property_id);

  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/app/owner/contracts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Link>
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Bail {property?.adresse_complete || "N/A"}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge>{(lease as any).statut || "N/A"}</Badge>
                <Badge variant="outline">{(lease as any).type_bail || "N/A"}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Résumé */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Loyer mensuel</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  Number((lease as any).loyer || 0) +
                    Number((lease as any).charges_forfaitaires || 0)
                )}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Dont charges : {formatCurrency(Number((lease as any).charges_forfaitaires || 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Période</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Du {formatDateShort((lease as any).date_debut)}
              </p>
              {(lease as any).date_fin && (
                <p className="text-sm">
                  Au {formatDateShort((lease as any).date_fin)}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dépôt de garantie</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(Number((lease as any).depot_de_garantie || 0))}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList>
            <TabsTrigger value="summary">Résumé</TabsTrigger>
            <TabsTrigger value="tenants">Locataires & garants</TabsTrigger>
            <TabsTrigger value="rents">Loyers</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="indexation">Indexations</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Informations du bail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Bien</p>
                  <p className="text-sm text-muted-foreground">
                    {property?.adresse_complete || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Type de bail</p>
                  <p className="text-sm text-muted-foreground">
                    {(lease as any).type_bail || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Statut</p>
                  <Badge>{(lease as any).statut || "N/A"}</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants">
            <Card>
              <CardHeader>
                <CardTitle>Locataires & garants</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Les signataires du bail apparaîtront ici.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rents">
            <Card>
              <CardHeader>
                <CardTitle>Loyers</CardTitle>
                <CardDescription>
                  Calendrier des loyers pour ce bail
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={`/app/owner/money?lease_id=${leaseId}`}>
                    Voir dans Loyers & revenus
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={`/app/owner/documents?lease_id=${leaseId}`}>
                    Voir dans Documents
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="indexation">
            <Card>
              <CardHeader>
                <CardTitle>Indexations</CardTitle>
                <CardDescription>
                  Historique et simulation d'indexation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  L'historique des indexations apparaîtra ici.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}

