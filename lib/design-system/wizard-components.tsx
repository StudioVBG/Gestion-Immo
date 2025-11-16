/**
 * Composants de base unifiés pour le wizard Property V3
 * Garantit une homogénéité parfaite sur tous les supports
 */

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, AlertCircle } from "lucide-react";
import { itemVariants, inputFocusVariants, iconVariants, containerVariants } from "./animations";
import { CLASSES } from "./design-tokens";

// ============================================================================
// EN-TÊTE D'ÉTAPE UNIFIÉ
// ============================================================================

export function StepHeader({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-3"
    >
      <div className="flex items-center gap-3">
        {icon && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-sm"
          >
            {icon}
          </motion.div>
        )}
        <h2 className="text-3xl font-bold tracking-tight text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          {title}
        </h2>
      </div>
      {description && (
        <p className="text-lg text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </motion.div>
  );
}

// ============================================================================
// INPUT UNIFIÉ
// ============================================================================

export function UnifiedInput({
  id, label, value, onChange, type = "text", placeholder, required, error, prefix, suffix, maxLength, disabled
}: {
  id: string;
  label: string;
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  type?: "text" | "number" | "email" | "tel";
  placeholder?: string;
  required?: boolean;
  error?: string;
  prefix?: string;
  suffix?: string;
  maxLength?: number;
  disabled?: boolean;
}) {
  const [isFocused, setIsFocused] = React.useState(false);
  const isValid = value !== undefined && value !== "" && !error;

  return (
    <motion.div variants={itemVariants} className="space-y-3">
      <Label htmlFor={id} className="flex items-center gap-2 text-base font-semibold text-foreground">
        {label}
        {required && <span className="text-destructive font-bold">*</span>}
      </Label>
      <motion.div
        variants={inputFocusVariants}
        animate={isFocused ? "focused" : "unfocused"}
        className="relative"
      >
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type={type}
          value={value || ""}
          onChange={(e) => {
            let newValue: string | number = e.target.value;
            if (type === "number") {
              newValue = Number(newValue) || 0;
            }
            if (maxLength && typeof newValue === "string") {
              newValue = newValue.slice(0, maxLength);
            }
            onChange(newValue);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`h-12 text-base transition-all ${
            error
              ? "border-destructive focus-visible:ring-destructive"
              : isValid && !isFocused
                ? "border-green-500/50"
                : ""
          } ${prefix ? "pl-10" : ""} ${suffix ? "pr-20" : ""}`}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
        <AnimatePresence>
          {isValid && !isFocused && !error && (
            <motion.div
              variants={iconVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <Check className="h-5 w-5 text-green-600" />
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <AlertCircle className="h-5 w-5 text-destructive" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-base font-medium text-destructive"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}

// ============================================================================
// SELECT UNIFIÉ
// ============================================================================

export function UnifiedSelect({
  id, label, value, onValueChange, options, placeholder = "Sélectionner une option", required, error, disabled
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <motion.div variants={itemVariants} className="space-y-3">
      <Label htmlFor={id} className="flex items-center gap-2 text-base font-semibold text-foreground">
        {label}
        {required && <span className="text-destructive font-bold">*</span>}
      </Label>
      <Select 
        value={value && options.some(opt => opt.value === value) ? value : undefined} 
        onValueChange={onValueChange} 
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          className={`h-12 text-base bg-background text-foreground border-border ${
            error ? "border-destructive focus:ring-destructive" : ""
          }`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-background text-foreground border-border shadow-lg">
          {options
            .filter((option) => option.value !== "") // Filtrer les valeurs vides (non autorisées par Radix UI)
            .map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-base py-3 text-foreground hover:bg-primary/10 focus:bg-primary/10 cursor-pointer"
                disabled={disabled}
              >
                {option.label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-base font-medium text-destructive"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}

// ============================================================================
// CHECKBOX UNIFIÉ
// ============================================================================

export function UnifiedCheckbox({
  id, label, checked, onCheckedChange, disabled
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Label
        htmlFor={id}
        className="flex items-center gap-3 text-base font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
      >
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className="h-5 w-5"
        />
        {label}
      </Label>
    </motion.div>
  );
}

// ============================================================================
// CARD DE SECTION UNIFIÉE
// ============================================================================

export function UnifiedSectionCard({
  title, icon, children, className
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className={`${CLASSES.card} ${className || ""}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-foreground">
            {icon && (
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10"
              >
                {icon}
              </motion.div>
            )}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================================================
// MESSAGE D'AIDE UNIFIÉ
// ============================================================================

export function UnifiedHelpMessage({
  icon = "💡", message, variant = "info"
}: {
  icon?: string;
  message: string;
  variant?: "info" | "warning" | "success";
}) {
  const variantStyles = {
    info: "border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5",
    warning: "border-yellow-500/20 bg-gradient-to-r from-yellow-500/5 via-yellow-500/10 to-yellow-500/5",
    success: "border-green-500/20 bg-gradient-to-r from-green-500/5 via-green-500/10 to-green-500/5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className={`${CLASSES.glass} rounded-xl border-2 ${variantStyles[variant]} p-6 shadow-md`}
    >
      <div className="flex items-start gap-3">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-2xl"
        >
          {icon}
        </motion.div>
        <p className="text-base text-foreground leading-relaxed flex-1">
          <strong className={`font-semibold ${
            variant === "info" ? "text-primary" : 
            variant === "warning" ? "text-yellow-600" : 
            "text-green-600"
          }`}>
            {variant === "info" ? "Conseil" : variant === "warning" ? "Attention" : "Succès"} :{" "}
          </strong>
          {message}
        </p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// CONTENEUR DE FORMULAIRE UNIFIÉ
// ============================================================================

export function UnifiedFormContainer({
  children, className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className={`${CLASSES.glass} rounded-xl p-6 md:p-8 space-y-6 ${className || ""}`}
    >
      {children}
    </motion.div>
  );
}

