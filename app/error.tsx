"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Une erreur est survenue</h1>
      <p className="text-muted-foreground">{error.message || "Erreur inconnue"}</p>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}

