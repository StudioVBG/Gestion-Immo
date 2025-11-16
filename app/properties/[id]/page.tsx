"use client";

import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { PropertyDetailPremium } from "@/features/properties/components/v3/property-detail-premium";

function PropertyDetailPageContent() {
  const params = useParams();
  
  if (!params.id || typeof params.id !== "string") {
    return null;
  }

  return <PropertyDetailPremium propertyId={params.id} />;
}

export default function PropertyDetailPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "owner"]}>
      <PropertyDetailPageContent />
    </ProtectedRoute>
  );
}

