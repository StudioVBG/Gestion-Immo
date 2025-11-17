/**
 * Utilitaires pour la gestion des numéros de téléphone
 */

/**
 * Détecte automatiquement le pays d'un numéro de téléphone
 * @param phone - Numéro de téléphone nettoyé (ex: "0696614049")
 * @returns Code pays détecté (ex: "FR" ou "MQ")
 */
function detectCountryFromPhone(phone: string): string {
  // Patterns spécifiques pour détecter le pays
  // Format français : commence par 06, 07 (mobiles) ou 01-05 (fixes)
  // Format DROM : peut commencer par les mêmes patterns mais avec indicatifs différents
  
  // Si commence par 06 ou 07 (mobiles français/DROM)
  if (phone.match(/^0[67]/)) {
    // Par défaut, on considère que c'est français
    // Mais on pourrait améliorer avec une détection plus fine
    return "FR";
  }
  
  // Si commence par 01-05 (fixes français/DROM)
  if (phone.match(/^0[1-5]/)) {
    return "FR";
  }
  
  // Par défaut, retourner FR
  return "FR";
}

/**
 * Convertit un numéro de téléphone en format E.164 avec détection automatique du pays
 * @param phone - Numéro de téléphone (ex: "0696614049" ou "+33696614049")
 * @param countryCode - Code pays par défaut (ex: "FR" pour +33). Si non fourni, détection automatique
 * @returns Numéro au format E.164 (ex: "+33696614049" ou "+596696614049")
 */
export function normalizePhoneToE164(phone: string | null | undefined, countryCode?: string): string | null {
  if (!phone || phone.trim() === "") {
    return null;
  }

  // Nettoyer le numéro (supprimer espaces, tirets, points)
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, "");

  // Si déjà au format E.164, retourner tel quel
  if (cleaned.startsWith("+")) {
    // Vérifier le format E.164
    if (/^\+[1-9]\d{1,14}$/.test(cleaned)) {
      return cleaned;
    }
    // Si commence par + mais format invalide, essayer de corriger
    const withoutPlus = cleaned.substring(1);
    if (/^[1-9]\d{1,14}$/.test(withoutPlus)) {
      return `+${withoutPlus}`;
    }
  }

  // Mapping des codes pays avec leurs indicatifs
  const countryPrefixes: Record<string, string> = {
    FR: "33",
    GP: "590",
    MQ: "596",
    GF: "594",
    RE: "262",
    YT: "262",
    PM: "508",
    BL: "590",
    MF: "590",
  };

  // Détecter automatiquement le pays si non fourni
  let detectedCountry = countryCode;
  if (!detectedCountry && cleaned.startsWith("0")) {
    detectedCountry = detectCountryFromPhone(cleaned);
  }
  
  // Si toujours pas de pays, utiliser FR par défaut
  const finalCountry = detectedCountry || "FR";
  const prefix = countryPrefixes[finalCountry] || "33";

  // Si le numéro commence par 0 (format français/DROM), le remplacer par le préfixe
  if (cleaned.startsWith("0")) {
    const withoutZero = cleaned.substring(1);
    // Vérifier que c'est un numéro valide (9 chiffres après le 0)
    if (/^\d{9}$/.test(withoutZero)) {
      return `+${prefix}${withoutZero}`;
    }
  }

  // Si le numéro commence déjà par le préfixe sans le +
  if (cleaned.startsWith(prefix)) {
    const withoutPrefix = cleaned.substring(prefix.length);
    if (/^\d{9}$/.test(withoutPrefix)) {
      return `+${prefix}${withoutPrefix}`;
    }
  }

  // Si c'est juste 9 chiffres (format français/DROM sans le 0)
  if (/^\d{9}$/.test(cleaned)) {
    return `+${prefix}${cleaned}`;
  }

  // Si c'est 10 chiffres commençant par 0
  if (/^0\d{9}$/.test(cleaned)) {
    const withoutZero = cleaned.substring(1);
    return `+${prefix}${withoutZero}`;
  }

  // Si aucun format reconnu, retourner null pour déclencher une erreur
  return null;
}

/**
 * Valide un numéro de téléphone au format E.164
 * @param phone - Numéro de téléphone à valider
 * @returns true si valide, false sinon
 */
export function isValidE164(phone: string | null | undefined): boolean {
  if (!phone) return false;
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

/**
 * Formate un numéro de téléphone pour l'affichage (format français)
 * @param phone - Numéro au format E.164 (ex: "+33696614049")
 * @returns Numéro formaté (ex: "06 96 61 40 49")
 */
export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone) return "";
  
  // Si c'est un numéro français (+33)
  if (phone.startsWith("+33")) {
    const withoutPrefix = phone.substring(3);
    if (withoutPrefix.length === 9) {
      // Formater comme 06 96 61 40 49
      return `0${withoutPrefix.substring(0, 1)} ${withoutPrefix.substring(1, 3)} ${withoutPrefix.substring(3, 5)} ${withoutPrefix.substring(5, 7)} ${withoutPrefix.substring(7, 9)}`;
    }
  }
  
  // Pour les autres formats, retourner tel quel
  return phone;
}

