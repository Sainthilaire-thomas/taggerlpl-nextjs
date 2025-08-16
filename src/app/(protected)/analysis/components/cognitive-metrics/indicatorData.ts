// src/components/cognitive-metrics/indicatorData.ts

import React from "react";
import { IndicatorDescription, CategoryData, IndicatorKey } from "./types";
import {
  Speed as AutomaticIcon,
  Memory as LoadIcon,
  TrendingUp as PerformanceIcon,
} from "@mui/icons-material";

export const indicatorDescriptions: Record<IndicatorKey, IndicatorDescription> =
  {
    fluiditeCognitive: {
      title: "Score de Fluidité Cognitive",
      description:
        "Mesure l'automatisme du traitement via les neurones miroirs selon la théorie de Gallese (2007).",
      formula:
        "Score = (0.4 × Score_temporel) + (0.35 × Score_linguistique) + (0.25 × Score_prosodique)",
      interpretation:
        "Score élevé (>0.7) = Traitement automatique optimal. Score faible (<0.3) = Effort cognitif requis.",
      examples:
        "Réactions immédiates ('d'accord'), absence de marqueurs d'hésitation, débit fluide.",
      references: "Gallese, V. (2007). Neurones miroirs et simulation incarnée",
    },
    reactionsDirectes: {
      title: "Réactions Directes",
      description:
        "Pourcentage de réactions clients immédiates sans demande de clarification.",
      formula: "% = (Réactions_directes / Total_réactions) × 100",
      interpretation:
        "Taux élevé = Compréhension immédiate. Taux faible = Confusion ou résistance.",
      examples:
        "'Oui', 'D'accord', 'Merci' vs 'Comment ?', 'Qu'est-ce que vous voulez dire ?'",
      references:
        "Chen & Yuan (2008). Système des neurones miroirs action-langage",
    },
    reprisesLexicales: {
      title: "Reprises Lexicales",
      description:
        "Alignement linguistique automatique : reprise des verbes d'action du conseiller par le client.",
      formula: "Score = Reprises_verbes_action / Total_verbes_conseiller",
      interpretation:
        "Score élevé = Synchronisation cognitive. Score faible = Désalignement.",
      examples:
        "Conseiller: 'Je vérifie' → Client: 'Quand vous aurez vérifié...'",
      references: "Pickering & Garrod (2004). Alignement interactionnel",
    },
    chargeCognitive: {
      title: "Score de Charge Cognitive",
      description:
        "Effort cognitif requis pour traiter les métaphores selon Lakoff & Johnson (1980).",
      formula:
        "Score = (0.4 × Complexité_stimulus) + (0.35 × Effort_traitement) + (0.25 × Vulnérabilité_contexte)",
      interpretation:
        "Score élevé (>0.6) = Surcharge cognitive. Score faible = Traitement fluide.",
      examples:
        "Métaphores organisationnelles : 'le système fonctionne comme...', 'notre politique exige...'",
      references: "Pierce et al. (2010). Effet d'interférence métaphorique",
    },
    marqueursEffort: {
      title: "Marqueurs d'Effort",
      description:
        "Indicateurs linguistiques de difficulté cognitive : hésitations, clarifications.",
      formula: "% = (Marqueurs_effort / Total_mots) × 100",
      interpretation:
        "Taux élevé = Traitement difficile. Taux faible = Compréhension fluide.",
      examples:
        "'euh', 'attendez', 'alors', 'comment dire', 'je ne comprends pas'",
      references: "Chiappe & Chiappe (2007). Mémoire de travail et métaphores",
    },
    patternsResistance: {
      title: "Patterns de Résistance",
      description:
        "Manifestations de résistance cognitive : interruptions, objections, évitement.",
      formula:
        "Score = Somme_pondérée(Interruptions + Objections + Évitements)",
      interpretation:
        "Score élevé = Forte résistance. Score faible = Coopération.",
      examples:
        "Interruptions, 'mais non', 'c'est inadmissible', changements de sujet",
      references: "Arnsten (2009). Impact neurobiologique du stress",
    },
    robustesseStress: {
      title: "Robustesse au Stress",
      description:
        "Maintien de l'efficacité des stratégies en contexte émotionnel tendu.",
      formula: "Score = Efficacité_stress_élevé / Efficacité_stress_faible",
      interpretation:
        "Score >1 = Robuste au stress. Score <1 = Vulnérable au stress.",
      examples:
        "Performance stable des descriptions d'actions même en situation conflictuelle",
      references: "Lupien et al. (2007). Stress et fonctions exécutives",
    },
    niveauStress: {
      title: "Niveau de Stress",
      description:
        "Stress émotionnel cumulé basé sur l'historique conversationnel.",
      formula: "Stress = Σ(Réactions_négatives × Poids_temporel)",
      interpretation:
        "Niveau élevé = Contexte tendu. Niveau faible = Contexte apaisé.",
      examples:
        "Accumulation de frustrations, escalade émotionnelle, tensions répétées",
      references:
        "Kitzbichler et al. (2011). Effort cognitif et reconfiguration",
    },
    positionConversation: {
      title: "Position dans Conversation",
      description:
        "Impact de la séquentialité sur l'efficacité différentielle.",
      formula: "Position = Tour_actuel / Total_tours_conversation",
      interpretation:
        "Début = Établissement relation. Fin = Enjeux de clôture.",
      examples:
        "Efficacité variable selon moment : accueil, traitement, conclusion",
      references: "Levinson & Torreira (2015). Temporalité turn-taking",
    },
  };

// Configuration des catégories avec leurs métriques
export const categoryConfigs: CategoryData[] = [
  {
    key: "automatic",
    title: "Traitement Automatique",
    subtitle: "Mécanismes de simulation motrice",
    icon: React.createElement(AutomaticIcon),
    color: "primary",
    description:
      "Indicateurs de traitement automatique via les neurones miroirs",
    metrics: [
      {
        key: "fluiditeCognitive",
        title: "Score de Fluidité Cognitive",
        value: "--",
        subtitle: "En attente de données",
        color: "primary",
        loading: true,
      },
      {
        key: "reactionsDirectes",
        title: "Réactions Directes",
        value: "--%",
        subtitle: "Pourcentage de réactions immédiates",
        color: "primary",
        loading: true,
      },
      {
        key: "reprisesLexicales",
        title: "Reprises Lexicales",
        value: "--",
        subtitle: "Alignement linguistique automatique",
        color: "primary",
        loading: true,
      },
    ],
  },
  {
    key: "cognitive",
    title: "Charge Cognitive",
    subtitle: "Traitement contrôlé et métaphores",
    icon: React.createElement(LoadIcon),
    color: "warning",
    description: "Indicateurs de surcharge et de résistance cognitive",
    metrics: [
      {
        key: "chargeCognitive",
        title: "Score de Charge Cognitive",
        value: "--",
        subtitle: "Effort de traitement mesuré",
        color: "warning",
        loading: true,
      },
      {
        key: "marqueursEffort",
        title: "Marqueurs d'Effort",
        value: "--%",
        subtitle: '"euh", "attendez", "alors"...',
        color: "warning",
        loading: true,
      },
      {
        key: "patternsResistance",
        title: "Patterns de Résistance",
        value: "--",
        subtitle: "Interruptions, objections, évitement",
        color: "warning",
        loading: true,
      },
    ],
  },
  {
    key: "contextual",
    title: "Modulation Contextuelle",
    subtitle: "Sensibilité au stress et contexte",
    icon: React.createElement(PerformanceIcon),
    color: "success",
    description: "Impact du contexte émotionnel sur l'efficacité",
    metrics: [
      {
        key: "robustesseStress",
        title: "Robustesse au Stress",
        value: "--",
        subtitle: "Performance en contexte tendu",
        color: "success",
        loading: true,
      },
      {
        key: "niveauStress",
        title: "Niveau de Stress",
        value: "--",
        subtitle: "Stress émotionnel cumulé",
        color: "success",
        loading: true,
      },
      {
        key: "positionConversation",
        title: "Position dans Conversation",
        value: "--",
        subtitle: "Impact de la séquentialité",
        color: "success",
        loading: true,
      },
    ],
  },
];
