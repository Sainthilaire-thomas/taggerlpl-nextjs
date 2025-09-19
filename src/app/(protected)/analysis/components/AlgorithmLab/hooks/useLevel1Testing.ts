// hooks/useLevel1Testing.ts  — VERSION DÉFINITIVE (réel + multi-algos)

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTaggingData } from "@/context/TaggingDataContext";
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
// ----------------- Types -----------------

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

    // ✅ AJOUT CRUCIAL : Vos données réelles avec espaces
    "CLIENT POSITIF": "CLIENT_POSITIF", // ← VOS DONNÉES
    "CLIENT NEGATIF": "CLIENT_NEGATIF", // ← VOS DONNÉES
    "CLIENT NEUTRE": "CLIENT_NEUTRE", // ← VOS DONNÉES

    // Variantes si nécessaire
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

// Adaptateurs → détails typés (injectables dans metadata)
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

// 🔹 1a) petit indexeur: récupère le tour précédent (−1) et l'avant-précédent (−2)
const buildPrevIndex = (rows: any[]) => {
  const byCall = new Map<any, any[]>();
  for (const r of rows || []) {
    const key = r.call_id ?? "__no_call__";
    if (!byCall.has(key)) byCall.set(key, []);
    byCall.get(key)!.push(r);
  }
  for (const arr of byCall.values()) {
    arr.sort((a, b) => (a.start_time ?? 0) - (b.start_time ?? 0));
  }
  const prev1 = new Map<any, any>();
  const prev2 = new Map<any, any>();
  for (const arr of byCall.values()) {
    for (let i = 0; i < arr.length; i++) {
      const cur = arr[i];
      prev1.set(cur?.id, i > 0 ? arr[i - 1] : null);
      prev2.set(cur?.id, i > 1 ? arr[i - 2] : null);
    }
  }
  return { prev1, prev2 };
};

// 🔹 1b) map vers le gold standard en incluant prev1/prev2 et next (+1)
// ✅ Ajouter cette fonction utilitaire AVANT mapTurnsToGoldStandard
const getNextTurn = (currentTurn: any, allTurns: any[]): any | null => {
  const currentIndex = allTurns.findIndex((turn) => turn.id === currentTurn.id);
  if (currentIndex === -1 || currentIndex >= allTurns.length - 1) return null;

  // Chercher le prochain tour dans la même conversation
  for (let i = currentIndex + 1; i < allTurns.length; i++) {
    const candidate = allTurns[i];
    if (
      candidate.call_id === currentTurn.call_id &&
      candidate.start_time > currentTurn.end_time
    ) {
      return candidate;
    }
  }
  return null;
};

const mapTurnsToGoldStandard = (
  allTurnTagged: any[],
  allowedConseiller?: Set<string>
): GoldStandardSample[] => {
  const out: GoldStandardSample[] = [];
  const { prev1, prev2 } = buildPrevIndex(allTurnTagged);

  for (const t of allTurnTagged) {
    const p1 = prev1.get(t?.id) || null;
    const p2 = prev2.get(t?.id) || null;

    // CONSEILLER (tour courant = t) - SANS SPEAKER
    if (t?.verbatim && t?.tag) {
      const norm = normalizeLabel(t.tag);
      if (!allowedConseiller || allowedConseiller.has(norm)) {
        out.push({
          verbatim: t.verbatim,
          expectedTag: norm,
          metadata: {
            target: "conseiller",
            callId: t.call_id,
            // speaker: t.speaker, // ❌ SUPPRIMÉ
            start: t.start_time,
            end: t.end_time,
            turnId: t.id,

            // Inclusion des annotations
            annotations: Array.isArray(t.annotations) ? t.annotations : [],

            // Contexte pour conseiller - SANS SPEAKERS
            next_turn_verbatim: t.next_turn_verbatim || undefined,
            next_turn_tag: t.next_turn_tag
              ? normalizeLabel(t.next_turn_tag)
              : undefined,
            prev1_turn_id: p1?.id,
            prev1_turn_verbatim: p1?.verbatim,
            prev1_turn_tag: p1?.tag ? normalizeLabel(p1.tag) : undefined,
            // prev1_speaker: p1?.speaker, // ❌ SUPPRIMÉ
            prev2_turn_id: p2?.id,
            prev2_turn_verbatim: p2?.verbatim,
            prev2_turn_tag: p2?.tag ? normalizeLabel(p2.tag) : undefined,
            // prev2_speaker: p2?.speaker, // ❌ SUPPRIMÉ

            // ✅ AJOUT : current_turn_verbatim pour affichage universel
            current_turn_verbatim: t.verbatim,
          },
        });
      }
    }

    // ✅ TOURS CLIENT DIRECTS - SANS SPEAKERS
    if (t?.verbatim && t?.tag && t.tag.includes("CLIENT")) {
      const y = normalizeYLabelStrict(String(t.tag));
      const isValidY = [
        "CLIENT_POSITIF",
        "CLIENT_NEGATIF",
        "CLIENT_NEUTRE",
      ].includes(y);

      if (isValidY) {
        const nextTurn = getNextTurn(t, allTurnTagged);

        out.push({
          verbatim: t.verbatim, // ✅ Tour client direct
          expectedTag: y, // ✅ Tag client normalisé
          metadata: {
            target: "client",
            callId: t.call_id,
            // speaker: t.speaker, // ❌ SUPPRIMÉ
            start: t.start_time,
            end: t.end_time,
            turnId: t.id, // ✅ ID réel du tour client

            // Inclusion des annotations
            annotations: Array.isArray(t.annotations) ? t.annotations : [],

            // ✅ Contexte NATUREL centré sur le tour client - SANS SPEAKERS
            prev2_turn_verbatim: p2?.verbatim,
            prev1_turn_verbatim: p1?.verbatim,
            current_turn_verbatim: t.verbatim, // ✅ FOCUS = tour client
            next_turn_verbatim: nextTurn?.verbatim,

            // ❌ SPEAKERS SUPPRIMÉS
            // prev2_speaker: p2?.speaker,
            // prev1_speaker: p1?.speaker,
            // current_speaker: "CLIENT",
            // next_speaker: nextTurn?.speaker,

            // IDs pour référence
            prev2_turn_id: p2?.id,
            prev1_turn_id: p1?.id,
            next_turn_id: nextTurn?.id,
          },
        });
      }
    }
  }

  // Debug pour vérifier la transmission des annotations
  const totalAnnotations = out.reduce(
    (total: number, sample: GoldStandardSample) => {
      const annotations = sample.metadata?.annotations || [];
      return total + annotations.length;
    },
    0
  );

  console.log(`🔍 mapTurnsToGoldStandard: ${out.length} échantillons créés`);
  console.log(`📝 ${totalAnnotations} annotations transmises au total`);

  // Statistiques par target
  const conseillerCount = out.filter(
    (s: GoldStandardSample) => s.metadata?.target === "conseiller"
  ).length;
  const clientCount = out.filter(
    (s: GoldStandardSample) => s.metadata?.target === "client"
  ).length;
  console.log(`👨‍💼 ${conseillerCount} échantillons conseiller (X)`);
  console.log(`👤 ${clientCount} échantillons client (Y)`);

  // Debug détaillé: afficher quelques exemples avec annotations
  const withAnnotations = out.filter(
    (s: GoldStandardSample) => s.metadata?.annotations?.length > 0
  );
  if (withAnnotations.length > 0) {
    console.log(
      `✅ ${withAnnotations.length} échantillons contiennent des annotations`
    );
    console.log("📋 Premier exemple avec annotations:", {
      verbatim: withAnnotations[0].verbatim.substring(0, 50) + "...",
      annotationsCount: withAnnotations[0].metadata?.annotations?.length,
      firstAnnotation: withAnnotations[0].metadata?.annotations?.[0],
    });
  } else {
    console.warn("⚠️ Aucun échantillon ne contient d'annotations");
  }

  return out;
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
      initializeAlgorithms();
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

  const samplesPerAlgorithm = useMemo(
    () => countSamplesPerAlgorithm(goldStandardData),
    [goldStandardData]
  );

  const isLoading = loadingGlobalData;

  // ---------- Actions principales ----------

  const getAvailableAlgorithms = useCallback((target: string) => {
    return Object.entries(ALGORITHM_CONFIGS)
      .filter(([, config]) => config.target === target)
      .map(([name]) => name);
  }, []);

  // ✅ NOUVEAU : Helper pour obtenir les statistiques
  const getAlgorithmStats = useCallback(
    (algorithmName: string) => {
      const config = getConfigForAlgorithm(algorithmName);
      const availableSamples =
        countSamplesPerAlgorithm(goldStandardData)[algorithmName] || 0; // ✅ CORRECT

      return {
        config,
        availableSamples,
        isReady: availableSamples > 0,
      };
    },
    [goldStandardData]
  );

  const validateAlgorithm = useCallback(
    async (
      classifierName: string,
      sampleSize?: number
    ): Promise<TVValidationResult[]> => {
      console.log(`\n🔍 [${classifierName}] Validation unifiée`);

      const config = getConfigForAlgorithm(classifierName);
      if (!config)
        throw new Error(`Configuration manquante pour ${classifierName}`);

      // 1) Filtrer le corpus selon l’algo (M2 a besoin de next, etc.)
      const filteredBase = filterCorpusForAlgorithm(
        goldStandardData,
        classifierName
      );
      if (filteredBase.length === 0) {
        throw new Error(
          `Aucune donnée compatible pour ${classifierName} (cible=${config.target}).`
        );
      }

      // 2) Échantillon (si demandé)
      const samples = randomSample(filteredBase, sampleSize);
      console.log(
        `📊 [${classifierName}] ${samples.length}/${filteredBase.length} exemples`
      );

      // 3) Inputs adaptés (⚠️ on utilise ces inputs et pas sample.verbatim)
      const inputs = prepareInputsForAlgorithm(samples, classifierName);
      if (process.env.NODE_ENV === "development") {
        debugPreparedInputs(inputs, classifierName);
      }

      // 4) Récupérer l’algo
      const classifier = algorithmRegistry.get<any, any>(classifierName);
      if (!classifier) {
        throw new Error(
          `Algorithme ${classifierName} introuvable dans le registre`
        );
      }

      // 5) Exécuter & normaliser → TVValidationResult (pour la table)
      const tvRows: TVValidationResult[] = [];
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const sample = samples[i];

        const uni = await classifier.run(input); // ✅ IMPORTANT : on passe l'input préparé
        const tv = normalizeUniversalToTV(
          uni,
          {
            verbatim: sample.verbatim,
            expectedTag: sample.expectedTag,
            metadata: sample.metadata,
          },
          { target: config.target as "X" | "Y" | "M1" | "M2" | "M3" }
        );
        console.log("TV ROW →", tv.predicted, tv.metadata);
        tvRows.push(tv);
      }

      console.log(`✅ [${classifierName}] ${tvRows.length} résultats`);
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

  // ---------- Utilitaires ----------

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

  /** Nombre d'échantillons pertinents selon le classificateur (corrige le "7082") */
  const getRelevantCountFor = useCallback(
    (classifierName: string): number => {
      const target = getClassificationTarget(classifierName);
      return goldStandardData.filter(
        (s: GoldStandardSample) => s.metadata?.target === target
      ).length;
    },
    [goldStandardData]
  );

  /** Utile si tu veux afficher les deux compteurs dans l'UI */
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

    // nouveaux helpers pour l'UI (slider/compteur)
    getRelevantCountFor,
    getGoldStandardCountByTarget,
  };
};

// ✅ NOUVEAU : Hook utilitaire pour BaseAlgorithmTesting
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
