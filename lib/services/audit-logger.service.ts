/**
 * Service centralisé de journalisation d'audit
 *
 * ✅ SOTA 2026: Conformité légale et traçabilité complète
 */

import { getServiceClient } from "@/lib/supabase/service-client";

// Types d'actions standardisées
export const AUDIT_ACTIONS = {
  // Propriétés
  PROPERTY_CREATED: "property_created",
  PROPERTY_UPDATED: "property_updated",
  PROPERTY_DELETED: "property_deleted",
  PROPERTY_ARCHIVED: "property_archived",

  // Baux
  LEASE_CREATED: "lease_created",
  LEASE_UPDATED: "lease_updated",
  LEASE_SIGNATURE_INITIATED: "lease_signature_initiated",
  LEASE_SIGNED: "lease_signed",
  LEASE_ACTIVATED: "lease_activated",
  LEASE_TERMINATED: "lease_terminated",

  // EDL
  EDL_CREATED: "edl_created",
  EDL_UPDATED: "edl_updated",
  EDL_SIGNED: "edl_signed",
  EDL_COMPLETED: "edl_completed",

  // Paiements
  PAYMENT_CREATED: "payment_created",
  PAYMENT_CONFIRMED: "payment_confirmed",
  MANUAL_PAYMENT_RECORDED: "manual_payment_recorded",
  PAYMENT_FAILED: "payment_failed",
  PAYMENT_REFUNDED: "payment_refunded",

  // Documents
  DOCUMENT_UPLOADED: "document_uploaded",
  DOCUMENT_DOWNLOADED: "document_downloaded",
  DOCUMENT_DELETED: "document_deleted",

  // Utilisateurs
  USER_LOGGED_IN: "user_logged_in",
  USER_LOGGED_OUT: "user_logged_out",
  USER_INVITED: "user_invited",
  USER_ROLE_CHANGED: "user_role_changed",

  // Notifications
  EMAIL_SENT: "email_sent",
  NOTIFICATION_SENT: "notification_sent",

  // Incidents
  INCIDENT_CREATED: "incident_created",
  INCIDENT_UPDATED: "incident_updated",
  INCIDENT_RESOLVED: "incident_resolved",

  // Admin
  ADMIN_ACTION: "admin_action",
  SECURITY_ALERT: "security_alert",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

// Types d'entités
export const ENTITY_TYPES = {
  PROPERTY: "property",
  LEASE: "lease",
  EDL: "edl",
  PAYMENT: "payment",
  INVOICE: "invoice",
  DOCUMENT: "document",
  USER: "user",
  PROFILE: "profile",
  INCIDENT: "incident",
  NOTIFICATION: "notification",
} as const;

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

// Interface pour les entrées d'audit
export interface AuditEntry {
  user_id: string;
  action: AuditAction | string;
  entity_type: EntityType | string;
  entity_id: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

// Interface pour les options de log
export interface LogOptions {
  silent?: boolean; // Ne pas log les erreurs en console
  throwOnError?: boolean; // Lancer une exception si le log échoue
}

/**
 * Enregistre une entrée d'audit
 */
export async function logAudit(
  entry: AuditEntry,
  options: LogOptions = {}
): Promise<boolean> {
  const serviceClient = getServiceClient();

  try {
    const { error } = await serviceClient.from("audit_log").insert({
      user_id: entry.user_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      metadata: entry.metadata || {},
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      created_at: new Date().toISOString(),
    });

    if (error) {
      if (!options.silent) {
        console.error("[AuditLogger] Erreur:", error);
      }
      if (options.throwOnError) {
        throw new Error("Échec de l'audit log: " + error.message);
      }
      return false;
    }

    return true;
  } catch (error) {
    if (!options.silent) {
      console.error("[AuditLogger] Exception:", error);
    }
    if (options.throwOnError) {
      throw error;
    }
    return false;
  }
}

/**
 * Enregistre plusieurs entrées d'audit en batch
 */
export async function logAuditBatch(
  entries: AuditEntry[],
  options: LogOptions = {}
): Promise<boolean> {
  const serviceClient = getServiceClient();

  try {
    const records = entries.map((entry) => ({
      user_id: entry.user_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      metadata: entry.metadata || {},
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      created_at: new Date().toISOString(),
    }));

    const { error } = await serviceClient.from("audit_log").insert(records);

    if (error) {
      if (!options.silent) {
        console.error("[AuditLogger] Erreur batch:", error);
      }
      if (options.throwOnError) {
        throw new Error("Échec de l'audit log batch: " + error.message);
      }
      return false;
    }

    return true;
  } catch (error) {
    if (!options.silent) {
      console.error("[AuditLogger] Exception batch:", error);
    }
    if (options.throwOnError) {
      throw error;
    }
    return false;
  }
}

/**
 * Helper: Log une action sur une propriété
 */
export async function logPropertyAction(
  userId: string,
  action: "created" | "updated" | "deleted" | "archived",
  propertyId: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  return logAudit({
    user_id: userId,
    action: `property_${action}` as AuditAction,
    entity_type: ENTITY_TYPES.PROPERTY,
    entity_id: propertyId,
    metadata,
  });
}

/**
 * Helper: Log une action sur un bail
 */
export async function logLeaseAction(
  userId: string,
  action: "created" | "updated" | "signed" | "activated" | "terminated",
  leaseId: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  return logAudit({
    user_id: userId,
    action: `lease_${action}` as AuditAction,
    entity_type: ENTITY_TYPES.LEASE,
    entity_id: leaseId,
    metadata,
  });
}

/**
 * Helper: Log une action de paiement
 */
export async function logPaymentAction(
  userId: string,
  action: "created" | "confirmed" | "failed" | "refunded",
  paymentId: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  const actionMap: Record<string, AuditAction> = {
    created: AUDIT_ACTIONS.PAYMENT_CREATED,
    confirmed: AUDIT_ACTIONS.PAYMENT_CONFIRMED,
    failed: AUDIT_ACTIONS.PAYMENT_FAILED,
    refunded: AUDIT_ACTIONS.PAYMENT_REFUNDED,
  };

  return logAudit({
    user_id: userId,
    action: actionMap[action] || `payment_${action}`,
    entity_type: ENTITY_TYPES.PAYMENT,
    entity_id: paymentId,
    metadata,
  });
}

/**
 * Helper: Log une action document
 */
export async function logDocumentAction(
  userId: string,
  action: "uploaded" | "downloaded" | "deleted",
  documentPath: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  return logAudit({
    user_id: userId,
    action: `document_${action}` as AuditAction,
    entity_type: ENTITY_TYPES.DOCUMENT,
    entity_id: documentPath,
    metadata,
  });
}

/**
 * Helper: Log une alerte de sécurité
 */
export async function logSecurityAlert(
  userId: string,
  alertType: string,
  details: Record<string, unknown>
): Promise<boolean> {
  return logAudit({
    user_id: userId,
    action: AUDIT_ACTIONS.SECURITY_ALERT,
    entity_type: "security",
    entity_id: alertType,
    metadata: {
      alert_type: alertType,
      severity: "high",
      ...details,
    },
  });
}

/**
 * Récupère l'historique d'audit d'une entité
 */
export async function getEntityAuditHistory(
  entityType: EntityType,
  entityId: string,
  limit: number = 50
): Promise<AuditEntry[]> {
  const serviceClient = getServiceClient();

  const { data, error } = await serviceClient
    .from("audit_log")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[AuditLogger] Erreur récupération historique:", error);
    return [];
  }

  return data || [];
}

export default {
  AUDIT_ACTIONS,
  ENTITY_TYPES,
  logAudit,
  logAuditBatch,
  logPropertyAction,
  logLeaseAction,
  logPaymentAction,
  logDocumentAction,
  logSecurityAlert,
  getEntityAuditHistory,
};
