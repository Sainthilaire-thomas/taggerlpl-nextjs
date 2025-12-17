// ============================================================================
// HypothesisRobustnessService - Test Robustesse Hypothèses Multi-Annotateurs
// ============================================================================
// Description : Teste si H1/H2 se maintiennent avec différents annotateurs
// - H1 : Corrélation X↔Y robuste entre annotateurs ?
// - H2 : Médiation M1/M2/M3 robuste entre annotateurs ?
// - Génération rapports pour thèse
// ============================================================================

import { AnnotationService } from "./AnnotationService";
import { InterAnnotatorAgreementService } from "./InterAnnotatorAgreementService";
import { getSupabase } from "@/lib/supabaseClient";
import type {
  AnnotatorIdentifier,
  H1TestResult,
  H1RobustnessReport,
  H2TestResult,
  H2RobustnessReport,
  RobustnessTable,
  RobustnessTestConfig
} from "@/types/algorithm-lab/Level0Types";

export class HypothesisRobustnessService {
  private static supabase = getSupabase();

  // ==========================================================================
  // TEST ROBUSTESSE H1 - Corrélation X↔Y
  // ==========================================================================

  /**
   * Teste H1 (corrélation stratégie↔réaction) pour un annotateur
   * 
   * H1 : Il existe une corrélation significative entre
   *      stratégies conseiller (X) et réactions client (Y)
   * 
   * Méthode : Pearson r sur tags numériques convertis
   */
  static async testH1ForAnnotator(
    annotator: AnnotatorIdentifier
  ): Promise<{ data: H1TestResult | null; error: string | null }> {
    try {
      // 1. Récupérer annotations avec X ET Y
      const { data: annotations } = await AnnotationService.searchAnnotations({
        annotator_types: [annotator.annotator_type],
        annotator_ids: [annotator.annotator_id],
        has_strategy: true,
        has_reaction: true,
        limit: 10000
      });

      if (!annotations || annotations.length === 0) {
        return {
          data: null,
          error: "No annotations with both X and Y found"
        };
      }

      // 2. Convertir tags en valeurs numériques pour corrélation
      // Stratégies X : ENGAGEMENT=1, EXPLICATION=2, OUVERTURE=3
      // Réactions Y : POSITIF=1, NEUTRE=2, NEGATIF=3
      const tagToNum = (tag: string, type: "X" | "Y"): number | null => {
        if (type === "X") {
          if (tag === "ENGAGEMENT") return 1;
          if (tag === "EXPLICATION") return 2;
          if (tag === "OUVERTURE") return 3;
        } else {
          if (tag.includes("POSITIF")) return 1;
          if (tag.includes("NEUTRE")) return 2;
          if (tag.includes("NEGATIF")) return 3;
        }
        return null;
      };

      const pairs: Array<{ x: number; y: number }> = annotations
        .map((a) => {
          const x = tagToNum(a.strategy_tag || "", "X");
          const y = tagToNum(a.reaction_tag || "", "Y");
          return x !== null && y !== null ? { x, y } : null;
        })
        .filter((p): p is { x: number; y: number } => p !== null);

      if (pairs.length < 30) {
        return {
          data: null,
          error: "Insufficient data for correlation (min 30 pairs required)"
        };
      }

      // 3. Calculer corrélation Pearson
      const n = pairs.length;
      const meanX = pairs.reduce((sum, p) => sum + p.x, 0) / n;
      const meanY = pairs.reduce((sum, p) => sum + p.y, 0) / n;

      const numerator = pairs.reduce(
        (sum, p) => sum + (p.x - meanX) * (p.y - meanY),
        0
      );

      const denomX = Math.sqrt(
        pairs.reduce((sum, p) => sum + Math.pow(p.x - meanX, 2), 0)
      );

      const denomY = Math.sqrt(
        pairs.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0)
      );

      const r = numerator / (denomX * denomY);

      // 4. Calculer p-value (approximation via t-test)
      const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
      // Approximation p-value (bilatéral)
      const pValue = 2 * (1 - this.tDistCDF(Math.abs(t), n - 2));

      const significant = pValue < 0.05;

      return {
        data: {
          annotator,
          correlation_X_Y: r,
          p_value: pValue,
          sample_size: n,
          significant
        },
        error: null
      };
    } catch (err) {
      console.error("[HypothesisRobustness] H1 test error:", err);
      return { data: null, error: "Unexpected error testing H1" };
    }
  }

  /**
   * Teste robustesse H1 sur N annotateurs
   * Génère rapport : tous les annotateurs confirment-ils H1 ?
   */
  static async testH1Robustness(
    annotators: AnnotatorIdentifier[],
    minKappaThreshold: number = 0.6
  ): Promise<{ data: H1RobustnessReport | null; error: string | null }> {
    try {
      if (annotators.length < 2) {
        return {
          data: null,
          error: "At least 2 annotators required for robustness test"
        };
      }

      // 1. Tester H1 pour chaque annotateur
      const results: H1TestResult[] = [];

      for (const annotator of annotators) {
        const testResult = await this.testH1ForAnnotator(annotator);

        if (testResult.error || !testResult.data) {
          console.warn(
            `[HypothesisRobustness] H1 test failed for ${annotator.annotator_id}: ${testResult.error}`
          );
          continue;
        }

        results.push(testResult.data);
      }

      if (results.length === 0) {
        return { data: null, error: "No successful H1 tests" };
      }

      // 2. Calculer statistiques globales
      const avgCorrelation =
        results.reduce((sum, r) => sum + r.correlation_X_Y, 0) / results.length;

      const minCorrelation = Math.min(...results.map((r) => r.correlation_X_Y));
      const maxCorrelation = Math.max(...results.map((r) => r.correlation_X_Y));

      const significantCount = results.filter((r) => r.significant).length;
      const agreementOnH1 = (significantCount / results.length) * 100;

      // 3. Vérifier Kappa inter-annotateurs (accord sur tags)
      const kappaMatrix = await InterAnnotatorAgreementService.calculateKappaMatrix(
        annotators,
        "Y" // H1 concerne surtout Y
      );

      const avgKappa = kappaMatrix.data?.avg_kappa || 0;
      const kappaOK = avgKappa >= minKappaThreshold;

      // 4. Déterminer robustesse
      // Robuste si : tous annotateurs confirment H1 ET Kappa suffisant
      const robust = significantCount === results.length && kappaOK;

      return {
        data: {
          annotators_tested: results.length,
          results,
          avg_correlation: avgCorrelation,
          min_correlation: minCorrelation,
          max_correlation: maxCorrelation,
          robust,
          agreement_on_H1: agreementOnH1
        },
        error: null
      };
    } catch (err) {
      console.error("[HypothesisRobustness] H1 robustness error:", err);
      return { data: null, error: "Unexpected error testing H1 robustness" };
    }
  }

  // ==========================================================================
  // TEST ROBUSTESSE H2 - Médiation M1/M2/M3
  // ==========================================================================

  /**
   * Teste H2 (médiation) pour un annotateur
   * 
   * H2 : La relation X→Y est médiée par M1 (verbes d'action),
   *      M2 (alignement linguistique), M3 (charge cognitive)
   * 
   * Méthode : Baron-Kenny + Sobel test sur données h2_analysis_pairs
   * 
   * NOTE : Nécessite calcul M1/M2/M3 pour annotations de cet annotateur
   * À implémenter en coordination avec Level 1/2
   */
  static async testH2ForAnnotator(
    annotator: AnnotatorIdentifier
  ): Promise<{ data: H2TestResult | null; error: string | null }> {
    try {
      // TODO: Implémenter calcul médiation
      // Étapes :
      // 1. Récupérer h2_analysis_pairs avec tags de cet annotateur
      // 2. Calculer M1, M2, M3 pour ces paires
      // 3. Régressions Baron-Kenny :
      //    - Path c: X → Y (effet total)
      //    - Path a: X → M (effet X sur médiateur)
      //    - Path b: M → Y (effet médiateur sur Y, contrôlant X)
      //    - Path c': X → Y (effet direct, contrôlant M)
      // 4. Sobel test pour significativité médiation
      // 5. Calculer effet indirect = a * b

      return {
        data: null,
        error: "H2 testing not yet implemented. Requires Level 1/2 integration."
      };
    } catch (err) {
      console.error("[HypothesisRobustness] H2 test error:", err);
      return { data: null, error: "Unexpected error testing H2" };
    }
  }

  /**
   * Teste robustesse H2 sur N annotateurs
   * 
   * NOTE : À implémenter quand Level 2 sera intégré
   */
  static async testH2Robustness(
    annotators: AnnotatorIdentifier[]
  ): Promise<{ data: H2RobustnessReport | null; error: string | null }> {
    return {
      data: null,
      error: "H2 robustness testing not yet implemented. Requires Level 2 integration."
    };
  }

  // ==========================================================================
  // GÉNÉRATION RAPPORTS THÈSE
  // ==========================================================================

  /**
   * Génère table de robustesse formatée pour thèse
   * 
   * Exemple :
   * 
   * | Métrique          | thomas_initial | CharteY_A | CharteY_B | CharteY_B_enrichie |
   * |-------------------|----------------|-----------|-----------|---------------------|
   * | Correlation r     | 0.72           | 0.68      | 0.71      | 0.73                |
   * | p-value           | <0.001         | <0.001    | <0.001    | <0.001              |
   * | Sample size       | 901            | 901       | 901       | 901                 |
   * | Kappa (vs thomas) | 1.00           | 0.85      | 0.82      | 0.88                |
   * | H1 confirmed      | ✓              | ✓         | ✓         | ✓                   |
   */
  static async generateRobustnessTable(
    hypothesis: "H1" | "H2",
    annotators: AnnotatorIdentifier[]
  ): Promise<{ data: RobustnessTable | null; error: string | null }> {
    try {
      if (hypothesis === "H2") {
        return {
          data: null,
          error: "H2 robustness table not yet implemented"
        };
      }

      // Tester H1 robustesse
      const robustnessResult = await this.testH1Robustness(annotators);

      if (robustnessResult.error || !robustnessResult.data) {
        return { data: null, error: robustnessResult.error };
      }

      const { results, robust, agreement_on_H1 } = robustnessResult.data;

      // Calculer Kappa matrix
      const kappaMatrixResult =
        await InterAnnotatorAgreementService.calculateKappaMatrix(
          annotators,
          "Y"
        );

      const kappaMatrix = kappaMatrixResult.data?.matrix || [];

      // Construire lignes du tableau
      const rows = [
        {
          metric: "Correlation r",
          values: results.map((r) => r.correlation_X_Y.toFixed(3))
        },
        {
          metric: "p-value",
          values: results.map((r) =>
            r.p_value < 0.001 ? "<0.001" : r.p_value.toFixed(3)
          )
        },
        {
          metric: "Sample size",
          values: results.map((r) => r.sample_size.toString())
        },
        {
          metric: "H1 confirmed",
          values: results.map((r) => (r.significant ? "✓" : "✗"))
        }
      ];

      // Ajouter Kappa vs premier annotateur (baseline)
      if (kappaMatrix.length > 0) {
        rows.push({
          metric: `Kappa (vs ${annotators[0].annotator_id})`,
          values: annotators.map((_, i) => kappaMatrix[0][i].toFixed(3))
        });
      }

      return {
        data: {
          hypothesis: "H1",
          columns: annotators.map((a) => a.annotator_id),
          rows,
          summary: {
            robust,
            agreement_percentage: agreement_on_H1,
            notes: [
              `${results.length} annotateurs testés`,
              `Accord moyen : ${agreement_on_H1.toFixed(1)}%`,
              robust
                ? "✅ H1 robuste : tous annotateurs confirment"
                : "⚠️ H1 non robuste : désaccords détectés"
            ]
          }
        },
        error: null
      };
    } catch (err) {
      console.error("[HypothesisRobustness] Table generation error:", err);
      return { data: null, error: "Unexpected error generating table" };
    }
  }

  // ==========================================================================
  // UTILITAIRES STATISTIQUES
  // ==========================================================================

  /**
   * Approximation CDF de distribution t de Student
   * Utilisé pour calculer p-values
   */
  private static tDistCDF(t: number, df: number): number {
    // Approximation simple pour df > 30
    if (df > 30) {
      // Utiliser approximation normale
      return this.normalCDF(t);
    }

    // Pour df <= 30, approximation de Hill (1970)
    const x = df / (df + t * t);
    const a = df / 2;
    const b = 0.5;

    // Incomplete beta function approximation
    // Simplifié pour l'usage courant
    return 1 - 0.5 * Math.pow(x, a);
  }

  /**
   * CDF de distribution normale standard
   */
  private static normalCDF(z: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    const prob =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return z > 0 ? 1 - prob : prob;
  }
}
