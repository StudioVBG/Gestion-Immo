import crypto from "crypto";

/**
 * Vérification HMAC pour les webhooks (P2-2)
 */

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  // Extraire le hash de la signature (format: sha256=hash)
  const parts = signature.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") {
    return false;
  }

  const receivedHash = parts[1];

  // Calculer le hash attendu
  const expectedHash = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Comparaison sécurisée (timing-safe)
  return crypto.timingSafeEqual(
    Buffer.from(receivedHash, "hex"),
    Buffer.from(expectedHash, "hex")
  );
}

export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  // Stripe utilise un format spécifique
  const elements = signature.split(",");
  const timestamp = elements.find((e) => e.startsWith("t="))?.split("=")[1];
  const signatures = elements
    .filter((e) => e.startsWith("v1="))
    .map((e) => e.split("=")[1]);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  // Vérifier que le timestamp n'est pas trop ancien (5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    return false;
  }

  // Construire le payload signé
  const signedPayload = `${timestamp}.${payload}`;

  // Vérifier chaque signature
  for (const sig of signatures) {
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    if (crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedSig, "hex"))) {
      return true;
    }
  }

  return false;
}





