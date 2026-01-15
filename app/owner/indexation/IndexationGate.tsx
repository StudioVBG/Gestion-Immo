"use client";

/**
 * IndexationGate - Wrapper de gating pour la page indexation (IRL)
 * SOTA 2026: Feature irl_revision requiert Confort+
 */

import { ReactNode } from "react";
import { PlanGate } from "@/components/subscription";

interface IndexationGateProps {
  children: ReactNode;
}

export function IndexationGate({ children }: IndexationGateProps) {
  return (
    <PlanGate feature="irl_revision" mode="blur">
      {children}
    </PlanGate>
  );
}
