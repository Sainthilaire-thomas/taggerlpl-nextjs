// src/app/(protected)/analysis/components/shared/hooks/useScientificReferences.ts

import { useMemo } from "react";

// Types (identiques à ceux du composant)
interface ScientificSource {
  authors: string[];
  year: number;
  title: string;
  journal?: string;
  doi?: string;
  url?: string;
  type: "article" | "book" | "conference" | "thesis";
}

interface AlgorithmPrinciple {
  name: string;
  description: string;
  keyPoints: string[];
  complexity: "low" | "medium" | "high";
  domain: "cognitive" | "linguistic" | "temporal" | "hybrid";
}

interface ScientificReference {
  id: string;
  principle: AlgorithmPrinciple;
  sources: ScientificSource[];
}

export const useScientificReferences = () => {
  // Base de données des références scientifiques
  const scientificReferences: ScientificReference[] = useMemo(
    () => [
      {
        id: "basic_fluidity",
        principle: {
          name: "Analyse de Fluidité Basique",
          description:
            "Mesure temporelle et linguistique de la fluidité conversationnelle basée sur le débit de parole et les marqueurs d'hésitation.",
          keyPoints: [
            "Calcul du débit de parole (mots/seconde)",
            "Détection des marqueurs d'hésitation",
            "Analyse de la densité prosodique",
            "Score composite pondéré",
          ],
          complexity: "low",
          domain: "linguistic",
        },
        sources: [
          {
            authors: ["Bortfeld", "H.", "Leon", "S. D.", "Bloom", "J. E."],
            year: 2001,
            title:
              "Disfluency rates in conversation: Effects of age, relationship, topic, role, and gender",
            journal: "Language and Speech",
            doi: "10.1177/00238309010440040101",
            type: "article",
          },
          {
            authors: ["Goldman-Eisler", "F."],
            year: 1968,
            title: "Psycholinguistics: Experiments in spontaneous speech",
            journal: "Academic Press",
            type: "book",
          },
        ],
      },
      {
        id: "mirror_neuron",
        principle: {
          name: "Théorie des Neurones Miroirs",
          description:
            "Analyse de l'empathie automatique et de la synchronisation conversationnelle basée sur les découvertes de Gallese sur les neurones miroirs.",
          keyPoints: [
            "Détection des marqueurs d'empathie automatique",
            "Mesure de la synchronisation temporelle",
            "Analyse des reprises lexicales",
            "Score de résonance émotionnelle",
          ],
          complexity: "high",
          domain: "cognitive",
        },
        sources: [
          {
            authors: ["Gallese", "V."],
            year: 2007,
            title:
              "Before and below 'theory of mind': embodied simulation and the neural correlates of social cognition",
            journal: "Philosophical Transactions of the Royal Society B",
            doi: "10.1098/rstb.2007.2055",
            url: "https://royalsocietypublishing.org/doi/10.1098/rstb.2007.2055",
            type: "article",
          },
          {
            authors: ["Rizzolatti", "G.", "Craighero", "L."],
            year: 2004,
            title: "The mirror-neuron system",
            journal: "Annual Review of Neuroscience",
            doi: "10.1146/annurev.neuro.27.070203.144230",
            type: "article",
          },
          {
            authors: ["Iacoboni", "M."],
            year: 2009,
            title: "Imitation, empathy, and mirror neurons",
            journal: "Annual Review of Psychology",
            doi: "10.1146/annurev.psych.60.110707.163604",
            type: "article",
          },
        ],
      },
      {
        id: "hybrid_cognitive",
        principle: {
          name: "Modèle Cognitif Hybride",
          description:
            "Combinaison d'algorithmes de machine learning et d'expertise cognitive pour une analyse multi-dimensionnelle de la fluidité.",
          keyPoints: [
            "Extraction de features multi-modales",
            "Prédiction par modèles ML entraînés",
            "Ajustement par règles expertes",
            "Validation croisée cognitive",
          ],
          complexity: "high",
          domain: "hybrid",
        },
        sources: [
          {
            authors: ["Kahneman", "D."],
            year: 2011,
            title: "Thinking, Fast and Slow",
            journal: "Farrar, Straus and Giroux",
            type: "book",
          },
          {
            authors: ["Evans", "J. St. B. T."],
            year: 2008,
            title:
              "Dual-process accounts of reasoning, judgment, and social cognition",
            journal: "Annual Review of Psychology",
            doi: "10.1146/annurev.psych.59.103006.093629",
            type: "article",
          },
          {
            authors: ["Stanovich", "K. E.", "West", "R. F."],
            year: 2000,
            title:
              "Individual differences in reasoning: Implications for the rationality debate?",
            journal: "Behavioral and Brain Sciences",
            doi: "10.1017/S0140525X00003435",
            type: "article",
          },
        ],
      },
      {
        id: "temporal_analysis",
        principle: {
          name: "Analyse Temporelle Avancée",
          description:
            "Mesure précise des patterns temporels de la parole pour identifier les charges cognitives et les automatismes.",
          keyPoints: [
            "Analyse des pauses inter-tours",
            "Détection des overlaps conversationnels",
            "Mesure de la latence de réponse",
            "Modélisation des rythmes dialogiques",
          ],
          complexity: "medium",
          domain: "temporal",
        },
        sources: [
          {
            authors: ["Levinson", "S. C.", "Torreira", "F."],
            year: 2015,
            title:
              "Timing in turn-taking and its implications for processing models of language",
            journal: "Frontiers in Psychology",
            doi: "10.3389/fpsyg.2015.00731",
            type: "article",
          },
          {
            authors: ["Stivers", "T.", "Enfield", "N. J."],
            year: 2010,
            title:
              "A coding scheme for question–response sequences in conversation",
            journal: "Journal of Pragmatics",
            doi: "10.1016/j.pragma.2009.12.019",
            type: "article",
          },
        ],
      },
    ],
    []
  );

  // Fonction pour obtenir une référence par ID
  const getReferenceById = (id: string): ScientificReference | undefined => {
    return scientificReferences.find((ref) => ref.id === id);
  };

  // Fonction pour obtenir toutes les références d'un domaine
  const getReferencesByDomain = (domain: string): ScientificReference[] => {
    return scientificReferences.filter(
      (ref) => ref.principle.domain === domain
    );
  };

  // Fonction pour obtenir les références par complexité
  const getReferencesByComplexity = (
    complexity: string
  ): ScientificReference[] => {
    return scientificReferences.filter(
      (ref) => ref.principle.complexity === complexity
    );
  };

  // Statistiques des références
  const getReferencesStats = () => {
    const totalSources = scientificReferences.reduce(
      (acc, ref) => acc + ref.sources.length,
      0
    );
    const domainDistribution = scientificReferences.reduce((acc, ref) => {
      acc[ref.principle.domain] = (acc[ref.principle.domain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalReferences: scientificReferences.length,
      totalSources,
      averageSourcesPerReference: totalSources / scientificReferences.length,
      domainDistribution,
    };
  };

  return {
    scientificReferences,
    getReferenceById,
    getReferencesByDomain,
    getReferencesByComplexity,
    getReferencesStats,
  };
};
