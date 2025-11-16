"use client";

import { useEffect, useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  Search,
  Building2,
  Users,
  Home,
  FileText,
  ArrowRight,
  Ruler,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { formatDateShort } from "@/lib/helpers/format";

interface Owner {
  id: string;
  name: string;
  prenom?: string;
  nom?: string;
  user_id: string;
  properties_count: number;
  total_leases: number;
  active_leases: number;
  owner_profiles?: {
    type?: string | null;
    usage_strategie?: string | null;
    tva_optionnelle?: boolean;
    tva_taux?: number | null;
  } | null;
  properties?: any[];
}

interface Property {
  id: string;
  type: string;
  usage_principal?: string | null;
  sous_usage?: string | null;
  adresse_complete: string;
  surface: number;
  nb_pieces: number;
  owner_id: string;
  erp_type?: string | null;
  erp_categorie?: string | null;
  erp_accessibilite?: boolean;
  has_irve?: boolean;
  places_parking?: number;
  parking_badge_count?: number;
  tva_applicable?: boolean;
  tva_taux?: number | null;
  owner?: {
    id: string;
    name: string;
    email?: string;
  } | null;
  leases_count: number;
  active_leases_count: number;
  tenants_count: number;
  etat: "draft" | "pending" | "published" | "rejected" | "archived";
  submitted_at?: string | null;
  validated_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

interface OverviewData {
  owners: Owner[];
  properties: Property[];
  tenants: any[];
  stats: {
    total_owners: number;
    total_properties: number;
    total_tenants: number;
    total_leases: number;
    active_leases: number;
    professional_properties?: number;
    properties_with_tva?: number;
  };
}

function AdminOverviewContent() {
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData | null>(null);
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<"owners" | "properties" | "relations">("relations");

  useEffect(() => {
    if (authLoading) return;
    
    if (!user || profile?.role !== "admin") {
      setLoading(false);
      return;
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, authLoading]);

  async function fetchData() {
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

      const response = await fetch("/api/admin/overview", {
        credentials: "include",
        headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la récupération des données");
      }

      const result = await response.json();
      setData(result);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Filtrage et recherche
  const filteredOwners = useMemo(() => {
    if (!data) return [];
    if (!search) return data.owners;
    
    const searchLower = search.toLowerCase();
    return data.owners.filter(owner =>
      owner.name.toLowerCase().includes(searchLower) ||
      owner.prenom?.toLowerCase().includes(searchLower) ||
      owner.nom?.toLowerCase().includes(searchLower)
    );
  }, [data, search]);

  const filteredProperties = useMemo(() => {
    if (!data) return [];
    if (!search) return data.properties;
    
    const searchLower = search.toLowerCase();
    return data.properties.filter(property =>
      property.adresse_complete.toLowerCase().includes(searchLower) ||
      property.owner?.name.toLowerCase().includes(searchLower) ||
      property.type.toLowerCase().includes(searchLower) ||
      (property.usage_principal ?? "").toLowerCase().includes(searchLower)
    );
  }, [data, search]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      appartement: "Appartement",
      maison: "Maison",
      colocation: "Colocation",
      saisonnier: "Saisonnier",
      local_commercial: "Local commercial",
      bureaux: "Bureaux",
      entrepot: "Entrepôt",
      parking: "Parking",
      fonds_de_commerce: "Fonds de commerce",
    };
    return labels[type] || type;
  };

  const getUsageLabel = (usage?: string | null) => {
    if (!usage) return "Usage non défini";
    const map: Record<string, string> = {
      habitation: "Usage habitation",
      local_commercial: "Usage commercial",
      bureaux: "Usage bureaux / tertiaire",
      entrepot: "Usage entrepôt / logistique",
      parking: "Usage parking / stationnement",
      fonds_de_commerce: "Fonds de commerce / location-gérance",
    };
    return map[usage] || usage;
  };

  const formatSousUsage = (sous?: string | null) => {
    if (!sous) return null;
    return sous.replace(/_/g, " ");
  };

  const getStatusConfig = (
    etat: Property["etat"]
  ): { label: string; variant: BadgeProps["variant"] } => {
    switch (etat) {
      case "draft":
        return { label: "Brouillon", variant: "secondary" };
      case "pending":
        return { label: "En attente", variant: "warning" };
      case "published":
        return { label: "Publié", variant: "success" };
      case "rejected":
        return { label: "Rejeté", variant: "destructive" };
      case "archived":
      default:
        return { label: "Archivé", variant: "outline" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div>Erreur lors du chargement des données</div>;
  }

  const totalProperties = data.stats.total_properties || 0;
  const professionalProperties =
    data.stats.professional_properties ??
    data.properties.filter(
      (property) => property.usage_principal && property.usage_principal !== "habitation"
    ).length;
  const propertiesWithTva =
    data.stats.properties_with_tva ??
    data.properties.filter((property) => property.tva_applicable).length;
  const professionalShare =
    totalProperties > 0 ? Math.round((professionalProperties / totalProperties) * 100) : 0;
  const tvaShare =
    totalProperties > 0 ? Math.round((propertiesWithTva / totalProperties) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header avec stats */}
      <div>
        <h1 className="text-3xl font-bold">Vue d'ensemble</h1>
        <p className="text-muted-foreground">
          Relations entre propriétaires, logements et locataires
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 xl:grid-cols-7">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Propriétaires</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.total_owners}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logements</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.total_properties}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locataires</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.total_tenants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baux actifs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.active_leases}</div>
            <p className="text-xs text-muted-foreground">
              sur {data.stats.total_leases} baux
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'occupation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.total_properties > 0
                ? Math.round((data.stats.active_leases / data.stats.total_properties) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logements pro</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{professionalProperties}</div>
            <p className="text-xs text-muted-foreground">
              {professionalShare}% du parc
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TVA activée</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propertiesWithTva}</div>
            <p className="text-xs text-muted-foreground">{tvaShare}% des contrats</p>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recherche</CardTitle>
              <CardDescription>
                Rechercher par nom, adresse ou type
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="relations">
                <Building2 className="mr-2 h-4 w-4" />
                Relations
              </TabsTrigger>
              <TabsTrigger value="owners">
                <Users className="mr-2 h-4 w-4" />
                Propriétaires ({filteredOwners.length})
              </TabsTrigger>
              <TabsTrigger value="properties">
                <Home className="mr-2 h-4 w-4" />
                Logements ({filteredProperties.length})
              </TabsTrigger>
            </TabsList>

            {/* Vue Relations */}
            <TabsContent value="relations" className="mt-6">
              <div className="space-y-4">
                {filteredOwners.map((owner) => {
                  const ownerProperties = filteredProperties.filter(
                    p => p.owner_id === owner.id
                  );
                  
                  if (ownerProperties.length === 0 && search) return null;

                  return (
                    <Card key={owner.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{owner.name}</CardTitle>
                            <CardDescription>
                              {owner.properties_count} logement{owner.properties_count > 1 ? "s" : ""} • {owner.active_leases} bail{owner.active_leases > 1 ? "x" : ""} actif{owner.active_leases > 1 ? "s" : ""}
                            </CardDescription>
                          </div>
                          <Link href={`/admin/people/owners/${owner.id}`}>
                            <Button variant="outline" size="sm">
                              Voir le profil
                            </Button>
                          </Link>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {ownerProperties.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Aucun logement
                          </p>
                        ) : (
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {ownerProperties.map((property) => (
                              <div
                                key={property.id}
                                className="border rounded-lg p-4 hover:bg-accent transition-colors"
                              >
                                <div className="flex items-start justify-between mb-2 gap-2">
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary">
                                      {getTypeLabel(property.type)}
                                    </Badge>
                                    {property.usage_principal && (
                                      <Badge
                                        variant={
                                          property.usage_principal === "habitation"
                                            ? "secondary"
                                            : "warning"
                                        }
                                      >
                                        {getUsageLabel(property.usage_principal)}
                                      </Badge>
                                    )}
                                    <Badge variant={getStatusConfig(property.etat).variant}>
                                      {getStatusConfig(property.etat).label}
                                    </Badge>
                                  </div>
                                  <Link href={`/properties/${property.id}`}>
                                    <Button variant="ghost" size="sm" className="h-6 px-2">
                                      <ArrowRight className="h-3 w-3" />
                                    </Button>
                                  </Link>
                                </div>
                                <h4 className="font-medium mb-2 line-clamp-1">
                                  {property.adresse_complete}
                                </h4>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Ruler className="h-3 w-3" />
                                    <span>{property.surface} m² • {property.nb_pieces} pièces</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-3 w-3" />
                                    <span>
                                      {property.active_leases_count} bail{property.active_leases_count > 1 ? "x" : ""} actif{property.active_leases_count > 1 ? "s" : ""}
                                      {property.tenants_count > 0 && ` • ${property.tenants_count} locataire${property.tenants_count > 1 ? "s" : ""}`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredOwners.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun résultat trouvé
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Vue Propriétaires */}
            <TabsContent value="owners" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredOwners.map((owner) => (
                  <Card key={owner.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{owner.name}</CardTitle>
                      <CardDescription>
                        {owner.owner_profiles?.type === "societe" ? "Société" : "Particulier"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Logements</span>
                          <span className="font-medium">{owner.properties_count}</span>
                        </div>
                        {owner.owner_profiles?.usage_strategie && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Stratégie</span>
                            <span className="font-medium capitalize">
                              {owner.owner_profiles.usage_strategie.replace(/_/g, " ")}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Baux actifs</span>
                          <span className="font-medium">{owner.active_leases}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total baux</span>
                          <span className="font-medium">{owner.total_leases}</span>
                        </div>
                        {owner.owner_profiles?.tva_optionnelle && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">TVA</span>
                            <span className="font-medium">
                              {owner.owner_profiles.tva_taux
                                ? `${owner.owner_profiles.tva_taux?.toString().replace(".", ",")}%`
                                : "Optionnelle"}
                            </span>
                          </div>
                        )}
                      </div>
                      <Link href={`/admin/people/owners/${owner.id}`} className="mt-4 block">
                        <Button variant="outline" className="w-full" size="sm">
                          Voir le profil
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Vue Logements */}
            <TabsContent value="properties" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProperties.map((property) => (
                  <Card key={property.id}>
                    <CardHeader>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-1">
                              {property.adresse_complete}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {property.owner?.name || "Propriétaire inconnu"}
                            </CardDescription>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-end">
                            <Badge variant="secondary">
                              {getTypeLabel(property.type)}
                            </Badge>
                            {property.usage_principal && (
                              <Badge
                                variant={
                                  property.usage_principal === "habitation"
                                    ? "secondary"
                                    : "warning"
                                }
                              >
                                {getUsageLabel(property.usage_principal)}
                              </Badge>
                            )}
                            <Badge variant={getStatusConfig(property.etat).variant}>
                              {getStatusConfig(property.etat).label}
                            </Badge>
                          </div>
                        </div>
                        {property.rejection_reason && property.etat === "rejected" && (
                          <p className="text-xs text-destructive">
                            Motif de rejet : {property.rejection_reason}
                          </p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Ruler className="h-4 w-4" />
                          <span>{property.surface} m² • {property.nb_pieces} pièces</span>
                        </div>
                        {formatSousUsage(property.sous_usage) && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span>Sous-usage : {formatSousUsage(property.sous_usage)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>
                            {property.active_leases_count} bail{property.active_leases_count > 1 ? "x" : ""} actif{property.active_leases_count > 1 ? "s" : ""}
                          </span>
                        </div>
                        {property.tenants_count > 0 && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{property.tenants_count} locataire{property.tenants_count > 1 ? "s" : ""}</span>
                          </div>
                        )}
                        {property.tva_applicable && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>
                              TVA activée
                              {property.tva_taux
                                ? ` • ${property.tva_taux?.toString().replace(".", ",")}%`
                                : ""}
                            </span>
                          </div>
                        )}
                      </div>
                      <Link href={`/properties/${property.id}`}>
                        <Button variant="outline" className="w-full" size="sm">
                          Voir les détails
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminOverviewPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminOverviewContent />
    </ProtectedRoute>
  );
}

