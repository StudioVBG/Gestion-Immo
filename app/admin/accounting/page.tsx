"use client";
// @ts-nocheck

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

export default function AdminAccountingPage() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  async function handleExport(format: "csv" | "excel" | "fec") {
    setExporting(true);
    try {
      // 1. Créer le job
      const startResponse = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "accounting",
          format: format === "excel" ? "csv" : format, // On fallback sur CSV pour l'exemple
          filters: { scope: "global" }
        })
      });

      if (!startResponse.ok) throw new Error("Erreur initialisation export");
      const { jobId } = await startResponse.json();

      // 2. Poll pour le statut
      let attempts = 0;
      const maxAttempts = 20; // 20 * 2s = 40s
      
      const poll = async () => {
        if (attempts >= maxAttempts) throw new Error("Délai d'export dépassé");
        attempts++;

        const statusResponse = await fetch(`/api/exports/${jobId}`);
        const job = await statusResponse.json();

        if (job.status === "completed") {
          // 3. Télécharger
          window.location.href = `/api/exports/${jobId}/download`;
          toast({
            title: "Export réussi",
            description: `Le fichier est prêt et en cours de téléchargement.`,
          });
          setExporting(false);
        } else if (job.status === "failed") {
          throw new Error(job.error_message || "L'export a échoué");
        } else {
          // Attendre 2 secondes avant le prochain poll
          setTimeout(poll, 2000);
        }
      };

      poll();

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'exporter les données",
        variant: "destructive",
      });
      setExporting(false);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Comptabilité</h1>
        <p className="text-muted-foreground mt-2">
          Exports comptables et grand-livre
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Exports comptables</CardTitle>
            <CardDescription>
              Téléchargez les données comptables au format CSV, Excel ou FEC
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleExport("csv")}
              disabled={exporting}
              className="w-full"
              variant="outline"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
            <Button
              onClick={() => handleExport("excel")}
              disabled={exporting}
              className="w-full"
              variant="outline"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exporter Excel
            </Button>
            <Button
              onClick={() => handleExport("fec")}
              disabled={exporting}
              className="w-full"
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              Exporter FEC
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grand-livre</CardTitle>
            <CardDescription>
              Consultez le grand-livre agrégé
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={async () => {
                const response = await fetch("/api/accounting/gl");
                if (response.ok) {
                  const data = await response.json();
                  toast({
                    title: "Grand-livre",
                    description: `${data.entries?.length || 0} entrées`,
                  });
                }
              }}
              className="w-full"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Consulter le grand-livre
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





