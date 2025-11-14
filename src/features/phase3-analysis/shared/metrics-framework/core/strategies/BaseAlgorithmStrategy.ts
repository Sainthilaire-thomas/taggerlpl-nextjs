// src/app/(protected)/analysis/components/metrics-framework/core/strategies/BaseAlgorithmStrategy.ts

import {
  AlgorithmConfig,
  IndicatorResult,
  TurnTaggedData,
} from "../types/base";

/**
 * Classe de base abstraite pour tous les algorithmes du framework
 *
 * Fournit une interface standardisée et des méthodes utilitaires communes
 */
export abstract class BaseAlgorithmStrategy {
  protected config: AlgorithmConfig;

  constructor(config: AlgorithmConfig) {
    this.config = config;
  }

  /**
   * Méthode abstraite principale : calcul des métriques
   */
  abstract calculate(data: TurnTaggedData[]): Promise<IndicatorResult[]>;

  /**
   * Accesseurs pour les propriétés de l'algorithme
   */
  getId(): string {
    return this.config.id;
  }

  getName(): string {
    return this.config.name;
  }

  getType(): string {
    return this.config.type;
  }

  getVersion(): string {
    return this.config.version;
  }

  getDescription(): string {
    return this.config.description;
  }

  requiresTraining(): boolean {
    return this.config.requiresTraining;
  }

  getSupportedDomains(): string[] {
    return this.config.supportedDomains;
  }

  /**
   * Retourne la configuration de l'algorithme
   */
  getConfiguration(): AlgorithmConfig {
    return { ...this.config };
  }

  /**
   * Validation des données d'entrée
   */
  protected validateInput(data: TurnTaggedData[]): void {
    if (!Array.isArray(data)) {
      throw new Error("Input data must be an array");
    }

    if (data.length === 0) {
      throw new Error("Input data cannot be empty");
    }

    // Validation des champs requis
    const requiredFields = [
      "id",
      "call_id",
      "start_time",
      "end_time",
      "verbatim",
    ];

    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const turn = data[i];

      for (const field of requiredFields) {
        if (
          !(field in turn) ||
          (turn as any)[field] === null ||
          (turn as any)[field] === undefined
        ) {
          throw new Error(
            `Missing required field '${field}' in turn at index ${i}`
          );
        }
      }

      // Validation cohérence temporelle
      if (turn.end_time <= turn.start_time) {
        throw new Error(
          `Invalid time range in turn at index ${i}: end_time must be > start_time`
        );
      }
    }
  }

  /**
   * Préprocessing standard des données
   */
  protected preprocessData(data: TurnTaggedData[]): TurnTaggedData[] {
    return data
      .filter((turn) => {
        // Filtrer les tours invalides
        return (
          turn.verbatim &&
          turn.verbatim.trim().length > 0 &&
          turn.end_time > turn.start_time &&
          turn.speaker
        );
      })
      .map((turn) => ({
        ...turn,
        // Normalisation du verbatim
        verbatim: turn.verbatim?.trim() || "",
        next_turn_verbatim: turn.next_turn_verbatim?.trim() || "",
        // Normalisation du speaker
        speaker: turn.speaker?.toLowerCase().trim() || "unknown",
      }));
  }

  /**
   * Calcul de la confiance basée sur la qualité des données
   */
  protected calculateBaseConfidence(turn: TurnTaggedData): number {
    let confidence = 0.5; // Base

    const verbatim = turn.verbatim || "";
    const wordCount = verbatim.split(/\s+/).filter((w) => w.length > 0).length;

    // Facteurs d'augmentation de confiance
    if (wordCount >= 3) confidence += 0.1; // Verbatim suffisant
    if (wordCount >= 10) confidence += 0.1; // Verbatim riche
    if (turn.next_turn_verbatim?.trim()) confidence += 0.1; // Contexte disponible
    if (turn.end_time - turn.start_time > 0.5) confidence += 0.1; // Durée raisonnable
    if (turn.speaker && turn.speaker !== "unknown") confidence += 0.1; // Speaker identifié

    // Facteurs de réduction de confiance
    if (wordCount < 2) confidence -= 0.2; // Verbatim trop court
    if (turn.end_time - turn.start_time < 0.1) confidence -= 0.1; // Durée trop courte
    if (!turn.next_turn_verbatim?.trim()) confidence -= 0.05; // Pas de contexte

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  /**
   * Génération d'un résultat d'erreur standardisé
   */
  protected createErrorResult(
    error: Error | string,
    defaultValue: string | number = 0
  ): IndicatorResult {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      value: defaultValue,
      confidence: 0,
      explanation: `Erreur algorithme ${this.getId()}: ${errorMessage}`,
      algorithm_used: this.getId(),
      error: true,
      processing_time_ms: 0,
    };
  }

  /**
   * Mesure du temps d'exécution
   */
  protected async measureExecutionTime<T>(
    operation: () => Promise<T> | T
  ): Promise<{ result: T; executionTime: number }> {
    const startTime = performance.now();

    try {
      const result = await operation();
      const executionTime = performance.now() - startTime;

      return { result, executionTime };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      throw new Error(
        `Operation failed after ${executionTime.toFixed(2)}ms: ${error}`
      );
    }
  }

  /**
   * Logging standardisé pour debugging
   */
  protected log(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    data?: any
  ): void {
    const logMessage = `[${this.getId()}] ${message}`;

    switch (level) {
      case "debug":
        console.debug(logMessage, data);
        break;
      case "info":
        console.info(logMessage, data);
        break;
      case "warn":
        console.warn(logMessage, data);
        break;
      case "error":
        console.error(logMessage, data);
        break;
    }
  }

  /**
   * Méthode utilitaire pour normaliser les scores
   */
  protected normalizeScore(
    score: number,
    min: number = 0,
    max: number = 1
  ): number {
    return Math.max(min, Math.min(max, score));
  }

  /**
   * Méthode utilitaire pour calculer des statistiques descriptives
   */
  protected calculateStats(values: number[]): {
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
  } {
    if (values.length === 0) {
      return { mean: 0, median: 0, std: 0, min: 0, max: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    const std = Math.sqrt(variance);

    return {
      mean,
      median,
      std,
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };
  }
}
