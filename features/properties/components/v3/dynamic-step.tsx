/**
 * DynamicStep - Composant générique pour rendre une étape dynamiquement
 * 
 * Utilise la configuration JSON pour rendre les champs et sections
 */

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DynamicField } from "./dynamic-field";
import { getFieldsForStep, type StepConfig, type PropertyType } from "@/lib/config/property-wizard-loader";
import { containerVariants, itemVariants } from "@/lib/design-system/animations";

interface DynamicStepProps {
  step: StepConfig;
  typeBien?: PropertyType;
  formData: Record<string, any>;
  onChange: (updates: Record<string, any>) => void;
  fieldErrors?: Record<string, string>;
}

export function DynamicStep({
  step,
  typeBien,
  formData,
  onChange,
  fieldErrors = {},
}: DynamicStepProps) {
  const fields = useMemo(() => {
    return getFieldsForStep(step, typeBien);
  }, [step, typeBien]);

  const handleFieldChange = (fieldId: string, value: any) => {
    onChange({ [fieldId]: value });
  };

  // Rendre les sections si présentes
  if (step.sections) {
    const visibleSections = step.sections.filter(
      (section) =>
        !section.visibleForTypes || (typeBien && section.visibleForTypes.includes(typeBien))
    );

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{step.title}</h2>
          {step.description && (
            <p className="text-muted-foreground">{step.description}</p>
          )}
        </div>

        {visibleSections.map((section) => (
          <motion.div
            key={section.id}
            variants={itemVariants}
            className="space-y-6"
          >
            <Card>
              <CardContent className="p-6 space-y-6">
                {section.fields.map((field) => (
                  <DynamicField
                    key={field.id}
                    field={field}
                    value={formData[field.id]}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    error={fieldErrors[field.id]}
                    typeBien={typeBien}
                    formData={formData}
                  />
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // Rendre les champs directs
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{step.title}</h2>
        {step.description && (
          <p className="text-muted-foreground">{step.description}</p>
        )}
      </div>

      {fields.map((field) => (
        <motion.div key={field.id} variants={itemVariants}>
          <DynamicField
            field={field}
            value={formData[field.id]}
            onChange={(value) => handleFieldChange(field.id, value)}
            error={fieldErrors[field.id]}
            typeBien={typeBien}
            formData={formData}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

