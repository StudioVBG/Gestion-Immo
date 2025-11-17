"use client";

import { Suspense } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { PropertyWizardV3 } from "@/features/properties/components/v3/property-wizard-v3";

function PropertyWizardWrapper() {
  return (
    <div className="space-y-6">
      <PropertyWizardV3 />
    </div>
  );
}

export default function OwnerNewPropertyPage() {
  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Chargement...</div>}>
        <PropertyWizardWrapper />
      </Suspense>
    </ProtectedRoute>
  );
}

