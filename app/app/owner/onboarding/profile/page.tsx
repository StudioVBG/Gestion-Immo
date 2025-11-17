"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { onboardingService } from "@/features/onboarding/services/onboarding.service";
import { ownerProfileOnboardingSchema } from "@/lib/validations/onboarding";
import { ownerProfilesService } from "@/features/profiles/services/owner-profiles.service";
import { Building2, User, ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OwnerProfileOnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    type: "particulier" as "particulier" | "societe",
    raison_sociale: "",
    siren: "",
    siret: "",
    tva: "",
    ubo: "",
  });

  useEffect(() => {
    // Charger le brouillon si disponible
    onboardingService.getDraft().then((draft) => {
      if (draft?.data && draft.role === "owner") {
        setFormData((prev) => ({
          ...prev,
          ...(draft.data as any),
        }));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = ownerProfileOnboardingSchema.parse(formData);

      // Récupérer le profil
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profil non trouvé");

      const profileData = profile as any;

      // Créer ou mettre à jour le profil propriétaire
      const { error } = await (supabase.from("owner_profiles") as any).upsert(
        {
          profile_id: profileData.id as any,
          type: validated.type,
          siret: validated.siret || null,
          tva: validated.tva || null,
        } as any,
        {
          onConflict: "profile_id",
        }
      );

      if (error) throw error;

      // Sauvegarder le brouillon
      await onboardingService.saveDraft("owner_profile", validated, "owner");
      await onboardingService.markStepCompleted("owner_profile", "owner");

      toast({
        title: "Profil enregistré",
        description: "Vos informations ont été sauvegardées.",
      });

      // Rediriger vers les paramètres financiers
      router.push("/owner/onboarding/finance");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Votre profil propriétaire</CardTitle>
          <CardDescription>
            Indiquez si vous êtes un particulier ou une société
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Label>Type de propriétaire *</Label>
              <div className="grid gap-4 md:grid-cols-2">
                <Card
                  className={`cursor-pointer transition-all ${
                    formData.type === "particulier"
                      ? "border-primary ring-2 ring-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setFormData({ ...formData, type: "particulier" })}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3">
                      <User className="w-6 h-6 text-primary" />
                      <div>
                        <h3 className="font-semibold">Particulier</h3>
                        <p className="text-sm text-muted-foreground">
                          Personne physique
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${
                    formData.type === "societe"
                      ? "border-primary ring-2 ring-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setFormData({ ...formData, type: "societe" })}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-6 h-6 text-primary" />
                      <div>
                        <h3 className="font-semibold">Société</h3>
                        <p className="text-sm text-muted-foreground">
                          SCI, SARL, SAS, etc.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {formData.type === "societe" && (
              <div className="space-y-4 border-t pt-6">
                <div className="space-y-2">
                  <Label htmlFor="raison_sociale">Raison sociale *</Label>
                  <Input
                    id="raison_sociale"
                    value={formData.raison_sociale}
                    onChange={(e) => setFormData({ ...formData, raison_sociale: e.target.value })}
                    required
                    disabled={loading}
                    placeholder="Ma SCI"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siren">SIREN (9 chiffres)</Label>
                    <Input
                      id="siren"
                      value={formData.siren}
                      onChange={(e) => setFormData({ ...formData, siren: e.target.value.replace(/\D/g, "").slice(0, 9) })}
                      disabled={loading}
                      placeholder="123456789"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="siret">SIRET (14 chiffres)</Label>
                    <Input
                      id="siret"
                      value={formData.siret}
                      onChange={(e) => setFormData({ ...formData, siret: e.target.value.replace(/\D/g, "").slice(0, 14) })}
                      disabled={loading}
                      placeholder="12345678901234"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tva">Numéro TVA intracommunautaire</Label>
                  <Input
                    id="tva"
                    value={formData.tva}
                    onChange={(e) => setFormData({ ...formData, tva: e.target.value })}
                    disabled={loading}
                    placeholder="FR12345678901"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ubo">UBO (Ultimate Beneficial Owner)</Label>
                  <Input
                    id="ubo"
                    value={formData.ubo}
                    onChange={(e) => setFormData({ ...formData, ubo: e.target.value })}
                    disabled={loading}
                    placeholder="Nom du bénéficiaire effectif"
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                "Enregistrement..."
              ) : (
                <>
                  Continuer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

