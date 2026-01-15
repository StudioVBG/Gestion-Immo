"use client";

/**
 * CoproGate - Wrapper de gating pour le module copropriété
 * SOTA 2026: Feature copro_module requiert Enterprise L+
 */

import { ReactNode } from "react";
import { PlanGate } from "@/components/subscription";

interface CoproGateProps {
  children: ReactNode;
}

export function CoproGate({ children }: CoproGateProps) {
  return (
    <PlanGate feature="copro_module" mode="blur">
      {children}
    </PlanGate>
  );
}
