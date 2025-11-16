// Helpers pour le formatage

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatPeriod(period: string): string {
  // Format "YYYY-MM" -> "MM/YYYY"
  const [year, month] = period.split("-");
  return `${month}/${year}`;
}

export function formatPhoneNumber(phone: string): string {
  // Format "0612345678" -> "06 12 34 56 78"
  return phone.replace(/(\d{2})(?=\d)/g, "$1 ");
}

export function formatFullName(prenom: string | null, nom: string | null): string {
  if (!prenom && !nom) return "Utilisateur";
  return [prenom, nom].filter(Boolean).join(" ");
}

export function buildAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) return null;
  if (/^https?:\/\//i.test(avatarPath)) {
    return avatarPath;
  }
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) return null;
  return `${baseUrl}/storage/v1/object/public/avatars/${avatarPath}`;
}

