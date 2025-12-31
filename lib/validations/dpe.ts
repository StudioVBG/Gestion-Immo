import { z } from "zod";

/**
 * Statuts des demandes DPE
 */
export const dpeRequestStatusEnum = z.enum([
  "REQUESTED",
  "QUOTE_RECEIVED",
  "SCHEDULED",
  "DONE",
  "DELIVERED",
  "CANCELLED",
]);

export type DpeRequestStatus = z.infer<typeof dpeRequestStatusEnum>;

/**
 * Type pour les créneaux horaires
 */
export interface TimeSlot {
  start: string;
  end: string;
}

/**
 * Input pour la création d'une demande DPE
 */
export interface DpeRequestInput {
  property_id: string;
  visit_contact_name: string;
  visit_contact_role: "OWNER" | "TENANT" | "OTHER";
  visit_contact_email?: string;
  visit_contact_phone: string;
  access_notes?: string;
  preferred_slots: TimeSlot[];
  notes?: string;
}

/**
 * Input pour le livrable DPE (Dépôt)
 */
export interface DpeDeliverableInput {
  property_id: string;
  request_id?: string;
  dpe_number: string;
  issued_at: string;
  energy_class: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  ges_class?: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  source: "UPLOAD" | "API_PREFILL";
}

/**
 * Validation du numéro ADEME (13 chiffres)
 */
export function isValidAdemeNumber(number: string): boolean {
  return /^[0-9]{13}$/.test(number);
}

/**
 * Validation de la classe énergétique
 */
export function isValidEnergyClass(cls: string): cls is "A" | "B" | "C" | "D" | "E" | "F" | "G" {
  return ["A", "B", "C", "D", "E", "F", "G"].includes(cls);
}
