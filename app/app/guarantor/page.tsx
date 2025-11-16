"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GuarantorDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["tenant"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tableau de bord Garant</h1>
          <p className="text-muted-foreground">
            Accès en lecture seule aux documents et au statut du bail
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Documents signés</CardTitle>
              <CardDescription>Consultez les documents que vous avez signés</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/documents">
                <Button className="w-full">Voir les documents</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statut du bail</CardTitle>
              <CardDescription>Suivez le statut du bail pour lequel vous êtes garant</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/leases">
                <Button className="w-full">Voir le bail</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}

