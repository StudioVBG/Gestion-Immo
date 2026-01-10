"use client";

/**
 * Hook useConfirm - SOTA 2026
 *
 * Remplace window.confirm() par un AlertDialog accessible WCAG 2.1 AA.
 * Utilise Radix UI AlertDialog avec focus trap et annonces screen reader.
 *
 * @example
 * const { confirm, ConfirmDialog } = useConfirm();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: "Supprimer l'élément",
 *     description: "Cette action est irréversible.",
 *     confirmText: "Supprimer",
 *     cancelText: "Annuler",
 *     variant: "destructive"
 *   });
 *   if (confirmed) {
 *     // Effectuer la suppression
 *   }
 * };
 *
 * return (
 *   <>
 *     <Button onClick={handleDelete}>Supprimer</Button>
 *     <ConfirmDialog />
 *   </>
 * );
 */

import { useState, useCallback, createContext, useContext, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  /** Titre du dialog */
  title: string;
  /** Description détaillée */
  description: string;
  /** Texte du bouton de confirmation */
  confirmText?: string;
  /** Texte du bouton d'annulation */
  cancelText?: string;
  /** Variante du bouton de confirmation */
  variant?: "default" | "destructive" | "outline";
  /** Icône optionnelle (Lucide icon) */
  icon?: ReactNode;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

const initialState: ConfirmState = {
  isOpen: false,
  title: "",
  description: "",
  confirmText: "Confirmer",
  cancelText: "Annuler",
  variant: "default",
  resolve: null,
};

/**
 * Hook pour afficher un dialog de confirmation accessible
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>(initialState);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        ...options,
        confirmText: options.confirmText || "Confirmer",
        cancelText: options.cancelText || "Annuler",
        variant: options.variant || "default",
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState(initialState);
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState(initialState);
  }, [state.resolve]);

  const ConfirmDialog = useCallback(() => (
    <AlertDialog open={state.isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent role="alertdialog" aria-modal="true">
        <AlertDialogHeader>
          {state.icon && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              {state.icon}
            </div>
          )}
          <AlertDialogTitle>{state.title}</AlertDialogTitle>
          <AlertDialogDescription>{state.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {state.cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={cn(
              state.variant === "destructive" && buttonVariants({ variant: "destructive" })
            )}
          >
            {state.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ), [state, handleConfirm, handleCancel]);

  return { confirm, ConfirmDialog };
}

// Context pour usage global (optionnel)
interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

/**
 * Provider pour usage global du confirm dialog
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const { confirm, ConfirmDialog } = useConfirm();

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog />
    </ConfirmContext.Provider>
  );
}

/**
 * Hook pour accéder au confirm dialog global
 */
export function useGlobalConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useGlobalConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}

/**
 * Composant standalone pour les cas simples
 */
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Confirmer la suppression",
  description = "Cette action est irréversible. Voulez-vous vraiment continuer ?",
  itemName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent role="alertdialog" aria-modal="true">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {itemName
              ? `Vous êtes sur le point de supprimer "${itemName}". ${description}`
              : description
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={buttonVariants({ variant: "destructive" })}
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
