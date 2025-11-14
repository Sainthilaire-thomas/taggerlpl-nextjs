// src/components/cognitive-metrics/hooks/useCognitiveMetrics.ts

import { useState, useEffect, useMemo } from "react";
import { useTaggingData } from "@/context/TaggingDataContext";
import { IndicatorKey } from "../types";

interface CognitiveMetricsData {
  fluiditeCognitive: number;
  reactionsDirectes: number;
  reprisesLexicales: number;
  chargeCognitive: number;
  marqueursEffort: number;
  patternsResistance: number;
  robustesseStress: number;
  niveauStress: number;
  positionConversation: number;
}

interface FilterOptions {
  origine?: string;
  conseiller?: string;
  strategyType?: string;
  reactionType?: string;
}

interface MetricsCalculationResult {
  data: CognitiveMetricsData;
  loading: boolean;
  error: string | null;
  sampleSize: number;
  lastUpdated: Date | null;
}

// Types pour les structures de données
interface TaggedTurn {
  id: number;
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  verbatim: string;
  next_turn_verbatim: string;
  next_turn_tag?: string;
  speaker: string;
  color: string;
}

export const useCognitiveMetrics = (
  filters: FilterOptions = {}
): MetricsCalculationResult => {
  const { taggedTurns, tags } = useTaggingData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filtrage des données selon les critères
  const filteredTurns = useMemo(() => {
    if (!taggedTurns || taggedTurns.length === 0) return [];

    return taggedTurns.filter((turn) => {
      // Filtre par origine (via call_id - nécessiterait jointure avec table call)
      // Pour l'instant, on garde tous les turns en attendant cette jointure

      // Filtre par type de stratégie
      if (filters.strategyType) {
        const isEngagement = turn.tag && isEngagementStrategy(turn.verbatim);
        const isExplication = turn.tag && isExplicationStrategy(turn.verbatim);
        const isOuverture = turn.tag && isOuvertureStrategy(turn.verbatim);

        switch (filters.strategyType) {
          case "ENGAGEMENT":
            if (!isEngagement) return false;
            break;
          case "EXPLICATION":
            if (!isExplication) return false;
            break;
          case "OUVERTURE":
            if (!isOuverture) return false;
            break;
          case "REFLET":
            if (isEngagement || isExplication || isOuverture) return false;
            break;
        }
      }

      return true;
    });
  }, [taggedTurns, filters]);

  // Calculs des métriques cognitives
  const calculatedMetrics = useMemo((): CognitiveMetricsData => {
    if (filteredTurns.length === 0) {
      return {
        fluiditeCognitive: 0,
        reactionsDirectes: 0,
        reprisesLexicales: 0,
        chargeCognitive: 0,
        marqueursEffort: 0,
        patternsResistance: 0,
        robustesseStress: 0,
        niveauStress: 0,
        positionConversation: 0,
      };
    }

    // 1. TRAITEMENT AUTOMATIQUE - Fluidité Cognitive
    const fluiditeCognitive = calculateFluiditeCognitive(filteredTurns);

    // 2. TRAITEMENT AUTOMATIQUE - Réactions Directes
    const reactionsDirectes = calculateReactionsDirectes(filteredTurns);

    // 3. TRAITEMENT AUTOMATIQUE - Reprises Lexicales
    const reprisesLexicales = calculateReprisesLexicales(filteredTurns);

    // 4. CHARGE COGNITIVE - Score de Charge Cognitive
    const chargeCognitive = calculateChargeCognitive(filteredTurns);

    // 5. CHARGE COGNITIVE - Marqueurs d'Effort
    const marqueursEffort = calculateMarqueursEffort(filteredTurns);

    // 6. CHARGE COGNITIVE - Patterns de Résistance
    const patternsResistance = calculatePatternsResistance(filteredTurns);

    // 7. MODULATION CONTEXTUELLE - Robustesse au Stress
    const robustesseStress = calculateRobustesseStress(filteredTurns);

    // 8. MODULATION CONTEXTUELLE - Niveau de Stress
    const niveauStress = calculateNiveauStress(filteredTurns);

    // 9. MODULATION CONTEXTUELLE - Position dans Conversation
    const positionConversation = calculatePositionConversation(filteredTurns);

    return {
      fluiditeCognitive,
      reactionsDirectes,
      reprisesLexicales,
      chargeCognitive,
      marqueursEffort,
      patternsResistance,
      robustesseStress,
      niveauStress,
      positionConversation,
    };
  }, [filteredTurns]);

  // Effect pour gérer le loading et la mise à jour
  useEffect(() => {
    if (taggedTurns.length > 0) {
      setLoading(false);
      setLastUpdated(new Date());
      setError(null);
    } else {
      setLoading(true);
    }
  }, [taggedTurns, filters]);

  return {
    data: calculatedMetrics,
    loading,
    error,
    sampleSize: filteredTurns.length,
    lastUpdated,
  };
};

// ================ FONCTIONS DE CALCUL DES MÉTRIQUES ================

// 1. Score de Fluidité Cognitive
// Formule: (0.4 × Score_temporel) + (0.35 × Score_linguistique) + (0.25 × Score_prosodique)
function calculateFluiditeCognitive(turns: TaggedTurn[]): number {
  if (turns.length === 0) return 0;

  const scores = turns.map((turn) => {
    // Score temporel (basé sur la durée du verbatim comme proxy)
    const duration = turn.end_time - turn.start_time;
    const scoreTemporel = duration <= 3 ? 1.0 : duration <= 6 ? 0.5 : 0.0;

    // Score linguistique (absence de marqueurs d'hésitation)
    const scoreLinguistique = calculateAbsenceMarqueursEffort(
      turn.verbatim || turn.next_turn_verbatim || ""
    );

    // Score prosodique (approximé par la fluidité du verbatim)
    const scoreProsodique = calculateFluiditeText(
      turn.verbatim || turn.next_turn_verbatim || ""
    );

    return (
      0.4 * scoreTemporel + 0.35 * scoreLinguistique + 0.25 * scoreProsodique
    );
  });

  return (
    Math.round(
      (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100
    ) / 100
  );
}

// 2. Réactions Directes
// Formule: (Réactions_directes / Total_réactions) × 100
function calculateReactionsDirectes(turns: TaggedTurn[]): number {
  if (turns.length === 0) return 0;

  const reactionsDirectes = turns.filter((turn) => {
    const verbatim = (turn.next_turn_verbatim || "").toLowerCase();
    const directMarkers = [
      "d'accord",
      "oui",
      "très bien",
      "merci",
      "parfait",
      "ok",
    ];
    return directMarkers.some((marker) => verbatim.includes(marker));
  }).length;

  return Math.round((reactionsDirectes / turns.length) * 100);
}

// 3. Reprises Lexicales
// Formule: Reprises_verbes_action / Total_verbes_conseiller
function calculateReprisesLexicales(turns: TaggedTurn[]): number {
  if (turns.length === 0) return 0;

  let totalReprises = 0;
  let totalPossible = 0;

  turns.forEach((turn) => {
    const conseillerVerbatim = turn.verbatim || "";
    const clientVerbatim = turn.next_turn_verbatim || "";

    const verbesAction = extractVerbsAction(conseillerVerbatim);
    const clientWords = clientVerbatim.toLowerCase().split(" ");

    verbesAction.forEach((verbe) => {
      totalPossible++;
      if (
        clientWords.some((word: string) => word.includes(verbe.toLowerCase()))
      ) {
        totalReprises++;
      }
    });
  });

  return totalPossible > 0
    ? Math.round((totalReprises / totalPossible) * 100) / 100
    : 0;
}

// 4. Score de Charge Cognitive
// Formule: (0.4 × Complexité_stimulus) + (0.35 × Effort_traitement) + (0.25 × Vulnérabilité_contexte)
function calculateChargeCognitive(turns: TaggedTurn[]): number {
  if (turns.length === 0) return 0;

  const scores = turns.map((turn) => {
    const complexiteStimulus = calculateComplexiteStimulus(turn.verbatim || "");
    const effortTraitement =
      1 - calculateAbsenceMarqueursEffort(turn.next_turn_verbatim || "");
    const vulnerabiliteContexte = calculateVulnerabiliteContexte(turn);

    return (
      0.4 * complexiteStimulus +
      0.35 * effortTraitement +
      0.25 * vulnerabiliteContexte
    );
  });

  return (
    Math.round(
      (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100
    ) / 100
  );
}

// 5. Marqueurs d'Effort
// Formule: (Marqueurs_effort / Total_mots) × 100
function calculateMarqueursEffort(turns: TaggedTurn[]): number {
  if (turns.length === 0) return 0;

  let totalMarqueurs = 0;
  let totalMots = 0;

  turns.forEach((turn) => {
    const verbatim = turn.next_turn_verbatim || "";
    const mots = verbatim.split(" ").length;
    const marqueurs = countMarqueursEffort(verbatim);

    totalMots += mots;
    totalMarqueurs += marqueurs;
  });

  return totalMots > 0 ? Math.round((totalMarqueurs / totalMots) * 100) : 0;
}

// 6. Patterns de Résistance
// Formule: Somme_pondérée(Interruptions + Objections + Évitements)
function calculatePatternsResistance(turns: TaggedTurn[]): number {
  if (turns.length === 0) return 0;

  let totalResistance = 0;

  turns.forEach((turn) => {
    const verbatim = (turn.next_turn_verbatim || "").toLowerCase();

    // Objections explicites (poids 1.0)
    const objections = [
      "mais",
      "non",
      "c'est inadmissible",
      "je ne suis pas d'accord",
      "impossible",
    ];
    const objectionScore = objections.reduce(
      (score, obj) => score + (verbatim.includes(obj) ? 1.0 : 0),
      0
    );

    // Marqueurs d'évitement (poids 0.5)
    const evitements = ["enfin", "bon", "de toute façon", "peu importe"];
    const evitementScore = evitements.reduce(
      (score, ev) => score + (verbatim.includes(ev) ? 0.5 : 0),
      0
    );

    totalResistance += objectionScore + evitementScore;
  });

  return Math.round((totalResistance / turns.length) * 100) / 100;
}

// 7. Robustesse au Stress
// Formule: Efficacité_stress_élevé / Efficacité_stress_faible
function calculateRobustesseStress(turns: TaggedTurn[]): number {
  if (turns.length === 0) return 0;

  // Approximation basée sur la position dans la conversation et le contexte émotionnel
  // Plus la conversation avance, plus le stress s'accumule potentiellement

  const premiereTiers = turns.slice(0, Math.ceil(turns.length / 3));
  const dernierTiers = turns.slice(-Math.ceil(turns.length / 3));

  const efficaciteDebut = calculateEfficaciteMoyenne(premiereTiers);
  const efficaciteFin = calculateEfficaciteMoyenne(dernierTiers);

  return efficaciteDebut > 0
    ? Math.round((efficaciteFin / efficaciteDebut) * 100) / 100
    : 0;
}

// 8. Niveau de Stress
// Formule: Σ(Réactions_négatives × Poids_temporel)
function calculateNiveauStress(turns: TaggedTurn[]): number {
  if (turns.length === 0) return 0;

  let stressCumule = 0;

  turns.forEach((turn, index) => {
    const verbatim = (turn.next_turn_verbatim || "").toLowerCase();
    const poidsTemporel = Math.pow(0.9, turns.length - index - 1); // Décroissance temporelle

    // Détection de réactions négatives
    const marqueursNegatifs = [
      "inadmissible",
      "inacceptable",
      "scandaleux",
      "frustrant",
    ];
    const reactionNegative = marqueursNegatifs.some((marqueur) =>
      verbatim.includes(marqueur)
    )
      ? 1
      : 0;

    stressCumule += reactionNegative * poidsTemporel;
  });

  return Math.round(stressCumule * 100) / 100;
}

// 9. Position dans Conversation
// Formule: Tour_actuel / Total_tours_conversation
function calculatePositionConversation(turns: TaggedTurn[]): number {
  if (turns.length === 0) return 0;

  // Position moyenne pondérée dans les conversations
  const positions = turns.map((_, index) => (index + 1) / turns.length);
  const positionMoyenne =
    positions.reduce((sum, pos) => sum + pos, 0) / positions.length;

  return Math.round(positionMoyenne * 100) / 100;
}

// ================ FONCTIONS UTILITAIRES ================

function isEngagementStrategy(verbatim: string): boolean {
  const engagementMarkers = [
    "je vérifie",
    "je transfère",
    "je vous envoie",
    "j'ouvre",
    "je regarde",
  ];
  return engagementMarkers.some((marker) =>
    verbatim.toLowerCase().includes(marker)
  );
}

function isExplicationStrategy(verbatim: string): boolean {
  const explicationMarkers = [
    "notre politique",
    "le système fonctionne",
    "la procédure",
    "nous sommes obligés",
  ];
  return explicationMarkers.some((marker) =>
    verbatim.toLowerCase().includes(marker)
  );
}

function isOuvertureStrategy(verbatim: string): boolean {
  const ouvertureMarkers = [
    "vous allez recevoir",
    "vous pourrez",
    "vous devrez",
    "il faudra que vous",
  ];
  return ouvertureMarkers.some((marker) =>
    verbatim.toLowerCase().includes(marker)
  );
}

function calculateAbsenceMarqueursEffort(verbatim: string): number {
  const marqueurs = [
    "euh",
    "attendez",
    "alors",
    "ben",
    "donc",
    "en fait",
    "comment dire",
  ];
  const count = marqueurs.reduce(
    (sum, marqueur) =>
      sum + (verbatim.toLowerCase().split(marqueur).length - 1),
    0
  );
  const totalMots = verbatim.split(" ").length;

  return totalMots > 0 ? Math.max(0, 1 - (count / totalMots) * 5) : 1;
}

function calculateFluiditeText(verbatim: string): number {
  // Approximation de la fluidité basée sur la longueur des phrases et la ponctuation
  const phrases = verbatim.split(/[.!?]/).filter((p) => p.trim().length > 0);
  if (phrases.length === 0) return 1;

  const longueurMoyenne =
    phrases.reduce((sum, phrase) => sum + phrase.trim().split(" ").length, 0) /
    phrases.length;

  // Fluidité optimale pour des phrases de 5-15 mots
  return longueurMoyenne >= 5 && longueurMoyenne <= 15 ? 1 : 0.5;
}

function extractVerbsAction(verbatim: string): string[] {
  const verbesAction = [
    "vérifie",
    "transfère",
    "envoie",
    "ouvre",
    "regarde",
    "confirme",
    "valide",
  ];
  return verbesAction.filter((verbe) => verbatim.toLowerCase().includes(verbe));
}

function calculateComplexiteStimulus(verbatim: string): number {
  // Complexité basée sur la longueur et la présence de termes techniques
  const mots = verbatim.split(" ").length;
  const termesComplexes = [
    "procédure",
    "réglementation",
    "politique",
    "système",
    "protocole",
  ];
  const complexite = termesComplexes.reduce(
    (count, terme) => count + (verbatim.toLowerCase().includes(terme) ? 1 : 0),
    0
  );

  return Math.min(1, mots / 20 + complexite * 0.2);
}

function calculateVulnerabiliteContexte(turn: TaggedTurn): number {
  // Basé sur la présence de marqueurs émotionnels dans le contexte
  const contexteEmotionnel = (
    turn.verbatim +
    " " +
    turn.next_turn_verbatim
  ).toLowerCase();
  const marqueursStress = [
    "urgent",
    "problème",
    "inadmissible",
    "inacceptable",
  ];

  return marqueursStress.reduce(
    (score, marqueur) =>
      score + (contexteEmotionnel.includes(marqueur) ? 0.25 : 0),
    0
  );
}

function countMarqueursEffort(verbatim: string): number {
  const marqueurs = [
    "euh",
    "attendez",
    "alors",
    "ben",
    "donc",
    "en fait",
    "je ne comprends pas",
  ];
  return marqueurs.reduce(
    (count, marqueur) =>
      count + (verbatim.toLowerCase().split(marqueur).length - 1),
    0
  );
}

function calculateEfficaciteMoyenne(turns: TaggedTurn[]): number {
  if (turns.length === 0) return 0;

  const efficacites = turns.map((turn) => {
    const verbatim = (turn.next_turn_verbatim || "").toLowerCase();
    const positifMarkers = ["d'accord", "merci", "très bien"];
    const negatifMarkers = ["non", "inadmissible", "impossible"];

    if (positifMarkers.some((marker) => verbatim.includes(marker))) return 1;
    if (negatifMarkers.some((marker) => verbatim.includes(marker))) return 0;
    return 0.5;
  });

  return (
    efficacites.reduce((sum: number, eff: number) => sum + eff, 0) /
    efficacites.length
  );
}
