"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { chargesService } from "@/features/billing/services/charges.service";
import type { Charge } from "@/lib/types";
import { formatCurrency } from "@/lib/helpers/format";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { ConfirmDeleteDialog } from "@/lib/hooks/use-confirm";

interface ChargesListProps {
  propertyId?: string;
}

export function ChargesList({ propertyId }: ChargesListProps) {
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null; type: string }>({
    open: false,
    id: null,
    type: "",
  });
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCharges();
  }, [propertyId]);

  const loadCharges = async () => {
    try {
      setLoading(true);
      const data = propertyId
        ? await chargesService.getChargesByProperty(propertyId)
        : await chargesService.getCharges();
      setCharges(data);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de charger les charges.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;

    setDeleting(true);
    try {
      await chargesService.deleteCharge(deleteConfirm.id);
      toast({
        title: "Charge supprimée",
        description: "La charge a été supprimée avec succès.",
      });
      loadCharges();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la charge.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteConfirm({ open: false, id: null, type: "" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (charges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Charges</CardTitle>
          <CardDescription>Aucune charge enregistrée</CardDescription>
        </CardHeader>
        <CardContent>
          {propertyId && (
            <Link href={`/charges/new?property_id=${propertyId}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une charge
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  }

  const getChargeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      eau: "Eau",
      electricite: "Électricité",
      copro: "Copropriété",
      taxe: "Taxe",
      ordures: "Ordures ménagères",
      assurance: "Assurance",
      autre: "Autre",
    };
    return labels[type] || type;
  };

  const getPeriodicityLabel = (periodicite: string) => {
    const labels: Record<string, string> = {
      mensuelle: "Mensuelle",
      trimestrielle: "Trimestrielle",
      annuelle: "Annuelle",
    };
    return labels[periodicite] || periodicite;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Charges</h2>
        {propertyId && (
          <Link href={`/charges/new?property_id=${propertyId}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une charge
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {charges.map((charge) => (
          <Card key={charge.id}>
            <CardHeader>
              <CardTitle className="text-lg">{getChargeTypeLabel(charge.type)}</CardTitle>
              <CardDescription>
                {getPeriodicityLabel(charge.periodicite)}
                {charge.refacturable_locataire && " • Refacturable au locataire"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{formatCurrency(charge.montant)}</div>
                <div className="flex gap-2">
                  <Link href={`/charges/${charge.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteConfirm({ open: true, id: charge.id, type: charge.type })}
                    disabled={deleting}
                    aria-label={`Supprimer la charge ${getChargeTypeLabel(charge.type)}`}
                  >
                    {deleting && deleteConfirm.id === charge.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDeleteDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la charge"
        description="Cette action supprimera définitivement la charge. Les factures déjà générées ne seront pas affectées."
        itemName={deleteConfirm.type ? getChargeTypeLabel(deleteConfirm.type) : undefined}
      />
    </div>
  );
}

