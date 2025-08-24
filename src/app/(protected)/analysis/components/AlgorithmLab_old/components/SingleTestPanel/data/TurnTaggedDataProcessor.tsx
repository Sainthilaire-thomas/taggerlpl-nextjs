// TurntaggedDataProcessor.ts - Version utilisant le contexte existant
import { TaggedTurn } from "@/context/TaggingDataContext";

// Types pour les données de validation
export interface TurnTaggedRow {
  id: number;
  call_id: string;
  tag: string;
  verbatim: string;
  next_turn_tag: string;
  next_turn_verbatim: string;
  speaker: string;
  start_time: number;
  end_time: number;
}

export interface ValidationPair {
  id: number;
  // Input pour algorithmes
  conseillerVerbatim: string;
  conseillerStrategy: string;
  clientVerbatim: string;

  // Gold standards pour validation
  expectedStrategyClassification: string; // Test 1: accord classification
  expectedClientReaction: string; // Test 2: prédiction réaction

  // Métadonnées
  callId: string;
  speaker: string;
  strategyFamily: string;
  timeRange: [number, number];
}

export interface ValidationCorpus {
  pairs: ValidationPair[];
  statistics: {
    totalPairs: number;
    strategiesCounts: Record<string, number>;
    reactionsCounts: Record<string, number>;
    familiesCounts: Record<string, number>;
  };
  filters: {
    strategies: string[];
    reactions: string[];
    families: string[];
  };
}

export default class TurntaggedDataProcessor {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  async debugClientTags(): Promise<string[]> {
    try {
      const { data: debugTags, error } = await this.supabase
        .from("turntagged")
        .select("next_turn_tag")
        .not("next_turn_tag", "is", null)
        .limit(20);

      if (error) {
        console.error("Erreur debug tags:", error);
        return [];
      }

      if (!debugTags) {
        return [];
      }

      const uniqueTags = [
        ...new Set(debugTags.map((d: any) => d.next_turn_tag)),
      ];
      console.log("🔍 DEBUG: Tags client uniques trouvés:", uniqueTags);

      return uniqueTags;
    } catch (error) {
      console.error("Erreur lors du debug des tags:", error);
      return [];
    }
  }
  /**
   * Utilise les données du contexte pour créer le corpus de validation
   */
  async loadValidationCorpus(filters?: {
    strategies?: string[];
    reactions?: string[];
    families?: string[];
    maxRecords?: number;
    origine?: string;
  }): Promise<ValidationCorpus> {
    try {
      console.log("🔄 Chargement corpus depuis contexte existant...");

      let query = this.supabase
        .from("turntagged")
        .select(
          `
        id, call_id, tag, verbatim, next_turn_tag, next_turn_verbatim, 
        speaker, start_time, end_time,
        lpltag!inner(family, originespeaker)
      `
        )
        .not("tag", "is", null)
        .not("next_turn_tag", "is", null)
        .not("verbatim", "is", null)
        .not("next_turn_verbatim", "is", null);

      // Filtres par défaut basés sur le contexte existant
      if (!filters?.strategies?.length && !filters?.families?.length) {
        query = query.in("lpltag.family", [
          "REFLET",
          "OUVERTURE",
          "ENGAGEMENT",
          "EXPLICATION",
        ]);
      }

      if (filters?.strategies?.length) {
        query = query.in("tag", filters.strategies);
      }

      if (filters?.families?.length) {
        query = query.in("lpltag.family", filters.families);
      }

      // CORRECTION : Utiliser le format réel de la base
      if (!filters?.reactions?.length) {
        query = query.in("next_turn_tag", [
          "CLIENT POSITIF", // ✅ Format réel dans la base
          "CLIENT NEGATIF",
          "CLIENT NEUTRE",
        ]);
      } else {
        query = query.in("next_turn_tag", filters.reactions);
      }

      // Limite
      if (filters?.maxRecords) {
        query = query.limit(filters.maxRecords);
      }

      const { data, error } = await query;

      if (error) {
        console.error("❌ Erreur chargement turntagged:", error);
        throw new Error(`Erreur base de données: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.warn("⚠️ Aucune donnée trouvée avec ces filtres:", {
          appliedFilters: {
            families: filters?.families || [
              "REFLET",
              "OUVERTURE",
              "ENGAGEMENT",
              "EXPLICATION",
            ],
            reactions: filters?.reactions || [
              "CLIENT POSITIF",
              "CLIENT NEGATIF",
              "CLIENT NEUTRE",
            ],
            strategies: filters?.strategies || "toutes",
          },
        });

        // Debug : essayer une requête simple pour voir ce qui existe
        const { data: debugData } = await this.supabase
          .from("turntagged")
          .select("id, tag, next_turn_tag")
          .limit(5);

        console.log("🔍 Échantillon debug turntagged:", debugData);

        return this.createEmptyCorpus();
      }

      console.log(`✅ ${data.length} paires chargées depuis turntagged`);

      // Transformation en ValidationPair
      const pairs: ValidationPair[] = data.map((row: any) => ({
        id: row.id,

        // Input algorithmes
        conseillerVerbatim: row.verbatim,
        conseillerStrategy: row.tag,
        clientVerbatim: row.next_turn_verbatim,

        // Gold standards - IMPORTANT : Normaliser le format
        expectedStrategyClassification: row.tag,
        expectedClientReaction: this.normalizeClientReaction(row.next_turn_tag),

        // Métadonnées
        callId: row.call_id,
        speaker: row.speaker,
        strategyFamily: row.lpltag?.family || "UNKNOWN",
        timeRange: [row.start_time, row.end_time],
      }));

      // Calcul statistiques
      const statistics = this.calculateCorpusStatistics(pairs);
      const filters_available = this.extractAvailableFilters(pairs);

      console.log("📊 Statistiques corpus:", statistics);

      return {
        pairs,
        statistics,
        filters: filters_available,
      };
    } catch (error) {
      console.error("❌ Erreur lors du chargement du corpus:", error);
      throw error;
    }
  }

  /**
   * Normalise les tags client pour cohérence
   */
  private normalizeClientReaction(clientTag: string): string {
    const upperTag = clientTag.toUpperCase();

    // Conversion : "CLIENT POSITIF" -> "POSITIF"
    if (upperTag.includes("POSITIF")) return "POSITIF";
    if (upperTag.includes("NEGATIF")) return "NEGATIF";
    if (upperTag.includes("NEUTRE")) return "NEUTRE";

    // Fallback - garder le tag original
    return clientTag;
  }

  /**
   * Filtre le corpus selon critères spécifiques
   */
  filterCorpus(
    corpus: ValidationCorpus,
    filters: {
      strategiesByFamily?: Record<string, string[]>;
      reactions?: string[];
      minConfidenceScore?: number;
    }
  ): ValidationCorpus {
    let filteredPairs = [...corpus.pairs];

    // Filtre par stratégies par famille
    if (filters.strategiesByFamily) {
      const allowedStrategies = Object.values(
        filters.strategiesByFamily
      ).flat();
      filteredPairs = filteredPairs.filter((pair) =>
        allowedStrategies.includes(pair.expectedStrategyClassification)
      );
    }

    // Filtre par réactions
    if (filters.reactions?.length) {
      filteredPairs = filteredPairs.filter((pair) =>
        filters.reactions!.includes(pair.expectedClientReaction)
      );
    }

    const newStatistics = this.calculateCorpusStatistics(filteredPairs);
    const newFilters = this.extractAvailableFilters(filteredPairs);

    return {
      pairs: filteredPairs,
      statistics: newStatistics,
      filters: newFilters,
    };
  }

  /**
   * Prépare les données d'entrée pour les algorithmes
   */
  prepareAlgorithmInput(pairs: ValidationPair[]): any[] {
    const algorithmInput = pairs.map((pair, index) => ({
      // Champs de base
      id: pair.id,

      // Format TaggedTurn compatible avec BasicAlignmentAlgorithm
      verbatim: pair.conseillerVerbatim,
      next_turn_verbatim: pair.clientVerbatim, // Snake_case requis par l'algorithme
      next_turn_tag: pair.expectedClientReaction, // Crucial pour isClientTag()

      // Métadonnées du turn
      tag: pair.conseillerStrategy, // Tag du tour conseiller
      family: pair.strategyFamily, // Famille de stratégie
      speaker: pair.speaker,
      call_id: pair.callId,
      start_time: pair.timeRange[0],
      end_time: pair.timeRange[1],

      // Champs additionnels pour compatibilité
      strategy: pair.conseillerStrategy, // Alias
      nextTurnVerbatim: pair.clientVerbatim, // Alias camelCase

      metadata: {
        callId: pair.callId,
        timing: pair.timeRange,
      },
    }));

    // DEBUG : Vérifier le format des données
    console.log("🔍 DEBUG prepareAlgorithmInput - Premier échantillon:");
    console.log("Données d'entrée (3 premiers):", algorithmInput.slice(0, 3));

    // Vérifier les champs critiques pour BasicAlignmentAlgorithm
    const sample = algorithmInput[0];
    if (sample) {
      console.log("🔍 Format échantillon:");
      console.log(
        "- verbatim:",
        typeof sample.verbatim,
        sample.verbatim?.length,
        "chars"
      );
      console.log(
        "- next_turn_verbatim:",
        typeof sample.next_turn_verbatim,
        sample.next_turn_verbatim?.length,
        "chars"
      );
      console.log("- next_turn_tag:", sample.next_turn_tag);
      console.log("- family:", sample.family);
      console.log("- tag:", sample.tag);
    }

    // Vérifier que les verbatims ne sont pas vides/null
    const emptyVerbatims = algorithmInput.filter(
      (item) => !item.verbatim || item.verbatim.trim().length === 0
    );
    console.log(
      "⚠️ Verbatims vides:",
      emptyVerbatims.length,
      "/",
      algorithmInput.length
    );

    const emptyNextTurn = algorithmInput.filter(
      (item) =>
        !item.next_turn_verbatim || item.next_turn_verbatim.trim().length === 0
    );
    console.log(
      "⚠️ NextTurnVerbatims vides:",
      emptyNextTurn.length,
      "/",
      algorithmInput.length
    );

    // Vérifier les tags client pour isClientTag()
    const clientTags = new Set(
      algorithmInput.map((item) => item.next_turn_tag).filter(Boolean)
    );
    console.log("🏷️ Tags client trouvés:", Array.from(clientTags));

    // Vérifier la correspondance avec CLIENT_TURN_PATTERNS
    const CLIENT_TURN_PATTERNS = ["CLIENT", "POSITIF", "NEGATIF", "NEUTRE"];
    const matchingTags = Array.from(clientTags).filter((tag) =>
      CLIENT_TURN_PATTERNS.some((pattern) =>
        tag.toUpperCase().includes(pattern)
      )
    );
    console.log("✅ Tags correspondant aux patterns:", matchingTags);

    if (matchingTags.length === 0) {
      console.warn(
        "⚠️ ATTENTION: Aucun tag client ne correspond aux patterns attendus!"
      );
      console.warn("Patterns attendus:", CLIENT_TURN_PATTERNS);
      console.warn("Tags trouvés:", Array.from(clientTags));
    }

    return algorithmInput;
  }

  /**
   * Extrait le gold standard pour validation
   */
  extractGoldStandard(pairs: ValidationPair[]): {
    classification: Array<{ input: string; expected: string; family: string }>;
    prediction: Array<{ input: string; strategy: string; expected: string }>;
  } {
    return {
      classification: pairs.map((pair) => ({
        input: pair.conseillerVerbatim,
        expected: pair.expectedStrategyClassification,
        family: pair.strategyFamily,
      })),
      prediction: pairs.map((pair) => ({
        input: pair.conseillerVerbatim,
        strategy: pair.conseillerStrategy,
        expected: pair.expectedClientReaction,
      })),
    };
  }

  /**
   * Calcule les statistiques du corpus
   */
  private calculateCorpusStatistics(
    pairs: ValidationPair[]
  ): ValidationCorpus["statistics"] {
    const strategiesCounts: Record<string, number> = {};
    const reactionsCounts: Record<string, number> = {};
    const familiesCounts: Record<string, number> = {};

    pairs.forEach((pair) => {
      // Comptage stratégies
      strategiesCounts[pair.expectedStrategyClassification] =
        (strategiesCounts[pair.expectedStrategyClassification] || 0) + 1;

      // Comptage réactions
      reactionsCounts[pair.expectedClientReaction] =
        (reactionsCounts[pair.expectedClientReaction] || 0) + 1;

      // Comptage familles
      familiesCounts[pair.strategyFamily] =
        (familiesCounts[pair.strategyFamily] || 0) + 1;
    });

    return {
      totalPairs: pairs.length,
      strategiesCounts,
      reactionsCounts,
      familiesCounts,
    };
  }

  /**
   * Extrait les filtres disponibles
   */
  private extractAvailableFilters(
    pairs: ValidationPair[]
  ): ValidationCorpus["filters"] {
    const strategies = [
      ...new Set(pairs.map((p) => p.expectedStrategyClassification)),
    ];
    const reactions = [...new Set(pairs.map((p) => p.expectedClientReaction))];
    const families = [...new Set(pairs.map((p) => p.strategyFamily))];

    return {
      strategies: strategies.sort(),
      reactions: reactions.sort(),
      families: families.sort(),
    };
  }

  /**
   * Crée un corpus vide
   */
  private createEmptyCorpus(): ValidationCorpus {
    return {
      pairs: [],
      statistics: {
        totalPairs: 0,
        strategiesCounts: {},
        reactionsCounts: {},
        familiesCounts: {},
      },
      filters: {
        strategies: [],
        reactions: [],
        families: [],
      },
    };
  }

  /**
   * Échantillonnage stratifié du corpus
   */
  stratifiedSample(
    corpus: ValidationCorpus,
    sampleSize: number,
    stratifyBy: "strategy" | "reaction" | "family" = "strategy"
  ): ValidationCorpus {
    if (corpus.pairs.length <= sampleSize) {
      return corpus;
    }

    const groupKey =
      stratifyBy === "strategy"
        ? "expectedStrategyClassification"
        : stratifyBy === "reaction"
        ? "expectedClientReaction"
        : "strategyFamily";

    // Grouper par critère de stratification
    const groups: Record<string, ValidationPair[]> = {};
    corpus.pairs.forEach((pair) => {
      const key = pair[groupKey as keyof ValidationPair] as string;
      if (!groups[key]) groups[key] = [];
      groups[key].push(pair);
    });

    // Échantillonnage proportionnel
    const sampledPairs: ValidationPair[] = [];
    const groupKeys = Object.keys(groups);

    groupKeys.forEach((key) => {
      const groupSize = groups[key].length;
      const sampleForGroup = Math.max(
        1,
        Math.round((groupSize / corpus.pairs.length) * sampleSize)
      );

      // Échantillonnage aléatoire dans le groupe
      const shuffled = [...groups[key]].sort(() => Math.random() - 0.5);
      sampledPairs.push(...shuffled.slice(0, sampleForGroup));
    });

    // Si pas assez d'échantillons, compléter aléatoirement
    if (sampledPairs.length < sampleSize) {
      const remaining = corpus.pairs.filter((p) => !sampledPairs.includes(p));
      const needed = sampleSize - sampledPairs.length;
      const shuffledRemaining = remaining.sort(() => Math.random() - 0.5);
      sampledPairs.push(...shuffledRemaining.slice(0, needed));
    }

    const newStatistics = this.calculateCorpusStatistics(sampledPairs);
    const newFilters = this.extractAvailableFilters(sampledPairs);

    return {
      pairs: sampledPairs,
      statistics: newStatistics,
      filters: newFilters,
    };
  }
}
