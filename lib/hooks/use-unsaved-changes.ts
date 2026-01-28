"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook pour gérer les modifications non sauvegardées
 *
 * Affiche une alerte de confirmation si l'utilisateur tente de quitter
 * la page avec des modifications non sauvegardées.
 *
 * @example
 * const { setHasChanges, confirmNavigation } = useUnsavedChanges();
 *
 * // Dans un formulaire
 * <form onChange={() => setHasChanges(true)}>
 *   ...
 * </form>
 *
 * // Navigation manuelle
 * const handleCancel = () => {
 *   if (confirmNavigation()) {
 *     router.push('/back');
 *   }
 * };
 */
export function useUnsavedChanges(initialState = false) {
  const [hasChanges, setHasChanges] = useState(initialState);
  const router = useRouter();

  // Message d'avertissement
  const warningMessage =
    "Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?";

  // Gestion du beforeunload (fermeture onglet / rafraîchissement)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        // Pour les navigateurs modernes
        e.returnValue = warningMessage;
        return warningMessage;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // Fonction pour confirmer la navigation manuelle
  const confirmNavigation = useCallback(() => {
    if (hasChanges) {
      return window.confirm(warningMessage);
    }
    return true;
  }, [hasChanges]);

  // Fonction pour réinitialiser après sauvegarde
  const resetChanges = useCallback(() => {
    setHasChanges(false);
  }, []);

  // Fonction pour marquer comme modifié
  const markAsChanged = useCallback(() => {
    setHasChanges(true);
  }, []);

  return {
    hasChanges,
    setHasChanges,
    confirmNavigation,
    resetChanges,
    markAsChanged,
  };
}

/**
 * Hook simplifié pour les formulaires react-hook-form
 *
 * @example
 * const { formState: { isDirty } } = useForm();
 * useFormUnsavedChanges(isDirty);
 */
export function useFormUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
}

export default useUnsavedChanges;
