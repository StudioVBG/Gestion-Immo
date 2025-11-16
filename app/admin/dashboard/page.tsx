"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { StatsCard } from "@/features/admin/components/stats-card";
import { statsService, type AdminStats } from "@/features/admin/services/stats.service";
import { useAuth } from "@/lib/hooks/use-auth";
import { useToast } from "@/components/ui/use-toast";
import { Users, Home, FileText, Ticket, DollarSign, FolderOpen, BookOpen, Key, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateShort } from "@/lib/helpers/format";

function AdminDashboardContent() {
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attendre que l'authentification soit chargée et vérifier que l'utilisateur est admin
    if (authLoading) return;
    
    if (!user) {
      toast({
        title: "Non authentifié",
        description: "Vous devez être connecté pour accéder à cette page.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (profile?.role !== "admin") {
      toast({
        title: "Accès refusé",
        description: "Vous devez être administrateur pour accéder à cette page.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, authLoading]);

  async function fetchStats() {
    try {
      setLoading(true);
      const data = await statsService.getAdminStats();
      setStats(data);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les statistiques.",
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
          <p className="mt-4 text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div>Erreur lors du chargement des statistiques</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord Admin</h1>
        <p className="text-muted-foreground">Vue d'ensemble de la plateforme</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Utilisateurs"
          value={stats.totalUsers}
          description={`${stats.usersByRole.owner} propriétaires, ${stats.usersByRole.tenant} locataires`}
          icon={Users}
        />
        <StatsCard
          title="Logements"
          value={stats.totalProperties}
          description="Total des logements enregistrés"
          icon={Home}
        />
        <StatsCard
          title="Baux actifs"
          value={stats.activeLeases}
          description={`Sur ${stats.totalLeases} baux au total`}
          icon={FileText}
        />
        <StatsCard
          title="Factures impayées"
          value={stats.unpaidInvoices}
          description={`Sur ${stats.totalInvoices} factures`}
          icon={DollarSign}
        />
        <StatsCard
          title="Tickets ouverts"
          value={stats.openTickets}
          description={`Sur ${stats.totalTickets} tickets`}
          icon={Ticket}
        />
        <StatsCard
          title="Documents"
          value={stats.totalDocuments}
          description="Total des documents stockés"
          icon={FolderOpen}
        />
        <StatsCard
          title="Articles publiés"
          value={stats.publishedBlogPosts}
          description={`Sur ${stats.totalBlogPosts} articles`}
          icon={BookOpen}
        />
      </div>

      {/* Statistiques détaillées */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs par rôle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Admins</span>
                <span className="font-medium">{stats.usersByRole.admin}</span>
              </div>
              <div className="flex justify-between">
                <span>Propriétaires</span>
                <span className="font-medium">{stats.usersByRole.owner}</span>
              </div>
              <div className="flex justify-between">
                <span>Locataires</span>
                <span className="font-medium">{stats.usersByRole.tenant}</span>
              </div>
              <div className="flex justify-between">
                <span>Prestataires</span>
                <span className="font-medium">{stats.usersByRole.provider}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Baux par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Brouillons</span>
                <span className="font-medium">{stats.leasesByStatus.draft}</span>
              </div>
              <div className="flex justify-between">
                <span>En attente de signature</span>
                <span className="font-medium">{stats.leasesByStatus.pending_signature}</span>
              </div>
              <div className="flex justify-between">
                <span>Actifs</span>
                <span className="font-medium text-green-600">
                  {stats.leasesByStatus.active}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Terminés</span>
                <span className="font-medium">{stats.leasesByStatus.terminated}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Factures par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Brouillons</span>
                <span className="font-medium">{stats.invoicesByStatus.draft}</span>
              </div>
              <div className="flex justify-between">
                <span>Envoyées</span>
                <span className="font-medium">{stats.invoicesByStatus.sent}</span>
              </div>
              <div className="flex justify-between">
                <span>Payées</span>
                <span className="font-medium text-green-600">
                  {stats.invoicesByStatus.paid}
                </span>
              </div>
              <div className="flex justify-between">
                <span>En retard</span>
                <span className="font-medium text-red-600">
                  {stats.invoicesByStatus.late}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Ouverts</span>
                <span className="font-medium">{stats.ticketsByStatus.open}</span>
              </div>
              <div className="flex justify-between">
                <span>En cours</span>
                <span className="font-medium">{stats.ticketsByStatus.in_progress}</span>
              </div>
              <div className="flex justify-between">
                <span>Résolus</span>
                <span className="font-medium text-green-600">
                  {stats.ticketsByStatus.resolved}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Fermés</span>
                <span className="font-medium">{stats.ticketsByStatus.closed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logements par type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Appartements</span>
                <span className="font-medium">{stats.propertiesByType.appartement}</span>
              </div>
              <div className="flex justify-between">
                <span>Maisons</span>
                <span className="font-medium">{stats.propertiesByType.maison}</span>
              </div>
              <div className="flex justify-between">
                <span>Colocations</span>
                <span className="font-medium">{stats.propertiesByType.colocation}</span>
              </div>
              <div className="flex justify-between">
                <span>Saisonniers</span>
                <span className="font-medium">{stats.propertiesByType.saisonnier}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>Les 10 dernières activités sur la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentActivity.length === 0 ? (
              <p className="text-muted-foreground">Aucune activité récente</p>
            ) : (
              stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateShort(activity.date)}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-muted capitalize">
                    {activity.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

