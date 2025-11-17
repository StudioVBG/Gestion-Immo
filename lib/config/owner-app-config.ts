/**
 * Configuration de l'application propriétaire
 */

export type OwnerModuleKey = "habitation" | "lcd" | "pro" | "parking";

export type OwnerRole = "owner";

export interface OwnerModuleState {
  key: OwnerModuleKey;
  hasUnits: boolean; // au moins un bien dans ce module
  enabled: boolean; // module actif (analytics affichées)
}

export interface OwnerContext {
  userRole: OwnerRole;
  ownerId: string;
  modules: Record<OwnerModuleKey, OwnerModuleState>;
}

