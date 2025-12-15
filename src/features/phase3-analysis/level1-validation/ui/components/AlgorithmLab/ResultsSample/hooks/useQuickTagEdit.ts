// src/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/hooks/useQuickTagEdit.ts
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { TVValidationResult } from "../types";

export interface QuickTagEditState {
  isOpen: boolean;
  row: TVValidationResult | null;
  saving: boolean;
  error: string | null;
}

export interface UseQuickTagEditOptions {
  /** Callback après sauvegarde réussie */
  onSuccess?: () => void;
  /** Callback en cas d'erreur */
  onError?: (error: string) => void;
}

export interface UseQuickTagEditReturn {
  /** État du dialog */
  state: QuickTagEditState;
  /** Ouvrir le dialog pour une ligne */
  openDialog: (row: TVValidationResult) => void;
  /** Fermer le dialog */
  closeDialog: () => void;
  /** Sauvegarder le nouveau tag */
  saveTag: (newTag: string) => Promise<boolean>;
  /** Détermine si c'est un tag X ou Y */
  getTagType: () => "X" | "Y" | null;
  /** Tags disponibles selon le type */
  getAvailableTags: () => string[];
}

// Tags disponibles pour X (stratégies conseiller)
const X_TAGS = [
  "ENGAGEMENT",
  "EXPLICATION",
  "REFLET_ACQ",
  "REFLET_JE",
  "REFLET_VOUS",
  "OUVERTURE",
];

// Tags disponibles pour Y (réactions client)
const Y_TAGS = [
  "CLIENT_POSITIF",
  "CLIENT_NEGATIF",
  "CLIENT_NEUTRE",
];

/**
 * Hook pour l'édition rapide des tags dans Level 1.
 * 
 * Flux de mise à jour (approche A - architecturale) :
 * 1. UPDATE turntagged SET tag = :newTag WHERE id = :turnId
 * 2. UPDATE analysis_pairs SET strategy_tag/reaction_tag = :newTag WHERE turn_id = :turnId
 * 3. Callback onSuccess pour refresh des données
 */
export function useQuickTagEdit(options: UseQuickTagEditOptions = {}): UseQuickTagEditReturn {
  const { onSuccess, onError } = options;

  const [state, setState] = useState<QuickTagEditState>({
    isOpen: false,
    row: null,
    saving: false,
    error: null,
  });

  const openDialog = useCallback((row: TVValidationResult) => {
    setState({
      isOpen: true,
      row,
      saving: false,
      error: null,
    });
  }, []);

  const closeDialog = useCallback(() => {
    setState({
      isOpen: false,
      row: null,
      saving: false,
      error: null,
    });
  }, []);

  const getTagType = useCallback((): "X" | "Y" | null => {
    if (!state.row) return null;
    const target = (state.row.metadata as any)?.target;
    
    // 'conseiller', 'X', 'M1', 'M2', 'M3' → tag X
    if (target === "conseiller" || target === "X" || target === "M1" || target === "M2" || target === "M3") {
      return "X";
    }
    // 'client', 'Y' → tag Y
    if (target === "client" || target === "Y") {
      return "Y";
    }
    return null;
  }, [state.row]);

  const getAvailableTags = useCallback((): string[] => {
    const tagType = getTagType();
    if (tagType === "X") return X_TAGS;
    if (tagType === "Y") return Y_TAGS;
    return [];
  }, [getTagType]);

  const saveTag = useCallback(async (newTag: string): Promise<boolean> => {
    if (!state.row) {
      onError?.("Aucune ligne sélectionnée");
      return false;
    }

    const metadata = state.row.metadata as Record<string, any>;
    const turnId = metadata?.turnId;
    const pairId = metadata?.pairId;
    const tagType = getTagType();

    if (!turnId) {
      onError?.("turnId manquant dans les métadonnées");
      return false;
    }

    if (!tagType) {
      onError?.("Impossible de déterminer le type de tag (X ou Y)");
      return false;
    }

    setState((prev) => ({ ...prev, saving: true, error: null }));

    try {
      // Étape 1: UPDATE turntagged
      console.log(`[QuickTagEdit] UPDATE turntagged SET tag = '${newTag}' WHERE id = ${turnId}`);
      const { error: turntaggedError } = await supabase
        .from("turntagged")
        .update({ tag: newTag })
        .eq("id", turnId);

      if (turntaggedError) {
        throw new Error(`Erreur turntagged: ${turntaggedError.message}`);
      }

      // Étape 2: UPDATE analysis_pairs (sync)
      if (pairId) {
        if (tagType === "X") {
          // Mise à jour du tag conseiller (strategy_tag)
          console.log(`[QuickTagEdit] UPDATE analysis_pairs SET strategy_tag = '${newTag}' WHERE pair_id = ${pairId}`);
          const { error: pairsError } = await supabase
            .from("analysis_pairs")
            .update({ strategy_tag: newTag })
            .eq("pair_id", pairId);

          if (pairsError) {
            console.warn(`[QuickTagEdit] Erreur sync analysis_pairs: ${pairsError.message}`);
            // On continue quand même, turntagged est la source de vérité
          }
        } else if (tagType === "Y") {
          // Mise à jour du tag client (reaction_tag)
          console.log(`[QuickTagEdit] UPDATE analysis_pairs SET reaction_tag = '${newTag}' WHERE pair_id = ${pairId}`);
          const { error: pairsError } = await supabase
            .from("analysis_pairs")
            .update({ reaction_tag: newTag })
            .eq("pair_id", pairId);

          if (pairsError) {
            console.warn(`[QuickTagEdit] Erreur sync analysis_pairs: ${pairsError.message}`);
          }
        }
      } else {
        console.warn("[QuickTagEdit] pairId manquant, sync analysis_pairs ignorée");
      }

      // Succès
      console.log(`[QuickTagEdit] ✅ Tag mis à jour: ${state.row.goldStandard} → ${newTag}`);
      setState((prev) => ({ ...prev, saving: false }));
      closeDialog();
      onSuccess?.();
      return true;

    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      console.error(`[QuickTagEdit] ❌ Erreur:`, message);
      setState((prev) => ({ ...prev, saving: false, error: message }));
      onError?.(message);
      return false;
    }
  }, [state.row, getTagType, closeDialog, onSuccess, onError]);

  return {
    state,
    openDialog,
    closeDialog,
    saveTag,
    getTagType,
    getAvailableTags,
  };
}

export default useQuickTagEdit;
