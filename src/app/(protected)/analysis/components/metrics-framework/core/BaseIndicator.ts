// src/app/(protected)/analysis/components/metrics-framework/core/BaseIndicator.ts

import {
  BaseIndicatorConfig,
  AlgorithmConfig,
  IndicatorResult,
  TurnTaggedData,
  AnnotationData,
  BenchmarkResult,
  MetricsDomain,
  ImplementationStatus,
} from "./types/base";

/**
 * Interface pour les stratégies d'algorithmes
 */
export interface AlgorithmStrategy {
  getId(): string;
  getName(): string;
  getType(): string;
  calculate(data: TurnTaggedData[]): Promise<IndicatorResult[]>;
  getConfiguration(): AlgorithmConfig;
  validateInput(data: TurnTaggedData[]): boolean;
}

/**
 * Classe de base abstraite pour tous les indicateurs du framework
 *
 * Chaque indicateur (cognitive, LI, AC) hérite de cette classe
 * et implémente ses algorithmes spécifiques
 */
export abstract class BaseIndicator {
  protected config: BaseIndicatorConfig;
  protected algorithms: Map<string, AlgorithmStrategy> = new Map();
  protected activeAlgorithm: AlgorithmStrategy | null = null;
  protected cache: Map<string, IndicatorResult[]> = new Map();

  constructor(config: BaseIndicatorConfig) {
    this.config = config;
    this.initializeAlgorithms();
  }

  // ================ METHODES PUBLIQUES ================

  /**
   * Calcule les métriques avec l'algorithme actif
   */
  async calculate(data: TurnTaggedData[]): Promise<IndicatorResult[]> {
    const startTime = performance.now();

    // Validation des données d'entrée
    if (!this.validateData(data)) {
      throw new Error(`Données invalides pour l'indicateur ${this.getId()}`);
    }

    // Vérification du cache
    const cacheKey = this.generateCacheKey(data);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Calcul avec l'algorithme actif
    if (!this.activeAlgorithm) {
      throw new Error(`Aucun algorithme actif pour ${this.getId()}`);
    }

    try {
      const results = await this.activeAlgorithm.calculate(data);

      // Ajout des métadonnées de performance
      const enrichedResults = results.map((result) => ({
        ...result,
        processing_time_ms: performance.now() - startTime,
        algorithm_used: this.activeAlgorithm!.getId(),
      }));

      // Mise en cache
      this.cache.set(cacheKey, enrichedResults);

      return enrichedResults;
    } catch (error) {
      console.error(`Erreur calcul ${this.getId()}:`, error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Échec du calcul pour ${this.getId()}: ${errorMsg}`);
    }
  }

  /**
   * Change l'algorithme actif
   */
  switchAlgorithm(algorithmId: string): boolean {
    const algorithm = this.algorithms.get(algorithmId);
    if (!algorithm) {
      console.warn(`Algorithme ${algorithmId} non trouvé pour ${this.getId()}`);
      return false;
    }

    this.activeAlgorithm = algorithm;
    this.clearCache(); // Invalider le cache
    return true;
  }

  /**
   * Retourne la liste des algorithmes disponibles
   */
  getAvailableAlgorithms(): AlgorithmConfig[] {
    return Array.from(this.algorithms.values()).map((alg) =>
      alg.getConfiguration()
    );
  }

  /**
   * Retourne l'algorithme actuellement actif
   */
  getActiveAlgorithm(): AlgorithmStrategy | null {
    return this.activeAlgorithm;
  }

  /**
   * Benchmark de tous les algorithmes sur des données annotées
   */
  async benchmarkAlgorithms(
    testData: TurnTaggedData[],
    annotations: AnnotationData[]
  ): Promise<Record<string, BenchmarkResult>> {
    const results: Record<string, BenchmarkResult> = {};
    const originalAlgorithm = this.activeAlgorithm?.getId();

    for (const [algorithmId, algorithm] of this.algorithms) {
      const startTime = performance.now();

      try {
        // Changer vers cet algorithme
        this.switchAlgorithm(algorithmId);

        // Calculer les résultats
        const predictions = await this.calculate(testData);

        // Comparer avec les annotations
        const benchmark = this.calculateBenchmarkMetrics(
          predictions,
          annotations,
          testData.length,
          performance.now() - startTime
        );

        results[algorithmId] = {
          ...benchmark,
          algorithm_id: algorithmId,
          test_data_size: testData.length,
        };
      } catch (error) {
        console.error(`Erreur benchmark ${algorithmId}:`, error);
        results[algorithmId] = {
          algorithm_id: algorithmId,
          accuracy: 0,
          precision: 0,
          recall: 0,
          f1_score: 0,
          processing_time_ms: 0,
          test_data_size: testData.length,
        };
      }
    }

    // Restaurer l'algorithme original
    if (originalAlgorithm) {
      this.switchAlgorithm(originalAlgorithm);
    }

    return results;
  }

  // ================ GETTERS DE CONFIGURATION ================

  getId(): string {
    return this.config.id;
  }

  getName(): string {
    return this.config.name;
  }

  getDomain(): MetricsDomain {
    return this.config.domain;
  }

  getCategory(): string {
    return this.config.category;
  }

  getImplementationStatus(): ImplementationStatus {
    return this.config.implementationStatus;
  }

  getDescription(): string {
    return this.config.description;
  }

  getTheoreticalFoundation(): string {
    return this.config.theoreticalFoundation || "";
  }

  // ================ GESTION DU CACHE ================

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // ================ METHODES ABSTRAITES (À IMPLÉMENTER) ================

  /**
   * Initialise les algorithmes spécifiques à cet indicateur
   * Doit être implémentée par chaque indicateur concret
   */
  protected abstract initializeAlgorithms(): void;

  /**
   * Valide que les données sont compatibles avec cet indicateur
   * Peut être surchargée pour des validations spécifiques
   */
  protected validateData(data: TurnTaggedData[]): boolean {
    if (!data || data.length === 0) {
      return false;
    }

    // Validation des colonnes requises
    for (const requirement of this.config.dataRequirements) {
      for (const item of data) {
        for (const column of requirement.columns) {
          if (!(column in item) && !requirement.optional) {
            console.warn(`Colonne manquante: ${column} pour ${this.getId()}`);
            return false;
          }
        }
      }
    }

    return true;
  }

  // ================ METHODES PRIVEES ================

  /**
   * Génère une clé de cache basée sur les données
   */
  private generateCacheKey(data: TurnTaggedData[]): string {
    // Hash simple basé sur la taille et quelques échantillons
    const sample = data
      .slice(0, 5)
      .map((d) => `${d.id}-${d.tag}`)
      .join(",");
    return `${this.getId()}-${this.activeAlgorithm?.getId()}-${
      data.length
    }-${sample}`;
  }

  /**
   * Calcule les métriques de benchmark (accuracy, precision, recall, F1)
   */
  private calculateBenchmarkMetrics(
    predictions: IndicatorResult[],
    annotations: AnnotationData[],
    dataSize: number,
    processingTime: number
  ): Omit<BenchmarkResult, "algorithm_id" | "test_data_size"> {
    // Créer un map des annotations par turn_id
    const annotationsMap = new Map<number, string>();
    annotations
      .filter((ann) => ann.indicator_id === this.getId())
      .forEach((ann) => annotationsMap.set(ann.turn_id, ann.human_label));

    if (annotationsMap.size === 0) {
      console.warn(`Aucune annotation trouvée pour ${this.getId()}`);
      return {
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1_score: 0,
        processing_time_ms: processingTime,
      };
    }

    // Comparer prédictions vs annotations
    let correctPredictions = 0;
    let totalPredictions = 0;

    // Pour les métriques par classe (si applicable)
    const truePositives = new Map<string, number>();
    const falsePositives = new Map<string, number>();
    const falseNegatives = new Map<string, number>();

    predictions.forEach((prediction, index) => {
      // Nous assumons que l'index correspond au turn_id ou qu'il y a un mapping
      // Ceci devrait être adapté selon la structure réelle des données
      const turnId = index + 1; // Simplification pour l'exemple
      const annotation = annotationsMap.get(turnId);

      if (annotation) {
        totalPredictions++;
        const predictionValue = String(prediction.value);

        if (predictionValue === annotation) {
          correctPredictions++;
        }

        // Comptage pour precision/recall par classe
        if (!truePositives.has(annotation)) {
          truePositives.set(annotation, 0);
          falsePositives.set(annotation, 0);
          falseNegatives.set(annotation, 0);
        }
        if (!truePositives.has(predictionValue)) {
          truePositives.set(predictionValue, 0);
          falsePositives.set(predictionValue, 0);
          falseNegatives.set(predictionValue, 0);
        }

        if (predictionValue === annotation) {
          truePositives.set(annotation, truePositives.get(annotation)! + 1);
        } else {
          falsePositives.set(
            predictionValue,
            falsePositives.get(predictionValue)! + 1
          );
          falseNegatives.set(annotation, falseNegatives.get(annotation)! + 1);
        }
      }
    });

    const accuracy =
      totalPredictions > 0 ? correctPredictions / totalPredictions : 0;

    // Calcul de la precision et recall macro (moyenne des classes)
    let totalPrecision = 0;
    let totalRecall = 0;
    let classCount = 0;

    for (const className of truePositives.keys()) {
      const tp = truePositives.get(className) || 0;
      const fp = falsePositives.get(className) || 0;
      const fn = falseNegatives.get(className) || 0;

      const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0;

      totalPrecision += precision;
      totalRecall += recall;
      classCount++;
    }

    const macroPrecision = classCount > 0 ? totalPrecision / classCount : 0;
    const macroRecall = classCount > 0 ? totalRecall / classCount : 0;
    const f1Score =
      macroPrecision + macroRecall > 0
        ? (2 * (macroPrecision * macroRecall)) / (macroPrecision + macroRecall)
        : 0;

    return {
      accuracy,
      precision: macroPrecision,
      recall: macroRecall,
      f1_score: f1Score,
      processing_time_ms: processingTime,
    };
  }
}

/**
 * Factory pour créer des algorithmes standards
 */
export abstract class BaseAlgorithmStrategy implements AlgorithmStrategy {
  protected config: AlgorithmConfig;

  constructor(config: AlgorithmConfig) {
    this.config = config;
  }

  getId(): string {
    return this.config.id;
  }

  getName(): string {
    return this.config.name;
  }

  getType(): string {
    return this.config.type;
  }

  getConfiguration(): AlgorithmConfig {
    return { ...this.config };
  }

  validateInput(data: TurnTaggedData[]): boolean {
    return data && data.length > 0;
  }

  // Méthode abstraite à implémenter par chaque algorithme concret
  abstract calculate(data: TurnTaggedData[]): Promise<IndicatorResult[]>;
}

export default BaseIndicator;
