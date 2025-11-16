/**
 * DynamicField - Composant générique pour rendre les champs dynamiquement
 * 
 * Supporte tous les types de champs définis dans la configuration JSON :
 * - text, number, select, boolean, checkbox-group, checkbox-grid
 */

"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
// RadioGroup non utilisé pour l'instant
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { FieldConfig } from "@/lib/config/property-wizard-loader";
import type { PropertyType } from "@/lib/config/property-wizard-loader";

interface DynamicFieldProps {
  field: FieldConfig;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  typeBien?: PropertyType;
  formData?: Record<string, any>;
}

export function DynamicField({
  field,
  value,
  onChange,
  error,
  typeBien,
  formData = {},
}: DynamicFieldProps) {
  // Vérifier si le champ est visible
  const isVisible = useMemo(() => {
    if (!field.visibleWhen) return true;

    const condition = field.visibleWhen;

    // Vérifier type_bien_in
    if (condition.type_bien_in) {
      return typeBien && condition.type_bien_in.includes(typeBien);
    }

    // Vérifier field equals/notEquals
    if (condition.field) {
      const fieldValue = formData[condition.field];
      if (condition.equals !== undefined) {
        return fieldValue === condition.equals;
      }
      if (condition.notEquals !== undefined) {
        return fieldValue !== condition.notEquals;
      }
    }

    return true;
  }, [field.visibleWhen, typeBien, formData]);

  if (!isVisible) return null;

  const fieldId = `field-${field.id}`;
  const hasError = !!error;

  // Rendu selon le type de champ
  switch (field.type) {
    case "text":
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId} className={field.required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ""}>
            {field.label}
          </Label>
          <Input
            id={fieldId}
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={hasError ? "border-destructive" : ""}
            placeholder={field.placeholder}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId} className={field.required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ""}>
            {field.label}
          </Label>
          <Input
            id={fieldId}
            type="number"
            value={value ?? ""}
            onChange={(e) => {
              const numValue = e.target.value === "" ? null : Number(e.target.value);
              onChange(numValue);
            }}
            className={hasError ? "border-destructive" : ""}
            min={field.min}
            max={field.max}
            placeholder={field.placeholder}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );

    case "select":
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId} className={field.required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ""}>
            {field.label}
          </Label>
          <Select
            value={value ?? ""}
            onValueChange={onChange}
          >
            <SelectTrigger id={fieldId} className={hasError ? "border-destructive" : ""}>
              <SelectValue placeholder={field.placeholder || "Sélectionnez..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
          <Checkbox
            id={fieldId}
            checked={value ?? false}
            onCheckedChange={(checked) => onChange(checked)}
            className={hasError ? "border-destructive" : ""}
          />
          <div className="space-y-1 leading-none">
            <Label
              htmlFor={fieldId}
              className="cursor-pointer font-medium"
            >
              {field.label}
              {field.required && <span className="ml-0.5 text-destructive">*</span>}
            </Label>
            {field.placeholder && (
              <p className="text-sm text-muted-foreground">{field.placeholder}</p>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );

    case "checkbox-group":
      const checkboxValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-3">
          <Label className={field.required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ""}>
            {field.label}
          </Label>
          <div className="space-y-2">
            {field.options?.map((option) => {
              const isChecked = checkboxValues.includes(option.value);
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${fieldId}-${option.value}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...checkboxValues, option.value]
                        : checkboxValues.filter((v) => v !== option.value);
                      onChange(newValues);
                    }}
                  />
                  <Label
                    htmlFor={`${fieldId}-${option.value}`}
                    className="cursor-pointer font-normal"
                  >
                    {option.label}
                  </Label>
                </div>
              );
            })}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );

    case "checkbox-grid":
      const gridValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-3">
          <Label className={field.required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ""}>
            {field.label}
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {field.options?.map((option) => {
              const isChecked = gridValues.includes(option.value);
              return (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all ${
                    isChecked
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => {
                    const newValues = isChecked
                      ? gridValues.filter((v) => v !== option.value)
                      : [...gridValues, option.value];
                    onChange(newValues);
                  }}
                >
                  <CardContent className="p-4 flex items-center space-x-2">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => {
                        const newValues = isChecked
                          ? gridValues.filter((v) => v !== option.value)
                          : [...gridValues, option.value];
                        onChange(newValues);
                      }}
                    />
                    <Label className="cursor-pointer font-normal text-sm">
                      {option.label}
                    </Label>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );

    case "select-card":
      // Ce type est géré par PropertyTypeSelection
      return null;

    case "textarea":
      return (
        <div className="space-y-2">
          <Label htmlFor={fieldId} className={field.required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ""}>
            {field.label}
          </Label>
          <Textarea
            id={fieldId}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={hasError ? "border-destructive" : ""}
            placeholder={field.placeholder}
            rows={4}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );

    default:
      console.warn(`Type de champ non supporté: ${field.type}`);
      return null;
  }
}

