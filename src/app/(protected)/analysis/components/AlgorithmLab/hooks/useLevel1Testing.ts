// hooks/useLevel1Testing.ts  — VERSION DÉFINITIVE (réel + multi-algos)

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTaggingData } from "@/context/TaggingDataContext";
import { ClassifierRegistry } from "../algorithms/level1/shared/ClassifierRegistry";
import {
  BaseClassifier,
  ClassificationResult,
} from "../algorithms/level1/shared/BaseClassifier";
import { initializeClassifiers } from "../algorithms/level1/shared/initializeClassifiers";

// ----------------- Types -----------------

interface GoldStandardSample {
  verbatim: string;
  expectedTag: string;
  metadata?: {
    target?: "conseiller" | "client";
    callId?: string | number;
    speaker?: string;
    start?: number;
    end?: number;
    turnId?: string | number;
    nextOf?: string | number;
    [k: string]: any;
  };
}

interface ValidationResult {
  verbatim: string;
  goldStandard: string;
  predicted: string;
  confidence: number;
  correct: boolean;
  processingTime?: number;
  metadata?: Record<string, any>;
}

interface ClassificationMetrics {
  accuracy: number; // en %
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  confusionMatrix: Record<string, Record<string, number>>;
  avgProcessingTime: number; // ms
  avgConfidence: number; // 0..1
  kappa?: number; // optionnel
}

// ----------------- Utils -----------------

const normalizeLabel = (label: string) =>
  label.replace(/\s+/g, "_").toUpperCase();

// construit la liste des labels CONSEILLER autorisés (familles cibles)
const useAllowedConseillerLabels = (tags: any[]) => {
  const familles = new Set([
    "ENGAGEMENT",
    "OUVERTURE",
    "REFLET",
    "EXPLICATION",
  ]);
  const allowed = new Set(
    (tags || [])
      .filter((t: any) => t?.family && familles.has(t.family))
      .map((t: any) => normalizeLabel(t.label))
  );
  return allowed;
};

const mapTurnsToGoldStandard = (
  allTurnTagged: any[],
  allowedConseiller?: Set<string>
): GoldStandardSample[] => {
  const out: GoldStandardSample[] = [];
  for (const t of allTurnTagged) {
    // CONSEILLER (on filtre sur 'allowedConseiller' si fourni)
    if (t?.verbatim && t?.tag) {
      const norm = normalizeLabel(t.tag);
      if (!allowedConseiller || allowedConseiller.has(norm)) {
        out.push({
          verbatim: t.verbatim,
          expectedTag: norm,
          metadata: {
            target: "conseiller",
            callId: t.call_id,
            speaker: t.speaker,
            start: t.start_time,
            end: t.end_time,
            turnId: t.id,
            next_turn_verbatim: t.next_turn_verbatim || undefined,
            next_turn_tag: t.next_turn_tag
              ? normalizeLabel(t.next_turn_tag)
              : undefined,
          },
        });
      }
    }
    // CLIENT (laisse tel quel)
    if (t?.next_turn_verbatim && t?.next_turn_tag) {
      out.push({
        verbatim: t.next_turn_verbatim,
        expectedTag: normalizeLabel(t.next_turn_tag),
        metadata: {
          target: "client",
          callId: t.call_id,
          nextOf: t.id, // référence au tour conseiller
        },
      });
    }
  }
  return out;
};

const getClassificationTarget = (
  classifierName: string
): "conseiller" | "client" => {
  const c = ClassifierRegistry.getClassifier(classifierName);
  if (c) {
    const md = c.getMetadata();
    const txt = (md.name + " " + (md.description || "")).toLowerCase();
    if (txt.includes("client")) return "client";
  } else if (classifierName.toLowerCase().includes("client")) {
    return "client";
  }
  return "conseiller";
};

const randomSample = <T>(arr: T[], n?: number): T[] => {
  if (!n || n >= arr.length) return arr;
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
};

const computeKappa = (cm: Record<string, Record<string, number>>): number => {
  const labels = Object.keys(cm);
  const N = labels.reduce(
    (s, a) => s + labels.reduce((t, b) => t + (cm[a][b] || 0), 0),
    0
  );
  if (N === 0) return 0;
  const agree = labels.reduce((s, a) => s + (cm[a][a] || 0), 0);
  const Po = agree / N;

  const rowSums: Record<string, number> = {};
  const colSums: Record<string, number> = {};
  labels.forEach((a) => {
    rowSums[a] = labels.reduce((t, b) => t + (cm[a][b] || 0), 0);
    colSums[a] = labels.reduce((t, b) => t + (cm[b][a] || 0), 0);
  });
  const Pe = labels.reduce(
    (s, a) => s + (rowSums[a] * colSums[a]) / (N * N),
    0
  );
  const denom = 1 - Pe;
  return denom === 0 ? 0 : (Po - Pe) / denom;
};

// ----------------- Hook -----------------

export const useLevel1Testing = () => {
  const { allTurnTagged, loadingGlobalData, errorGlobalData, tags } =
    useTaggingData();
  const [error, setError] = useState<string | null>(null);
  // set des labels autorisés
  const allowedConseiller = useMemo(
    () => useAllowedConseillerLabels(tags || []),
    [tags]
  );

  // Initialise les classificateurs une seule fois
  useEffect(() => {
    try {
      initializeClassifiers();
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    setError(errorGlobalData ?? null);
  }, [errorGlobalData]);

  // Dataset gold standard dérivé des données réelles

  const goldStandardData: GoldStandardSample[] = useMemo(
    () => mapTurnsToGoldStandard(allTurnTagged, allowedConseiller),
    [allTurnTagged, allowedConseiller]
  );

  const isLoading = loadingGlobalData;

  // ---------- Actions principales ----------

  const validateAlgorithm = useCallback(
    async (
      classifierName: string,
      sampleSize?: number
    ): Promise<ValidationResult[]> => {
      const classifier = ClassifierRegistry.getClassifier(classifierName);
      if (!classifier) {
        throw new Error(`Classificateur '${classifierName}' non trouvé`);
      }

      const target = getClassificationTarget(classifierName);
      const base = goldStandardData.filter(
        (s) => !s.metadata?.target || s.metadata?.target === target
      );
      if (base.length === 0) {
        throw new Error(
          "Aucune donnée gold standard disponible pour ce target"
        );
      }

      const samples = randomSample(base, sampleSize);
      const results: ValidationResult[] = [];

      for (const sample of samples) {
        try {
          const start = Date.now();
          const prediction = await classifier.classify(sample.verbatim);
          const expected = sample.expectedTag; // déjà normalisé

          results.push({
            verbatim: sample.verbatim,
            goldStandard: expected,
            predicted: prediction.prediction,
            confidence: prediction.confidence ?? 0,
            correct: prediction.prediction === expected,
            processingTime: prediction.processingTime ?? Date.now() - start,
            metadata: {
              ...sample.metadata,
              classifier: classifierName,
              ...(prediction.metadata || {}),
            },
          });
        } catch (e) {
          results.push({
            verbatim: sample.verbatim,
            goldStandard: sample.expectedTag,
            predicted: "ERREUR",
            confidence: 0,
            correct: false,
            metadata: {
              error: e instanceof Error ? e.message : "Unknown error",
              classifier: classifierName,
            },
          });
        }
      }

      return results;
    },
    [goldStandardData]
  );

  const compareAlgorithms = useCallback(
    async (
      classifierNames: string[],
      sampleSize?: number
    ): Promise<Record<string, ValidationResult[]>> => {
      const map: Record<string, ValidationResult[]> = {};
      for (const name of classifierNames) {
        try {
          map[name] = await validateAlgorithm(name, sampleSize);
        } catch (e) {
          console.error(`Erreur test ${name}:`, e);
          map[name] = [];
        }
      }
      return map;
    },
    [validateAlgorithm]
  );

  // ---------- Analyse ----------

  const PSEUDO_OTHER = "__AUTRE__";

  const calculateMetrics = useCallback(
    (results: ValidationResult[]): ClassificationMetrics => {
      if (results.length === 0) {
        return {
          accuracy: 0,
          precision: {},
          recall: {},
          f1Score: {},
          confusionMatrix: {},
          avgProcessingTime: 0,
          avgConfidence: 0,
          kappa: 0,
        };
      }

      const correct = results.filter((r) => r.correct).length;
      const accuracy = Math.round((correct / results.length) * 100 * 10) / 10;

      // ⚠️ classes = uniquement les labels du gold (scope scientifique)
      const classes = Array.from(new Set(results.map((r) => r.goldStandard)));

      const precision: Record<string, number> = {};
      const recall: Record<string, number> = {};
      const f1Score: Record<string, number> = {};
      const confusionMatrix: Record<string, Record<string, number>> = {};

      // init confusion avec une colonne AUTRE
      for (const a of classes) {
        confusionMatrix[a] = {};
        for (const b of classes) confusionMatrix[a][b] = 0;
        confusionMatrix[a][PSEUDO_OTHER] = 0;
      }

      // remplissage
      for (const r of results) {
        const pred = classes.includes(r.predicted) ? r.predicted : PSEUDO_OTHER;
        confusionMatrix[r.goldStandard][pred] =
          (confusionMatrix[r.goldStandard][pred] || 0) + 1;
      }

      // per-class metrics (TP/FP/FN depuis results)
      for (const cls of classes) {
        const tp = results.filter(
          (r) => r.predicted === cls && r.goldStandard === cls
        ).length;
        const fp = results.filter(
          (r) => r.predicted === cls && r.goldStandard !== cls
        ).length;
        const fn = results.filter(
          (r) => r.predicted !== cls && r.goldStandard === cls
        ).length;

        const p = tp + fp > 0 ? tp / (tp + fp) : 0;
        const rc = tp + fn > 0 ? tp / (tp + fn) : 0;
        precision[cls] = p;
        recall[cls] = rc;
        f1Score[cls] = p + rc > 0 ? (2 * p * rc) / (p + rc) : 0;
      }

      const times = results
        .map((r) => r.processingTime || 0)
        .filter((t) => t > 0);
      const avgProcessingTime = times.length
        ? Math.round(times.reduce((s, t) => s + t, 0) / times.length)
        : 0;

      const avgConfidence =
        Math.round(
          (results.reduce((s, r) => s + (r.confidence || 0), 0) /
            results.length) *
            100
        ) / 100;

      // Kappa avec les colonnes classes + AUTRE (reflète bien les erreurs out-of-scope)
      const cmForKappa: Record<string, Record<string, number>> = {};
      for (const a of classes) {
        cmForKappa[a] = { ...confusionMatrix[a] }; // inclut __AUTRE__
      }
      const kappa = computeKappa(cmForKappa);

      return {
        accuracy,
        precision,
        recall,
        f1Score,
        confusionMatrix,
        avgProcessingTime,
        avgConfidence,
        kappa,
      };
    },
    []
  );

  const analyzeErrors = useCallback((results: ValidationResult[]) => {
    const errors = results.filter((r) => !r.correct);
    const totalErrors = errors.length;

    const errorsByCategory: Record<string, number> = {};
    for (const e of errors) {
      const key = `${e.goldStandard} → ${e.predicted}`;
      errorsByCategory[key] = (errorsByCategory[key] || 0) + 1;
    }

    const errorCounts: Record<string, { count: number; examples: string[] }> =
      {};
    for (const e of errors) {
      const key = `${e.goldStandard}→${e.predicted}`;
      if (!errorCounts[key]) errorCounts[key] = { count: 0, examples: [] };
      errorCounts[key].count++;
      if (errorCounts[key].examples.length < 3) {
        errorCounts[key].examples.push(
          (e.verbatim || "").substring(0, 80) + "..."
        );
      }
    }

    const commonErrors = Object.entries(errorCounts)
      .map(([key, data]) => {
        const [expected, predicted] = key.split("→");
        return {
          expected,
          predicted,
          frequency: data.count,
          examples: data.examples,
        };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    const improvementSuggestions: string[] = [];
    if (results.length && totalErrors / results.length > 0.3) {
      improvementSuggestions.push(
        "Accuracy < 70% : revoir les règles ou affiner le modèle"
      );
    }

    const avgConfidence =
      results.reduce((s, r) => s + (r.confidence || 0), 0) /
      (results.length || 1);
    if (avgConfidence < 0.7) {
      improvementSuggestions.push(
        "Confiance moyenne faible : ajuster les seuils de classification"
      );
    }

    for (const ce of commonErrors) {
      if (ce.frequency >= 3) {
        improvementSuggestions.push(
          `Confusion fréquente ${ce.expected}/${ce.predicted} : analyser les patterns linguistiques (${ce.frequency} cas)`
        );
      }
    }

    return {
      totalErrors,
      errorsByCategory,
      commonErrors,
      improvementSuggestions,
    };
  }, []);

  // ---------- Utilitaires ----------

  const quickTest = useCallback(
    async (
      classifierName: string,
      testSamples?: string[]
    ): Promise<ClassificationResult[]> => {
      const classifier = ClassifierRegistry.getClassifier(classifierName);
      if (!classifier)
        throw new Error(`Classificateur '${classifierName}' non trouvé`);
      const samples = testSamples || [
        "je vais vérifier votre dossier",
        "vous devez nous envoyer le document",
        "notre système fonctionne ainsi",
        "d'accord je comprends",
      ];
      const out: ClassificationResult[] = [];
      for (const s of samples) {
        try {
          out.push(await classifier.classify(s));
        } catch (e) {
          out.push({
            prediction: "ERREUR",
            confidence: 0,
            metadata: {
              error: e instanceof Error ? e.message : "Unknown error",
            },
          });
        }
      }
      return out;
    },
    []
  );

  /** Nombre d’échantillons pertinents selon le classificateur (corrige le "7082") */
  const getRelevantCountFor = useCallback(
    (classifierName: string): number => {
      const target = getClassificationTarget(classifierName);
      return goldStandardData.filter((s) => s.metadata?.target === target)
        .length;
    },
    [goldStandardData]
  );

  /** Utile si tu veux afficher les deux compteurs dans l’UI */
  const getGoldStandardCountByTarget = useCallback(() => {
    const conseiller = goldStandardData.filter(
      (s) => s.metadata?.target === "conseiller"
    ).length;
    const client = goldStandardData.filter(
      (s) => s.metadata?.target === "client"
    ).length;
    return { conseiller, client, total: conseiller + client };
  }, [goldStandardData]);

  return {
    // état
    goldStandardData,
    isLoading,
    error,

    // actions
    validateAlgorithm,
    compareAlgorithms,
    quickTest,

    // analyse
    calculateMetrics,
    analyzeErrors,

    // registry helpers
    getAvailableClassifiers: () => ClassifierRegistry.listRegistered(),
    getClassifierInfo: (name: string) =>
      ClassifierRegistry.getClassifier(name)?.getMetadata(),

    // pratique pour l’UI
    isDataReady: !isLoading && !error && goldStandardData.length > 0,

    // nouveaux helpers pour l’UI (slider/compteur)
    getRelevantCountFor,
    getGoldStandardCountByTarget,
  };
};
