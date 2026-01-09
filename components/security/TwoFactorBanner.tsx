"use client";

/**
 * Bannière d'avertissement pour l'activation du 2FA
 * 
 * SOTA 2026 - Security UX
 * =======================
 * 
 * Affiche une bannière persistante pour les utilisateurs
 * qui doivent activer l'authentification à deux facteurs.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, ShieldCheck, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { use2FARequired } from "@/lib/hooks/use-2fa-required";
import { cn } from "@/lib/utils";

interface TwoFactorBannerProps {
  className?: string;
  dismissible?: boolean;
}

export function TwoFactorBanner({
  className,
  dismissible = false,
}: TwoFactorBannerProps) {
  const router = useRouter();
  const { isLoading, is2FARequired, is2FAEnabled, needsSetup, propertyCount } = use2FARequired();
  const [isDismissed, setIsDismissed] = useState(false);

  // Ne rien afficher si chargement, pas requis, ou déjà activé
  if (isLoading || !needsSetup || isDismissed) {
    return null;
  }

  // Message selon le contexte
  const getMessage = () => {
    if (propertyCount >= 5) {
      return `Vous gérez ${propertyCount} biens. L'authentification à deux facteurs est requise pour sécuriser votre compte.`;
    }
    return "L'authentification à deux facteurs est requise pour votre compte.";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "relative overflow-hidden",
          "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500",
          "text-white shadow-lg",
          className
        )}
      >
        {/* Pattern de fond */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="security-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" fill="currentColor" />
            </pattern>
            <rect x="0" y="0" width="100" height="100" fill="url(#security-pattern)" />
          </svg>
        </div>

        <div className="relative px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            {/* Icône et message */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <ShieldAlert className="h-6 w-6" />
                </motion.div>
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate sm:whitespace-normal">
                  {getMessage()}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/settings/security?setup=2fa")}
                className="bg-white/20 hover:bg-white/30 text-white border-0 font-medium"
              >
                <ShieldCheck className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Configurer</span>
                <span className="sm:hidden">2FA</span>
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>

              {dismissible && (
                <button
                  onClick={() => setIsDismissed(true)}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Barre de progression urgente */}
        <motion.div
          className="h-1 bg-white/30"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 30, ease: "linear" }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Version compacte pour les sidebars
 */
export function TwoFactorBadge() {
  const router = useRouter();
  const { isLoading, needsSetup } = use2FARequired();

  if (isLoading || !needsSetup) {
    return null;
  }

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => router.push("/settings/security?setup=2fa")}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        "bg-gradient-to-r from-amber-500/10 to-red-500/10",
        "border border-amber-500/30",
        "text-amber-700 dark:text-amber-400",
        "hover:from-amber-500/20 hover:to-red-500/20",
        "transition-all duration-200"
      )}
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
      >
        <ShieldAlert className="h-4 w-4" />
      </motion.div>
      <span className="text-xs font-medium">2FA requis</span>
    </motion.button>
  );
}

/**
 * Dialog de configuration 2FA (à intégrer dans la page settings)
 */
export function TwoFactorSetupPrompt({
  onSetupComplete,
}: {
  onSetupComplete?: () => void;
}) {
  const { needsSetup, propertyCount } = use2FARequired();

  if (!needsSetup) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "p-6 rounded-2xl",
        "bg-gradient-to-br from-amber-50 to-orange-50",
        "dark:from-amber-950/30 dark:to-orange-950/30",
        "border-2 border-amber-200 dark:border-amber-800",
        "shadow-xl shadow-amber-100/50 dark:shadow-amber-900/20"
      )}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl">
          <ShieldAlert className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">
            Sécurisez votre compte
          </h3>
          
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            {propertyCount >= 5 ? (
              <>
                Vous gérez <strong>{propertyCount} biens</strong>. Pour protéger vos 
                données et celles de vos locataires, l'authentification à deux 
                facteurs est obligatoire.
              </>
            ) : (
              <>
                L'authentification à deux facteurs ajoute une couche de sécurité 
                supplémentaire à votre compte.
              </>
            )}
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                // TODO: Ouvrir le modal de configuration 2FA
                onSetupComplete?.();
              }}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Configurer maintenant
            </Button>
            
            <Button variant="outline" className="text-amber-700 border-amber-300">
              En savoir plus
            </Button>
          </div>
        </div>
      </div>

      {/* Avantages du 2FA */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: "🔐", label: "Protection renforcée" },
          { icon: "📱", label: "App Authenticator" },
          { icon: "🛡️", label: "Conformité RGPD" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 px-3 py-2 bg-white/50 dark:bg-black/20 rounded-lg"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-xs font-medium text-amber-800 dark:text-amber-200">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default TwoFactorBanner;

