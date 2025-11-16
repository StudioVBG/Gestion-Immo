"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { paymentSharesService } from "../services/payment-shares.service";

interface Receipt {
  id: string;
  periode: string;
  montant_total: number;
  montant_loyer: number;
  montant_charges: number;
  paid_at: string;
  payment_method?: string;
  pdf_url?: string | null;
}

interface ReceiptsTableProps {
  leaseId: string;
  month?: string;
}

export function ReceiptsTable({ leaseId, month }: ReceiptsTableProps) {
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipts();
  }, [leaseId, month]);

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const data = await paymentSharesService.getReceipts(leaseId, month);
      setReceipts(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors du chargement des quittances",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (receiptId: string) => {
    try {
      // TODO: Implémenter le téléchargement du PDF
      toast({
        title: "Information",
        description: "Téléchargement en cours...",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors du téléchargement",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quittances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (receipts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quittances</CardTitle>
          <CardDescription>Aucune quittance disponible</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quittances</CardTitle>
        <CardDescription>Historique de vos paiements</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Période</TableHead>
              <TableHead>Loyer</TableHead>
              <TableHead>Charges</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payé le</TableHead>
              <TableHead>Moyen</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.map((receipt) => (
              <TableRow key={receipt.id}>
                <TableCell className="font-medium">
                  {new Date(receipt.periode + "-01").toLocaleDateString("fr-FR", {
                    month: "long",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>{receipt.montant_loyer.toFixed(2)} €</TableCell>
                <TableCell>{receipt.montant_charges.toFixed(2)} €</TableCell>
                <TableCell className="font-semibold">
                  {receipt.montant_total.toFixed(2)} €
                </TableCell>
                <TableCell>
                  {new Date(receipt.paid_at).toLocaleDateString("fr-FR")}
                </TableCell>
                <TableCell>
                  {receipt.payment_method === "cb"
                    ? "Carte bancaire"
                    : receipt.payment_method === "virement"
                    ? "Virement"
                    : receipt.payment_method === "prelevement"
                    ? "Prélèvement"
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(receipt.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

