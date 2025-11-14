/**
 * CommonGroundIndicator - Version finale propre
 * Aucune duplication, aucune erreur TypeScript
 */

// Types de base
interface TurnTaggedData {
  verbatim: string;
  next_turn_verbatim?: string;
  start_time: number;
  end_time: number;
  tag: string;
  speaker: string;
}

interface CommonGroundResult {
  value: "CG_ETABLI" | "CG_NEGOCIE" | "CG_ROMPU";
  confidence: number;
  explanation: string;
  details: {
    shared_references: number;
    breakdown_detected: boolean;
    semantic_similarity?: number;
    detected_markers: string[];
  };
}

interface FeedbackAlignmentResult {
  value: "ALIGNEMENT_FORT" | "ALIGNEMENT_FAIBLE" | "DESALIGNEMENT";
  confidence: number;
  explanation: string;
  details: {
    positive_markers: string[];
    negative_markers: string[];
    sentiment_score?: number;
  };
}

// Algorithme Common Ground
class CommonGroundAnalyzer {
  analyze(data: TurnTaggedData[]): CommonGroundResult[] {
    const results: CommonGroundResult[] = [];

    for (const turn of data) {
      const result = this.analyzeCommonGround(turn);
      results.push(result);
    }

    return results;
  }

  private analyzeCommonGround(turn: TurnTaggedData): CommonGroundResult {
    const conseillerVerbatim = turn.verbatim || "";
    const clientVerbatim = turn.next_turn_verbatim || "";

    // Indicateurs de références partagées
    const sharedIndicators = {
      temporal: ["maintenant", "aujourd'hui", "ce matin", "hier", "demain"],
      spatial: ["votre dossier", "votre compte", "notre système"],
      personal: ["votre", "notre", "ensemble", "nous", "vous"],
      procedural: ["cette procédure", "votre demande", "cette démarche"],
    };

    // Compter les références partagées
    let sharedCount = 0;
    const detectedMarkers: string[] = [];

    Object.values(sharedIndicators)
      .flat()
      .forEach((indicator) => {
        if (
          conseillerVerbatim.toLowerCase().includes(indicator.toLowerCase()) &&
          clientVerbatim.toLowerCase().includes(indicator.toLowerCase())
        ) {
          sharedCount++;
          detectedMarkers.push(indicator);
        }
      });

    // Détection ruptures de compréhension
    const breakdownMarkers = [
      "je ne comprends pas",
      "comment ça",
      "pardon",
      "quoi",
      "qu'est-ce que vous voulez dire",
      "je ne vois pas",
    ];

    const breakdownDetected = breakdownMarkers.some((marker) =>
      clientVerbatim.toLowerCase().includes(marker.toLowerCase())
    );

    // Calcul du score
    const totalPossibleRefs = Object.values(sharedIndicators).flat().length;
    const sharedScore = sharedCount / Math.max(totalPossibleRefs, 1);

    // Classification finale
    let cgStatus: "CG_ETABLI" | "CG_NEGOCIE" | "CG_ROMPU";

    if (breakdownDetected) {
      cgStatus = "CG_ROMPU";
    } else if (sharedScore > 0.3) {
      cgStatus = "CG_ETABLI";
    } else {
      cgStatus = "CG_NEGOCIE";
    }

    // Calcul de la confiance
    let confidence = 0.5;
    if (breakdownDetected) {
      confidence = 0.9;
    } else if (sharedScore > 0.2) {
      confidence = 0.7 + sharedScore * 0.3;
    } else if (sharedCount > 0) {
      confidence = 0.6;
    }

    return {
      value: cgStatus,
      confidence: Math.min(1, confidence),
      explanation: `Common Ground ${cgStatus}: ${sharedCount} références partagées${
        breakdownDetected ? ", rupture détectée" : ""
      }`,
      details: {
        shared_references: sharedCount,
        breakdown_detected: breakdownDetected,
        semantic_similarity: sharedScore,
        detected_markers: detectedMarkers,
      },
    };
  }
}

// Algorithme Alignment
class AlignmentAnalyzer {
  analyze(data: TurnTaggedData[]): FeedbackAlignmentResult[] {
    const results: FeedbackAlignmentResult[] = [];

    for (const turn of data) {
      const result = this.analyzeAlignment(turn);
      results.push(result);
    }

    return results;
  }

  private analyzeAlignment(turn: TurnTaggedData): FeedbackAlignmentResult {
    const verbatim = (turn.next_turn_verbatim || "").toLowerCase();

    // Signaux d'alignement fort
    const strongAlignment = [
      "d'accord",
      "exactement",
      "parfait",
      "merci",
      "très bien",
      "tout à fait",
      "absolument",
      "c'est ça",
      "voilà",
    ];

    // Signaux de désalignement
    const disalignment = [
      "mais",
      "non",
      "pas du tout",
      "inadmissible",
      "impossible",
      "je ne suis pas d'accord",
      "c'est faux",
      "absolument pas",
    ];

    // Détection des marqueurs
    const positiveMarkers = strongAlignment.filter((marker) =>
      verbatim.includes(marker)
    );
    const negativeMarkers = disalignment.filter((marker) =>
      verbatim.includes(marker)
    );

    // Classification
    let alignmentStatus:
      | "ALIGNEMENT_FORT"
      | "ALIGNEMENT_FAIBLE"
      | "DESALIGNEMENT";
    let confidence = 0.5;

    if (negativeMarkers.length > 0) {
      alignmentStatus = "DESALIGNEMENT";
      confidence = 0.8 + negativeMarkers.length * 0.1;
    } else if (positiveMarkers.length > 0) {
      alignmentStatus = "ALIGNEMENT_FORT";
      confidence = 0.9;
    } else {
      alignmentStatus = "ALIGNEMENT_FAIBLE";
      confidence = 0.6;
    }

    // Score sentiment basique
    const sentimentScore =
      (positiveMarkers.length - negativeMarkers.length) / 3;

    return {
      value: alignmentStatus,
      confidence: Math.min(1, confidence),
      explanation: `${alignmentStatus}: ${positiveMarkers.length} signaux positifs, ${negativeMarkers.length} signaux négatifs`,
      details: {
        positive_markers: positiveMarkers,
        negative_markers: negativeMarkers,
        sentiment_score: Math.max(-1, Math.min(1, sentimentScore)),
      },
    };
  }
}

// Hook d'utilisation
export const useCommonGroundMetrics = (data: TurnTaggedData[]) => {
  const cgAnalyzer = new CommonGroundAnalyzer();
  const alignmentAnalyzer = new AlignmentAnalyzer();

  const cgResults = cgAnalyzer.analyze(data);
  const alignmentResults = alignmentAnalyzer.analyze(data);

  // Statistiques globales
  const cgStats = {
    etabli: cgResults.filter((r) => r.value === "CG_ETABLI").length,
    negocie: cgResults.filter((r) => r.value === "CG_NEGOCIE").length,
    rompu: cgResults.filter((r) => r.value === "CG_ROMPU").length,
    total: cgResults.length,
  };

  const alignmentStats = {
    fort: alignmentResults.filter((r) => r.value === "ALIGNEMENT_FORT").length,
    faible: alignmentResults.filter((r) => r.value === "ALIGNEMENT_FAIBLE")
      .length,
    desalignement: alignmentResults.filter((r) => r.value === "DESALIGNEMENT")
      .length,
    total: alignmentResults.length,
  };

  return {
    commonGroundResults: cgResults,
    alignmentResults: alignmentResults,
    cgStats,
    alignmentStats,
    averageConfidence: {
      commonGround:
        cgResults.reduce((sum, r) => sum + r.confidence, 0) /
          cgResults.length || 0,
      alignment:
        alignmentResults.reduce((sum, r) => sum + r.confidence, 0) /
          alignmentResults.length || 0,
    },
  };
};

// Exports uniques (pas de duplication)
export type { CommonGroundResult, FeedbackAlignmentResult, TurnTaggedData };
