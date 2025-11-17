"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { Search, FileText, Upload, Download } from "lucide-react";
import { useDocuments } from "@/lib/hooks";
import { formatDateShort } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";

export default function OwnerDocumentsPage() {
  const searchParams = useSearchParams();
  const propertyIdFilter = searchParams.get("property_id");

  const { data: documents = [], isLoading } = useDocuments();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  // Filtrer les documents
  let filteredDocuments = documents;

  if (propertyIdFilter) {
    filteredDocuments = filteredDocuments.filter(
      (doc: any) => doc.property_id === propertyIdFilter
    );
  }

  if (typeFilter !== "all") {
    filteredDocuments = filteredDocuments.filter((doc: any) => doc.type === typeFilter);
  }

  if (searchQuery) {
    filteredDocuments = filteredDocuments.filter((doc: any) =>
      doc.type?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bail: "Bail",
      avenant: "Avenant",
      EDL_entree: "EDL entrée",
      EDL_sortie: "EDL sortie",
      quittance: "Quittance",
      attestation_assurance: "Attestation assurance",
      DPE: "DPE",
      diagnostic: "Diagnostic",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      expired: "destructive",
      archived: "outline",
    };
    const labels: Record<string, string> = {
      active: "Actif",
      expired: "Expiré",
      archived: "Archivé",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
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
                Documents
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Bibliothèque de tous vos documents
              </p>
            </div>
            <Button asChild className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Link href="/documents/upload">
                <Upload className="mr-2 h-4 w-4" />
                Téléverser un document
              </Link>
            </Button>
          </div>

        {/* Filtres */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="bail">Bail</SelectItem>
              <SelectItem value="avenant">Avenant</SelectItem>
              <SelectItem value="EDL_entree">EDL entrée</SelectItem>
              <SelectItem value="EDL_sortie">EDL sortie</SelectItem>
              <SelectItem value="quittance">Quittance</SelectItem>
              <SelectItem value="DPE">DPE</SelectItem>
              <SelectItem value="diagnostic">Diagnostic</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="expired">Expiré</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des documents */}
        {filteredDocuments.length === 0 ? (
          <EmptyStateDocuments />
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Type</th>
                      <th className="px-4 py-3 text-left font-medium">Bien</th>
                      <th className="px-4 py-3 text-left font-medium">Bail</th>
                      <th className="px-4 py-3 text-left font-medium">Daté du</th>
                      <th className="px-4 py-3 text-left font-medium">Statut</th>
                      <th className="px-4 py-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc: any, index: number) => (
                      <tr
                        key={doc.id}
                        className={cn(
                          "border-b hover:bg-slate-50 transition-colors duration-200 group",
                          "animate-in fade-in slide-in-from-left-4"
                        )}
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {getTypeLabel(doc.type || "")}
                          </div>
                        </td>
                        <td className="px-4 py-3">-</td>
                        <td className="px-4 py-3">-</td>
                        <td className="px-4 py-3">
                          {doc.created_at
                            ? formatDateShort(doc.created_at)
                            : "-"}
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(doc.statut || "active")}</td>
                        <td className="px-4 py-3 text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/documents/${doc.id}`}>
                              <Download className="h-4 w-4" />
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function EmptyStateDocuments() {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Aucun document pour l'instant
        </h2>
        <p className="text-muted-foreground mb-6">
          Tous vos documents (baux, EDL, diagnostics, quittances…) apparaîtront ici dès qu'ils
          seront générés ou téléversés.
        </p>
        <Button asChild>
          <Link href="/documents/upload">
            <Upload className="mr-2 h-4 w-4" />
            Téléverser un document
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

