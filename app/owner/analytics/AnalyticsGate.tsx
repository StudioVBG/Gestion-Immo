"use client";

/**
 * AnalyticsGate - Wrapper de gating pour la page analytics
 * SOTA 2026: Feature owner_reports requiert Confort+
 */

import { ReactNode } from "react";
import { PlanGate } from "@/components/subscription";

interface AnalyticsGateProps {
  children: ReactNode;
}

export function AnalyticsGate({ children }: AnalyticsGateProps) {
  return (
    <PlanGate feature="owner_reports" mode="blur">
      {children}
    </PlanGate>
  );
}
