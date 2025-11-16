"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { OwnerProfileForm } from "@/features/profiles/components/owner-profile-form";
import { TenantProfileForm } from "@/features/profiles/components/tenant-profile-form";
import { ProviderProfileForm } from "@/features/profiles/components/provider-profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/lib/hooks/use-profile";
import { useAuth } from "@/lib/hooks/use-auth";
import { formatFullName } from "@/lib/helpers/format";
import { ProfileGeneralForm } from "@/features/profiles/components/profile-general-form";

function ProfilePageContent() {
  const { profile } = useProfile();
  const { user } = useAuth();

  const renderProfileForm = () => {
    if (!profile) return null;

    switch (profile.role) {
      case "owner":
        return <OwnerProfileForm />;
      case "tenant":
        return <TenantProfileForm />;
      case "provider":
        return <ProviderProfileForm />;
      default:
        return (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Aucun formulaire de profil spécialisé disponible pour votre rôle.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mon profil</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles</p>
      </div>

      <ProfileGeneralForm />

      {renderProfileForm()}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}

