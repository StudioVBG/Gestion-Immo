"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function VendorDashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    in_progress: 0,
    done: 0,
    pending: 0,
  });

  useEffect(() => {
    // TODO: Charger les statistiques du prestataire
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch("/api/work-orders");
      if (response.ok) {
        const data = await response.json();
        // Calculer les stats
        const workOrders = data.work_orders || [];
        setStats({
          total: workOrders.length,
          in_progress: workOrders.filter((wo: any) => wo.statut === "scheduled" || wo.statut === "assigned").length,
          done: workOrders.filter((wo: any) => wo.statut === "done").length,
          pending: workOrders.filter((wo: any) => wo.statut === "assigned").length,
        });
      }
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tableau de bord Prestataire</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de vos interventions
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total missions</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.in_progress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.done}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





