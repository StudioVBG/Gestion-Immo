/**
 * ConditionsStep - Composant pour conditions de location V3 avec validation inline
 * 
 * Sources :
 * - Modèle V3 section 2.6 : Étape 5 - Conditions de location
 * - Types V3 : lib/types/property-v3.ts (TypeBailV3)
 * - Design SOTA 2025 : Validation inline avec feedback visuel, animations fluides
 * 
 * Ce composant adapte les champs selon le type de bien :
 * - Habitation : loyer_hc, charges_mensuelles, depot_garantie, type_bail (vide/meuble/colocation), preavis_mois
 * - Parking/Box : même structure mais type_bail différent (parking_seul/accessoire_logement)
 * - Locaux pro : même structure mais type_bail pro (3_6_9/derogatoire/precaire/professionnel/autre)
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeEuro, AlertCircle, Check } from "lucide-react";
import type { PropertyTypeV3, TypeBailV3 } from "@/lib/types/property-v3";
import { StepHeader, UnifiedInput, UnifiedSelect, UnifiedHelpMessage, UnifiedFormContainer } from "@/lib/design-system/wizard-components";
import { containerVariants } from "@/lib/design-system/animations";

interface ConditionsStepProps {
  type_bien: PropertyTypeV3;
  loyer_hc?: number;
  charges_mensuelles?: number;
  depot_garantie?: number;
  type_bail?: TypeBailV3;
  preavis_mois?: number;
  onChange: (data: {
    loyer_hc?: number;
    charges_mensuelles?: number;
    depot_garantie?: number;
    type_bail?: TypeBailV3;
    preavis_mois?: number;
  }) => void;
  errors?: {
    loyer_hc?: string;
    charges_mensuelles?: string;
    depot_garantie?: string;
    type_bail?: string;
  };
}

// Options de bail par type de bien
const BAIL_OPTIONS_HABITATION: { value: TypeBailV3; label: string }[] = [
  { value: "vide", label: "Habitation vide" },
  { value: "meuble", label: "Habitation meublée" },
  { value: "colocation", label: "Colocation" },
];

const BAIL_OPTIONS_PARKING: { value: TypeBailV3; label: string }[] = [
  { value: "parking_seul", label: "Parking seul" },
  { value: "accessoire_logement", label: "Accessoire à un logement" },
];

const BAIL_OPTIONS_PRO: { value: TypeBailV3; label: string }[] = [
  { value: "3_6_9", label: "Bail commercial 3-6-9" },
  { value: "derogatoire", label: "Bail dérogatoire" },
  { value: "precaire", label: "Bail précaire" },
  { value: "professionnel", label: "Bail professionnel" },
  { value: "autre", label: "Autre" },
];

const PREAVIS_OPTIONS = [
  { value: 1, label: "1 mois" },
  { value: 3, label: "3 mois" },
  { value: 6, label: "6 mois" },
];

// Composant de champ avec validation inline
function ValidatedField({
  id,
  label,
  value,
  onChange,
  type = "number",
  placeholder,
  required,
  error,
  suffix,
  prefix,
}: {
  id: string;
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  suffix?: string;
  prefix?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const isValid = value !== undefined && value > 0 && !error;

  return (
    <div className="space-y-3">
      <Label htmlFor={id} className="flex items-center gap-2 text-base font-semibold text-foreground">
        {label}
        {required && <span className="text-destructive font-bold">*</span>}
      </Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type={type}
          value={value || ""}
          onChange={(e) => {
            const numValue = type === "number" ? Number(e.target.value) : 0;
            onChange(numValue >= 0 ? numValue : 0);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          className={`text-base h-12 transition-all ${
            error
              ? "border-destructive focus-visible:ring-destructive"
              : isValid && !isFocused
                ? "border-green-500"
                : ""
          } ${prefix ? "pl-10" : ""} ${suffix ? "pr-20" : ""}`}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground">
            {suffix}
          </span>
        )}
        {/* Icônes de validation */}
        <AnimatePresence>
          {isValid && !isFocused && !error && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <Check className="h-4 w-4 text-green-500" />
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <AlertCircle className="h-4 w-4 text-destructive" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-base font-medium text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

export function ConditionsStep({
  type_bien,
  loyer_hc = 0,
  charges_mensuelles = 0,
  depot_garantie = 0,
  type_bail,
  preavis_mois,
  onChange,
  errors,
}: ConditionsStepProps) {
  const isHabitation = ["appartement", "maison", "studio", "colocation"].includes(type_bien);
  const isParking = ["parking", "box"].includes(type_bien);
  const isLocalPro = ["local_commercial", "bureaux", "entrepot", "fonds_de_commerce"].includes(type_bien);

  const bailOptions =
    isHabitation
      ? BAIL_OPTIONS_HABITATION
      : isParking
        ? BAIL_OPTIONS_PARKING
        : BAIL_OPTIONS_PRO;

  const loyerTotal = (loyer_hc || 0) + (charges_mensuelles || 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      {/* Titre */}
      <StepHeader
        title="Conditions de location"
        description="Définissez les conditions financières"
        icon={<BadgeEuro className="h-6 w-6 text-primary" />}
      />

      {/* Formulaire */}
      <UnifiedFormContainer>
        {/* Loyer & Charges */}
        <div className="grid gap-6 md:grid-cols-2">
          <UnifiedInput
            id="loyer_hc"
            label="Loyer hors charges"
            value={loyer_hc}
            onChange={(value) => onChange({ loyer_hc: Number(value) })}
            type="number"
            placeholder="1200"
            required
            error={errors?.loyer_hc}
            prefix="€"
            suffix="/ mois"
          />

          <UnifiedInput
            id="charges_mensuelles"
            label="Charges mensuelles"
            value={charges_mensuelles}
            onChange={(value) => onChange({ charges_mensuelles: Number(value) })}
            type="number"
            placeholder="80"
            required
            error={errors?.charges_mensuelles}
            prefix="€"
            suffix="/ mois"
          />
        </div>

        {/* Total CC */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BadgeEuro className="h-6 w-6 text-primary" />
              <Label className="text-xl font-bold text-foreground">Loyer charges comprises</Label>
            </div>
            <span className="text-3xl font-bold text-primary tracking-tight">
              {(loyer_hc || 0) + (charges_mensuelles || 0)} € / mois
            </span>
          </div>
        </motion.div>

        {/* Dépôt de garantie */}
        <UnifiedInput
          id="depot_garantie"
          label="Dépôt de garantie"
          value={depot_garantie}
          onChange={(value) => onChange({ depot_garantie: Number(value) })}
          type="number"
          placeholder="1200"
          required
          error={errors?.depot_garantie}
          prefix="€"
        />

        {/* Type de bail */}
        <UnifiedSelect
          id="type_bail"
          label="Type de bail"
          value={type_bail || ""}
          onValueChange={(value) => onChange({ type_bail: value as TypeBailV3 })}
          options={bailOptions}
          placeholder="Sélectionner un type de bail"
          required
          error={errors?.type_bail}
        />

        {/* Préavis */}
        <UnifiedSelect
          id="preavis_mois"
          label="Préavis de résiliation"
          value={preavis_mois?.toString() || ""}
          onValueChange={(value) => onChange({ preavis_mois: Number(value) })}
          options={PREAVIS_OPTIONS.map((opt) => ({ value: opt.value.toString(), label: opt.label }))}
          placeholder="Sélectionner un préavis"
        />

        {/* Récapitulatif visuel */}
        <UnifiedHelpMessage
          icon="💡"
          message="Les conditions définies ici serviront de base pour la génération automatique des baux. Vous pourrez les ajuster lors de la création de chaque bail."
          variant="info"
        />
      </UnifiedFormContainer>
    </motion.div>
  );
}

