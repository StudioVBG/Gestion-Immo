"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { PropertyForm } from "@/features/properties/components/property-form";
import { propertiesService } from "@/features/properties/services/properties.service";
import type { Property } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

function EditPropertyPageContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProperty(params.id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function fetchProperty(id: string) {
    try {
      setLoading(true);
      const data = await propertiesService.getPropertyById(id);
      setProperty(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger le logement.",
        variant: "destructive",
      });
      router.push("/properties");
    } finally {
      setLoading(false);
    }
  }

  const handleSuccess = () => {
    router.push(`/properties/${params.id}`);
  };

  const handleCancel = () => {
    router.push(`/properties/${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <PropertyForm property={property} onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}

export default function EditPropertyPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "owner"]}>
      <EditPropertyPageContent />
    </ProtectedRoute>
  );
}

