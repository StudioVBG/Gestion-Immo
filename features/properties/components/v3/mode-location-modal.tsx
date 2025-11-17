/**
 * ModeLocationModal - Modal pour gérer l'erreur active_lease_blocking
 * Affiche les informations du bail actif et propose des actions
 */

"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, Calendar, User, ArrowRight } from "lucide-react";
import { formatDateShort } from "@/lib/helpers/format";
import { useRouter } from "next/navigation";

interface LeaseInfo {
  id: string;
  type_bail: string;
  date_debut: string;
  date_fin: string | null;
  tenant: {
    name: string;
    email: string;
  } | null;
}

interface ModeLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lease: LeaseInfo | null;
  propertyId: string;
}

const BAIL_TYPE_LABELS: Record<string, string> = {
  nu: "Bail nu",
  meuble: "Bail meublé",
  colocation: "Bail de colocation",
  saisonnier: "Bail saisonnier",
  "3_6_9": "Bail 3-6-9",
  derogatoire: "Bail dérogatoire",
  precaire: "Bail précaire",
  professionnel: "Bail professionnel",
  autre: "Autre",
};

export function ModeLocationModal({
  open,
  onOpenChange,
  lease,
  propertyId,
}: ModeLocationModalProps) {
  const router = useRouter();

  if (!lease) {
    return null;
  }

  const handleViewLease = () => {
    router.push(`/leases/${lease.id}`);
    onOpenChange(false);
  };

  const handleTerminateLease = () => {
    router.push(`/leases/${lease.id}/terminate`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-2">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <DialogTitle>Bail actif en cours</DialogTitle>
          </div>
          <DialogDescription>
            Impossible de changer le mode de location tant qu'un bail est actif sur ce bien.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informations du bail */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Type de bail</span>
              <Badge variant="outline">
                {BAIL_TYPE_LABELS[lease.type_bail] || lease.type_bail}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Dates</span>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {formatDateShort(lease.date_debut)}
                  {lease.date_fin ? ` - ${formatDateShort(lease.date_fin)}` : " (sans fin)"}
                </span>
              </div>
            </div>

            {lease.tenant && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Locataire</span>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{lease.tenant.name}</span>
                </div>
              </div>
            )}
          </div>

          {/* Message d'information */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              Pour changer le mode de location, vous devez d'abord résilier ou terminer le bail actif.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Fermer
          </Button>
          <Button
            variant="secondary"
            onClick={handleViewLease}
            className="w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            Voir le bail en cours
          </Button>
          <Button onClick={handleTerminateLease} className="w-full sm:w-auto">
            <ArrowRight className="h-4 w-4 mr-2" />
            Créer une fin de bail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

