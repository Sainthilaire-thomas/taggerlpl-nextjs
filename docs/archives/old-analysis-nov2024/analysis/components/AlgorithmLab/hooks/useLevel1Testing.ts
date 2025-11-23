// hooks/useLevel1Testing.ts — VERSION MIGRÉE H2

import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  BaseClassifier,
  ClassificationResult,
} from "../algorithms/level1/shared/BaseClassifier";
import { initializeAlgorithms } from "@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/initializeAlgorithms";

import { normalizeUniversalToTV } from "./normalizeUniversalToTV";
import type { TVValidationResult } from "@/app/(protected)/analysis/components/AlgorithmLab/types";
import type { TVGoldStandardSample as GoldStandardSample } from "@/app/(protected)/analysis/components/AlgorithmLab/types";

import { algorithmRegistry } from "@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/AlgorithmRegistry";

import type {
  XTag,
  YTag,
  XDetails,
  YDetails,
} from "@/app/(protected)/analysis/components/AlgorithmLab/types";
import {
  ALGORITHM_CONFIGS,
  getConfigForAlgorithm,
} from "../types/algorithms/base";
import {
  filterCorpusForAlgorithm,
  countSamplesPerAlgorithm,
} from "../types/utils/corpusFilters";
import {
  prepareInputsForAlgorithm,
  debugPreparedInputs,
} from "../types/utils/inputPreparation";

// 🆕 IMPORT du nouveau hook H2
import { useAnalysisPairs, AnalysisPair } from "@/features/phase3-analysis/level1-validation/ui/hooks/useAnalysisPairs";
import { getH2Property } from "../types/h2Types";
// ----------------- Types -----------------

interface ClassificationMetrics {
  accuracy: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  confusionMatrix: Record<string, Record<string, number>>;
  avgProcessingTime: number;
  avgConfidence: number;
  kappa?: number;
}

// ----------------- Constants -----------------

const MAX_RETRIES = 2;
const BATCH_SIZE = 100;

// ----------------- Utils -----------------

const normalizeLabel = (label: string) =>
  label.replace(/\s+/g, "_").toUpperCase();

const normalizeXLabelStrict = (raw: string): XTag => {
  const v = raw.trim().toUpperCase().replace(/\s+/g, "_");
  const map: Record<string, XTag> = {
    ENGAGEMENT: "ENGAGEMENT",
    OUVERTURE: "OUVERTURE",
    REFLET_VOUS: "REFLET_VOUS",
    REFLET_JE: "REFLET_JE",
    REFLET_ACQ: "REFLET_ACQ",
    EXPLICATION: "EXPLICATION",
  };
  return map[v] ?? "EXPLICATION";
};

const normalizeYLabelStrict = (raw: string): YTag => {
  const v = raw.trim().toUpperCase().replace(/\s+/g, "_");
  const map: Record<string, YTag> = {
    CLIENT_POSITIF: "CLIENT_POSITIF",
    CLIENT_NEGATIF: "CLIENT_NEGATIF",
    CLIENT_NEUTRE: "CLIENT_NEUTRE",
    "CLIENT POSITIF": "CLIENT_POSITIF",
    "CLIENT NEGATIF": "CLIENT_NEGATIF",
    "CLIENT NEUTRE": "CLIENT_NEUTRE",
    POS: "CLIENT_POSITIF",
    NEG: "CLIENT_NEGATIF",
    NEU: "CLIENT_NEUTRE",
  };
  return map[v] ?? "CLIENT_NEUTRE";
};

const familyFromX = (
  label: XTag
): "ENGAGEMENT" | "OUVERTURE" | "REFLET" | "EXPLICATION" => {
  if (label.startsWith("REFLET")) return "REFLET";
  if (label === "ENGAGEMENT") return "ENGAGEMENT";
  if (label === "OUVERTURE") return "OUVERTURE";
  return "EXPLICATION";
};

const toXDetails = (out: ClassificationResult): XDetails => {
  const label = normalizeXLabelStrict(out.prediction);
  const md = out.metadata || {};
  return {
    label,
    confidence: out.confidence ?? 0,
    family: familyFromX(label),
    matchedPatterns: md.matchedRules ?? md.patterns ?? [],
    rationale: md.explanation,
    probabilities: md.probs,
    spans: md.spans,
  };
};

const toYDetails = (out: ClassificationResult): YDetails => {
  const label = normalizeYLabelStrict(out.prediction);
  const md = out.metadata || {};
  return {
    label,
    confidence: out.confidence ?? 0,
    cues: md.cues ?? md.patterns ?? [],
    sentimentProxy: md.sentiment,
    spans: md.spans,
  };
};

// 🆕 NOUVELLE FONCTION : Convertit H2 en GoldStandard
const mapH2ToGoldStandard = (pairs: AnalysisPair[]): GoldStandardSample[] => {
  console.log(`🔄 mapH2ToGoldStandard: Conversion de ${pairs.length} paires`);
  
  const samples: GoldStandardSample[] = pairs.map(pair => ({
    verbatim: pair.conseiller_verbatim,
    expectedTag: normalizeXLabelStrict(pair.strategy_tag),
    metadata: {
      target: 'conseiller',
      callId: pair.call_id,
      turnId: pair.conseiller_turn_id,
      pairId: pair.pair_id, // ✅ CRUCIAL : référence h2
      
      // Contexte client (pour M2/M3)
      client_verbatim: pair.client_verbatim,
      reaction_tag: pair.reaction_tag,
      
      // Timestamps
      start: pair.conseiller_start_time,
      end: pair.conseiller_end_time,
      
      // Annotations
      annotations: Array.isArray(pair.annotations) ? pair.annotations : [],
      
      // Résultats existants (si déjà calculés)
      existing_results: {
        m1_verb_density: pair.m1_verb_density,
        m2_global_alignment: pair.m2_global_alignment,
        m3_cognitive_score: pair.m3_cognitive_score,
        next_turn_tag_auto: pair.next_turn_tag_auto,
      },
      
      // Versioning
      algorithm_version: pair.algorithm_version,
      computation_status: pair.computation_status,
      
      // ✅ Champ pour affichage universel
      current_turn_verbatim: pair.conseiller_verbatim,
    }
  }));
  
  // Statistiques
  const totalAnnotations = samples.reduce(
    (total, sample) => total + (sample.metadata?.annotations?.length || 0),
    0
  );
  
  console.log(`✅ ${samples.length} échantillons créés`);
  console.log(`📝 ${totalAnnotations} annotations transmises`);
  
  return samples;
};

// 🆕 NOUVELLE FONCTION : Update H2 avec results
const updateH2WithResults = async (
  results: TVValidationResult[],
  algorithmName: string,
  algorithmVersion: string
): Promise<{ success: number; errors: number; total: number }> => {
  console.log(`📝 Mise à jour h2_analysis_pairs : ${results.length} paires`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const result of results) {
    // ✅ Utilisation du helper type-safe
    const pairId = getH2Property(result.metadata, 'pairId');
    
    if (!pairId) {
      console.warn('⚠️ Pas de pairId:', result);
      errorCount++;
      continue;
    }

    const updateData: any = {
      computed_at: new Date().toISOString(),
      algorithm_version: algorithmVersion,
    };

    try {
      // Remplir selon l'algo avec accès type-safe
      if (algorithmName.includes('M1')) {
        updateData.m1_verb_density = getH2Property(result.metadata, 'm1_verb_density');
        updateData.m1_verb_count = getH2Property(result.metadata, 'm1_verb_count');
        updateData.m1_total_words = getH2Property(result.metadata, 'm1_total_words');
        updateData.m1_action_verbs = getH2Property(result.metadata, 'm1_action_verbs');
        updateData.computation_status = 'computed';
      } else if (algorithmName.includes('M2')) {
        updateData.m2_lexical_alignment = getH2Property(result.metadata, 'm2_lexical_alignment');
        updateData.m2_semantic_alignment = getH2Property(result.metadata, 'm2_semantic_alignment');
        updateData.m2_global_alignment = getH2Property(result.metadata, 'm2_global_alignment');
        updateData.m2_shared_terms = getH2Property(result.metadata, 'm2_shared_terms');
        updateData.computation_status = 'computed';
      } else if (algorithmName.includes('M3')) {
        updateData.m3_hesitation_count = getH2Property(result.metadata, 'm3_hesitation_count');
        updateData.m3_clarification_count = getH2Property(result.metadata, 'm3_clarification_count');
        updateData.m3_cognitive_score = getH2Property(result.metadata, 'm3_cognitive_score');
        updateData.m3_cognitive_load = getH2Property(result.metadata, 'm3_cognitive_load');
        updateData.m3_patterns = getH2Property(result.metadata, 'm3_patterns');
        updateData.computation_status = 'computed';
      } else if (algorithmName.includes('X') || algorithmName.includes('Y')) {
        updateData.x_predicted_tag = result.predicted; updateData.y_predicted_tag = result.predicted;
        updateData.x_confidence = result.confidence; updateData.y_confidence = result.confidence;
        updateData.computation_status = 'computed';
      }

      // Retry logic
      let success = false;
      let lastError: any = null;

      for (let attempt = 0; attempt <= MAX_RETRIES && !success; attempt++) {
        try {
          const { error } = await supabase
            .from('analysis_pairs')
            .update(updateData)
            .eq('pair_id', pairId);

          if (error) throw error;
          success = true;
          successCount++;
        } catch (err) {
          lastError = err;
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
          }
        }
      }

      if (!success) {
        errorCount++;
        await supabase
          .from('analysis_pairs')
          .update({
            computation_status: 'error',
            version_metadata: {
              error: lastError instanceof Error ? lastError.message : 'Update failed',
              retries: MAX_RETRIES
            }
          })
          .eq('pair_id', pairId);
      }

    } catch (err) {
      errorCount++;
      console.error(`❌ Erreur pair_id=${pairId}:`, err);
    }
  }

  console.log(`✅ ${successCount} paires mises à jour, ❌ ${errorCount} erreurs`);
  return { success: successCount, errors: errorCount, total: results.length };
};

// 🆕 NOUVELLE FONCTION : Version batch avec progression
const updateH2WithResultsBatch = async (
  results: TVValidationResult[],
  algorithmName: string,
  algorithmVersion: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; errors: number; total: number; batches: number }> => {
  const batches = [];
  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    batches.push(results.slice(i, i + BATCH_SIZE));
  }

  let totalSuccess = 0;
  let totalErrors = 0;

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    
    const stats = await updateH2WithResults(batch, algorithmName, algorithmVersion);
    
    totalSuccess += stats.success;
    totalErrors += stats.errors;

    onProgress?.((batchIdx + 1) * BATCH_SIZE, results.length);

    // Pause inter-batch
    if (batchIdx < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return {
    success: totalSuccess,
    errors: totalErrors,
    total: results.length,
    batches: batches.length
  };
};

const getClassificationTarget = (
  classifierName: string
): "conseiller" | "client" | "M1" | "M2" | "M3" => {
  const algo: any = algorithmRegistry.get<any, any>(classifierName);
  const md = algo?.describe?.();
  const t = (md?.target ?? "").toString().toUpperCase();

  if (t === "M1" || t === "M2" || t === "M3") return t as any;
  if (t === "Y" || t === "CLIENT") return "client";
  if (t === "X" || t === "CONSEILLER") return "conseiller";

  const txt = `${md?.name ?? ""} ${
    md?.description ?? ""
  } ${classifierName}`.toLowerCase();
  if (txt.includes("m1")) return "M1";
  if (txt.includes("m2")) return "M2";
  if (txt.includes("m3")) return "M3";
  return txt.includes("client") ? "client" : "conseiller";
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
  // 🆕 REMPLACE useTaggingData par useH2Data
  const { analysisPairs: h2Pairs, loading: h2Loading, error: h2Error } = useAnalysisPairs();
  const [error, setError] = useState<string | null>(null);

  // Initialise les classificateurs une seule fois
  useEffect(() => {
    try {
      initializeAlgorithms();
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    setError(h2Error ?? null);
  }, [h2Error]);

  // 🆕 Dataset gold standard dérivé de H2
  const goldStandardData: GoldStandardSample[] = useMemo(
    () => mapH2ToGoldStandard(h2Pairs),
    [h2Pairs]
  );

  const samplesPerAlgorithm = useMemo(
    () => countSamplesPerAlgorithm(goldStandardData),
    [goldStandardData]
  );

  const isLoading = h2Loading;

  // ---------- Actions principales ----------

  const getAvailableAlgorithms = useCallback((target: string) => {
    return Object.entries(ALGORITHM_CONFIGS)
      .filter(([, config]) => config.target === target)
      .map(([name]) => name);
  }, []);

  const getAlgorithmStats = useCallback(
    (algorithmName: string) => {
      const config = getConfigForAlgorithm(algorithmName);
      const availableSamples =
        countSamplesPerAlgorithm(goldStandardData)[algorithmName] || 0;

      return {
        config,
        availableSamples,
        isReady: availableSamples > 0,
      };
    },
    [goldStandardData]
  );

  // 🔄 MODIFIÉ : validateAlgorithm avec update H2
  const validateAlgorithm = useCallback(
    async (
      classifierName: string,
      sampleSize?: number
    ): Promise<TVValidationResult[]> => {
      console.log(`\n🔍 [${classifierName}] Validation unifiée avec update H2`);

      const config = getConfigForAlgorithm(classifierName);
      if (!config)
        throw new Error(`Configuration manquante pour ${classifierName}`);

      // 1) Filtrer le corpus selon l'algo
      const filteredBase = filterCorpusForAlgorithm(
        goldStandardData,
        classifierName
      );
      if (filteredBase.length === 0) {
        throw new Error(
          `Aucune donnée compatible pour ${classifierName} (cible=${config.target}).`
        );
      }

      // 2) Échantillon
      const samples = randomSample(filteredBase, sampleSize);
      console.log(
        `📊 [${classifierName}] ${samples.length}/${filteredBase.length} exemples`
      );

      // 3) Inputs adaptés
      const inputs = prepareInputsForAlgorithm(samples, classifierName);
      if (process.env.NODE_ENV === "development") {
        debugPreparedInputs(inputs, classifierName);
      }

      // 4) Récupérer l'algo
      const classifier = algorithmRegistry.get<any, any>(classifierName);
      if (!classifier) {
        throw new Error(
          `Algorithme ${classifierName} introuvable dans le registre`
        );
      }

      // 5) Exécuter & normaliser
      const tvRows: TVValidationResult[] = [];
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const sample = samples[i];

        const uni = await classifier.run(input);
        const tv = normalizeUniversalToTV(
          uni,
          {
            verbatim: sample.verbatim,
            expectedTag: sample.expectedTag,
            metadata: sample.metadata,
          },
          { target: config.target as "X" | "Y" | "M1" | "M2" | "M3" }
        );
        tvRows.push(tv);
      }

      // 🆕 6) Update H2 avec les résultats
      const version = `${classifierName}_v${new Date().toISOString().split('T')[0]}`;
      await updateH2WithResults(tvRows, classifierName, version);

      console.log(`✅ [${classifierName}] ${tvRows.length} résultats + update h2_analysis_pairs`);
      return tvRows;
    },
    [goldStandardData]
  );

  const compareAlgorithms = useCallback(
    async (
      classifierNames: string[],
      sampleSize?: number
    ): Promise<Record<string, TVValidationResult[]>> => {
      const map: Record<string, TVValidationResult[]> = {};
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
    (results: TVValidationResult[]): ClassificationMetrics => {
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

      const classes = Array.from(new Set(results.map((r) => r.goldStandard)));

      const precision: Record<string, number> = {};
      const recall: Record<string, number> = {};
      const f1Score: Record<string, number> = {};
      const confusionMatrix: Record<string, Record<string, number>> = {};

      for (const a of classes) {
        confusionMatrix[a] = {};
        for (const b of classes) confusionMatrix[a][b] = 0;
        confusionMatrix[a][PSEUDO_OTHER] = 0;
      }

      for (const r of results) {
        const pred = classes.includes(r.predicted) ? r.predicted : PSEUDO_OTHER;
        confusionMatrix[r.goldStandard][pred] =
          (confusionMatrix[r.goldStandard][pred] || 0) + 1;
      }

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

      const cmForKappa: Record<string, Record<string, number>> = {};
      for (const a of classes) {
        cmForKappa[a] = { ...confusionMatrix[a] };
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

  const analyzeErrors = useCallback((results: TVValidationResult[]) => {
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

  const quickTest = useCallback(
    async (
      classifierName: string,
      testSamples?: string[]
    ): Promise<ClassificationResult[]> => {
      const classifier = algorithmRegistry.get<any, any>(classifierName);
      if (!classifier)
        throw new Error(`Classificateur '${classifierName}' non trouvé`);
      const samples = testSamples || [
        "je vais vérifier votre dossier",
        "vous devez nous envoyer le document",
        "notre système fonctionne ainsi",
        "d'accord je comprends",
      ];
      const results: ClassificationResult[] = [];
      for (const s of samples) {
        try {
          results.push(await (classifier as any).run(s));
        } catch (e) {
          results.push({
            prediction: "ERREUR",
            confidence: 0,
            metadata: {
              error: e instanceof Error ? e.message : "Unknown error",
            },
          });
        }
      }
      return results;
    },
    []
  );

  const getRelevantCountFor = useCallback(
    (classifierName: string): number => {
      const target = getClassificationTarget(classifierName);
      return goldStandardData.filter(
        (s: GoldStandardSample) => s.metadata?.target === target
      ).length;
    },
    [goldStandardData]
  );

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

    // 🆕 État H2
    h2Pairs,
    h2Loading,
    h2Error,

    // actions
    validateAlgorithm,
    compareAlgorithms,
    quickTest,

    // 🆕 Nouvelles fonctions H2
    updateH2WithResults,
    updateH2WithResultsBatch,

    samplesPerAlgorithm,
    getAvailableAlgorithms,
    getAlgorithmStats,
    algorithmConfigs: ALGORITHM_CONFIGS,

    // analyse
    calculateMetrics,
    analyzeErrors,

    // registry helpers
    getAvailableClassifiers: () => algorithmRegistry.list().map((e) => e.key),
    getClassifierInfo: (name: string) =>
      algorithmRegistry.list().find((e) => e.key === name)?.meta,

    // pratique pour l'UI
    isDataReady: !isLoading && !error && goldStandardData.length > 0,

    // helpers pour l'UI
    getRelevantCountFor,
    getGoldStandardCountByTarget,
  };
};

// ✅ Hook utilitaire pour BaseAlgorithmTesting
export const useAlgorithmValidation = (target: string) => {
  const {
    validateAlgorithm,
    getAvailableAlgorithms,
    getAlgorithmStats,
    samplesPerAlgorithm,
  } = useLevel1Testing();

  const availableAlgorithms = useMemo(
    () => getAvailableAlgorithms(target),
    [getAvailableAlgorithms, target]
  );

  const targetStats = useMemo(() => {
    const stats: Record<string, any> = {};
    availableAlgorithms.forEach((algoName) => {
      stats[algoName] = getAlgorithmStats(algoName);
    });
    return stats;
  }, [availableAlgorithms, getAlgorithmStats]);

  return {
    validateAlgorithm,
    availableAlgorithms,
    targetStats,
    totalSamples: Object.values(samplesPerAlgorithm).reduce((a, b) => a + b, 0),
  };
};
