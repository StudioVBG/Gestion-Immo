"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Home,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Download,
  Zap,
  Droplet,
  Flame,
  Camera,
  User,
  Building2,
  FileSignature,
} from "lucide-react";
import { formatDateShort, formatCurrency } from "@/lib/helpers/format";
import { EDLPreview } from "@/features/edl/components/edl-preview";
import { mapRawEDLToTemplate } from "@/lib/mappers/edl-to-template";
import { SignaturePad, type SignatureData } from "@/components/signature/SignaturePad";

interface TenantEDLDetailClientProps {
  data: {
    raw: any;
    mySignature: any;
    meterReadings: any[];
    ownerProfile: any;
    rooms: any[];
    stats: {
      totalItems: number;
      completedItems: number;
      totalPhotos: number;
      signaturesCount: number;
    };
  };
  profileId: string;
}

export default function TenantEDLDetailClient({
  data,
  profileId,
}: TenantEDLDetailClientProps) {
  const router = useRouter();
  const [isSigning, setIsSigning] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  const { raw: edl, mySignature, meterReadings, ownerProfile, rooms, stats } = data;
  const property = edl.lease?.property || edl.property_details;
  const lease = edl.lease;

  // Vérifier si j'ai déjà signé
  const hasSigned = !!(mySignature?.signed_at && mySignature?.signature_image_path);

  // Adapter les signatures pour le mapper
  const adaptedSignatures = (edl.edl_signatures || []).map((s: any) => ({
    id: s.id,
    edl_id: edl.id,
    signer_type: s.signer_role,
    signer_profile_id: s.signer_profile_id || s.signer_user,
    signature_image: s.signature_image_path,
    signature_image_url: s.signature_image_url,
    signed_at: s.signed_at,
    ip_address: s.ip_inet,
    profile: s.profile,
  }));

  // Adapter les relevés de compteurs pour le mapper
  const adaptedMeterReadings = (meterReadings || []).map((r: any) => ({
    type: r.meter?.type || "electricity",
    meter_number: r.meter?.meter_number,
    reading: String(r.reading_value),
    unit: r.reading_unit || "kWh",
    photo_url: r.photo_path,
  }));

  // Adapter les médias pour le mapper
  const adaptedMedia = (edl.edl_media || []).map((m: any) => ({
    id: m.id,
    edl_id: edl.id,
    item_id: m.item_id,
    file_path: m.storage_path,
    type: m.media_type || "photo",
  }));

  // Mapper les données pour l'aperçu du document
  const edlTemplateData = mapRawEDLToTemplate(
    edl as any,
    ownerProfile,
    edl.edl_items || [],
    adaptedMedia,
    adaptedMeterReadings,
    adaptedSignatures,
    []
  );

  // Gérer la signature
  const handleSignatureSubmit = async (signatureData: SignatureData) => {
    if (!signatureData.data) return;

    try {
      setIsSigning(true);
      const response = await fetch(`/api/edl/${edl.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: signatureData.data }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erreur lors de la signature");
      }

      setIsSignModalOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error("Signature error:", error);
      alert(error.message || "Erreur lors de la signature");
    } finally {
      setIsSigning(false);
    }
  };

  // Télécharger le PDF
  const handleDownloadPDF = async () => {
    // Implementation similaire au bail
    alert("Téléchargement PDF - À implémenter");
  };

  const getTypeLabel = (type: string) => {
    return type === "entree"
      ? "État des lieux d'entrée"
      : "État des lieux de sortie";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Brouillon</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Programmé</Badge>;
      case "in_progress":
        return <Badge className="bg-indigo-100 text-indigo-800">En cours</Badge>;
      case "completed":
        return <Badge className="bg-purple-100 text-purple-800">Terminé</Badge>;
      case "signed":
        return <Badge className="bg-green-100 text-green-800">✅ Signé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{getTypeLabel(edl.type)}</h1>
            {getStatusBadge(edl.status)}
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Home className="h-4 w-4" />
            {property?.adresse || "Adresse non définie"}
          </p>
          {edl.scheduled_at && (
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              Prévu le {formatDateShort(edl.scheduled_at)}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {!hasSigned && edl.status !== "draft" && (
            <Button onClick={() => setIsSignModalOpen(true)} disabled={isSigning}>
              <FileSignature className="h-4 w-4 mr-2" />
              {isSigning ? "Signature en cours..." : "Signer maintenant"}
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger PDF
          </Button>
        </div>
      </div>

      {/* Alerte si signature requise */}
      {!hasSigned && edl.status !== "draft" && (
        <Card className="border-amber-200 bg-amber-50 mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <FileSignature className="h-6 w-6 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">
                  Votre signature est requise
                </p>
                <p className="text-sm text-amber-700">
                  Veuillez examiner l'état des lieux ci-dessous puis signer le
                  document.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ma signature confirmée */}
      {hasSigned && (
        <Card className="border-green-200 bg-green-50 mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  Vous avez signé cet état des lieux
                </p>
                <p className="text-sm text-green-700">
                  Signé le {formatDateShort(mySignature.signed_at)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aperçu du document */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Aperçu du document
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t max-h-[70vh] overflow-y-auto">
                <EDLPreview edlData={edlTemplateData} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau latéral */}
        <div className="space-y-4">
          {/* Signatures */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSignature className="h-4 w-4" />
                Signatures
              </CardTitle>
              <CardDescription>
                {stats.signaturesCount}/2 signatures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(edl.edl_signatures || []).map((sig: any) => {
                const isSigned = sig.signed_at && sig.signature_image_path;
                const isOwner =
                  sig.signer_role === "owner" ||
                  sig.signer_role === "proprietaire";
                const signerName =
                  sig.profile?.prenom && sig.profile?.nom
                    ? `${sig.profile.prenom} ${sig.profile.nom}`
                    : isOwner
                    ? "Bailleur"
                    : "Locataire";

                return (
                  <div
                    key={sig.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isSigned ? "bg-green-50 border-green-200" : "bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          isSigned ? "bg-green-100" : "bg-slate-200"
                        }`}
                      >
                        {isSigned ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{signerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {isOwner ? "Bailleur" : "Locataire"}
                        </p>
                      </div>
                    </div>
                    {isSigned ? (
                      <span className="text-xs text-green-700">
                        {formatDateShort(sig.signed_at)}
                      </span>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        En attente
                      </Badge>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Logement */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Logement
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="font-medium">{property?.adresse}</p>
              <p className="text-muted-foreground">
                {property?.code_postal} {property?.ville}
              </p>
              {property?.surface && (
                <p className="text-muted-foreground">{property.surface} m²</p>
              )}
            </CardContent>
          </Card>

          {/* Compteurs */}
          {meterReadings.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Relevés de compteurs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {meterReadings.map((reading: any, i: number) => {
                  const type = reading.meter?.type || "electricity";
                  const Icon =
                    type === "electricity"
                      ? Zap
                      : type === "water"
                      ? Droplet
                      : Flame;

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{type}</span>
                      </div>
                      <span className="font-mono">
                        {reading.reading_value} {reading.reading_unit || "kWh"}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Statistiques */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pièces inspectées</span>
                <span className="font-medium">{rooms.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Éléments évalués</span>
                <span className="font-medium">
                  {stats.completedItems}/{stats.totalItems}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Photos</span>
                <span className="font-medium">{stats.totalPhotos}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de signature */}
      <Dialog open={isSignModalOpen} onOpenChange={setIsSignModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Signer l'état des lieux</DialogTitle>
            <DialogDescription>
              Veuillez dessiner ou taper votre signature ci-dessous pour
              confirmer votre accord avec cet état des lieux.
            </DialogDescription>
          </DialogHeader>
          <SignaturePad
            signerName={`${mySignature?.profile?.prenom || ""} ${mySignature?.profile?.nom || "Locataire"}`.trim()}
            onSignatureComplete={handleSignatureSubmit}
            disabled={isSigning}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

