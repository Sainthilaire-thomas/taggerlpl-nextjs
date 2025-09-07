// hooks/useLevel1Testing.ts  — VERSION DÉFINITIVE (réel + multi-algos)

import { useState, useMemo, useEffect, useCallback } from "react";
import { useTaggingData } from "@/context/TaggingDataContext";
import {
  BaseClassifier,
  ClassificationResult,
} from "../algorithms/level1/shared/BaseClassifier";
import { algorithmRegistry } from "@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/AlgorithmRegistry";
import { initializeAlgorithms } from "@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/initializeAlgorithms";

import type { XTag, YTag, XDetails, YDetails } from "@/app/(protected)/analysis/components/AlgorithmLab/types";
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
const mapTurnsToGoldStandard = (
  allTurnTagged: any[],
  allowedConseiller?: Set<string>
): GoldStandardSample[] => {
  const out: GoldStandardSample[] = [];
  const { prev1, prev2 } = buildPrevIndex(allTurnTagged);

  for (const t of allTurnTagged) {
    const p1 = prev1.get(t?.id) || null;
    const p2 = prev2.get(t?.id) || null;

    // CONSEILLER (tour courant = t)
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

            // ✅ AJOUT CRUCIAL: Inclusion des annotations
            annotations: Array.isArray(t.annotations) ? t.annotations : [],

            // +1
            next_turn_verbatim: t.next_turn_verbatim || undefined,
            next_turn_tag: t.next_turn_tag
              ? normalizeLabel(t.next_turn_tag)
              : undefined,

            // -1
            prev1_turn_id: p1?.id,
            prev1_turn_verbatim: p1?.verbatim,
            prev1_turn_tag: p1?.tag ? normalizeLabel(p1.tag) : undefined,
            prev1_speaker: p1?.speaker,

            // -2
            prev2_turn_id: p2?.id,
            prev2_turn_verbatim: p2?.verbatim,
            prev2_turn_tag: p2?.tag ? normalizeLabel(p2.tag) : undefined,
            prev2_speaker: p2?.speaker,
          },
        });
      }
    }

    // CLIENT (tour suivant du conseiller t)
    if (t?.next_turn_verbatim && t?.next_turn_tag) {
      const p1ForClient = t; // le -1 du client est le conseiller courant
      const p2ForClient = prev1.get(t?.id) || null; // le -2 du client

      out.push({
        verbatim: t.next_turn_verbatim,
        expectedTag: normalizeLabel(t.next_turn_tag),
        metadata: {
          target: "client",
          callId: t.call_id,
          nextOf: t.id,

          // ✅ AJOUT CRUCIAL: Inclusion des annotations du tour parent
          annotations: Array.isArray(t.annotations) ? t.annotations : [],

          // -1
          prev1_turn_id: p1ForClient?.id,
          prev1_turn_verbatim: p1ForClient?.verbatim,
          prev1_turn_tag: p1ForClient?.tag
            ? normalizeLabel(p1ForClient.tag)
            : undefined,
          prev1_speaker: p1ForClient?.speaker,

          // -2
          prev2_turn_id: p2ForClient?.id,
          prev2_turn_verbatim: p2ForClient?.verbatim,
          prev2_turn_tag: p2ForClient?.tag
            ? normalizeLabel(p2ForClient.tag)
            : undefined,
          prev2_speaker: p2ForClient?.speaker,
        },
      });
    }
  }

  // ✅ AJOUT: Debug pour vérifier la transmission des annotations
  const totalAnnotations = out.reduce((total, sample) => {
    const annotations = sample.metadata?.annotations || [];
    return total + annotations.length;
  }, 0);

  console.log(`🔍 mapTurnsToGoldStandard: ${out.length} échantillons créés`);
  console.log(`📝 ${totalAnnotations} annotations transmises au total`);

  // Debug détaillé: afficher quelques exemples avec annotations
  const withAnnotations = out.filter(
    (s) => s.metadata?.annotations?.length > 0
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

  const isLoading = loadingGlobalData;

  // ---------- Actions principales ----------

  const validateAlgorithm = useCallback(
    async (
      classifierName: string,
      sampleSize?: number
    ): Promise<ValidationResult[]> => {
      const classifier = algorithmRegistry.get<any, any>(classifierName);
      if (!classifier)
        throw new Error(`Classificateur '${classifierName}' non trouvé`);

      const target = getClassificationTarget(classifierName);
      if (target === "M1") {
        // Échantillons = tours CONSEILLER uniquement (T0)
        const base = goldStandardData.filter(
          (s) => s.metadata?.target === "conseiller"
        );
        if (base.length === 0)
          throw new Error("Aucune donnée disponible pour M1.");

        const samples = randomSample(base, sampleSize);
        const inputs = samples.map((s) => s.verbatim || "");

        // On passe par la route serveur (bon réflexe standard)
        const r = await fetch("/api/algolab/classifiers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: classifierName, verbatims: inputs }),
        });
        const j = await r.json();
        if (!j.ok || !Array.isArray(j.results)) {
          throw new Error(
            j.error || "Route /api/algolab/classifiers en erreur (M1)"
          );
        }

        const outs: ClassificationResult[] = j.results;

        // Pour M1, il n’y a pas de "gold label" catégoriel : on renvoie la valeur mesurée
        // On met 'goldStandard' = "—" pour ne pas alimenter la matrice.
        return outs.map((out, i) => {
          const sample = samples[i];
          const dens = Number.parseFloat(String(out.prediction)) || 0; // valeur M1

          return {
            verbatim: sample.verbatim,
            goldStandard: "M1", // const : évite une pseudo-matrice inutile
            predicted: "M1", // idem ; la valeur est mise en metadata
            confidence: out.confidence ?? 0,
            correct: true, // M1 = mesure, pas une classe
            processingTime: out.processingTime ?? 0,
            metadata: {
              ...sample.metadata,
              classifier: classifierName,
              // expose proprement M1 pour l’UI :
              m1: {
                value: dens,
                densityPer: out.metadata?.densityPer ?? 100,
                actionVerbCount: out.metadata?.actionVerbCount ?? 0,
                totalTokens: out.metadata?.totalTokens ?? 0,
                verbsFound: out.metadata?.verbsFound ?? [],
              },
            },
          };
        });
      }

      const base = goldStandardData.filter(
        (s) => !s.metadata?.target || s.metadata?.target === target
      );
      if (base.length === 0)
        throw new Error(
          "Aucune donnée gold standard disponible pour ce target"
        );

      const samples = randomSample(base, sampleSize);
      const inputs = samples.map((s) => {
        const m = s.metadata || {};
        return /OpenAI3TConseillerClassifier/i.test(classifierName)
          ? `T-2: ${m.prev2_turn_verbatim ?? "—"}\nT-1: ${
              m.prev1_turn_verbatim ?? "—"
            }\nT0: ${s.verbatim ?? ""}`
          : s.verbatim;
      });

      const md = (classifier as any).describe?.();
      const isClient = typeof window !== "undefined";
      const isLLM =
        md?.type === "llm" ||
        /openai|gpt/i.test(md?.name || "") ||
        /openai|gpt/i.test(md?.description || "");

      // --- 🔴 CHANGEMENT CRUCIAL : on force la route serveur en client + LLM
      const mustUseServer = isClient && isLLM;

      const normalizePredictedForSample = (
        out: ClassificationResult,
        sampleTarget: "conseiller" | "client"
      ) =>
        sampleTarget === "client"
          ? normalizeYLabelStrict(out.prediction)
          : normalizeXLabelStrict(out.prediction);

      const detailsForSample = (
        out: ClassificationResult,
        sampleTarget: "conseiller" | "client"
      ) => (sampleTarget === "client" ? toYDetails(out) : toXDetails(out));

      // 1) Client + LLM -> route serveur EN PREMIER
      if (mustUseServer) {
        const r = await fetch("/api/algolab/classifiers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: classifierName, verbatims: inputs }),
        });
        const j = await r.json();
        if (!j.ok || !Array.isArray(j.results)) {
          throw new Error(
            j.error || "Route /api/algolab/classifiers en erreur"
          );
        }
        const outs: ClassificationResult[] = j.results;

        return outs.map((out, i) => {
          const sample = samples[i];
          const sampleTarget =
            sample.metadata?.target === "client" ? "client" : "conseiller";
          const predictedNorm = normalizePredictedForSample(out, sampleTarget);
          const details = detailsForSample(out, sampleTarget);
          return {
            verbatim: sample.verbatim,
            goldStandard: sample.expectedTag,
            predicted: predictedNorm,
            confidence: out.confidence ?? 0,
            correct: predictedNorm === sample.expectedTag,
            processingTime: out.processingTime ?? 0,
            metadata: {
              ...sample.metadata,
              classifier: classifierName,
              rawPrediction: out.prediction,
              ...(out.metadata || {}),
              x_details: sampleTarget === "conseiller" ? details : undefined,
              y_details: sampleTarget === "client" ? details : undefined,
            },
          };
        });
      }

      // 2) Sinon, on peut essayer le batch local s’il existe (runtimes non-LLM)
      if (typeof (classifier as any).runBatch === "function") {
        try {
          const outs = await (classifier as any).runBatch(inputs);
          return outs.map((out: ClassificationResult, i: number) => {
            const sample = samples[i];
            const sampleTarget =
              sample.metadata?.target === "client" ? "client" : "conseiller";
            const predictedNorm = normalizePredictedForSample(
              out,
              sampleTarget
            );
            const details = detailsForSample(out, sampleTarget);
            return {
              verbatim: sample.verbatim,
              goldStandard: sample.expectedTag,
              predicted: predictedNorm,
              confidence: out.confidence ?? 0,
              correct: predictedNorm === sample.expectedTag,
              processingTime: out.processingTime ?? 0,
              metadata: {
                ...sample.metadata,
                classifier: classifierName,
                rawPrediction: out.prediction,
                ...(out.metadata || {}),
                x_details: sampleTarget === "conseiller" ? details : undefined,
                y_details: sampleTarget === "client" ? details : undefined,
              },
            };
          });
        } catch (e) {
          console.warn("runBatch local a échoué, on passera item-by-item :", e);
        }
      }

      // 3) Fallback item-by-item local (algos non LLM)
      const results: ValidationResult[] = [];
      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        const input = inputs[i];
        const sampleTarget =
          sample.metadata?.target === "client" ? "client" : "conseiller";
        try {
          const start = Date.now();
          const prediction = await (classifier as any).run(input);
          const predictedNorm = normalizePredictedForSample(
            prediction,
            sampleTarget
          );
          const details = detailsForSample(prediction, sampleTarget);
          results.push({
            verbatim: sample.verbatim,
            goldStandard: sample.expectedTag,
            predicted: predictedNorm,
            confidence: prediction.confidence ?? 0,
            correct: predictedNorm === sample.expectedTag,
            processingTime: prediction.processingTime ?? Date.now() - start,
            metadata: {
              ...sample.metadata,
              classifier: classifierName,
              rawPrediction: prediction.prediction,
              ...(prediction.metadata || {}),
              x_details: sampleTarget === "conseiller" ? details : undefined,
              y_details: sampleTarget === "client" ? details : undefined,
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
      const classifier = algorithmRegistry.get<any, any>(classifierName);
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
          out.push(await (classifier as any).run(s));
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
    getAvailableClassifiers: () => algorithmRegistry.list().map((e) => e.key),
    getClassifierInfo: (name: string) =>
      algorithmRegistry.list().find((e) => e.key === name)?.meta,

    // pratique pour l’UI
    isDataReady: !isLoading && !error && goldStandardData.length > 0,

    // nouveaux helpers pour l’UI (slider/compteur)
    getRelevantCountFor,
    getGoldStandardCountByTarget,
  };
};
