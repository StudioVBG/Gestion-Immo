import { z } from "zod";

/**
 * Schémas de validation pour les signataires de baux
 */

export const leaseSignerRoleSchema = z.enum([
  "proprietaire",
  "locataire_principal",
  "colocataire",
  "garant",
]);

export const leaseSignerStatusSchema = z.enum([
  "pending",
  "signed",
  "refused",
]);

export const addLeaseSignerSchema = z.object({
  profile_id: z.string().uuid("L'ID du profil doit être un UUID valide"),
  role: leaseSignerRoleSchema,
});

export const updateLeaseSignerSchema = z.object({
  signature_status: leaseSignerStatusSchema.optional(),
  signed_at: z.string().datetime().optional().nullable(),
});

export const signLeaseSchema = z.object({
  level: z.enum(["SES", "AES", "QES"]).default("SES"),
  otp_code: z.string().optional(),
  signature_image: z.string().optional(),
});

