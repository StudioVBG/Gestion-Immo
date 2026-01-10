"use client";

import { Building2, Car, Shield, Hash, Flame, Snowflake, Store, Wifi, Accessibility } from "lucide-react";
import type { OwnerProperty } from "@/lib/types/owner-property";
import {
  HABITATION_TYPES,
  PARKING_TYPES,
  PRO_TYPES,
} from "@/lib/constants/property-types";

interface PropertyCharacteristicsBadgesProps {
  property: OwnerProperty;
}

/**
 * Affiche les badges de caractéristiques adaptés au type de bien
 * - Parking: type, numéro, niveau, gabarit, sécurité
 * - Local Pro: surface, type, étage, équipements
 * - Habitation: surface, pièces, type, DPE, chauffage, clim
 */
export function PropertyCharacteristicsBadges({ property }: PropertyCharacteristicsBadgesProps) {
  const propertyType = property.type || "";

  // ========== PARKING / BOX ==========
  if ((PARKING_TYPES as readonly string[]).includes(propertyType)) {
    return (
      <div className="flex flex-wrap gap-3">
        {/* Type de parking */}
        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg">
          <Car className="h-4 w-4 text-purple-600" />
          <div>
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="font-semibold text-sm capitalize">
              {property.parking_type === "box"
                ? "Box fermé"
                : property.parking_type === "place_couverte"
                  ? "Couvert"
                  : property.parking_type === "souterrain"
                    ? "Souterrain"
                    : "Extérieur"}
            </p>
          </div>
        </div>

        {/* Numéro de place */}
        {property.parking_numero && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
            <Hash className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">N° Place</p>
              <p className="font-semibold text-sm">{property.parking_numero}</p>
            </div>
          </div>
        )}

        {/* Niveau */}
        {property.parking_niveau && (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <div>
              <p className="text-xs text-muted-foreground">Niveau</p>
              <p className="font-semibold text-sm">{property.parking_niveau}</p>
            </div>
          </div>
        )}

        {/* Gabarit */}
        {property.parking_gabarit && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg">
            <Car className="h-4 w-4 text-amber-600" />
            <div>
              <p className="text-xs text-muted-foreground">Gabarit max</p>
              <p className="font-semibold text-sm capitalize">{property.parking_gabarit}</p>
            </div>
          </div>
        )}

        {/* Sécurité */}
        {(property.parking_video_surveillance || property.parking_gardien || property.parking_portail_securise) && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
            <Shield className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">Sécurité</p>
              <p className="font-semibold text-sm">
                {[
                  property.parking_video_surveillance && "Vidéo",
                  property.parking_gardien && "Gardien",
                  property.parking_portail_securise && "Portail",
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Surface (pour box) */}
        {property.surface && property.surface > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
            <span className="text-slate-600 text-lg">📐</span>
            <div>
              <p className="text-xs text-muted-foreground">Surface</p>
              <p className="font-semibold text-sm">{property.surface} m²</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========== LOCAL PROFESSIONNEL ==========
  if ((PRO_TYPES as readonly string[]).includes(propertyType)) {
    return (
      <div className="flex flex-wrap gap-3">
        {/* Surface */}
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
          <span className="text-blue-600 text-lg">📐</span>
          <div>
            <p className="text-xs text-muted-foreground">Surface</p>
            <p className="font-semibold text-sm">{property.local_surface_totale || property.surface} m²</p>
          </div>
        </div>

        {/* Type de local */}
        {property.local_type && (
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg">
            <Store className="h-4 w-4 text-purple-600" />
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-semibold text-sm capitalize">{property.local_type}</p>
            </div>
          </div>
        )}

        {/* Étage */}
        {property.etage !== undefined && property.etage !== null && (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
            <Building2 className="h-4 w-4 text-indigo-600" />
            <div>
              <p className="text-xs text-muted-foreground">Étage</p>
              <p className="font-semibold text-sm">{property.etage === 0 ? "RDC" : property.etage}</p>
            </div>
          </div>
        )}

        {/* Équipements */}
        {property.local_has_vitrine && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg">
            <span className="text-amber-600 text-lg">🪟</span>
            <div>
              <p className="text-xs text-muted-foreground">Vitrine</p>
              <p className="font-semibold text-sm">Oui</p>
            </div>
          </div>
        )}

        {property.local_access_pmr && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
            <Accessibility className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Accès PMR</p>
              <p className="font-semibold text-sm">Oui</p>
            </div>
          </div>
        )}

        {property.local_fibre && (
          <div className="flex items-center gap-2 px-3 py-2 bg-cyan-50 rounded-lg">
            <Wifi className="h-4 w-4 text-cyan-600" />
            <div>
              <p className="text-xs text-muted-foreground">Fibre</p>
              <p className="font-semibold text-sm">Oui</p>
            </div>
          </div>
        )}

        {property.local_clim && (
          <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 rounded-lg">
            <Snowflake className="h-4 w-4 text-sky-600" />
            <div>
              <p className="text-xs text-muted-foreground">Climatisation</p>
              <p className="font-semibold text-sm">Oui</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ========== HABITATION (par défaut) ==========
  return (
    <div className="flex flex-wrap gap-3">
      {/* Surface */}
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
        <span className="text-blue-600 text-lg">📐</span>
        <div>
          <p className="text-xs text-muted-foreground">Surface</p>
          <p className="font-semibold text-sm">{property.surface} m²</p>
        </div>
      </div>

      {/* Pièces */}
      {property.nb_pieces && property.nb_pieces > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg">
          <span className="text-emerald-600 text-lg">🚪</span>
          <div>
            <p className="text-xs text-muted-foreground">Pièces</p>
            <p className="font-semibold text-sm">{property.nb_pieces}</p>
          </div>
        </div>
      )}

      {/* Type */}
      <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 rounded-lg">
        <span className="text-violet-600 text-lg">🏠</span>
        <div>
          <p className="text-xs text-muted-foreground">Type</p>
          <p className="font-semibold text-sm capitalize">{property.type}</p>
        </div>
      </div>

      {/* DPE */}
      {property.dpe_classe_energie && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg">
          <span className="text-amber-600 text-lg">⚡</span>
          <div>
            <p className="text-xs text-muted-foreground">DPE</p>
            <p className="font-semibold text-sm">{property.dpe_classe_energie}</p>
          </div>
        </div>
      )}

      {/* Étage */}
      {property.etage !== undefined && property.etage !== null && (
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg">
          <Building2 className="h-4 w-4 text-indigo-600" />
          <div>
            <p className="text-xs text-muted-foreground">Étage</p>
            <p className="font-semibold text-sm">{property.etage === 0 ? "RDC" : property.etage}</p>
          </div>
        </div>
      )}

      {/* Chauffage */}
      {property.chauffage_type && property.chauffage_type !== "aucun" && (
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg">
          <Flame className="h-4 w-4 text-orange-600" />
          <div>
            <p className="text-xs text-muted-foreground">Chauffage</p>
            <p className="font-semibold text-sm capitalize">
              {property.chauffage_type} {property.chauffage_energie ? `(${property.chauffage_energie})` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Climatisation */}
      {property.clim_presence && property.clim_presence !== "aucune" && (
        <div className="flex items-center gap-2 px-3 py-2 bg-cyan-50 rounded-lg">
          <Snowflake className="h-4 w-4 text-cyan-600" />
          <div>
            <p className="text-xs text-muted-foreground">Climatisation</p>
            <p className="font-semibold text-sm capitalize">{property.clim_presence}</p>
          </div>
        </div>
      )}

      {/* Meublé */}
      {property.meuble && (
        <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg">
          <span className="text-teal-600 text-lg">🛋️</span>
          <div>
            <p className="text-xs text-muted-foreground">Meublé</p>
            <p className="font-semibold text-sm">Oui</p>
          </div>
        </div>
      )}
    </div>
  );
}
