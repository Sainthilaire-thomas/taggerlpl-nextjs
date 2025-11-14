// src/components/cognitive-metrics/hooks/useCognitiveMetricsByFamily.ts

import { useState, useEffect, useMemo } from "react";
import { useSupabase } from "@/features/shared/context";

// Types pour les métriques cognitives par famille
interface FamilyImpactMetrics {
  family: string;
  totalUsage: number;

  // MÉTRIQUES D'ACCEPTATION
  acceptanceRate: number; // % réactions positives
  immediateAcceptance: number; // % réactions type "oui", "d'accord"

  // MÉTRIQUES DE RÉSISTANCE COGNITIVE
  resistanceRate: number; // % objections/refus
  cognitiveLoad: number; // Score charge cognitive (hésitations)

  // MÉTRIQUES DE FLUIDITÉ
  averageReactionLength: number; // Longueur moyenne réaction client
  reactionSpeed: number; // Vitesse de réaction estimée

  // DÉTAILS QUALITATIFS
  positiveMarkers: number; // Comptage marqueurs positifs
  negativeMarkers: number; // Comptage marqueurs négatifs
  effortMarkers: number; // Comptage marqueurs d'effort

  // EXEMPLES REPRÉSENTATIFS
  examples: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
}

interface CognitiveAnalysisResult {
  familyMetrics: FamilyImpactMetrics[];
  globalMetrics: {
    mostEffective: string; // Famille la plus efficace
    leastResistance: string; // Famille générant le moins de résistance
    highestCognitiveLoad: string; // Famille générant le plus d'effort
  };
  comparativeAnalysis: {
    refletVsExplication: number; // Différence d'efficacité
    ouvertureVsEngagement: number;
  };
  loading: boolean;
  error: string | null;
}

export const useCognitiveMetricsByFamily = (): CognitiveAnalysisResult => {
  const { supabase } = useSupabase();
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chargement des données
  useEffect(() => {
    const fetchCognitiveData = async () => {
      if (!supabase) return;

      try {
        setLoading(true);
        setError(null);

        console.log("🧠 Chargement données cognitives...");

        const { data, error: supabaseError } = await supabase
          .from("turntagged")
          .select(
            `
            call_id,
            tag,
            verbatim,
            next_turn_verbatim,
            next_turn_tag,
            start_time,
            end_time,
            lpltag:tag (
              family,
              originespeaker
            )
          `
          )
          .not("next_turn_verbatim", "is", null)
          .neq("next_turn_verbatim", "")
          .order("call_id")
          .order("start_time");

        if (supabaseError) throw supabaseError;

        // Filtrer seulement les stratégies conseiller ET exclure "AUTRES"
        const conseillerData = (data || []).filter(
          (item: any) =>
            item.lpltag?.originespeaker === "conseiller" &&
            item.lpltag?.family !== "AUTRES"
        );

        console.log(
          `✅ ${conseillerData.length} interactions conseiller→client chargées`
        );
        setRawData(conseillerData);
      } catch (err) {
        console.error("❌ Erreur chargement:", err);
        setError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchCognitiveData();
  }, [supabase]);

  // Calcul des métriques par famille
  const familyMetrics = useMemo((): FamilyImpactMetrics[] => {
    if (rawData.length === 0) return [];

    console.log("🧮 Calcul métriques cognitives par famille...");

    // Grouper par famille
    const familyGroups = rawData.reduce(
      (acc: Record<string, any[]>, item: any) => {
        const family = item.lpltag?.family || "AUTRE";
        if (!acc[family]) acc[family] = [];
        acc[family].push(item);
        return acc;
      },
      {}
    );

    const metrics: FamilyImpactMetrics[] = [];

    Object.entries(familyGroups).forEach(([family, items]: [string, any[]]) => {
      console.log(`📊 Analyse famille ${family}: ${items.length} interactions`);

      const familyMetric = analyzeFamilyImpact(family, items);
      metrics.push(familyMetric);
    });

    return metrics.sort((a, b) => b.totalUsage - a.totalUsage);
  }, [rawData]);

  // Métriques globales et comparatives
  const globalMetrics = useMemo(() => {
    if (familyMetrics.length === 0) {
      return {
        mostEffective: "",
        leastResistance: "",
        highestCognitiveLoad: "",
      };
    }

    // Famille la plus efficace (meilleur taux d'acceptation)
    const mostEffective = familyMetrics.reduce((prev, current) =>
      current.acceptanceRate > prev.acceptanceRate ? current : prev
    ).family;

    // Famille générant le moins de résistance
    const leastResistance = familyMetrics.reduce((prev, current) =>
      current.resistanceRate < prev.resistanceRate ? current : prev
    ).family;

    // Famille générant le plus de charge cognitive
    const highestCognitiveLoad = familyMetrics.reduce((prev, current) =>
      current.cognitiveLoad > prev.cognitiveLoad ? current : prev
    ).family;

    return {
      mostEffective,
      leastResistance,
      highestCognitiveLoad,
    };
  }, [familyMetrics]);

  // Analyses comparatives spécifiques
  const comparativeAnalysis = useMemo(() => {
    const reflet = familyMetrics.find((f) => f.family === "REFLET");
    const explication = familyMetrics.find((f) => f.family === "EXPLICATION");
    const ouverture = familyMetrics.find((f) => f.family === "OUVERTURE");
    const engagement = familyMetrics.find((f) => f.family === "ENGAGEMENT");

    return {
      refletVsExplication:
        reflet && explication
          ? reflet.acceptanceRate - explication.acceptanceRate
          : 0,
      ouvertureVsEngagement:
        ouverture && engagement
          ? ouverture.acceptanceRate - engagement.acceptanceRate
          : 0,
    };
  }, [familyMetrics]);

  return {
    familyMetrics,
    globalMetrics,
    comparativeAnalysis,
    loading,
    error,
  };
};

// ================ FONCTIONS D'ANALYSE COGNITIVE ================

function analyzeFamilyImpact(
  family: string,
  interactions: any[]
): FamilyImpactMetrics {
  const totalUsage = interactions.length;

  // Analyser les réactions clients
  const reactions = interactions.map((item) => ({
    text: item.next_turn_verbatim || "",
    tag: item.next_turn_tag,
    length: (item.next_turn_verbatim || "").length,
    hasPositiveMarkers: detectPositiveMarkers(item.next_turn_verbatim || ""),
    hasNegativeMarkers: detectNegativeMarkers(item.next_turn_verbatim || ""),
    hasEffortMarkers: detectEffortMarkers(item.next_turn_verbatim || ""),
  }));

  // CALCULS DES MÉTRIQUES COGNITIVES

  // 1. Taux d'acceptation (réactions positives)
  const positiveReactions = reactions.filter(
    (r) =>
      r.hasPositiveMarkers ||
      r.tag === "CLIENT_POSITIF" ||
      r.tag === "B_EXPLIQUE"
  );
  const acceptanceRate = Math.round(
    (positiveReactions.length / totalUsage) * 100
  );

  // 2. Acceptation immédiate (marqueurs explicites)
  const immediatePositive = reactions.filter((r) =>
    /\b(oui|d'accord|très bien|parfait|exactement)\b/i.test(r.text)
  );
  const immediateAcceptance = Math.round(
    (immediatePositive.length / totalUsage) * 100
  );

  // 3. Taux de résistance (objections/refus)
  const resistantReactions = reactions.filter(
    (r) => r.hasNegativeMarkers || r.tag === "CLIENT_NEGATIF"
  );
  const resistanceRate = Math.round(
    (resistantReactions.length / totalUsage) * 100
  );

  // 4. Charge cognitive (marqueurs d'effort)
  const effortReactions = reactions.filter((r) => r.hasEffortMarkers);
  const cognitiveLoad = Math.round((effortReactions.length / totalUsage) * 100);

  // 5. Longueur moyenne des réactions (proxy de complexité)
  const averageReactionLength = Math.round(
    reactions.reduce((sum, r) => sum + r.length, 0) / reactions.length
  );

  // 6. Vitesse de réaction estimée (basée sur longueur)
  const reactionSpeed =
    averageReactionLength > 100 ? 0.5 : averageReactionLength > 50 ? 0.75 : 1.0;

  // 7. Comptages détaillés
  const positiveMarkers = reactions.reduce(
    (sum, r) => sum + (r.hasPositiveMarkers ? 1 : 0),
    0
  );
  const negativeMarkers = reactions.reduce(
    (sum, r) => sum + (r.hasNegativeMarkers ? 1 : 0),
    0
  );
  const effortMarkers = reactions.reduce(
    (sum, r) => sum + (r.hasEffortMarkers ? 1 : 0),
    0
  );

  // 8. Exemples représentatifs
  const examples = {
    positive: reactions
      .filter((r) => r.hasPositiveMarkers)
      .slice(0, 3)
      .map((r) => r.text.substring(0, 100)),
    negative: reactions
      .filter((r) => r.hasNegativeMarkers)
      .slice(0, 3)
      .map((r) => r.text.substring(0, 100)),
    neutral: reactions
      .filter((r) => !r.hasPositiveMarkers && !r.hasNegativeMarkers)
      .slice(0, 3)
      .map((r) => r.text.substring(0, 100)),
  };

  return {
    family,
    totalUsage,
    acceptanceRate,
    immediateAcceptance,
    resistanceRate,
    cognitiveLoad,
    averageReactionLength,
    reactionSpeed,
    positiveMarkers,
    negativeMarkers,
    effortMarkers,
    examples,
  };
}

// ================ DÉTECTEURS DE MARQUEURS COGNITIFS ================

function detectPositiveMarkers(text: string): boolean {
  const positivePatterns = [
    /\b(oui|d'accord|très bien|parfait|exactement|voilà|merci)\b/i,
    /\b(c'est ça|tout à fait|absolument|bien sûr)\b/i,
  ];
  return positivePatterns.some((pattern) => pattern.test(text));
}

function detectNegativeMarkers(text: string): boolean {
  const negativePatterns = [
    /\b(non|mais|inadmissible|inacceptable|impossible)\b/i,
    /\b(je ne suis pas d'accord|c'est faux|ça ne va pas)\b/i,
    /\b(scandaleux|révoltant|abusé)\b/i,
  ];
  return negativePatterns.some((pattern) => pattern.test(text));
}

function detectEffortMarkers(text: string): boolean {
  const effortPatterns = [
    /\b(euh|attendez|alors|comment|hein|quoi)\b/i,
    /\b(je ne comprends pas|comment ça|qu'est-ce que vous voulez dire)\b/i,
    /\.\.\.|(?:\s){3,}|\([^)]*\)/g, // Pauses, hésitations, annotations
  ];
  return effortPatterns.some((pattern) => pattern.test(text));
}
