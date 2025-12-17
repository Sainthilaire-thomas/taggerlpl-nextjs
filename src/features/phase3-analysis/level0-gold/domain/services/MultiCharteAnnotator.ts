// ============================================================================
// MultiCharteAnnotator - Orchestration des tests multi-chartes
// ============================================================================

import {
  OpenAIAnnotationRequest,
  OpenAIAnnotationResult,
  CharteDefinition,
  CharteTestResult,
  AnnotationPair,
  DisagreementCase
} from "@/types/algorithm-lab/Level0Types";
import { OpenAIAnnotatorService } from "./OpenAIAnnotatorService";
import { KappaCalculationService } from "./KappaCalculationService";
import { CharteRegistry } from "./CharteRegistry";
import { AnnotationService } from "./AnnotationService";

export class MultiCharteAnnotator {
  /**
   * Teste toutes les chartes pour une variable donnée
   */
  static async testAllChartesForVariable(
    variable: "X" | "Y",
    analysisPairs: Array<{
      pair_id: number;
      conseiller_verbatim: string;
      client_verbatim: string;
      strategy_tag: string;
      reaction_tag: string;
      prev1_verbatim?: string | null;
      next1_verbatim?: string | null;
    }>,
    onCharteProgress?: (charteName: string, current: number, total: number) => void,
    onCharteComplete?: (result: CharteTestResult) => void
  ): Promise<CharteTestResult[]> {
    const chartes = await CharteRegistry.getChartesForVariable(variable);
    const results: CharteTestResult[] = [];

    for (const charte of chartes) {
      console.log(`Testing charte: ${charte.charte_name} for variable ${variable}`);
      
      const result = await this.testSingleCharte(
        charte,
        analysisPairs,
        (current, total) => {
          if (onCharteProgress) {
            onCharteProgress(charte.charte_name, current, total);
          }
        }
      );

      results.push(result);

      if (onCharteComplete) {
        onCharteComplete(result);
      }
    }

    return results;
  }

  /**
   * Teste une seule charte sur tout le corpus
   */
  static async testSingleCharte(
    charte: CharteDefinition,
    analysisPairs: Array<{
      pair_id: number;
      conseiller_verbatim: string;
      client_verbatim: string;
      strategy_tag: string;
      reaction_tag: string;
      prev1_verbatim?: string | null;
      next1_verbatim?: string | null;
    }>,
    onProgress?: (current: number, total: number) => void
  ): Promise<CharteTestResult> {
    const startTime = Date.now();

    // Préparer les requêtes
    const requests: OpenAIAnnotationRequest[] = analysisPairs.map(pair => ({
      pairId: pair.pair_id,
      conseiller_verbatim: pair.conseiller_verbatim,
      client_verbatim: pair.client_verbatim,
      prev1_verbatim: pair.prev1_verbatim || undefined,
      next1_verbatim: pair.next1_verbatim || undefined
    }));

    // Annoter via OpenAI
    const annotations = await OpenAIAnnotatorService.annotateBatch(
      requests,
      charte,
      onProgress
    );

    const executionTime = Date.now() - startTime;
    // ✨ SPRINT 2 : Sauvegarder annotations LLM dans table unifiée
    const testId = crypto.randomUUID();
    try {
      const annotationsToSave = annotations.map(ann => ({
        pair_id: ann.pairId,
        annotator_type: 'llm_openai' as const,
        annotator_id: charte.charte_id,
        strategy_tag: charte.variable === "X" ? ann.x_predicted || null : null,
        reaction_tag: charte.variable === "Y" ? ann.y_predicted || null : null,
        confidence: charte.variable === "X" 
          ? (ann.x_confidence || null) 
          : (ann.y_confidence || null),
        reasoning: charte.variable === "X"
          ? (ann.x_reasoning || null)
          : (ann.y_reasoning || null),
        annotation_context: {
          model: "gpt-4o-mini",
          temperature: 0.0,
          charte_name: charte.charte_name
        },
        test_id: null
      }));

      await AnnotationService.saveBatchAnnotations(annotationsToSave);
      console.log(`✅ [MultiCharteAnnotator] ${annotations.length} annotations sauvegardées pour ${charte.charte_id}`);
    } catch (error) {
      console.error(`❌ [MultiCharteAnnotator] Erreur sauvegarde annotations:`, error);
      // Ne pas bloquer le test si la sauvegarde échoue
    }

    // Construire les paires pour Kappa
    const annotationPairs: AnnotationPair[] = analysisPairs.map((pair, index) => {
      const annotation = annotations[index];
      
      const manualTag = charte.variable === "X" 
        ? pair.strategy_tag 
        : pair.reaction_tag;
      
      const llmTag = charte.variable === "X"
        ? annotation.x_predicted || "UNKNOWN"
        : annotation.y_predicted || "UNKNOWN";

      return {
        manual: manualTag,
        llm: llmTag
      };
    });

    // Calculer les métriques
    const kappaResult = KappaCalculationService.calculateKappa(annotationPairs);
    const accuracy = KappaCalculationService.calculateAccuracy(annotationPairs);
    const confusionMatrix = KappaCalculationService.buildConfusionMatrix(annotationPairs);
    const classificationMetrics = KappaCalculationService.calculateClassificationMetrics(annotationPairs);

    // Identifier les désaccords
    const pairIds = analysisPairs.map(p => p.pair_id);
    const verbatims = charte.variable === "X"
      ? analysisPairs.map(p => p.conseiller_verbatim)
      : analysisPairs.map(p => p.client_verbatim);
    
    const llmReasonings = (charte.variable === "X"
      ? annotations.map(a => a.x_reasoning)
      : annotations.map(a => a.y_reasoning)
    ).filter((r): r is string => r !== undefined);
    
    const llmConfidences = (charte.variable === "X"
      ? annotations.map(a => a.x_confidence)
      : annotations.map(a => a.y_confidence)
    ).filter((c): c is number => c !== undefined);

    const disagreements = KappaCalculationService.findDisagreements(
      annotationPairs,
      pairIds,
      verbatims,
      llmReasonings,
      llmConfidences
    );

    // Construire le résultat
    const testResult: CharteTestResult = {
      test_id: testId,
      charte_id: charte.charte_id,
      charte_name: charte.charte_name,
      variable: charte.variable,
      kappa: kappaResult.kappa,
      accuracy,
      total_pairs: analysisPairs.length,
      disagreements_count: disagreements.length,
      disagreements,
      metrics: {
        precision: classificationMetrics.precision,
        recall: classificationMetrics.recall,
        f1Score: classificationMetrics.f1Score,
        confusionMatrix
      },
      execution_time_ms: executionTime,
      openai_model: "gpt-4o",
      tested_at: new Date().toISOString()
    };

    return testResult;
  }

  /**
   * Sélectionne la meilleure charte selon le Kappa
   */
  static selectBestCharte(results: CharteTestResult[]): CharteTestResult {
    if (results.length === 0) {
      throw new Error("Aucun résultat de test disponible");
    }

    return results.reduce((best, current) => 
      current.kappa > best.kappa ? current : best
    );
  }

  /**
   * Compare deux chartes
   */
  static compareChartes(
    result1: CharteTestResult,
    result2: CharteTestResult
  ): {
    kappaDiff: number;
    accuracyDiff: number;
    disagreementsDiff: number;
    betterCharte: string;
  } {
    const kappaDiff = result1.kappa - result2.kappa;
    const accuracyDiff = result1.accuracy - result2.accuracy;
    const disagreementsDiff = result1.disagreements_count - result2.disagreements_count;

    const betterCharte = result1.kappa > result2.kappa 
      ? result1.charte_name 
      : result2.charte_name;

    return {
      kappaDiff,
      accuracyDiff,
      disagreementsDiff,
      betterCharte
    };
  }

  /**
   * Génère un rapport comparatif pour la thèse
   */
  static generateComparisonReport(results: CharteTestResult[]): {
    summary: string;
    table: Array<{
      charte: string;
      kappa: number;
      accuracy: number;
      disagreements: number;
      interpretation: string;
    }>;
    bestCharte: CharteTestResult;
  } {
    const bestCharte = this.selectBestCharte(results);

    const table = results.map(result => ({
      charte: result.charte_name,
      kappa: Math.round(result.kappa * 1000) / 1000,
      accuracy: Math.round(result.accuracy * 10000) / 100,
      disagreements: result.disagreements_count,
      interpretation: this.interpretKappa(result.kappa)
    })).sort((a, b) => b.kappa - a.kappa);

    const summary = `Tests de ${results.length} chartes sur ${results[0].total_pairs} paires. ` +
      `Meilleure charte : ${bestCharte.charte_name} (κ=${bestCharte.kappa.toFixed(3)}). ` +
      `Nombre de désaccords : ${bestCharte.disagreements_count}/${bestCharte.total_pairs} ` +
      `(${((bestCharte.disagreements_count / bestCharte.total_pairs) * 100).toFixed(1)}%).`;

    return {
      summary,
      table,
      bestCharte
    };
  }

  /**
   * Interprète le Kappa
   */
  private static interpretKappa(kappa: number): string {
    if (kappa < 0) return "Inférieur au hasard";
    if (kappa < 0.2) return "Accord faible";
    if (kappa < 0.4) return "Accord acceptable";
    if (kappa < 0.6) return "Accord modéré";
    if (kappa < 0.8) return "Accord substantiel";
    return "Accord quasi-parfait";
  }

  /**
   * Estime le coût et la durée totale pour tester toutes les chartes
   */
  static async estimateFullTest(
    variable: "X" | "Y",
    pairCount: number
  ): Promise<{
    chartesCount: number;
    totalCalls: number;
    estimatedCostUSD: number;
    estimatedDurationMinutes: number;
  }> {
    const chartes = await CharteRegistry.getChartesForVariable(variable);
    const singleEstimate = OpenAIAnnotatorService.estimateCost(pairCount);

    return {
      chartesCount: chartes.length,
      totalCalls: singleEstimate.estimatedCalls * chartes.length,
      estimatedCostUSD: singleEstimate.estimatedCostUSD * chartes.length,
      estimatedDurationMinutes: singleEstimate.estimatedDurationMinutes * chartes.length
    };
  }
}
