"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/hooks/use-auth";

export default function OwnerDashboardRedirect() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (profile?.role === "owner") {
        router.replace("/app/owner/dashboard");
      } else if (profile?.role === "tenant") {
        router.replace("/app/tenant");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [profile, loading, router]);

  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Redirection vers le tableau de bord...</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
