"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { CheckCircle, Clock, XCircle } from "lucide-react";

export default function VendorJobsPage() {
  const { toast } = useToast();
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  async function fetchWorkOrders() {
    try {
      const response = await fetch("/api/work-orders");
      if (response.ok) {
        const data = await response.json();
        setWorkOrders(data.work_orders || []);
      }
    } catch (error) {
      console.error("Erreur chargement missions:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(statut: string) {
    switch (statut) {
      case "done":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "scheduled":
      case "assigned":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Mes missions</h1>
        <p className="text-muted-foreground mt-2">
          Liste de toutes vos interventions assignées
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interventions</CardTitle>
          <CardDescription>
            Gérer vos missions et interventions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Chargement...</p>
          ) : workOrders.length === 0 ? (
            <p className="text-muted-foreground">Aucune mission assignée</p>
          ) : (
            <div className="space-y-4">
              {workOrders.map((wo: any) => (
                <div
                  key={wo.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(wo.statut)}
                    <div>
                      <h3 className="font-semibold">
                        Ticket #{wo.ticket_id?.substring(0, 8)}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {wo.date_intervention_prevue
                          ? new Date(wo.date_intervention_prevue).toLocaleDateString()
                          : "Date non définie"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/tickets/${wo.ticket_id}`}>
                      <Button variant="outline" size="sm">
                        Voir détails
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}





