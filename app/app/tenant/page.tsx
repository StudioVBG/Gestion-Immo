"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { dashboardGatingService } from "@/features/onboarding/services/dashboard-gating.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PaymentCard } from "@/features/tenant/components/payment-card";
import { ReceiptsTable } from "@/features/tenant/components/receipts-table";
import { ColocBoard } from "@/features/tenant/components/coloc-board";
import { createClient } from "@/lib/supabase/client";

export default function TenantDashboardPage() {
  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeLease, setActiveLease] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) + "-01"
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [check, lease] = await Promise.all([
          dashboardGatingService.getChecklist("tenant"),
          loadActiveLease(),
        ]);
        setChecklist(check);
        setActiveLease(lease);
      } catch (error) {
        console.error("Erreur chargement:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const loadActiveLease = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      // Récupérer le profil
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return null;

      // Récupérer le premier bail actif
      const { data: roommate } = await supabase
        .from("roommates")
        .select("lease_id")
        .eq("user_id", user.id)
        .is("left_on", null)
        .limit(1)
        .single();

      if (!roommate) return null;

      const roommateData = roommate as any;

      const { data: lease } = await supabase
        .from("leases")
        .select("*")
        .eq("id", roommateData.lease_id as any)
        .eq("statut", "active" as any)
        .single();

      return lease;
    } catch (error) {
      console.error("Erreur chargement bail:", error);
      return null;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["tenant"]}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["tenant"]}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {checklist && !checklist.allCompleted && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <CardTitle>Finalisez votre inscription</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {checklist.items.map((item: any) => (
                  <li key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      )}
                      <span>{item.label}</span>
                    </div>
                    {!item.completed && item.route && (
                      <Link href={item.route}>
                        <Button size="sm" variant="outline">
                          Compléter
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {activeLease && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <PaymentCard leaseId={activeLease.id} month={currentMonth} />
              <ColocBoard leaseId={activeLease.id} month={currentMonth} />
            </div>

            <ReceiptsTable leaseId={activeLease.id} />
          </>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Mes baux</CardTitle>
              <CardDescription>Consultez vos contrats</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/leases">
                <Button className="w-full">Voir mes baux</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mes factures</CardTitle>
              <CardDescription>Suivez vos paiements</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/invoices">
                <Button className="w-full">Voir mes factures</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mes tickets</CardTitle>
              <CardDescription>Gérez vos demandes</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/tickets">
                <Button className="w-full">Voir mes tickets</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

