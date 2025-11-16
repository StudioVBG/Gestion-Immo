"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plus, FileText, CheckCircle, Clock, XCircle } from "lucide-react";

export default function VendorInvoicesPage() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      // TODO: Créer route API pour récupérer les factures prestataire
      // const response = await fetch("/api/vendor/invoices");
      setLoading(false);
    } catch (error) {
      console.error("Erreur chargement factures:", error);
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Payée
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Approuvée
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejetée
          </span>
        );
      default:
        return null;
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mes factures</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos factures prestataire
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle facture
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Factures</CardTitle>
          <CardDescription>
            Liste de toutes vos factures
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Chargement...</p>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune facture</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        Facture #{invoice.invoice_number || invoice.id.substring(0, 8)}
                      </h3>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {invoice.amount}€ • {new Date(invoice.invoice_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Voir détails
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

