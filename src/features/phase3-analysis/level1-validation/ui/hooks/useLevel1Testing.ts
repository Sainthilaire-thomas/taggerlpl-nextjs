// hooks/useLevel1Testing.ts � VERSION MIGR�E H2



import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

// ✅ MIGRÉ : Algorithmes
import {
  BaseClassifier,
  ClassificationResult,
} from '@/features/phase3-analysis/level1-validation/algorithms/shared/BaseClassifier';
import { initializeAlgorithms } from "@/features/phase3-analysis/level1-validation/algorithms/shared/initializeAlgorithms";
import { algorithmRegistry } from "@/features/phase3-analysis/level1-validation/algorithms/shared/AlgorithmRegistry";

// ✅ MIGRÉ : Types de validation
import type { 
  TVValidationResult,
  XTag,
  YTag,
  XDetails,
  YDetails,
  TVGoldStandardSample as GoldStandardSample 
} from '@/types/algorithm-lab';

// ✅ Types centralisés - Configuration algorithmes
import {
  ALGORITHM_CONFIGS,
  getConfigForAlgorithm,
  filterCorpusForAlgorithm,
  countSamplesPerAlgorithm,
  prepareInputsForAlgorithm,
  debugPreparedInputs,
} from '@/types/algorithm-lab';

// ✅ SpeakerType depuis algorithms
import type { SpeakerType } from '@/types/algorithm-lab/algorithms';

// ✅ MIGRÉ : Hook H2
import { useAnalysisPairs, AnalysisPair } from './useAnalysisPairs';

// ✅ Normalisation (à migrer si besoin)
import { normalizeUniversalToTV } from "./normalizeUniversalToTV";
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



// ?? NOUVELLE FONCTION : Update H2 avec results
const updateH2WithResults = async (
  results: TVValidationResult[],
  algorithmName: string,
  algorithmVersion: string
): Promise<{ success: number; errors: number; total: number }> => {
  console.log(`🔄 Mise à jour analysis_pairs : ${results.length} paires`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const result of results) {
    // ✅ STRUCTURE UNIFIÉE : Récupération du pairId avec cast
    const pairId = (result.metadata as any)?.pairId;
    
    if (!pairId) {
      console.warn('⚠️ Pas de pairId:', result);
      errorCount++;
      continue;
    }

    // ✅ STRUCTURE UNIFIÉE : Accès direct à dbColumns avec cast
    const updateData: any = (result.metadata as any)?.dbColumns || {};

    // 🔍 DEBUG : Voir le contenu de metadata
console.log('🔍 DEBUG metadata:', {
  pairId,
  hasMetadata: !!result.metadata,
  hasDbColumns: !!(result.metadata as any)?.dbColumns,
  metadataKeys: result.metadata ? Object.keys(result.metadata) : [],
  dbColumns: (result.metadata as any)?.dbColumns,
  fullMetadata: result.metadata
});
    console.log('📊 UPDATE DATA:', { pairId, updateData });

    try {
      // Retry logic
      let success = false;
      let lastError: any = null;

      for (let attempt = 0; attempt <= MAX_RETRIES && !success; attempt++) {
        try {
          const { error } = await supabase
            .from('analysis_pairs')
            .update(updateData)
            .eq('pair_id', pairId);

          if (error) { 
            console.error('❌ SUPABASE ERROR:', error); 
            throw error; 
          }
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

// ?? NOUVELLE FONCTION : Version batch avec progression
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

  if (t === "M1" || t === "M2" || t === "M3") return t;
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
  // ?? NOUVELLE FONCTION : Convertit H2 en GoldStandard
const mapH2ToGoldStandard = useCallback(
  (pairs: AnalysisPair[]): GoldStandardSample[] => {
    console.log(`?? mapH2ToGoldStandard: Conversion de ${pairs.length} paires`);
    
    const samples: GoldStandardSample[] = [];
    
    pairs.forEach(pair => {
      // ? DEBUG : V�rifier le contexte
      console.log('?? CONTEXT CHECK:', {
        prev2: pair.prev2_verbatim ? '?' : '?',
        prev1: pair.prev1_verbatim ? '?' : '?',
        next1: pair.next1_verbatim ? '?' : '?',
        next1_value: pair.next1_verbatim
      });
      
      // 1?? SAMPLE CONSEILLER (pour algos X, M1)
      samples.push({
        verbatim: pair.conseiller_verbatim,
        expectedTag: normalizeXLabelStrict(pair.strategy_tag),
        metadata: {
          target: 'conseiller',
          callId: pair.call_id,
          turnId: pair.conseiller_turn_id,
          pairId: pair.pair_id,
          
          // Contexte client (pour M2/M3)
          client_verbatim: pair.client_verbatim,
          reaction_tag: pair.reaction_tag,
          
          // Timestamps
          start: pair.conseiller_start_time,
          end: pair.conseiller_end_time,
          
          // Annotations
          annotations: Array.isArray(pair.annotations) ? pair.annotations : [],
          
          // R�sultats existants
          existing_results: {
            m1_verb_density: pair.m1_verb_density,
            m2_global_alignment: pair.m2_global_alignment,
            m3_cognitive_score: pair.m3_cognitive_score,
            next_turn_tag_auto: pair.next_turn_tag_auto,
          },
          
          // Versioning
          algorithm_version: pair.algorithm_version,
          computation_status: pair.computation_status,
          
          // Champ pour affichage universel
          current_turn_verbatim: pair.conseiller_verbatim,
          
          // CONTEXTE : tours pr�c�dents/suivants
          prev3_turn_verbatim: pair.prev3_verbatim,
          prev2_turn_verbatim: pair.prev2_verbatim,
          prev1_turn_verbatim: pair.prev1_verbatim,
          next1_turn_verbatim: pair.next1_verbatim,
          next2_turn_verbatim: pair.next2_verbatim,
          next3_turn_verbatim: pair.next3_verbatim,
        }
      });
      
      // 2?? SAMPLE CLIENT (pour algos Y)
      samples.push({
        verbatim: pair.client_verbatim,
        expectedTag: pair.reaction_tag, // CLIENT_POSITIF, CLIENT_NEUTRE, CLIENT_NEGATIF
        metadata: {
          target: 'client',
          callId: pair.call_id,
          turnId: pair.client_turn_id,
          pairId: pair.pair_id,
          
          // Contexte conseiller
          conseiller_verbatim: pair.conseiller_verbatim,
          strategy_tag: pair.strategy_tag,
          
          // Timestamps
          start: pair.conseiller_start_time,
          end: pair.conseiller_end_time,
          
          // Annotations
          annotations: Array.isArray(pair.annotations) ? pair.annotations : [],
          
          // Versioning
          algorithm_version: pair.algorithm_version,
          computation_status: pair.computation_status,
          
          // Champ pour affichage universel
          current_turn_verbatim: pair.client_verbatim,
          
          // CONTEXTE : tours pr�c�dents/suivants
          prev3_turn_verbatim: pair.prev3_verbatim,
          prev2_turn_verbatim: pair.prev2_verbatim,
          prev1_turn_verbatim: pair.prev1_verbatim,
          next1_turn_verbatim: pair.next1_verbatim,
          next2_turn_verbatim: pair.next2_verbatim,
          next3_turn_verbatim: pair.next3_verbatim,
        }
      });

      // 3?? SAMPLE M�DIATEUR M2 (pour alignement conseiller-client)
      samples.push({
        verbatim: pair.conseiller_verbatim,
        expectedTag: normalizeXLabelStrict(pair.strategy_tag),
        metadata: {
          target: 'M2',
          callId: pair.call_id,
          turnId: pair.conseiller_turn_id,
          pairId: pair.pair_id,
          
          // ?? CRUCIAL : Les deux verbatims pour M2
          t0: pair.conseiller_verbatim,
          t1: pair.client_verbatim,
          
          // Aussi pour compatibilit�
          conseiller_verbatim: pair.conseiller_verbatim,
          client_verbatim: pair.client_verbatim,
          
          // Tags
          strategy_tag: pair.strategy_tag,
          reaction_tag: pair.reaction_tag,
          
          // Timestamps
          start: pair.conseiller_start_time,
          end: pair.conseiller_end_time,
          
          // Champ pour affichage universel
          current_turn_verbatim: pair.conseiller_verbatim,
          
          // CONTEXTE
          prev3_turn_verbatim: pair.prev3_verbatim,
          prev2_turn_verbatim: pair.prev2_verbatim,
          prev1_turn_verbatim: pair.prev1_verbatim,
          next1_turn_verbatim: pair.next1_verbatim,
          next2_turn_verbatim: pair.next2_verbatim,
          next3_turn_verbatim: pair.next3_verbatim,
        }
      });
    });
    
    console.log(`? ${samples.length} samples cr��s (${pairs.length} � 3: conseiller + client + M2)`);
    return samples;
  },
  []
);

  // ?? UTILISE useAnalysisPairs pour charger les paires d'analyse
  const { analysisPairs, loading: h2Loading, error: h2Error } = useAnalysisPairs();
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

  // ?? Dataset gold standard d�riv� de H2
  const goldStandardData: GoldStandardSample[] = useMemo(
    () => mapH2ToGoldStandard(analysisPairs),
    [analysisPairs]
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

  // ?? MODIFI� : validateAlgorithm avec update H2
  const validateAlgorithm = useCallback(
    async (
      classifierName: string,
      sampleSize?: number
    ): Promise<TVValidationResult[]> => {
      console.log(`\n?? [${classifierName}] Validation unifi�e avec update H2`);

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
          `Aucune donn�e compatible pour ${classifierName} (cible=${config.target}).`
        );
      }

      // 2) �chantillon
      const samples = randomSample(filteredBase, sampleSize);
      console.log(
        `?? [${classifierName}] ${samples.length}/${filteredBase.length} exemples`
      );

      // 3) Inputs adapt�s
      const inputs = prepareInputsForAlgorithm(samples, classifierName);
      if (process.env.NODE_ENV === "development") {
        debugPreparedInputs(inputs, classifierName);
      }

      // 4) R�cup�rer l'algo
      const classifier = algorithmRegistry.get<any, any>(classifierName);
      if (!classifier) {
        throw new Error(
          `Algorithme ${classifierName} introuvable dans le registre`
        );
      }

      // 5) Ex�cuter & normaliser
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

      // ?? 6) Update H2 avec les r�sultats
      const version = `${classifierName}_v${new Date().toISOString().split('T')[0]}`;
      await updateH2WithResults(tvRows, classifierName, version);

      console.log(`? [${classifierName}] ${tvRows.length} r�sultats + update analysis_pairs`);
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
      const key = `${e.goldStandard} ? ${e.predicted}`;
      errorsByCategory[key] = (errorsByCategory[key] || 0) + 1;
    }

    const errorCounts: Record<string, { count: number; examples: string[] }> =
      {};
    for (const e of errors) {
      const key = `${e.goldStandard}?${e.predicted}`;
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
        const [expected, predicted] = key.split("?");
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
        "Accuracy < 70% : revoir les r�gles ou affiner le mod�le"
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
          `Confusion fr�quente ${ce.expected}/${ce.predicted} : analyser les patterns linguistiques (${ce.frequency} cas)`
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
        throw new Error(`Classificateur '${classifierName}' non trouv�`);
      const samples = testSamples || [
        "je vais v�rifier votre dossier",
        "vous devez nous envoyer le document",
        "notre syst�me fonctionne ainsi",
        "d'accord je comprends",
      ];
      const results: ClassificationResult[] = [];
      for (const s of samples) {
        try {
          results.push(await classifier.run(s));
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
    // �tat
    goldStandardData,
    isLoading,
    error,

    // ?? �tat H2
    analysisPairs,
    h2Loading,
    h2Error,

    // actions
    validateAlgorithm,
    compareAlgorithms,
    quickTest,

    // ?? Nouvelles fonctions H2
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

// ? Hook utilitaire pour BaseAlgorithmTesting
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
