"use client";

/**
 * Dashboard Tenant V2 - Version complète avec données réelles
 * Affiche les KPIs, baux actifs, factures récentes et tickets ouverts
 * Date: 2025-01-XX
 */

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/hooks/use-auth";
import { useLeases, useInvoices, useTickets } from "@/lib/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight, FileText, Euro, Calendar, Home, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDateShort } from "@/lib/helpers/format";
import { cn } from "@/lib/utils";

export default function TenantDashboardPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const { data: leases = [], isLoading: leasesLoading } = useLeases();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: tickets = [], isLoading: ticketsLoading } = useTickets();

  // Rediriger immédiatement les propriétaires
  useEffect(() => {
    if (!authLoading && profile?.role === "owner") {
      router.replace("/app/owner/dashboard");
      return;
    }
  }, [profile, authLoading, router]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const activeLeases = leases.filter((l: any) => l.statut === "active");
    const pendingInvoices = invoices.filter((inv: any) => inv.statut === "sent" || inv.statut === "draft");
    const unpaidInvoices = invoices.filter((inv: any) => inv.statut === "sent");
    const openTickets = tickets.filter((t: any) => t.statut === "open" || t.statut === "in_progress");
    
    const totalDue = unpaidInvoices.reduce((sum: number, inv: any) => sum + Number(inv.montant_total || 0), 0);
    const nextPayment = pendingInvoices.length > 0 
      ? pendingInvoices.sort((a: any, b: any) => a.periode.localeCompare(b.periode))[0]
      : null;

    return {
      activeLeases,
      pendingInvoices,
      unpaidInvoices,
      openTickets,
      totalDue,
      nextPayment,
    };
  }, [leases, invoices, tickets]);

  const loading = authLoading || leasesLoading || invoicesLoading || ticketsLoading;

  // Ne pas afficher si on redirige
  if (!authLoading && profile?.role === "owner") {
    return null;
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["tenant"]}>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-primary mx-auto"></div>
            </div>
            <p className="text-muted-foreground animate-pulse">Chargement de votre tableau de bord...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["tenant"]}>
      <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
          {/* Header avec animation */}
          <header className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Tableau de bord
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Bienvenue, {profile?.prenom || "Locataire"}
            </p>
          </header>

          {/* Alertes importantes */}
          {stats.unpaidInvoices.length > 0 && (
            <Card className="border-red-500 bg-red-50 dark:bg-red-950 animate-in fade-in slide-in-from-top-4 duration-700">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <CardTitle>Paiements en attente</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  Vous avez {stats.unpaidInvoices.length} facture{stats.unpaidInvoices.length > 1 ? "s" : ""} en attente de paiement pour un total de <strong>{formatCurrency(stats.totalDue)}</strong>.
                </p>
                <Button asChild variant="outline" className="hover:bg-red-100">
                  <Link href="/invoices">
                    Voir mes factures
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-3 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '100ms' }}>
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Mes baux actifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.activeLeases.length}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.activeLeases.length === 0 ? "Aucun bail actif" : `${stats.activeLeases.length} bail${stats.activeLeases.length > 1 ? "x" : ""} en cours`}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Montant dû
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(stats.totalDue)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.unpaidInvoices.length} facture{stats.unpaidInvoices.length > 1 ? "s" : ""} impayée{stats.unpaidInvoices.length > 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Tickets ouverts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.openTickets.length}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.openTickets.length === 0 ? "Aucun ticket" : "En attente de traitement"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Prochain paiement */}
          {stats.nextPayment && (
            <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '200ms' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Prochain paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(stats.nextPayment.montant_total || 0)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Période : {new Date(stats.nextPayment.periode + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/invoices/${stats.nextPayment.id}`}>
                      Payer maintenant
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mes baux actifs */}
          {stats.activeLeases.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '300ms' }}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse"></span>
                Mes baux actifs
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {stats.activeLeases.slice(0, 2).map((lease: any, index: number) => (
                  <Card
                    key={lease.id}
                    className={cn(
                      "hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group",
                      "animate-in fade-in slide-in-from-left-4"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">Bail {lease.type_bail || "N/A"}</CardTitle>
                          <Badge variant="default">Actif</Badge>
                        </div>
                        <Home className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Du {formatDateShort(lease.date_debut)}
                            {lease.date_fin && ` au ${formatDateShort(lease.date_fin)}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Euro className="h-4 w-4" />
                          <span>
                            {formatCurrency(Number(lease.loyer || 0) + Number(lease.charges_forfaitaires || 0))} / mois
                          </span>
                        </div>
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:bg-slate-900 group-hover:text-white"
                      >
                        <Link href={`/leases/${lease.id}`}>
                          Voir le détail
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {stats.activeLeases.length > 2 && (
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/leases">
                      Voir tous mes baux ({stats.activeLeases.length})
                    </Link>
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* Factures récentes */}
          {stats.pendingInvoices.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '400ms' }}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse"></span>
                Factures récentes
              </h2>
              <div className="space-y-3">
                {stats.pendingInvoices.slice(0, 3).map((invoice: any, index: number) => (
                  <Card
                    key={invoice.id}
                    className={cn(
                      "hover:shadow-lg transition-all duration-300 hover:scale-[1.01] cursor-pointer group",
                      "animate-in fade-in slide-in-from-left-4"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {new Date(invoice.periode + "-01").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                            </span>
                            <Badge variant={invoice.statut === "sent" ? "destructive" : "secondary"}>
                              {invoice.statut === "sent" ? "À payer" : "Brouillon"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(invoice.montant_total || 0)}
                          </p>
                        </div>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <Link href={`/invoices/${invoice.id}`}>
                            {invoice.statut === "sent" ? "Payer" : "Voir"}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {stats.pendingInvoices.length > 3 && (
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/invoices">
                      Voir toutes mes factures ({stats.pendingInvoices.length})
                    </Link>
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* Tickets ouverts */}
          {stats.openTickets.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '500ms' }}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-orange-500 animate-pulse"></span>
                Mes tickets ouverts
              </h2>
              <div className="space-y-3">
                {stats.openTickets.slice(0, 3).map((ticket: any, index: number) => (
                  <Card
                    key={ticket.id}
                    className={cn(
                      "hover:shadow-lg transition-all duration-300 hover:scale-[1.01] cursor-pointer group",
                      "animate-in fade-in slide-in-from-left-4"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{ticket.titre}</span>
                            <Badge variant={
                              ticket.priorite === "haute" ? "destructive" :
                              ticket.priorite === "normale" ? "default" : "secondary"
                            }>
                              {ticket.priorite}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {ticket.description}
                          </p>
                        </div>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <Link href={`/tickets/${ticket.id}`}>
                            Voir
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {stats.openTickets.length > 3 && (
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/tickets">
                      Voir tous mes tickets ({stats.openTickets.length})
                    </Link>
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* Actions rapides */}
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '600ms' }}>
            <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
                <CardHeader>
                  <CardTitle className="group-hover:text-primary transition-colors duration-300">
                    Mes baux
                  </CardTitle>
                  <CardDescription>Consultez vos contrats</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/leases">
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      Voir mes baux
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
                <CardHeader>
                  <CardTitle className="group-hover:text-primary transition-colors duration-300">
                    Mes factures
                  </CardTitle>
                  <CardDescription>Suivez vos paiements</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/invoices">
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      Voir mes factures
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
                <CardHeader>
                  <CardTitle className="group-hover:text-primary transition-colors duration-300">
                    Mes tickets
                  </CardTitle>
                  <CardDescription>Gérez vos demandes</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/tickets">
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      Voir mes tickets
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Empty state si aucune donnée */}
          {stats.activeLeases.length === 0 && stats.pendingInvoices.length === 0 && stats.openTickets.length === 0 && (
            <Card className="animate-in fade-in zoom-in-95 duration-700">
              <CardContent className="py-16 text-center">
                <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Bienvenue !</h2>
                <p className="text-muted-foreground mb-6">
                  Votre tableau de bord s'enrichira au fur et à mesure de vos contrats et paiements.
                </p>
                <Button asChild variant="outline">
                  <Link href="/leases">
                    Voir mes baux
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
