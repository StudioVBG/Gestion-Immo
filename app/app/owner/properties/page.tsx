"use client";

import { useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Building2, Home, MapPin, Ruler, ArrowRight } from "lucide-react";
import { useProperties, useLeases } from "@/lib/hooks";
import { formatCurrency } from "@/lib/helpers/format";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function OwnerPropertiesPage() {
  const searchParams = useSearchParams();
  const moduleFilter = searchParams.get("module");
  const { data: properties = [], isLoading } = useProperties();
  const { data: leases = [] } = useLeases();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Déterminer le statut de chaque bien
  const propertiesWithStatus = properties.map((property: any) => {
    const propertyLeases = leases.filter(
      (lease: any) => lease.property_id === property.id
    );
    const activeLease = propertyLeases.find(
      (lease: any) => lease.statut === "active"
    );
    const pendingLease = propertyLeases.find(
      (lease: any) => lease.statut === "pending_signature"
    );

    let status = "vacant";
    if (activeLease) status = "loue";
    else if (pendingLease) status = "en_preavis";

    return {
      ...property,
      status,
      currentLease: activeLease || pendingLease,
      monthlyRent: activeLease
        ? Number(activeLease.loyer || 0) + Number(activeLease.charges_forfaitaires || 0)
        : 0,
    };
  });

  // Filtrer selon les critères
  let filteredProperties = propertiesWithStatus;

  if (moduleFilter) {
    // Filtrer par module (simplifié - basé sur le type de bien)
    filteredProperties = filteredProperties.filter((p: any) => {
      if (moduleFilter === "habitation") {
        return p.type === "appartement" || p.type === "maison" || p.type === "colocation";
      }
      if (moduleFilter === "pro") {
        return p.type === "commercial" || p.type === "bureau";
      }
      return true;
    });
  }

  if (typeFilter !== "all") {
    filteredProperties = filteredProperties.filter((p: any) => p.type === typeFilter);
  }

  if (statusFilter !== "all") {
    filteredProperties = filteredProperties.filter((p: any) => p.status === statusFilter);
  }

  if (searchQuery) {
    filteredProperties = filteredProperties.filter((p: any) =>
      p.adresse_complete?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      loue: "default",
      en_preavis: "secondary",
      vacant: "outline",
    };
    const labels: Record<string, string> = {
      loue: "Loué",
      en_preavis: "En préavis",
      vacant: "Vacant",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

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
    return labels[type] || type;
  };

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

  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header avec animation */}
          <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                Mes biens
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Gérez votre portefeuille locatif
              </p>
            </div>
            <Button asChild className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Link href="/app/owner/properties/new">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un bien
              </Link>
            </Button>
          </div>

        {/* Filtres */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par adresse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Type de bien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="appartement">Appartement</SelectItem>
              <SelectItem value="maison">Maison</SelectItem>
              <SelectItem value="colocation">Colocation</SelectItem>
              <SelectItem value="saisonnier">Saisonnier</SelectItem>
              <SelectItem value="commercial">Local commercial</SelectItem>
              <SelectItem value="bureau">Bureau</SelectItem>
              <SelectItem value="parking">Parking</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="loue">Loué</SelectItem>
              <SelectItem value="en_preavis">En préavis</SelectItem>
              <SelectItem value="vacant">Vacant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des biens */}
        {filteredProperties.length === 0 ? (
          <EmptyState hasProperties={properties.length === 0} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property: any, index: number) => (
              <Card
                key={property.id}
                className={cn(
                  "hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group",
                  "animate-in fade-in slide-in-from-bottom-4"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {property.adresse_complete || "Sans adresse"}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{getTypeLabel(property.type || "")}</Badge>
                        {getStatusBadge(property.status)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {property.surface && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Ruler className="h-4 w-4" />
                        {property.surface} m²
                        {property.nb_pieces && ` · ${property.nb_pieces} pièces`}
                      </div>
                    )}
                    {property.monthlyRent > 0 && (
                      <div className="text-lg font-semibold">
                        {formatCurrency(property.monthlyRent)} / mois
                      </div>
                    )}
                    <Button
                      asChild
                      variant="outline"
                      className="w-full group-hover:bg-slate-900 group-hover:text-white transition-all duration-300"
                    >
                      <Link href={`/app/owner/properties/${property.id}`}>
                        Voir la fiche
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function EmptyState({ hasProperties }: { hasProperties: boolean }) {
  if (hasProperties) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            Aucun bien ne correspond à vos critères de recherche.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-16 text-center">
        <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Aucun bien pour l'instant</h2>
        <p className="text-muted-foreground mb-6">
          Cliquez sur "Ajouter un bien" pour enregistrer votre premier logement.
        </p>
        <Button asChild>
          <Link href="/app/owner/properties/new">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un bien
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}


