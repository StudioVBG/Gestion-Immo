"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { onboardingService } from "@/features/onboarding/services/onboarding.service";
import { minimalProfileSchema } from "@/lib/validations/onboarding";
import type { UserRole } from "@/lib/types";
import { User, Phone, Globe, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

const COUNTRIES = [
  { code: "FR", name: "France métropolitaine" },
  { code: "GP", name: "Guadeloupe" },
  { code: "MQ", name: "Martinique" },
  { code: "GF", name: "Guyane" },
  { code: "RE", name: "La Réunion" },
  { code: "YT", name: "Mayotte" },
  { code: "PM", name: "Saint-Pierre-et-Miquelon" },
  { code: "BL", name: "Saint-Barthélemy" },
  { code: "MF", name: "Saint-Martin" },
];

export default function MinimalProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const role = searchParams.get("role") as UserRole | null;
  const inviteToken = searchParams.get("invite");

  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    country_code: "FR" as const,
    telephone: "",
  });

  const [skipPhone, setSkipPhone] = useState(false);

  useEffect(() => {
    if (!role || !["owner", "tenant", "provider"].includes(role)) {
      router.push("/signup/role");
    }

    // Charger le brouillon si disponible
    onboardingService.getDraft().then((draft) => {
      if (draft?.data) {
        setFormData((prev) => ({
          ...prev,
          ...(draft.data as any),
        }));
      }
    });
  }, [role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = minimalProfileSchema.parse({
        ...formData,
        telephone: skipPhone ? null : formData.telephone || null,
      });

      // Sauvegarder le profil
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non authentifié");

      const updateData: any = {
        prenom: validated.prenom,
        nom: validated.nom,
        telephone: validated.telephone,
      };
      const { error: profileError } = await (supabase
        .from("profiles") as any)
        .update(updateData)
        .eq("user_id", user.id as any);

      if (profileError) throw profileError;

      // Sauvegarder le brouillon
      await onboardingService.saveDraft("minimal_profile", validated, role!);
      await onboardingService.markStepCompleted("minimal_profile", role!);

      toast({
        title: "Profil enregistré",
        description: "Vos informations ont été sauvegardées.",
      });

      // Rediriger vers le parcours spécifique du rôle
      if (inviteToken) {
        router.push(`/tenant/onboarding/context?invite=${inviteToken}`);
      } else {
        switch (role) {
          case "owner":
            router.push("/owner/onboarding/profile");
            break;
          case "tenant":
            router.push("/tenant/onboarding/context");
            break;
          case "provider":
            router.push("/provider/onboarding/profile");
            break;
          default:
            router.push("/dashboard");
        }
      }
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
    <OnboardingShell
      stepLabel="Étape 3 / 4 – Profil express"
      title="Personnalisons votre expérience"
      subtitle="Ces informations restent privées et permettent d’adapter le parcours locatif/propriétaire."
      footer={
        <p>
          Besoin d’aide ?{" "}
          <a href="mailto:concierge@gestion-locative.app" className="text-white underline-offset-4 hover:underline">
            concierge@gestion-locative.app
          </a>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-8 text-white">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 160 }}
          className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-slate-200"
        >
          <div className="flex flex-wrap items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            <span>Profil minimal requis pour l’accès complet.</span>
            <Badge variant="outline" className="border-emerald-400/60 bg-emerald-500/10 text-emerald-100">
              2 min
            </Badge>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140 }}
          className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-200">Identité</p>
              <p className="text-xs text-slate-400">Visible uniquement pour vos prospects approuvés.</p>
            </div>
            <Badge className="bg-white/10 text-white">{role?.toUpperCase()}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="prenom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  required
                  disabled={loading}
                  className="pl-10"
                  placeholder="Jean"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  disabled={loading}
                  className="pl-10"
                  placeholder="Dupont"
                />
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 140 }}
          className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-200">
            <Globe className="h-4 w-4" />
            Territoire d’activité
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country_code">Pays / DROM *</Label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-3 top-3 z-10 h-4 w-4 text-slate-400" />
                <Select
                  value={formData.country_code}
                  onValueChange={(value: any) => setFormData({ ...formData, country_code: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Sélectionnez un territoire" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-slate-400">Nous adaptons les diagnostics et obligations locales.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="telephone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  disabled={loading || skipPhone}
                  className="pl-10"
                  placeholder="+596 696 12 34 56"
                />
              </div>
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-300">
                <input
                  type="checkbox"
                  id="skipPhone"
                  checked={skipPhone}
                  onChange={(e) => setSkipPhone(e.target.checked)}
                  className="rounded border-white/30 bg-transparent"
                />
                <Label htmlFor="skipPhone" className="cursor-pointer">
                  Je compléterai plus tard (recommandé pour l’assistance)
                </Label>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 140 }}
          className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <p className="text-sm text-slate-200">
            Nous utilisons ces informations pour personnaliser les prochaines étapes (documents, diagnostics, invitations).
          </p>

          <Button
            type="submit"
            className="w-full bg-white text-slate-900 hover:bg-white/90"
            disabled={loading}
          >
            {loading ? (
              "Enregistrement..."
            ) : (
              <>
                Continuer
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </OnboardingShell>
  );
}

