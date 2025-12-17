// ============================================================================
// InterAnnotatorAgreementService - Accord Inter-Annotateurs N×N
// ============================================================================
// Description : Calculs d'accord entre N annotateurs (pas seulement 2)
// - Matrice Kappa N×N
// - Désaccords multi-annotateurs
// - Résumé statistiques d'accord
// - Support pour robustesse hypothèses H1/H2
// ============================================================================

import { AnnotationService } from "./AnnotationService";
import type {
  AnnotatorIdentifier,
  KappaMatrix,
  AgreementSummary,
  MultiAnnotatorDisagreement,
  Annotation
} from "@/types/algorithm-lab/Level0Types";

export class InterAnnotatorAgreementService {
  // ==========================================================================
  // MATRICE KAPPA N×N
  // ==========================================================================

  /**
   * Calcule matrice Kappa entre N annotateurs
   * Retourne matrice carrée N×N avec kappa[i][j] = accord entre i et j
   * 
   * Exemple : 3 annotateurs → matrice 3×3
   * [
   *   [1.00, 0.85, 0.78],  // thomas_initial vs tous
   *   [0.85, 1.00, 0.82],  // CharteY_A vs tous
   *   [0.78, 0.82, 1.00]   // CharteY_B vs tous
   * ]
   */
  static async calculateKappaMatrix(
    annotators: AnnotatorIdentifier[],
    variable: "X" | "Y" = "Y"
  ): Promise<{ data: KappaMatrix | null; error: string | null }> {
    try {
      const n = annotators.length;

      if (n < 2) {
        return {
          data: null,
          error: "At least 2 annotators required for comparison"
        };
      }

      // Matrice N×N initialisée
      const matrix: number[][] = Array(n)
        .fill(0)
        .map(() => Array(n).fill(0));

      // Calculer kappa pour chaque paire (i, j)
      let totalKappa = 0;
      let pairCount = 0;
      let minKappa = 1.0;
      let maxKappa = 0.0;

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i === j) {
            // Diagonale = 1.0 (accord parfait avec soi-même)
            matrix[i][j] = 1.0;
          } else {
            // Comparer annotateurs i et j
            const comparison = await AnnotationService.compareAnnotators(
              annotators[i],
              annotators[j],
              variable
            );

            if (comparison.error || !comparison.data) {
              console.warn(
                `[InterAnnotatorAgreement] Comparison failed: ${annotators[i].annotator_id} vs ${annotators[j].annotator_id}`
              );
              matrix[i][j] = 0;
            } else {
              const kappa = comparison.data.kappa;
              matrix[i][j] = kappa;

              // Stats globales (seulement upper triangle pour éviter double comptage)
              if (i < j) {
                totalKappa += kappa;
                pairCount++;
                minKappa = Math.min(minKappa, kappa);
                maxKappa = Math.max(maxKappa, kappa);
              }
            }
          }
        }
      }

      const avgKappa = pairCount > 0 ? totalKappa / pairCount : 0;

      return {
        data: {
          annotators,
          matrix,
          avg_kappa: avgKappa,
          min_kappa: minKappa,
          max_kappa: maxKappa
        },
        error: null
      };
    } catch (err) {
      console.error("[InterAnnotatorAgreement] Matrix calculation error:", err);
      return { data: null, error: "Unexpected error calculating Kappa matrix" };
    }
  }

  // ==========================================================================
  // RÉSUMÉ D'ACCORD
  // ==========================================================================

  /**
   * Génère résumé statistiques d'accord entre annotateurs
   * Identifie meilleure et pire paire
   */
  static async getAgreementSummary(
    annotators: AnnotatorIdentifier[],
    variable: "X" | "Y" = "Y"
  ): Promise<{ data: AgreementSummary | null; error: string | null }> {
    try {
      const kappaMatrixResult = await this.calculateKappaMatrix(
        annotators,
        variable
      );

      if (kappaMatrixResult.error || !kappaMatrixResult.data) {
        return { data: null, error: kappaMatrixResult.error };
      }

      const { matrix, avg_kappa } = kappaMatrixResult.data;
      const n = annotators.length;
      const totalComparisons = (n * (n - 1)) / 2; // Combinaisons 2 parmi N

      // Trouver meilleure et pire paire
      let bestKappa = -1;
      let worstKappa = 2;
      let bestPair: { i: number; j: number } | null = null;
      let worstPair: { i: number; j: number } | null = null;

      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const kappa = matrix[i][j];

          if (kappa > bestKappa) {
            bestKappa = kappa;
            bestPair = { i, j };
          }

          if (kappa < worstKappa) {
            worstKappa = kappa;
            worstPair = { i, j };
          }
        }
      }

      if (!bestPair || !worstPair) {
        return {
          data: null,
          error: "Could not determine best/worst pairs"
        };
      }

      // Calculer % accord moyen (approximation depuis Kappa)
      // Formula: Po ≈ Kappa * (1 - Pe) + Pe, on approxime Pe ≈ 0.20 pour simplification
      const avgAgreement = Math.max(0, Math.min(1, avg_kappa * 0.8 + 0.2));

      return {
        data: {
          total_annotators: n,
          total_comparisons: totalComparisons,
          avg_agreement: avgAgreement,
          avg_kappa,
          best_pair: {
            annotator1: annotators[bestPair.i],
            annotator2: annotators[bestPair.j],
            kappa: bestKappa
          },
          worst_pair: {
            annotator1: annotators[worstPair.i],
            annotator2: annotators[worstPair.j],
            kappa: worstKappa
          }
        },
        error: null
      };
    } catch (err) {
      console.error("[InterAnnotatorAgreement] Summary error:", err);
      return { data: null, error: "Unexpected error generating summary" };
    }
  }

  // ==========================================================================
  // DÉSACCORDS MULTI-ANNOTATEURS
  // ==========================================================================

  /**
   * Identifie paires où ≥2 annotateurs ne sont pas d'accord
   * Utile pour repérer cas difficiles / ambigus
   * 
   * Types de désaccords :
   * - "partial" : certains annotateurs d'accord, d'autres non
   * - "total" : tous les annotateurs ont des tags différents
   */
  static async findMultiAnnotatorDisagreements(
    annotators: AnnotatorIdentifier[],
    variable: "X" | "Y" = "Y",
    minAnnotators: number = 2
  ): Promise<{
    data: MultiAnnotatorDisagreement[] | null;
    error: string | null;
  }> {
    try {
      if (annotators.length < minAnnotators) {
        return {
          data: null,
          error: `At least ${minAnnotators} annotators required`
        };
      }

      // 1. Récupérer toutes les annotations de tous les annotateurs
      const annotationsMap = new Map<number, Annotation[]>();

      for (const annotator of annotators) {
        const { data: annotations } = await AnnotationService.searchAnnotations({
          annotator_types: [annotator.annotator_type],
          annotator_ids: [annotator.annotator_id],
          limit: 10000 // Max 10k annotations
        });

        if (annotations) {
          annotations.forEach((ann) => {
            if (!annotationsMap.has(ann.pair_id)) {
              annotationsMap.set(ann.pair_id, []);
            }
            annotationsMap.get(ann.pair_id)!.push(ann);
          });
        }
      }

      // 2. Filtrer paires avec ≥ minAnnotators annotations
      const disagreements: MultiAnnotatorDisagreement[] = [];

      annotationsMap.forEach((anns, pairId) => {
        if (anns.length < minAnnotators) return;

        // Extraire tags selon variable
        const tags = anns.map((a) =>
          variable === "X" ? a.strategy_tag : a.reaction_tag
        );

        // Vérifier si désaccord
        const uniqueTags = new Set(tags.filter((t) => t !== null));

        if (uniqueTags.size > 1) {
          // Déterminer type désaccord
          const disagreementType =
            uniqueTags.size === anns.length ? "total" : "partial";

          // Construire objet désaccord
          const verbatim =
            variable === "Y"
              ? anns[0]?.reasoning || "N/A" // Pour Y, on veut verbatim client
              : anns[0]?.reasoning || "N/A"; // Pour X, verbatim conseiller

          disagreements.push({
            pair_id: pairId,
            verbatim,
            annotations: anns.map((a) => ({
              annotator: {
                annotator_type: a.annotator_type,
                annotator_id: a.annotator_id
              },
              tag: (variable === "X" ? a.strategy_tag : a.reaction_tag) || "NULL",
              confidence: a.confidence || undefined,
              reasoning: a.reasoning || undefined
            })),
            disagreement_type: disagreementType as "partial" | "total"
          });
        }
      });

      // Trier par nombre d'annotateurs (plus de désaccords = plus intéressant)
      disagreements.sort((a, b) => b.annotations.length - a.annotations.length);

      return { data: disagreements, error: null };
    } catch (err) {
      console.error("[InterAnnotatorAgreement] Disagreements error:", err);
      return {
        data: null,
        error: "Unexpected error finding disagreements"
      };
    }
  }

  // ==========================================================================
  // UTILITAIRES - Interprétation Kappa
  // ==========================================================================

  /**
   * Interprète valeur Kappa selon échelle de Landis & Koch (1977)
   */
  static interpretKappa(kappa: number): string {
    if (kappa < 0) return "Inférieur au hasard";
    if (kappa < 0.2) return "Accord faible";
    if (kappa < 0.4) return "Accord acceptable";
    if (kappa < 0.6) return "Accord modéré";
    if (kappa < 0.8) return "Accord substantiel";
    return "Accord quasi-parfait";
  }

  /**
   * Vérifie si Kappa est suffisant pour robustesse
   * Seuil recommandé : 0.60 (accord modéré minimum)
   */
  static isKappaSufficient(kappa: number, threshold: number = 0.6): boolean {
    return kappa >= threshold;
  }

  /**
   * Calcule Fleiss' Kappa pour N annotateurs sur M paires
   * (Alternative à Kappa de Cohen pour >2 annotateurs)
   * 
   * Note : Plus complexe, nécessite matrice complète N×M
   * À implémenter si nécessaire pour thèse
   */
  static async calculateFleissKappa(
    annotators: AnnotatorIdentifier[],
    variable: "X" | "Y" = "Y"
  ): Promise<{ data: number | null; error: string | null }> {
    // TODO: Implémenter Fleiss' Kappa si requis
    return {
      data: null,
      error: "Fleiss' Kappa not yet implemented. Use Kappa matrix instead."
    };
  }
}
