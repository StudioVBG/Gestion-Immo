"use client";

/**
 * GAP-002: Inventaire du mobilier pour logement meublé
 * Conforme au Décret n°2015-981 du 31/07/2015
 *
 * Ce composant permet de réaliser l'inventaire détaillé des meubles
 * et équipements obligatoires lors d'un état des lieux (entrée/sortie)
 * pour un bail meublé ou bail mobilité.
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bed,
  Moon,
  CookingPot,
  Armchair,
  Lamp,
  UtensilsCrossed,
  SprayCan,
  Check,
  X,
  Camera,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Info,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  FurnitureItem,
  FurnitureCategory,
  FurnitureCondition,
} from "@/lib/types/end-of-lease";
import {
  MANDATORY_FURNITURE_LIST,
  FURNITURE_CATEGORY_LABELS,
  FURNITURE_CONDITION_LABELS,
  FURNITURE_CONDITION_COLORS,
} from "@/lib/types/end-of-lease";

// Icônes par catégorie
const CATEGORY_ICONS: Record<FurnitureCategory, React.ReactNode> = {
  literie: <Bed className="h-5 w-5" />,
  occultation: <Moon className="h-5 w-5" />,
  cuisine: <CookingPot className="h-5 w-5" />,
  rangement: <Armchair className="h-5 w-5" />,
  luminaire: <Lamp className="h-5 w-5" />,
  vaisselle: <UtensilsCrossed className="h-5 w-5" />,
  entretien: <SprayCan className="h-5 w-5" />,
};

interface FurnitureInventoryProps {
  edlId: string;
  type: "entree" | "sortie";
  initialItems?: FurnitureItem[];
  onSave: (items: FurnitureItem[]) => void;
  onComplete: () => void;
  onBack?: () => void;
  className?: string;
}

export function FurnitureInventory({
  edlId,
  type,
  initialItems,
  onSave,
  onComplete,
  onBack,
  className,
}: FurnitureInventoryProps) {
  // Initialiser les items avec la liste obligatoire si pas d'items fournis
  const [items, setItems] = useState<FurnitureItem[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    // Créer les items à partir de la liste obligatoire
    return MANDATORY_FURNITURE_LIST.map((item, index) => ({
      ...item,
      id: `furniture-${index}`,
      quantity: 1,
      condition: "bon" as FurnitureCondition,
    }));
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customItem, setCustomItem] = useState({
    name: "",
    description: "",
    category: "rangement" as FurnitureCategory,
  });

  // Grouper les items par catégorie
  const itemsByCategory = useMemo(() => {
    const grouped = new Map<FurnitureCategory, FurnitureItem[]>();
    items.forEach((item) => {
      const existing = grouped.get(item.category) || [];
      grouped.set(item.category, [...existing, item]);
    });
    return grouped;
  }, [items]);

  // Liste des catégories dans l'ordre
  const categories = useMemo(() => {
    return Array.from(itemsByCategory.keys()).sort((a, b) => {
      const order: FurnitureCategory[] = [
        "literie",
        "occultation",
        "cuisine",
        "vaisselle",
        "rangement",
        "luminaire",
        "entretien",
      ];
      return order.indexOf(a) - order.indexOf(b);
    });
  }, [itemsByCategory]);

  const currentCategory = categories[currentIndex];
  const currentItems = currentCategory
    ? itemsByCategory.get(currentCategory) || []
    : [];

  // Calculer la progression
  const completedItems = items.filter(
    (item) => item.condition !== undefined
  ).length;
  const progress = (completedItems / items.length) * 100;
  const missingItems = items.filter(
    (item) => item.condition === "absent" && item.is_mandatory
  ).length;

  // Navigation
  const goNext = () => {
    if (currentIndex < categories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Mise à jour d'un item
  const updateItem = useCallback(
    (itemId: string, updates: Partial<FurnitureItem>) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      );
    },
    []
  );

  // Ajouter un item personnalisé
  const addCustomItem = () => {
    if (!customItem.name.trim()) return;

    const newItem: FurnitureItem = {
      id: `custom-${Date.now()}`,
      category: customItem.category,
      name: customItem.name,
      description: customItem.description,
      legal_requirement: "Équipement supplémentaire",
      is_mandatory: false,
      quantity: 1,
      condition: "bon",
    };

    setItems((prev) => [...prev, newItem]);
    setCustomItem({ name: "", description: "", category: "rangement" });
    setShowCustomItem(false);
  };

  // Sauvegarder et terminer
  const handleComplete = () => {
    onSave(items);
    onComplete();
  };

  // Vérifier si tous les items obligatoires sont présents
  const allMandatoryPresent = items
    .filter((item) => item.is_mandatory)
    .every((item) => item.condition !== "absent");

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header avec progression */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Inventaire du mobilier</h2>
            <p className="text-sm text-muted-foreground">
              {type === "entree" ? "État des lieux d'entrée" : "État des lieux de sortie"} - Décret n°2015-981
            </p>
          </div>
          <Badge variant={missingItems > 0 ? "destructive" : "default"}>
            {missingItems > 0
              ? `${missingItems} élément(s) manquant(s)`
              : "Conforme"}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progression</span>
            <span className="font-medium">
              {currentIndex + 1} / {categories.length} catégories
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Navigation par catégorie */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category, index) => {
          const categoryItems = itemsByCategory.get(category) || [];
          const hasIssue = categoryItems.some(
            (item) => item.condition === "absent" && item.is_mandatory
          );
          return (
            <Button
              key={category}
              variant={currentIndex === index ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "whitespace-nowrap",
                hasIssue && "border-red-300 bg-red-50"
              )}
            >
              {CATEGORY_ICONS[category]}
              <span className="ml-2">{FURNITURE_CATEGORY_LABELS[category]}</span>
              {hasIssue && (
                <AlertTriangle className="ml-1 h-3 w-3 text-red-500" />
              )}
            </Button>
          );
        })}
      </div>

      {/* Contenu de la catégorie actuelle */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCategory}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                {currentCategory && CATEGORY_ICONS[currentCategory]}
                {currentCategory && FURNITURE_CATEGORY_LABELS[currentCategory]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentItems.map((item) => (
                <FurnitureItemCard
                  key={item.id}
                  item={item}
                  onUpdate={(updates) => updateItem(item.id, updates)}
                />
              ))}

              {/* Bouton ajouter item personnalisé */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomItem(true)}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un équipement supplémentaire
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Modal ajout item personnalisé */}
      <AnimatePresence>
        {showCustomItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowCustomItem(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold">Ajouter un équipement</h3>

              <div className="space-y-3">
                <div>
                  <Label>Nom de l'équipement</Label>
                  <Input
                    value={customItem.name}
                    onChange={(e) =>
                      setCustomItem((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Ex: Canapé-lit"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={customItem.description}
                    onChange={(e) =>
                      setCustomItem((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Description de l'équipement"
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Catégorie</Label>
                  <Select
                    value={customItem.category}
                    onValueChange={(value: FurnitureCategory) =>
                      setCustomItem((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FURNITURE_CATEGORY_LABELS).map(
                        ([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCustomItem(false)}
                >
                  Annuler
                </Button>
                <Button onClick={addCustomItem} disabled={!customItem.name.trim()}>
                  Ajouter
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation et actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex gap-2">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Retour
            </Button>
          )}
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </Button>
        </div>

        <div className="flex gap-2">
          {currentIndex < categories.length - 1 ? (
            <Button onClick={goNext}>
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Terminer l'inventaire
            </Button>
          )}
        </div>
      </div>

      {/* Avertissement si items manquants */}
      {!allMandatoryPresent && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Équipements obligatoires manquants
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Certains équipements obligatoires selon le Décret n°2015-981 sont
                absents. Le logement ne peut pas être loué en meublé sans ces
                équipements.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour afficher un item de mobilier
interface FurnitureItemCardProps {
  item: FurnitureItem;
  onUpdate: (updates: Partial<FurnitureItem>) => void;
}

function FurnitureItemCard({ item, onUpdate }: FurnitureItemCardProps) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.name}</span>
            {item.is_mandatory && (
              <Badge variant="outline" className="text-xs">
                Obligatoire
              </Badge>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.legal_requirement}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {item.description}
          </p>
        </div>

        {/* Quantité */}
        <div className="flex items-center gap-2">
          <Label className="text-xs">Qté</Label>
          <Input
            type="number"
            min={0}
            value={item.quantity}
            onChange={(e) => onUpdate({ quantity: parseInt(e.target.value) || 0 })}
            className="w-16 h-8 text-center"
          />
        </div>
      </div>

      {/* Sélection de l'état */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FURNITURE_CONDITION_LABELS) as FurnitureCondition[]).map(
          (condition) => (
            <Button
              key={condition}
              variant={item.condition === condition ? "default" : "outline"}
              size="sm"
              onClick={() => onUpdate({ condition })}
              className={cn(
                "text-xs",
                item.condition === condition && {
                  backgroundColor: FURNITURE_CONDITION_COLORS[condition],
                  borderColor: FURNITURE_CONDITION_COLORS[condition],
                }
              )}
            >
              {condition === "absent" && <X className="h-3 w-3 mr-1" />}
              {condition !== "absent" && item.condition === condition && (
                <Check className="h-3 w-3 mr-1" />
              )}
              {FURNITURE_CONDITION_LABELS[condition]}
            </Button>
          )
        )}
      </div>

      {/* Notes */}
      <div>
        {showNotes ? (
          <div className="space-y-2">
            <Textarea
              value={item.notes || ""}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Observations, remarques..."
              rows={2}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotes(false)}
            >
              Fermer
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNotes(true)}
            className="text-xs text-muted-foreground"
          >
            {item.notes ? "Modifier les notes" : "Ajouter une note"}
          </Button>
        )}
      </div>

      {/* Alerte si absent et obligatoire */}
      {item.condition === "absent" && item.is_mandatory && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <AlertTriangle className="h-3 w-3 inline mr-1" />
          Équipement obligatoire manquant - non conforme au Décret 2015-981
        </div>
      )}
    </div>
  );
}

export default FurnitureInventory;
