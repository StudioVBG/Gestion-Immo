"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Search, Euro, Calendar, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { useInvoices, useLeases, useProperties } from "@/lib/hooks";
import { formatCurrency, formatDateShort } from "@/lib/helpers/format";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function OwnerMoneyPage() {
  const searchParams = useSearchParams();
  const propertyIdFilter = searchParams.get("property_id");
  const filterParam = searchParams.get("filter");

  const { data: invoices = [], isLoading } = useInvoices();
  const { data: leases = [] } = useLeases(propertyIdFilter || undefined);
  const { data: properties = [] } = useProperties();

  const [searchQuery, setSearchQuery] = useState("");

  // Filtrer les factures
  let filteredInvoices = invoices;

  if (propertyIdFilter) {
    const propertyLeases = leases.map((l: any) => l.id);
    filteredInvoices = filteredInvoices.filter((inv: any) =>
      propertyLeases.includes(inv.lease_id)
    );
  }

  if (filterParam === "unpaid") {
    filteredInvoices = filteredInvoices.filter(
      (inv: any) => inv.statut === "sent" || inv.statut === "draft"
    );
  }

  if (searchQuery) {
    filteredInvoices = filteredInvoices.filter((inv: any) => {
      const lease = leases.find((l: any) => l.id === inv.lease_id);
      const property = properties.find(
        (p: any) => p.id === lease?.property_id
      );
      return property?.adresse_complete?.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }

  // Calculer les KPIs
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthInvoices = filteredInvoices.filter(
    (inv: any) => inv.periode === currentMonth
  );
  const totalDue = currentMonthInvoices.reduce(
    (sum, inv) => sum + Number(inv.montant_total || 0),
    0
  );
  const totalCollected = currentMonthInvoices
    .filter((inv: any) => inv.statut === "paid")
    .reduce((sum, inv) => sum + Number(inv.montant_total || 0), 0);
  const totalUnpaid = filteredInvoices
    .filter((inv: any) => inv.statut === "sent" || inv.statut === "draft")
    .reduce((sum, inv) => sum + Number(inv.montant_total || 0), 0);

  // Données pour le graphique (12 derniers mois)
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const period = date.toISOString().slice(0, 7);
      const periodInvoices = filteredInvoices.filter((inv: any) => inv.periode === period);
      const collected = periodInvoices
        .filter((inv: any) => inv.statut === "paid")
        .reduce((sum, inv) => sum + Number(inv.montant_total || 0), 0);

      data.push({
        period,
        collected,
      });
    }
    return data;
  }, [filteredInvoices]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: "default",
      sent: "secondary",
      draft: "outline",
      late: "destructive",
    };
    const labels: Record<string, string> = {
      paid: "Payé",
      sent: "Envoyé",
      draft: "Brouillon",
      late: "En retard",
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
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Loyers & revenus
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Suivez vos encaissements et impayés
            </p>
          </div>

        {/* KPIs avec animations */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <CardHeader>
              <CardTitle className="text-sm">Total dû ce mois-ci</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {formatCurrency(totalDue)}
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <CardHeader>
              <CardTitle className="text-sm">Total encaissé</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {formatCurrency(totalCollected)}
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <CardHeader>
              <CardTitle className="text-sm">Impayés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {formatCurrency(totalUnpaid)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <Tabs defaultValue="current" className="space-y-6">
          <TabsList>
            <TabsTrigger value="current">Qui me doit combien ?</TabsTrigger>
            <TabsTrigger value="history">Historique & performance</TabsTrigger>
            <TabsTrigger value="regularization">Régularisation & indexation</TabsTrigger>
          </TabsList>

          {/* Qui me doit combien */}
          <TabsContent value="current">
            {/* Recherche */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par adresse..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tableau */}
            {filteredInvoices.length === 0 ? (
              <EmptyStateInvoices />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Mois</th>
                          <th className="px-4 py-3 text-left font-medium">Bien</th>
                          <th className="px-4 py-3 text-left font-medium">Locataire</th>
                          <th className="px-4 py-3 text-right font-medium">Dû</th>
                          <th className="px-4 py-3 text-right font-medium">Encaissé</th>
                          <th className="px-4 py-3 text-right font-medium">Retard</th>
                          <th className="px-4 py-3 text-right font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.map((invoice: any) => {
                          const lease = leases.find((l: any) => l.id === invoice.lease_id);
                          const property = properties.find(
                            (p: any) => p.id === lease?.property_id
                          );
                          const isOverdue =
                            invoice.statut !== "paid" &&
                            new Date(invoice.periode + "-01") < new Date();
                          const daysOverdue = isOverdue
                            ? Math.floor(
                                (new Date().getTime() -
                                  new Date(invoice.periode + "-01").getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            : 0;

                          return (
                            <tr
                              key={invoice.id}
                              className="border-b hover:bg-slate-50 transition-colors duration-200 group"
                            >
                              <td className="px-4 py-3">
                                {new Date(invoice.periode + "-01").toLocaleDateString("fr-FR", {
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                              <td className="px-4 py-3">
                                {property?.adresse_complete || "N/A"}
                              </td>
                              <td className="px-4 py-3">-</td>
                              <td className="px-4 py-3 text-right">
                                {formatCurrency(Number(invoice.montant_total || 0))}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {invoice.statut === "paid" ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 inline" />
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {daysOverdue > 0 ? (
                                  <span className="text-red-600">{daysOverdue} j</span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {getStatusBadge(invoice.statut)}
                                  {invoice.statut !== "paid" && (
                                    <Button
                                      asChild
                                      variant="outline"
                                      size="sm"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-green-50 hover:border-green-300"
                                    >
                                      <Link href={`/invoices/${invoice.id}`}>
                                        Marquer payé
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Historique & performance */}
          <TabsContent value="history">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Loyers encaissés</CardTitle>
                  <CardDescription>12 derniers mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="period"
                        stroke="#94a3b8"
                        tickFormatter={(value) => {
                          const date = new Date(value + "-01");
                          return date.toLocaleDateString("fr-FR", {
                            month: "short",
                            year: "2-digit",
                          });
                        }}
                      />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="collected"
                        name="Encaissé"
                        stroke="#0f172a"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance par bien</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Les statistiques par bien seront disponibles ici.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Régularisation & indexation */}
          <TabsContent value="regularization">
            <Card>
              <CardHeader>
                <CardTitle>Régularisation & indexation</CardTitle>
                <CardDescription>
                  Baux avec indexation à faire et régularisation de charges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Les baux nécessitant une indexation ou une régularisation de charges
                  apparaîtront ici.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function EmptyStateInvoices() {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <Euro className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          Aucune facture pour le moment
        </h2>
        <p className="text-muted-foreground mb-6">
          Dès que votre premier bail sera actif, vous verrez ici les loyers dus et encaissés.
        </p>
        <Button asChild variant="outline">
          <Link href="/app/owner/contracts">Voir mes baux</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

