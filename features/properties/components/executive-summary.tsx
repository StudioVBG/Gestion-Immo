"use client";

import type { ParkingDetails } from "@/lib/types";
import { Button } from "@/components/ui/button";
import React from "react";

export interface SummaryRoom {
  id: string;
  name: string;
  surface?: number | null;
  heating?: boolean;
  cooling?: boolean;
  photosReady?: boolean;
}

interface ExecutiveSummaryProps {
  data: Record<string, any>;
  rooms?: SummaryRoom[];
  parkingDetails?: ParkingDetails | null;
  actionSlot?: React.ReactNode;
}

export function ExecutiveSummary({ data, rooms = [], parkingDetails, actionSlot }: ExecutiveSummaryProps) {
  const address = data.adresse_complete ?? "Adresse à vérifier";
  const codePostal = data.code_postal ?? "00000";
  const ville = data.ville ?? "";
  const type = data.type_bien ?? data.type ?? "Logement";
  const usage = data.type_location_parking ?? data.type_bail ?? data.usage_principal ?? "";
  const repere = data.numero_place ?? data.reference_label ?? null;
  const niveau = data.niveau ? formatNiveau(data.niveau) : null;
  const gabarit = data.gabarit ?? data.vehicle_profile ?? null;
  const parkingType = data.parking_type ?? (data.type_bien === "parking" ? data.parking_details?.placement_type : null);
  const loyer = Number(data.loyer_hc ?? data.loyer_base ?? 0);
  const charges = Number(data.charges_mensuelles ?? 0);
  const depot = Number(data.depot_garantie ?? 0);
  const total = loyer + charges;
  const badges = [
    type === "parking" ? "STATIONNEMENT" : capitalize(String(type)),
    usage ? formatUsage(usage) : null,
  ].filter(Boolean) as string[];
  const hasParkingDetails = (data.type_bien ?? data.type) === "parking" && !!parkingDetails;

  return (
    <div className="space-y-6 text-white" data-testid="summary-executive">
      <div className="flex flex-col gap-4 rounded-3xl border border-white/15 bg-gradient-to-r from-primary/15 via-slate-900 to-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Résumé express</p>
          <h3 className="text-2xl font-semibold text-white">
            {capitalize(String(type))} — {address}
          </h3>
          <p className="text-sm text-white/80">
            {codePostal} {ville} • {niveau ? `${niveau} • ` : ""}
            {repere ? `Repère ${repere}` : "Repère à confirmer"}
          </p>
          <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-semibold uppercase tracking-wide text-white/70">
            {badges.map((badge) => (
              <span key={badge} className="rounded-full border border-white/20 px-3 py-1">
                {badge}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1 text-right">
          <span className="text-xs text-emerald-300">Charges comprises</span>
          <span className="text-3xl font-semibold text-white">{formatCurrency(total)}</span>
          <p className="text-xs text-white/60">
            {formatCurrency(loyer)} + {formatCurrency(charges)} • Dépôt de garantie {formatCurrency(depot)}
          </p>
          {actionSlot}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h4 className="text-sm font-semibold text-white">Identité du bien</h4>
          <dl className="mt-3 space-y-2 text-sm text-white/70">
            <InfoRow term="Adresse" value={`${address}, ${codePostal} ${ville}`} />
            <InfoRow term="Type" value={capitalize(String(type))} />
            {parkingType && <InfoRow term="Stationnement" value={formatParkingType(parkingType)} />}
            {niveau && <InfoRow term="Niveau" value={niveau} />}
            {gabarit && <InfoRow term="Gabarit accepté" value={formatGabarit(gabarit)} />}
          </dl>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h4 className="text-sm font-semibold text-white">Finances & contrat</h4>
          <dl className="mt-3 space-y-2 text-sm text-white/70">
            <InfoRow term="Loyer hors charges" value={formatCurrency(loyer)} />
            <InfoRow term="Charges mensuelles" value={formatCurrency(charges)} />
            <InfoRow term="Dépôt de garantie" value={formatCurrency(depot)} />
            <InfoRow term="Formule" value={formatUsage(usage) || "À définir"} />
            {data.parking_badge_count !== undefined && (
              <InfoRow term="Badges disponibles" value={`${data.parking_badge_count}`} />
            )}
          </dl>
        </div>
        {hasParkingDetails && parkingDetails && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
            <h4 className="text-sm font-semibold text-white">Détails du stationnement</h4>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <dl className="space-y-2 text-sm text-white/70">
                <InfoRow term="Emplacement" value={formatPlacement(parkingDetails.placement_type)} />
                <InfoRow term="Profil véhicule" value={formatVehicleProfile(parkingDetails.vehicle_profile)} />
                <InfoRow term="Revêtement" value={formatSurfaceType(parkingDetails.surface_type)} />
                {parkingDetails.dimensions && (
                  <InfoRow
                    term="Dimensions (m)"
                    value={`${parkingDetails.dimensions.length ?? "?"} × ${parkingDetails.dimensions.width ?? "?"} × ${
                      parkingDetails.dimensions.height ?? "?"
                    }`}
                  />
                )}
              </dl>
              <dl className="space-y-2 text-sm text-white/70">
                <InfoRow term="Accès" value={parkingDetails.access_types.map(formatAccess).join(", ")} />
                <InfoRow
                  term="Horaires"
                  value={
                    parkingDetails.access_window.mode === "24_7"
                      ? "24h/24"
                      : `${parkingDetails.access_window.open_at ?? "--"} → ${parkingDetails.access_window.close_at ?? "--"}`
                  }
                />
                <InfoRow
                  term="Sécurité"
                  value={
                    parkingDetails.security_features?.length
                      ? parkingDetails.security_features.map(formatSecurity).join(", ")
                      : "Standard"
                  }
                />
                <InfoRow term="Manœuvre" value={formatManoeuvre(parkingDetails.manoeuvre)} />
              </dl>
            </div>
            {parkingDetails.description_hint && (
              <p className="mt-3 text-xs text-white/70">{parkingDetails.description_hint}</p>
            )}
          </div>
        )}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4" data-testid="summary-rooms">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Pièces & photos</p>
            <p className="text-xs text-white/70">
              {rooms.length === 0
                ? "Aucune pièce déclarée. Ajoutez vos photos depuis la fiche logement."
                : `${rooms.filter((room) => room.photosReady).length}/${rooms.length} pièces ont déjà des photos planifiées.`}
            </p>
          </div>
          {actionSlot ?? (
            <Button variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/15">
              Ouvrir la galerie après création
            </Button>
          )}
        </div>
        {rooms.length > 0 && (
          <div className="mt-4 space-y-2 text-xs text-white/80">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 md:flex-row md:items-center md:justify-between md:gap-2"
              >
                <div>
                  <p className="font-medium">{room.name}</p>
                  <p className="text-white/60">
                    {room.surface ? `${room.surface} m² • ` : ""}
                    {room.heating ? "Chauffage" : "Pas de chauffage"} • {room.cooling ? "Clim" : "Pas de clim"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    room.photosReady ? "bg-emerald-500/20 text-emerald-200" : "bg-white/10 text-white/70"
                  }`}
                >
                  {room.photosReady ? "Photos prêtes" : "Photos à ajouter"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function InfoRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm text-white/70">
      <dt className="w-32 text-white/40">{term}</dt>
      <dd className="flex-1 text-white">{value}</dd>
    </div>
  );
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");
}

function formatParkingType(type: string) {
  const mapping: Record<string, string> = {
    box: "Box fermé",
    place_couverte: "Place couverte",
    place_exterieure: "Place extérieure",
    souterrain: "Parking souterrain",
    covered: "Couvert",
    underground: "Souterrain",
    outdoor: "Extérieur",
  };
  return mapping[type] ?? capitalize(type);
}

function formatGabarit(gabarit: string) {
  const mapping: Record<string, string> = {
    citadine: "Petite citadine",
    berline: "Berline",
    suv: "SUV / 4x4",
    utilitaire: "Utilitaire",
    deux_roues: "Deux-roues",
  };
  return mapping[gabarit] ?? capitalize(gabarit);
}

function formatUsage(usage?: string | null) {
  if (!usage) return "";
  const mapping: Record<string, string> = {
    parking_seul: "Parking indépendant",
    accessoire: "Accessoire logement",
    commercial: "Bail commercial",
    professionnel: "Bail professionnel",
  };
  return mapping[usage] ?? capitalize(usage);
}

export function formatNiveau(niveau: string) {
  const mapping: Record<string, string> = {
    sous_sol: "Sous-sol",
    rez_de_chaussee: "Rez-de-chaussée",
    etage: "Parking à étage",
    autre: "Niveau à préciser",
  };
  return mapping[niveau] ?? capitalize(niveau);
}

function formatPlacement(value: string) {
  const mapping: Record<string, string> = {
    outdoor: "Extérieur",
    covered: "Couvert",
    box: "Box fermé",
    underground: "Souterrain",
  };
  return mapping[value] ?? capitalize(value);
}

function formatVehicleProfile(value: string) {
  const mapping: Record<string, string> = {
    city: "Citadine",
    berline: "Berline",
    suv: "SUV / 4x4",
    utility: "Utilitaire",
    two_wheels: "Deux-roues",
  };
  return mapping[value] ?? capitalize(value);
}

function formatSurfaceType(value?: string | null) {
  if (!value) return "Standard";
  const mapping: Record<string, string> = {
    beton: "Béton",
    asphalte: "Asphalte",
    gravier: "Gravier",
    autre: "Autre",
  };
  return mapping[value] ?? capitalize(value);
}

function formatAccess(value: string) {
  const mapping: Record<string, string> = {
    badge: "Badge",
    remote: "Télécommande",
    key: "Clé",
    digicode: "Digicode",
    free: "Libre accès",
  };
  return mapping[value] ?? capitalize(value);
}

function formatSecurity(value: string) {
  const mapping: Record<string, string> = {
    gate: "Portail",
    camera: "Caméra",
    guard: "Gardien",
    residence: "Résidence",
    lighting: "Éclairage",
  };
  return mapping[value] ?? capitalize(value);
}

function formatManoeuvre(manoeuvre: ParkingDetails["manoeuvre"]) {
  const items = [
    manoeuvre.narrow_ramp ? "Rampe étroite" : "Rampe confortable",
    manoeuvre.sharp_turn ? "Virage serré" : "Virage fluide",
    manoeuvre.suitable_large_vehicle ? "Convient grands véhicules" : "Plutôt compact",
  ];
  return items.join(", ");
}


