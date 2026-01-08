import { redirect } from "next/navigation";

/**
 * Page racine /owner
 * Redirige automatiquement vers le dashboard
 */
export default function OwnerPage() {
  redirect("/owner/dashboard");
}

