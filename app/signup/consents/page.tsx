"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { onboardingService } from "@/features/onboarding/services/onboarding.service";
import { consentsSchema } from "@/lib/validations/onboarding";
import type { UserRole } from "@/lib/types";
import { FileText, Shield, Cookie, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

const TERMS_VERSION = "1.0";
const PRIVACY_VERSION = "1.0";

export default function ConsentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const role = searchParams.get("role") as UserRole | null;

  const [formData, setFormData] = useState({
    terms_accepted: false,
    privacy_accepted: false,
    cookies_necessary: true, // Verrouillé
    cookies_analytics: false,
    cookies_ads: false,
  });

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
      const validated = consentsSchema.parse({
        ...formData,
        terms_version: TERMS_VERSION,
        privacy_version: PRIVACY_VERSION,
      });

      // Sauvegarder les consentements
      const response = await fetch("/api/consents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validated),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la sauvegarde");
      }

      // Sauvegarder le brouillon
      await onboardingService.saveDraft("consents", validated, role!);

      // Marquer les étapes précédentes comme complétées maintenant que l'utilisateur est authentifié
      // (après confirmation de l'email)
      await onboardingService.markStepCompleted("role_choice", role!);
      await onboardingService.markStepCompleted("account_creation", role!);
      await onboardingService.markStepCompleted("consents", role!);

      toast({
        title: "Consentements enregistrés",
        description: "Vos préférences ont été sauvegardées.",
      });

      // Rediriger vers le profil minimal
      router.push(`/signup/profile${role ? `?role=${role}` : ""}`);
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
      stepLabel="Étape 1 / 4 – Confiance & conformité"
      title="Vos consentements, notre responsabilité"
      subtitle="Nous détaillons chaque engagement pour rester conforme RGPD et CNIL."
      footer={
        <p>
          Questions juridiques ?{" "}
          <a href="mailto:legal@gestion-locative.app" className="text-white underline-offset-4 hover:underline">
            legal@gestion-locative.app
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
          <div className="flex flex-wrap items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            <span>Consents requis avant l’accès aux données sensibles.</span>
            <Badge variant="outline" className="border-sky-400/60 bg-sky-500/10 text-sky-100">
              RGPD Ready
            </Badge>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140 }}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-200">
            <FileText className="h-4 w-4" />
            Conditions d’utilisation
          </div>
          <div className="rounded-xl border border-white/15 bg-black/10 p-4 sm:flex sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Label htmlFor="terms" className="text-base font-semibold text-white">
                CGU (version {TERMS_VERSION})
              </Label>
              <p className="text-sm text-slate-300">
                Accédez à la plateforme en acceptant les{" "}
                <a href="/legal/terms" target="_blank" className="text-white underline-offset-4 hover:underline">
                  conditions générales d’utilisation
                </a>
                .
              </p>
            </div>
            <input
              type="checkbox"
              id="terms"
              checked={formData.terms_accepted}
              onChange={(e) => setFormData({ ...formData, terms_accepted: e.target.checked })}
              required
              disabled={loading}
              className="mt-4 h-5 w-5 rounded border-white/30 bg-transparent sm:mt-0"
            />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, type: "spring", stiffness: 140 }}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-200">
            <Shield className="h-4 w-4" />
            Confidentialité & sécurité
          </div>
          <div className="rounded-xl border border-white/15 bg-black/10 p-4 sm:flex sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Label htmlFor="privacy" className="text-base font-semibold text-white">
                Politique de confidentialité (v{PRIVACY_VERSION})
              </Label>
              <p className="text-sm text-slate-300">
                Les traitements décrits dans la{" "}
                <a href="/legal/privacy" target="_blank" className="text-white underline-offset-4 hover:underline">
                  politique de confidentialité
                </a>{" "}
                respectent la CNIL et restent transparents.
              </p>
            </div>
            <input
              type="checkbox"
              id="privacy"
              checked={formData.privacy_accepted}
              onChange={(e) => setFormData({ ...formData, privacy_accepted: e.target.checked })}
              required
              disabled={loading}
              className="mt-4 h-5 w-5 rounded border-white/30 bg-transparent sm:mt-0"
            />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 140 }}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-200">
            <Cookie className="h-4 w-4" />
            Préférences cookies
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-white/15 bg-black/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Lock className="h-4 w-4 text-amber-200" />
                Essentiels (toujours actifs)
              </div>
              <p className="text-xs text-slate-300">Sécurité, sessions, performances. Obligatoires.</p>
              <input type="checkbox" checked disabled className="h-5 w-5 rounded border-white/30 bg-transparent" />
            </div>

            <div className="space-y-3 rounded-xl border border-white/15 bg-black/10 p-4">
              <Label htmlFor="cookies_analytics" className="text-sm font-semibold text-white">
                Analytics
              </Label>
              <p className="text-xs text-slate-300">Permettent d’optimiser le parcours (Matomo, GA, 100% anonymisé).</p>
              <input
                type="checkbox"
                id="cookies_analytics"
                checked={formData.cookies_analytics}
                onChange={(e) => setFormData({ ...formData, cookies_analytics: e.target.checked })}
                disabled={loading}
                className="h-5 w-5 rounded border-white/30 bg-transparent"
              />
            </div>

            <div className="space-y-3 rounded-xl border border-white/15 bg-black/10 p-4">
              <Label htmlFor="cookies_ads" className="text-sm font-semibold text-white">
                Personnalisation marketing
              </Label>
              <p className="text-xs text-slate-300">Recevez seulement les offres utiles (newsletters ciblées, promos).</p>
              <input
                type="checkbox"
                id="cookies_ads"
                checked={formData.cookies_ads}
                onChange={(e) => setFormData({ ...formData, cookies_ads: e.target.checked })}
                disabled={loading}
                className="h-5 w-5 rounded border-white/30 bg-transparent"
              />
            </div>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 140 }}
          className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5"
        >
          {!formData.terms_accepted || !formData.privacy_accepted ? (
            <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-sm text-amber-100">
              Validez les CGU et la politique de confidentialité pour continuer.
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              Merci ! Vos préférences seront visibles dans votre centre de confidentialité.
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !formData.terms_accepted || !formData.privacy_accepted}
            className="w-full bg-white text-slate-900 hover:bg-white/90"
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
