"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { invoicesService } from "../services/invoices.service";
import type { Invoice } from "@/lib/types";
import { formatCurrency, formatPeriod } from "@/lib/helpers/format";

interface InvoiceCardProps {
  invoice: Invoice;
  onDelete?: () => void;
}

export function InvoiceCard({ invoice, onDelete }: InvoiceCardProps) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) return;

    setDeleting(true);
    try {
      await invoicesService.deleteInvoice(invoice.id);
      toast({
        title: "Facture supprimée",
        description: "La facture a été supprimée avec succès.",
      });
      onDelete?.();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Brouillon",
      sent: "Envoyée",
      paid: "Payée",
      late: "En retard",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      sent: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      late: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Facture {formatPeriod(invoice.periode)}</CardTitle>
            <CardDescription>Période : {formatPeriod(invoice.periode)}</CardDescription>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(invoice.statut)}`}>
            {getStatusLabel(invoice.statut)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Loyer :</span>
            <span className="font-medium">{formatCurrency(invoice.montant_loyer)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Charges :</span>
            <span className="font-medium">{formatCurrency(invoice.montant_charges)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-muted-foreground font-medium">Total :</span>
            <span className="font-bold text-lg">{formatCurrency(invoice.montant_total)}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Link href={`/invoices/${invoice.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Voir détails
            </Button>
          </Link>
          <Button variant="destructive" size="icon" onClick={handleDelete} disabled={deleting}>
            {deleting ? "..." : "🗑️"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

