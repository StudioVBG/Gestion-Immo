/**
 * PropertyWizardV3 - Wrapper principal du wizard Property V3
 * 
 * Sources :
 * - Modèle V3 section 2 : Wizard UX - étapes détaillées
 * - Configuration V3 : config/propertyWizardV3.ts
 * - Validation Zod V3 : lib/validations/property-v3.ts
 * - Design SOTA 2025 : Animations fluides entre étapes, auto-save, validation inline
 * 
 * Ce wrapper orchestre :
 * - Navigation entre étapes avec animations
 * - State management centralisé
 * - Validation Zod par étape
 * - Auto-save des données
 * - Intégration avec les APIs existantes
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebouncedCallback } from "use-debounce";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Save, Sparkles, Zap, Settings } from "lucide-react";
import { propertySchemaV3 } from "@/lib/validations/property-v3";
import { validateProperty } from "@/lib/validations/property-validation";
import { getStepsForType, wizardConfigData, type PropertyType, type StepConfig } from "@/lib/config/property-wizard-loader";
import { PropertyTypeSelection } from "./property-type-selection";
import { RoomsPhotosStep } from "./rooms-photos-step";
import { RecapStep } from "./recap-step";
import { DynamicStep } from "./dynamic-step";
import type { PropertyTypeV3, PropertyV3 } from "@/lib/types/property-v3";
import type { Room, Photo } from "@/lib/types";
import { propertiesService } from "../../services/properties.service";
import { stepTransitionVariants, progressVariants, badgeVariants, ANIMATION_DURATION, EASING } from "@/lib/design-system/animations";
import { CLASSES, SHADOWS, GRADIENTS } from "@/lib/design-system/design-tokens";

type WizardMode = "fast" | "full";

interface PropertyWizardV3Props {
  propertyId?: string;
  initialData?: Partial<PropertyV3>;
  onSuccess?: (propertyId: string) => void;
  onCancel?: () => void;
}

// Variants d'animation optimisés SOTA 2025 (200-250ms)
const optimizedStepVariants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.22, // 220ms
      ease: [0.4, 0, 0.2, 1], // ease-out
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: {
      duration: 0.2, // 200ms
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Micro-copies contextuelles selon l'étape
const getMicroCopy = (stepId: string, isLastStep: boolean, mode: WizardMode): string => {
  const microCopies: Record<string, string> = {
    type_bien: "Parfait, on passe à l'adresse 🏠",
    adresse: "Super ! Maintenant les détails du logement 📐",
    details: mode === "fast" ? "Encore 2 étapes !" : "On continue avec les pièces 🚪",
    pieces_photos: "Presque terminé ! Vérifiez le récapitulatif ✅",
    photos_simple: "Parfait ! Vérifiez le récapitulatif ✅",
    recap: "Tout est prêt ! Soumettez votre logement 🎉",
  };
  return microCopies[stepId] || (isLastStep ? "Terminé !" : "Continuez...");
};

export function PropertyWizardV3({
  propertyId,
  initialData = {},
  onSuccess,
  onCancel,
}: PropertyWizardV3Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Détecter le mode depuis les query params (default: full)
  const mode: WizardMode = (searchParams?.get("mode") as WizardMode) || "full";
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(propertyId || null);

  // State principal du formulaire (utilise Record pour supporter tous les champs dynamiques)
  const [formData, setFormData] = useState<Record<string, any>>({
    type_bien: undefined,
    type: undefined,
    etat: "draft",
    ...initialData,
  });

  // State pour rooms et photos
  const [rooms, setRooms] = useState<Room[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  
  // State pour les erreurs de validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalErrors, setGlobalErrors] = useState<string[]>([]);

  // Récupérer les étapes adaptées selon le type de bien et le mode
  const stepsForType = useMemo(() => {
    const allSteps = getStepsForType(formData.type_bien as PropertyType | undefined);
    
    // En mode FAST, filtrer les étapes non essentielles
    if (mode === "fast") {
      return allSteps.filter((step) => {
        // Toujours inclure : type_bien, adresse, photos (simple), recap
        if (step.id === "type_bien" || step.id === "recap") return true;
        if (step.id === "adresse" || step.id === "details") return true;
        // Mode simple pour photos (pas de gestion détaillée des pièces)
        if (step.id === "pieces_photos") {
          // Remplacer par une version simplifiée si disponible
          return false; // On utilisera photos_simple si disponible
        }
        if (step.id === "photos_simple") return true;
        // Exclure les étapes optionnelles en mode fast
        return false;
      });
    }
    
    return allSteps;
  }, [formData.type_bien, mode]);

  const currentStep = stepsForType[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === stepsForType.length - 1;
  const progress = ((currentStepIndex + 1) / stepsForType.length) * 100;

  // Auto-save avec debounce
  const autoSave = useDebouncedCallback(async (data: Partial<PropertyV3>) => {
    if (!savedDraftId || !formData.type_bien) return;

    try {
      // Appel API PATCH /api/properties/:id avec les données
      await propertiesService.updatePropertyGeneral(savedDraftId, data as any);
    } catch (error: any) {
      // Ignorer silencieusement les erreurs 404 (propriété supprimée) et 400 (données invalides temporaires)
      if (error?.statusCode === 404 || error?.statusCode === 400 || 
          error?.message?.includes("404") || error?.message?.includes("400") || 
          error?.message?.includes("Propriété non trouvée") || error?.message?.includes("Données invalides")) {
        return; // Ne pas logger ces erreurs attendues
      }
      console.error("Erreur auto-save:", error);
    }
  }, 2000);

  // Sauvegarder les modifications du formulaire
  const updateFormData = useCallback(
    async (updates: Record<string, any>) => {
      const newData = { ...formData, ...updates };
      setFormData(newData);
      
      // Si type_bien est défini et qu'on n'a pas encore de draft, créer le draft
      let currentDraftId = savedDraftId;
      if (newData.type_bien && !currentDraftId && !propertyId) {
        try {
          console.log(`[PropertyWizardV3] Création d'un draft avec type_bien=${newData.type_bien}`);
          const property = await propertiesService.createDraftProperty({
            type_bien: newData.type_bien as any,
            usage_principal: "habitation", // Valeur par défaut, sera ajustée selon le type
          });
          currentDraftId = property.id;
          console.log(`[PropertyWizardV3] Draft créé avec succès: id=${currentDraftId}`);
          setSavedDraftId(currentDraftId);
        } catch (error: any) {
          console.error("[PropertyWizardV3] Erreur création draft:", error);
          // Ne pas bloquer l'utilisateur, on réessaiera plus tard
        }
      }
      
      // Auto-save si on a un draft
      if (currentDraftId && newData.type_bien) {
        try {
          console.log(`[PropertyWizardV3] Auto-save pour propertyId=${currentDraftId}`);
          await propertiesService.updatePropertyGeneral(currentDraftId, newData as any);
          console.log(`[PropertyWizardV3] Auto-save réussi pour propertyId=${currentDraftId}`);
        } catch (error: any) {
          // Ignorer silencieusement les erreurs 404 (propriété supprimée) et 400 (données invalides temporaires)
          // Ne pas spammer la console avec ces erreurs attendues
          if (error?.statusCode === 404 || error?.statusCode === 400 || 
              error?.message?.includes("404") || error?.message?.includes("400") || 
              error?.message?.includes("Propriété non trouvée") || error?.message?.includes("Données invalides")) {
            // Propriété supprimée ou données temporairement invalides, arrêter l'auto-save pour cette propriété
            console.warn(`[PropertyWizardV3] Auto-save ignoré (404/400) pour propertyId=${currentDraftId}`);
            return;
          }
          console.error(`[PropertyWizardV3] Erreur auto-save pour propertyId=${currentDraftId}:`, error);
        }
      }
    },
    [formData, savedDraftId, propertyId]
  );

  // Créer le brouillon initial (seulement si type_bien est déjà défini)
  const createDraft = useCallback(async () => {
    // Ne pas créer de draft vide, attendre que type_bien soit sélectionné
    if (!formData.type_bien) {
      return;
    }
    try {
      // Appel API POST /api/properties pour créer le brouillon avec type_bien
      const property = await propertiesService.createDraftProperty({
        type_bien: formData.type_bien as any,
        usage_principal: "habitation", // Valeur par défaut
      });
      setSavedDraftId(property.id);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le brouillon",
        variant: "destructive",
      });
    }
  }, [formData.type_bien, toast]);

  // Navigation entre étapes
  const goToNextStep = useCallback(() => {
    if (currentStepIndex < stepsForType.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  }, [currentStepIndex, stepsForType.length]);

  const goToPreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  const goToStep = useCallback((stepId: string) => {
    const index = stepsForType.findIndex((s) => s.id === stepId);
    if (index >= 0) {
      setCurrentStepIndex(index);
    }
  }, [stepsForType]);

  // Validation avant de passer à l'étape suivante avec la nouvelle validation
  const validateCurrentStep = useCallback(() => {
    if (!currentStep) return true;

    // Pour l'étape de sélection du type, validation simple
    if (currentStep.id === "type_bien") {
      const isValid = !!formData.type_bien;
      if (!isValid) {
        setFieldErrors({ type_bien: "Veuillez sélectionner un type de bien" });
      } else {
        setFieldErrors({});
      }
      return isValid;
    }

    // Pour les autres étapes, utiliser la validation complète
    const validation = validateProperty(formData, rooms, photos);
    
    // Filtrer les erreurs pour l'étape actuelle
    const stepFieldErrors: Record<string, string> = {};
    const stepGlobalErrors: string[] = [];
    
    // Vérifier les champs de l'étape actuelle
    const stepFields = currentStep.fields || 
      (currentStep.sections?.flatMap(s => s.fields) || []);
    
    stepFields.forEach(field => {
      if (validation.fieldErrors[field.id]) {
        stepFieldErrors[field.id] = validation.fieldErrors[field.id];
      }
    });
    
    // Ajouter les erreurs globales si elles concernent cette étape
    if (currentStep.id === "pieces_photos" || currentStep.id === "photos_simple") {
      validation.globalErrors.forEach(err => {
        if (err.includes("photo")) {
          stepGlobalErrors.push(err);
        }
      });
    }
    
    setFieldErrors(stepFieldErrors);
    setGlobalErrors(stepGlobalErrors);
    
    // Valider les champs requis de l'étape
    if (currentStep.validation?.requiredFields) {
      const missingFields = currentStep.validation.requiredFields.filter(
        fieldId => !formData[fieldId] && formData[fieldId] !== 0
      );
      
      if (missingFields.length > 0) {
        missingFields.forEach(fieldId => {
          stepFieldErrors[fieldId] = "Ce champ est obligatoire";
        });
        setFieldErrors(stepFieldErrors);
        return false;
      }
    }
    
    // Valider les conditions conditionnelles
    if (currentStep.sections) {
      for (const section of currentStep.sections) {
        if (section.validation?.conditional) {
          for (const condition of section.validation.conditional) {
            const fieldValue = formData[condition.if.field];
            const shouldValidate = 
              (condition.if.equals !== undefined && fieldValue === condition.if.equals) ||
              (condition.if.notEquals !== undefined && fieldValue !== condition.if.notEquals);
            
            if (shouldValidate) {
              const missingFields = condition.thenRequired.filter(
                fieldId => !formData[fieldId] && formData[fieldId] !== 0
              );
              
              if (missingFields.length > 0) {
                missingFields.forEach(fieldId => {
                  stepFieldErrors[fieldId] = "Ce champ est obligatoire";
                });
                setFieldErrors(stepFieldErrors);
                return false;
              }
            }
          }
        }
      }
    }
    
    return Object.keys(stepFieldErrors).length === 0 && stepGlobalErrors.length === 0;
  }, [currentStep, formData, rooms, photos]);

  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) {
      const errorMessages = [
        ...Object.values(fieldErrors),
        ...globalErrors,
      ];
      
      toast({
        title: "Validation requise",
        description: errorMessages.length > 0 
          ? errorMessages.join(", ")
          : "Veuillez compléter tous les champs obligatoires de cette étape",
        variant: "destructive",
      });
      return;
    }
    
    // Réinitialiser les erreurs avant de passer à l'étape suivante
    setFieldErrors({});
    setGlobalErrors([]);
    goToNextStep();
  }, [validateCurrentStep, goToNextStep, toast, fieldErrors, globalErrors]);

  // Soumission finale avec validation complète
  const handleSubmit = useCallback(async () => {
    if (!savedDraftId) {
      toast({
        title: "Erreur",
        description: "Aucun logement à soumettre",
        variant: "destructive",
      });
      return;
    }

    // Validation complète avec la nouvelle fonction
    const validation = validateProperty(formData, rooms, photos);
    
    if (!validation.isValid) {
      // Afficher les erreurs et naviguer vers l'étape concernée
      setFieldErrors(validation.fieldErrors);
      setGlobalErrors(validation.globalErrors);
      
      if (validation.stepId) {
        goToStep(validation.stepId);
      }
      
      const errorMessages = [
        ...Object.values(validation.fieldErrors),
        ...validation.globalErrors,
      ];
      
      toast({
        title: "Erreurs de validation",
        description: errorMessages.slice(0, 3).join(", ") + (errorMessages.length > 3 ? "..." : ""),
        variant: "destructive",
      });
      return;
    }

    // Validation Zod complète pour la structure de données
    try {
      const validatedData = propertySchemaV3.parse({
        ...formData,
        type_bien: formData.type_bien!,
      });
      
      setIsSubmitting(true);
      
      // Appel API POST /api/properties/:id/submit
      await propertiesService.submitProperty(savedDraftId);
      
      toast({
        title: "Succès",
        description: "Le logement a été soumis pour validation",
      });
      
      onSuccess?.(savedDraftId);
      router.push(`/properties/${savedDraftId}`);
    } catch (error: any) {
      if (error.errors) {
        // Erreurs de validation Zod
        const errorMessages = error.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`);
        toast({
          title: "Erreurs de validation",
          description: errorMessages.join(", "),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: error.message || "Impossible de soumettre le logement",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [savedDraftId, formData, rooms, photos, onSuccess, router, toast, goToStep]);

  // Initialiser savedDraftId si propertyId fourni
  useEffect(() => {
    if (propertyId && !savedDraftId) {
      setSavedDraftId(propertyId);
    }
  }, [propertyId, savedDraftId]);

  // Charger les données existantes si propertyId fourni
  useEffect(() => {
    if (propertyId && !initialData.id) {
      propertiesService
        .getPropertyById(propertyId)
        .then((property) => {
          setFormData(property as any);
        })
        .catch((error) => {
          console.error("Erreur chargement propriété:", error);
        });
      
      // Charger rooms et photos
      propertiesService
        .listRooms(propertyId)
        .then(setRooms)
        .catch((error) => {
          console.error("Erreur chargement pièces:", error);
        });
      
      propertiesService
        .listPhotos(propertyId)
        .then(setPhotos)
        .catch((error) => {
          console.error("Erreur chargement photos:", error);
        });
    }
  }, [propertyId, initialData.id]);

  // Rendu de l'étape actuelle avec support des modes custom
  const renderCurrentStep = () => {
    if (!currentStep) return null;

    // Étapes avec modes spéciaux (custom, simple-photos, summary)
    if (currentStep.mode === "custom" && currentStep.id === "pieces_photos") {
      return (
        <RoomsPhotosStep
          propertyId={savedDraftId || ""}
          type_bien={formData.type_bien!}
          nb_chambres={formData.nb_chambres ?? undefined}
          nb_pieces={formData.nb_pieces ?? undefined}
          rooms={rooms as any}
          photos={photos as any}
          onRoomsChange={(r) => setRooms(r as Room[])}
          onPhotosChange={(p) => setPhotos(p as Photo[])}
        />
      );
    }

    if (currentStep.mode === "summary" && currentStep.id === "recap") {
      return (
        <RecapStep
          propertyId={savedDraftId || undefined}
          type_bien={formData.type_bien as PropertyTypeV3}
          data={formData as any}
          rooms={rooms}
          photos={photos}
          onSubmit={handleSubmit}
          onEdit={goToStep}
          isSubmitting={isSubmitting}
        />
      );
    }

    // Étape de sélection du type avec composant spécial
    if (currentStep.id === "type_bien") {
      return (
        <PropertyTypeSelection
          selectedType={formData.type_bien as PropertyTypeV3 | undefined}
          onSelect={(type) => {
            updateFormData({ type_bien: type, type: type }); // Mettre à jour type_bien et type pour compatibilité
          }}
          onContinue={handleNext}
        />
      );
    }

    // Pour les autres étapes, utiliser DynamicStep
    return (
      <DynamicStep
        step={currentStep}
        typeBien={formData.type_bien as PropertyType | undefined}
        formData={formData}
        onChange={updateFormData}
        fieldErrors={fieldErrors}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background p-4 md:p-8">
      {/* Background décoratif avec gradient animé */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/2 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 100, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-primary/5 via-primary/10 to-transparent blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="mx-auto max-w-5xl space-y-8 relative z-10">
        {/* Header avec progression améliorée */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.25 }}
                  className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
                >
                  Ajouter un bien
                </motion.h1>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 25 }}
                  className="flex items-center gap-2"
                >
                  {mode === "fast" ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm font-medium">
                      <Zap className="h-3.5 w-3.5" />
                      Mode rapide
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-sm font-medium">
                      <Settings className="h-3.5 w-3.5" />
                      Mode complet
                    </span>
                  )}
                </motion.div>
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.25 }}
                className="text-lg text-muted-foreground"
              >
                {mode === "fast" 
                  ? `Un questionnaire ultra-simple en ${stepsForType.length} étapes pour créer rapidement votre brouillon`
                  : `Un questionnaire détaillé en ${stepsForType.length} étapes pour créer votre brouillon complet`
                }
              </motion.p>
            </div>
            {onCancel && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
              >
                <Button
                  variant="ghost"
                  onClick={onCancel}
                  className="hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                >
                  Annuler
                </Button>
              </motion.div>
            )}
          </div>

          {/* Barre de progression améliorée */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  variants={badgeVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Étape {currentStepIndex + 1} sur {stepsForType.length}
                </motion.div>
                <span className="text-sm font-medium text-muted-foreground">
                  {Math.round(progress)}% complété
                </span>
              </div>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-muted/50 backdrop-blur-sm">
              <motion.div
                variants={progressVariants}
                initial="initial"
                animate="animate"
                style={{ width: `${progress}%` }}
                className="absolute inset-y-0 left-0 h-full bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full shadow-lg shadow-primary/30"
              />
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 0px rgba(59, 130, 246, 0)",
                    "0 0 20px rgba(59, 130, 246, 0.5)",
                    "0 0 0px rgba(59, 130, 246, 0)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-y-0 right-0 w-1/4 h-full bg-gradient-to-r from-transparent via-primary/50 to-primary rounded-full"
              />
            </div>
          </motion.div>

          {/* Indicateur d'auto-save amélioré */}
          <AnimatePresence>
            {savedDraftId && (
              <motion.div
                variants={badgeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 backdrop-blur-sm"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Save className="h-4 w-4 text-green-600" />
                </motion.div>
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  Brouillon sauvegardé automatiquement
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Contenu de l'étape avec animations fluides SOTA 2025 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep?.id || "loading"}
            variants={optimizedStepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`${CLASSES.card} ${CLASSES.cardHover} p-6 md:p-8 lg:p-10`}
            style={{
              boxShadow: SHADOWS.xl,
            }}
          >
            {renderCurrentStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation améliorée */}
        {currentStep?.id !== "recap" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-between pt-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={isFirstStep}
                className={`gap-2 ${CLASSES.button} ${isFirstStep ? "opacity-50 cursor-not-allowed" : CLASSES.buttonHover}`}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
            </motion.div>

            <div className="flex items-center gap-3">
              {/* Micro-copie contextuelle */}
              <motion.p
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.25 }}
                className="text-sm text-muted-foreground hidden sm:block"
              >
                {getMicroCopy(currentStep?.id || "", isLastStep, mode)}
              </motion.p>
              
              <motion.div 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className={`gap-2 ${CLASSES.button} ${CLASSES.buttonHover} bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/30 transition-all duration-200`}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Save className="h-4 w-4" />
                      </motion.div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      {isLastStep ? "Soumettre" : "Suivant"}
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

