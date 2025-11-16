"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { dashboardGatingService } from "@/features/onboarding/services/dashboard-gating.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

export default function ProviderDashboardPage() {
  const [checklist, setChecklist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    const loadChecklist = async () => {
      try {
        const check = await dashboardGatingService.getChecklist("provider");
        setChecklist(check);
        // TODO: Vérifier si le profil est validé par un admin
        setIsValidated(false); // À implémenter avec une vérification réelle
      } catch (error) {
        console.error("Erreur chargement checklist:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChecklist();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["provider"]}>
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
    <ProtectedRoute allowedRoles={["provider"]}>
      <div className="container mx-auto px-4 py-8">
        {!isValidated && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <CardTitle>Profil en attente de validation</CardTitle>
              </div>
              <CardDescription>
                Votre profil est en cours de validation par un administrateur. 
                Vous avez accès à des fonctionnalités limitées en attendant.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {checklist && !checklist.allCompleted && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
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

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Mes interventions</CardTitle>
              <CardDescription>Suivez vos interventions</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/work-orders">
                <Button className="w-full">Voir mes interventions</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mes devis</CardTitle>
              <CardDescription>Gérez vos devis</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/quotes">
                <Button className="w-full">Voir mes devis</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mon profil</CardTitle>
              <CardDescription>Gérez vos informations</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/profile">
                <Button className="w-full">Modifier mon profil</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

