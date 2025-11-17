/**
 * PropertyAnnouncementTab - Tab "Annonce & expérience locataire"
 * Cards avec toutes les infos d'annonce + complétion
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FileText,
  Bed,
  Lock,
  Clock,
  Map,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Globe,
  Info,
} from "lucide-react";
import type { Property } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { ModeLocationModal } from "./mode-location-modal";

interface PropertyAnnouncementTabProps {
  property: Property;
  onPropertyUpdate: (updates: Partial<Property>) => Promise<void>;
}

export function PropertyAnnouncementTab({
  property,
  onPropertyUpdate,
}: PropertyAnnouncementTabProps) {
  const { toast } = useToast();
  const [modeLocation, setModeLocation] = useState<string>(
    (property as any).mode_location || "longue_duree"
  );
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);
  const [leaseModalOpen, setLeaseModalOpen] = useState(false);
  const [leaseInfo, setLeaseInfo] = useState<any>(null);

  // Calcul du score de complétion (simplifié)
  const completionScore = calculateCompletionScore(property);
  const completionChecks = getCompletionChecks(property);

  const handleModeLocationChange = async (newMode: string) => {
    if (newMode === modeLocation) return;

    setIsUpdatingMode(true);
    try {
      await onPropertyUpdate({ mode_location: newMode } as any);
      setModeLocation(newMode);
      toast({
        title: "Succès",
        description: "Le mode de location a été mis à jour.",
      });
    } catch (error: any) {
      // Vérifier si c'est l'erreur active_lease_blocking
      // L'erreur peut venir de différentes structures selon le client API
      const errorMessage = error?.message || "";
      const errorData = error?.data || error?.response?.data || error;
      
      if (
        errorData?.error === "active_lease_blocking" ||
        errorMessage.includes("active_lease_blocking") ||
        errorData?.globalErrors?.some((e: string) => e.includes("bail actif"))
      ) {
        setLeaseInfo(errorData?.lease || null);
        setLeaseModalOpen(true);
      } else {
        toast({
          title: "Erreur",
          description: errorData?.globalErrors?.[0] || errorMessage || "Impossible de mettre à jour le mode de location.",
          variant: "destructive",
        });
      }
      // Revenir à l'ancienne valeur
      setModeLocation((property as any).mode_location || "longue_duree");
    } finally {
      setIsUpdatingMode(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Score de complétion */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Complétion de l'annonce
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Score global</span>
              <span className="font-bold text-lg">{completionScore}%</span>
            </div>
            <Progress value={completionScore} className="h-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {completionChecks.map((check) => (
              <div key={check.id} className="flex items-center gap-2 text-sm">
                {check.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
                <span className={check.completed ? "" : "text-muted-foreground"}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mode de location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Mode de location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-900 dark:text-blue-200">
              Le mode de location détermine si le bien est destiné à une location longue durée ou courte durée.
              Vous ne pouvez pas changer ce mode s'il existe un bail actif sur ce bien.
            </p>
          </div>
          <RadioGroup
            value={modeLocation}
            onValueChange={handleModeLocationChange}
            disabled={isUpdatingMode}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="longue_duree" id="longue_duree" />
              <Label htmlFor="longue_duree" className="flex-1 cursor-pointer">
                <div className="font-medium">Location longue durée</div>
                <div className="text-sm text-muted-foreground">
                  Baux classiques (3 ans, renouvelables), location principale
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
              <RadioGroupItem value="courte_duree" id="courte_duree" />
              <Label htmlFor="courte_duree" className="flex-1 cursor-pointer">
                <div className="font-medium">Location courte durée</div>
                <div className="text-sm text-muted-foreground">
                  Location saisonnière, meublée de tourisme, locations temporaires
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Cards d'annonce */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identité de l'annonce */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Identité de l'annonce
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Titre</label>
              <p className="font-semibold mt-1">
                {(property as any).titre_annonce || property.adresse_complete || "Sans titre"}
              </p>
            </div>
            {(property as any).tagline && (
              <div>
                <label className="text-sm text-muted-foreground">Tagline</label>
                <p className="mt-1">{(property as any).tagline}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Description
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(property as any).description_logement && (
              <div>
                <label className="text-sm text-muted-foreground">Logement</label>
                <p className="mt-1 text-sm">{(property as any).description_logement}</p>
              </div>
            )}
            {(property as any).description_acces_voyageurs && (
              <div>
                <label className="text-sm text-muted-foreground">Accès voyageurs</label>
                <p className="mt-1 text-sm">{(property as any).description_acces_voyageurs}</p>
              </div>
            )}
            {(property as any).description_a_savoir && (
              <div>
                <label className="text-sm text-muted-foreground">À savoir</label>
                <p className="mt-1 text-sm">{(property as any).description_a_savoir}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Séjour & accès */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Séjour & accès
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(property as any).checkin_from && (
              <div>
                <label className="text-sm text-muted-foreground">Arrivée</label>
                <p className="mt-1">
                  {(property as any).checkin_from} - {(property as any).checkin_to}
                </p>
              </div>
            )}
            {(property as any).checkout_time && (
              <div>
                <label className="text-sm text-muted-foreground">Départ</label>
                <p className="mt-1">{(property as any).checkout_time}</p>
              </div>
            )}
            {(property as any).mode_acces && (
              <div>
                <label className="text-sm text-muted-foreground">Mode d'accès</label>
                <p className="mt-1">{(property as any).mode_acces}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sécurité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(property as any).detecteur_fumee && (
              <Badge variant="outline" className="w-full justify-start">
                <CheckCircle2 className="h-3 w-3 mr-2" />
                Détecteur de fumée
              </Badge>
            )}
            {(property as any).detecteur_co && (
              <Badge variant="outline" className="w-full justify-start">
                <CheckCircle2 className="h-3 w-3 mr-2" />
                Détecteur de CO
              </Badge>
            )}
            {(property as any).extincteur && (
              <Badge variant="outline" className="w-full justify-start">
                <CheckCircle2 className="h-3 w-3 mr-2" />
                Extincteur
              </Badge>
            )}
            {(property as any).trousse_secours && (
              <Badge variant="outline" className="w-full justify-start">
                <CheckCircle2 className="h-3 w-3 mr-2" />
                Trousse de secours
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Quartier & environnement */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Quartier & environnement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(property as any).description_quartier && (
              <div>
                <label className="text-sm text-muted-foreground">Description du quartier</label>
                <p className="mt-1 text-sm">{(property as any).description_quartier}</p>
              </div>
            )}
            {(property as any).points_forts_quartier &&
              Array.isArray((property as any).points_forts_quartier) &&
              (property as any).points_forts_quartier.length > 0 && (
                <div>
                  <label className="text-sm text-muted-foreground">Points forts</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(property as any).points_forts_quartier.map((point: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {point}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Modal pour l'erreur active_lease_blocking */}
      <ModeLocationModal
        open={leaseModalOpen}
        onOpenChange={setLeaseModalOpen}
        lease={leaseInfo}
        propertyId={property.id}
      />
    </div>
  );
}

function calculateCompletionScore(property: Property): number {
  let score = 0;
  let total = 0;

  // Titre
  total++;
  if ((property as any).titre_annonce) score++;

  // Description logement
  total++;
  if ((property as any).description_logement) score++;

  // Photos (au moins 3)
  total++;
  // TODO: Vérifier le nombre réel de photos
  // if (photos.length >= 3) score++;

  // Couchages
  total++;
  // TODO: Vérifier les couchages par chambre
  // if (hasBeds) score++;

  // Quartier
  total++;
  if ((property as any).description_quartier) score++;

  return Math.round((score / total) * 100);
}

function getCompletionChecks(property: Property): Array<{ id: string; label: string; completed: boolean }> {
  return [
    {
      id: "titre_annonce",
      label: "Titre d'annonce",
      completed: !!(property as any).titre_annonce,
    },
    {
      id: "description_logement",
      label: "Description du logement",
      completed: !!(property as any).description_logement,
    },
    {
      id: "photos_min",
      label: "Au moins 3 photos",
      completed: false, // TODO: Vérifier le nombre réel
    },
    {
      id: "couchages",
      label: "Couchages par chambre",
      completed: false, // TODO: Vérifier les couchages
    },
    {
      id: "quartier",
      label: "Description du quartier",
      completed: !!(property as any).description_quartier,
    },
  ];
}

