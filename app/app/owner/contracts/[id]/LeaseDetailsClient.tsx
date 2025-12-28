"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  ArrowLeft, 
  Trash2, 
  Loader2,
  Edit,
  Users,
  FolderOpen,
  CreditCard,
  CheckCircle,
  RefreshCw,
  XCircle,
  CalendarOff,
} from "lucide-react";
import { LeaseRenewalWizard } from "@/features/leases/components/lease-renewal-wizard";
import { useToast } from "@/components/ui/use-toast";
import type { LeaseDetails } from "../../_data/fetchLeaseDetails";
import { LeasePreview } from "@/features/leases/components/lease-preview";
import { formatCurrency } from "@/lib/helpers/format";
import { mapLeaseToTemplate } from "@/lib/mappers/lease-to-template";
import { OwnerSignatureModal } from "./OwnerSignatureModal";

interface LeaseDetailsClientProps {
  details: LeaseDetails;
  leaseId: string;
  ownerProfile?: {
    id: string;
    prenom: string;
    nom: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    type?: string;
    raison_sociale?: string;
  };
}

// Config des statuts
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-slate-100 text-slate-700 border-slate-300" },
  pending_signature: { label: "Signature en attente", color: "bg-amber-100 text-amber-700 border-amber-300" },
  pending_owner_signature: { label: "À signer (propriétaire)", color: "bg-blue-100 text-blue-700 border-blue-300" },
  active: { label: "Actif", color: "bg-green-100 text-green-700 border-green-300" },
  terminated: { label: "Terminé", color: "bg-slate-100 text-slate-600 border-slate-300" },
};

export function LeaseDetailsClient({ details, leaseId, ownerProfile }: LeaseDetailsClientProps) {
  const { lease, property, signers, payments, documents } = details;
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showRenewalWizard, setShowRenewalWizard] = useState(false);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  const statusConfig = STATUS_CONFIG[lease.statut] || STATUS_CONFIG.draft;

  // ✅ SYNCHRONISATION : Les données financières viennent du BIEN (source unique)
  const propAny = property as any;
  
  // Calcul du dépôt max légal selon le type de bail
  const getMaxDepotLegal = (typeBail: string, loyerHC: number): number => {
    switch (typeBail) {
      case "nu":
      case "etudiant":
        return loyerHC * 1;
      case "meuble":
      case "colocation":
        return loyerHC * 2;
      case "mobilite":
        return 0;
      case "saisonnier":
        return loyerHC * 2;
      default:
        return loyerHC;
    }
  };

  // ✅ LIRE depuis le BIEN (source unique)
  const displayLoyer = propAny?.loyer_hc ?? propAny?.loyer_base ?? lease.loyer ?? 0;
  const displayCharges = propAny?.charges_mensuelles ?? lease.charges_forfaitaires ?? 0;
  const displayDepot = getMaxDepotLegal(lease.type_bail, displayLoyer);
  const premierVersement = displayLoyer + displayCharges + displayDepot;

  // Trouver les signataires
  const mainTenant = signers?.find((s: any) => s.role === "locataire_principal");
  const ownerSigner = signers?.find((s: any) => s.role === "proprietaire");
  
  // Vérifier si le propriétaire doit signer
  const needsOwnerSignature = (
    lease.statut === "pending_owner_signature" || 
    (lease.statut === "pending_signature" && mainTenant?.signature_status === "signed" && ownerSigner?.signature_status !== "signed")
  );

  // Construire bailData pour la prévisualisation (via mapper)
  const bailData = mapLeaseToTemplate(details, ownerProfile);

  // Signer le bail en tant que propriétaire avec image de signature
  const handleOwnerSign = async (signatureImage: string) => {
    setIsSigning(true);
    try {
      const response = await fetch(`/api/leases/${leaseId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "SES",
          signature_image: signatureImage,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la signature");
      }
      toast({
        title: "✅ Bail signé !",
        description: "Le bail est maintenant actif.",
      });
      setShowSignatureModal(false);
      router.refresh();
    } catch (error: any) {
      console.error("Erreur signature:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de signer le bail",
        variant: "destructive",
      });
      throw error; // Re-throw pour le modal
    } finally {
      setIsSigning(false);
    }
  };

  // Supprimer le bail
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/leases/${leaseId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la suppression");
      }
      toast({
        title: "✅ Bail supprimé",
        description: "Le bail et toutes ses données ont été supprimés.",
      });
      router.push("/app/owner/contracts");
      router.refresh();
    } catch (error: any) {
      console.error("Erreur suppression:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le bail",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Résilier le bail
  const handleTerminate = async () => {
    setIsTerminating(true);
    try {
      const response = await fetch(`/api/leases/${leaseId}/terminate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termination_date: new Date().toISOString().split("T")[0],
          reason: "Résiliation à l'initiative du propriétaire",
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la résiliation");
      }
      toast({
        title: "✅ Bail résilié",
        description: "Le bail a été terminé avec succès.",
      });
      router.refresh();
    } catch (error: any) {
      console.error("Erreur résiliation:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de résilier le bail",
        variant: "destructive",
      });
    } finally {
      setIsTerminating(false);
      setShowTerminateDialog(false);
    }
  };

  // Callback après renouvellement
  const handleRenewalSuccess = (newLeaseId: string) => {
    router.push(`/app/owner/contracts/${newLeaseId}`);
    router.refresh();
  };

  // Peut-on renouveler ou résilier ?
  const canRenew = lease.statut === "active";
  const canTerminate = lease.statut === "active";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50">
      {/* Barre supérieure fixe (Header) */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground hover:text-foreground">
              <Link href="/app/owner/contracts">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
            </Button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-slate-900 hidden sm:block">
                Bail {property.ville}
              </h1>
              <Badge className={statusConfig.color} variant="outline">
                {statusConfig.label}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {needsOwnerSignature && (
              <Button
                size="sm"
                onClick={() => setShowSignatureModal(true)}
                disabled={isSigning}
                className="bg-blue-600 hover:bg-blue-700 shadow-sm"
              >
                {isSigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Signer le bail
              </Button>
            )}
            
            <Button variant="outline" size="sm" asChild>
              <Link href={`/app/owner/contracts/${leaseId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Modifier</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Colonne de gauche : Document (Aperçu temps réel) */}
          <div className="lg:col-span-8 xl:col-span-9 order-2 lg:order-1 flex flex-col h-[calc(100vh-8rem)]">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
              {/* Le composant LeasePreview gère l'affichage, l'impression et le téléchargement PDF */}
              <LeasePreview 
                typeBail={lease.type_bail} 
                bailData={bailData} 
                leaseId={leaseId}
              />
            </div>
          </div>

          {/* Colonne de droite : Contexte & Actions */}
          <div className="lg:col-span-4 xl:col-span-3 order-1 lg:order-2 space-y-6">
            
            {/* Carte Info Rapide */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Détails Clés
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Loyer mensuel</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(displayLoyer + displayCharges)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(displayLoyer)} HC + {formatCurrency(displayCharges)} charges
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-50">
                  <div>
                    <p className="text-xs text-muted-foreground">Dépôt de garantie</p>
                    <p className="text-base font-semibold text-slate-800">{formatCurrency(displayDepot)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">1er versement</p>
                    <p className="text-base font-semibold text-emerald-600">{formatCurrency(premierVersement)}</p>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-slate-50">
                  <p className="text-xs text-muted-foreground mb-2">Locataire</p>
                  {mainTenant ? (
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                        {mainTenant.profile?.prenom?.[0]}{mainTenant.profile?.nom?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{mainTenant.profile?.prenom} {mainTenant.profile?.nom}</p>
                        <Badge variant="secondary" className="text-[10px] h-5">Principal</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="text-sm italic text-muted-foreground">En attente d'invitation</p>
                      <Button variant="outline" size="sm" asChild className="w-full border-dashed">
                        <Link href={`/app/owner/contracts/${leaseId}/signers`}>
                           <Users className="h-4 w-4 mr-2" />
                           Inviter un locataire
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Menu de Gestion */}
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="pb-3 border-b border-slate-50">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Gestion
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 p-2">
                <nav className="space-y-1">
                  <Link 
                    href={`/app/owner/contracts/${leaseId}/signers`}
                    className="flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-slate-500" />
                      Signataires
                    </div>
                    <Badge variant="secondary" className="text-xs">{signers?.length || 0}</Badge>
                  </Link>
                  
                  <Link 
                    href={`/app/owner/documents?lease_id=${leaseId}`}
                    className="flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-4 w-4 text-slate-500" />
                      Documents
                    </div>
                    <Badge variant="secondary" className="text-xs">{documents?.length || 0}</Badge>
                  </Link>

                  <Link 
                    href={`/app/owner/money?lease_id=${leaseId}`}
                    className="flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-slate-500" />
                      Paiements
                    </div>
                    <Badge variant="secondary" className="text-xs">{payments?.length || 0}</Badge>
                  </Link>
                </nav>

                {/* Actions de cycle de vie */}
                {(canRenew || canTerminate) && (
                  <div className="mt-4 pt-4 border-t border-slate-50 px-2 space-y-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                      Cycle de vie
                    </p>
                    
                    {canRenew && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                        onClick={() => setShowRenewalWizard(true)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Renouveler le bail
                      </Button>
                    )}
                    
                    {canTerminate && (
                      <AlertDialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                          >
                            <CalendarOff className="h-4 w-4 mr-2" />
                            Résilier le bail
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-amber-600 flex items-center gap-2">
                              <CalendarOff className="h-5 w-5" />
                              Résilier ce bail ?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action mettra fin au bail. Le locataire sera notifié et 
                              le processus de fin de bail (EDL, restitution dépôt) sera initié.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isTerminating}>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleTerminate}
                              disabled={isTerminating}
                              className="bg-amber-600 hover:bg-amber-700"
                            >
                              {isTerminating ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Résiliation...
                                </>
                              ) : (
                                "Confirmer la résiliation"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-50 px-2">
                  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer ce bail
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">
                          Supprimer définitivement ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action effacera le bail, l'historique des paiements et tous les documents associés.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isDeleting ? "Suppression..." : "Supprimer"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Wizard de renouvellement */}
      <LeaseRenewalWizard
        leaseId={leaseId}
        open={showRenewalWizard}
        onOpenChange={setShowRenewalWizard}
        onSuccess={handleRenewalSuccess}
      />

      {/* Modal de signature propriétaire */}
      <OwnerSignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSign={handleOwnerSign}
        leaseInfo={{
          id: leaseId,
          typeBail: lease.type_bail,
          loyer: displayLoyer,
          charges: displayCharges,
          propertyAddress: property.adresse_complete || `${property.numero_rue || ""} ${property.nom_rue || ""}`.trim(),
          propertyCity: property.ville || "",
          tenantName: mainTenant?.profile ? `${mainTenant.profile.prenom || ""} ${mainTenant.profile.nom || ""}`.trim() : undefined,
          dateDebut: lease.date_debut,
        }}
        ownerName={ownerProfile ? `${ownerProfile.prenom || ""} ${ownerProfile.nom || ""}`.trim() : ""}
      />
    </div>
  );
}
