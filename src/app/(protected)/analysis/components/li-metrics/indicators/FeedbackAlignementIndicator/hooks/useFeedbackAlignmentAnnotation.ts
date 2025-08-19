// ==========================================
// 📁 FeedbackAlignmentIndicator/hooks/useFeedbackAlignmentAnnotation.ts
// ==========================================

import { useState, useEffect, useMemo } from "react";
import {
  TurnTaggedData,
  FeedbackAlignmentResult,
  FeedbackAlignmentConfig,
} from "../types";
import { BasicAlignmentAlgorithm } from "../algorithms";

// Types pour l'annotation experte
interface AnnotationData {
  turn_id: number;
  domain: "li";
  indicator_id: "feedback_alignment";
  human_label: "ALIGNEMENT_FORT" | "ALIGNEMENT_FAIBLE" | "DESALIGNEMENT";
  algorithm_prediction?:
    | "ALIGNEMENT_FORT"
    | "ALIGNEMENT_FAIBLE"
    | "DESALIGNEMENT";
  algorithm_confidence?: number;
  annotator_id: string;
  annotation_time_seconds?: number;
  difficulty_rating?: number; // 1-5
  notes?: string;
  created_at?: string;
}

interface AnnotationSession {
  id: string;
  annotator_id: string;
  start_time: string;
  cases_completed: number;
  cases_total: number;
  quality_metrics: {
    avg_annotation_time: number;
    consistency_score: number;
    agreement_with_algorithm: number;
  };
}

interface AnnotationCase {
  turn_data: TurnTaggedData;
  algorithm_result: FeedbackAlignmentResult;
  annotation?: AnnotationData;
  context?: {
    previous_turns: TurnTaggedData[];
    conversation_metadata: any;
  };
}

interface AnnotationWorkflowConfig {
  selection_strategy:
    | "random"
    | "disagreement"
    | "low_confidence"
    | "active_learning";
  batch_size: number;
  require_double_annotation: boolean;
  quality_threshold: number;
}

export const useFeedbackAlignmentAnnotation = (
  data: TurnTaggedData[],
  config: AnnotationWorkflowConfig = {
    selection_strategy: "disagreement",
    batch_size: 20,
    require_double_annotation: false,
    quality_threshold: 0.8,
  }
) => {
  // État de l'annotation
  const [currentSession, setCurrentSession] =
    useState<AnnotationSession | null>(null);
  const [currentCase, setCurrentCase] = useState<AnnotationCase | null>(null);
  const [casesToAnnotate, setCasesToAnnotate] = useState<AnnotationCase[]>([]);
  const [completedAnnotations, setCompletedAnnotations] = useState<
    AnnotationData[]
  >([]);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [annotationStartTime, setAnnotationStartTime] = useState<number | null>(
    null
  );

  // État de l'interface
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const algorithm = useMemo(() => new BasicAlignmentAlgorithm(), []);

  // Initialisation d'une session d'annotation
  const startAnnotationSession = (annotator_id: string) => {
    const session: AnnotationSession = {
      id: `session_${Date.now()}`,
      annotator_id,
      start_time: new Date().toISOString(),
      cases_completed: 0,
      cases_total: config.batch_size,
      quality_metrics: {
        avg_annotation_time: 0,
        consistency_score: 0,
        agreement_with_algorithm: 0,
      },
    };

    setCurrentSession(session);

    // Sélection des cas à annoter
    const selectedCases = selectCasesForAnnotation(data, config);
    setCasesToAnnotate(selectedCases);

    if (selectedCases.length > 0) {
      setCurrentCase(selectedCases[0]);
      setCurrentCaseIndex(0);
      setAnnotationStartTime(Date.now());
    }
  };

  // Sélection intelligente des cas à annoter
  const selectCasesForAnnotation = (
    dataset: TurnTaggedData[],
    config: AnnotationWorkflowConfig
  ): AnnotationCase[] => {
    // Filtrer les cas avec verbatim client non vide
    const validCases = dataset.filter(
      (turn) =>
        turn.next_turn_verbatim &&
        turn.next_turn_verbatim.trim() !== "" &&
        turn.next_turn_verbatim.length > 10 // Minimum de contenu
    );

    // Calculer les prédictions algorithmiques
    const casesWithPredictions = validCases.map((turn) => {
      const algorithm_result = algorithm.analyze(turn);
      return {
        turn_data: turn,
        algorithm_result,
      };
    });

    let selectedCases: AnnotationCase[] = [];

    switch (config.selection_strategy) {
      case "random":
        selectedCases = casesWithPredictions
          .sort(() => Math.random() - 0.5)
          .slice(0, config.batch_size);
        break;

      case "low_confidence":
        selectedCases = casesWithPredictions
          .sort(
            (a, b) =>
              a.algorithm_result.confidence - b.algorithm_result.confidence
          )
          .slice(0, config.batch_size);
        break;

      case "disagreement":
        // Sélectionner les cas où l'algorithme et l'annotation automatique existante diffèrent
        selectedCases = casesWithPredictions
          .filter((case_item) => {
            const predicted = case_item.algorithm_result.value;
            const existing = case_item.turn_data.next_turn_tag;

            // Mapping pour comparaison
            const algorithmToExisting = {
              ALIGNEMENT_FORT: "CLIENT_POSITIF",
              ALIGNEMENT_FAIBLE: "CLIENT_NEUTRE",
              DESALIGNEMENT: "CLIENT_NEGATIF",
            };

            return algorithmToExisting[predicted] !== existing;
          })
          .slice(0, config.batch_size);
        break;

      case "active_learning":
        // Combiner faible confiance + désaccord + diversité des stratégies
        const lowConfidence = casesWithPredictions.filter(
          (c) => c.algorithm_result.confidence < 0.7
        );

        const disagreements = casesWithPredictions.filter((case_item) => {
          const predicted = case_item.algorithm_result.value;
          const existing = case_item.turn_data.next_turn_tag;
          const algorithmToExisting = {
            ALIGNEMENT_FORT: "CLIENT_POSITIF",
            ALIGNEMENT_FAIBLE: "CLIENT_NEUTRE",
            DESALIGNEMENT: "CLIENT_NEGATIF",
          };
          return algorithmToExisting[predicted] !== existing;
        });

        // Diversité par stratégie conseiller
        const strategyCounts = new Map<string, number>();
        const diverseCases = casesWithPredictions.filter((case_item) => {
          const strategy = case_item.turn_data.tag;
          const count = strategyCounts.get(strategy) || 0;
          if (count < 3) {
            // Max 3 par stratégie
            strategyCounts.set(strategy, count + 1);
            return true;
          }
          return false;
        });

        selectedCases = [
          ...new Set([...lowConfidence, ...disagreements, ...diverseCases]),
        ].slice(0, config.batch_size);
        break;

      default:
        selectedCases = casesWithPredictions.slice(0, config.batch_size);
    }

    return selectedCases;
  };

  // Annoter le cas courant
  const annotateCurrentCase = (
    human_label: "ALIGNEMENT_FORT" | "ALIGNEMENT_FAIBLE" | "DESALIGNEMENT",
    difficulty_rating: number = 3,
    notes: string = ""
  ) => {
    if (!currentCase || !currentSession || annotationStartTime === null) return;

    const annotation_time = Math.round(
      (Date.now() - annotationStartTime) / 1000
    );

    const annotation: AnnotationData = {
      turn_id: currentCase.turn_data.id,
      domain: "li",
      indicator_id: "feedback_alignment",
      human_label,
      algorithm_prediction: currentCase.algorithm_result.value,
      algorithm_confidence: currentCase.algorithm_result.confidence,
      annotator_id: currentSession.annotator_id,
      annotation_time_seconds: annotation_time,
      difficulty_rating,
      notes,
      created_at: new Date().toISOString(),
    };

    // Sauvegarder l'annotation
    setCompletedAnnotations((prev) => [...prev, annotation]);

    // Mettre à jour les métriques de session
    updateSessionMetrics(annotation);

    // Passer au cas suivant
    goToNext();
  };

  // Passer au cas suivant
  const goToNext = () => {
    const nextIndex = currentCaseIndex + 1;

    if (nextIndex < casesToAnnotate.length) {
      setCurrentCaseIndex(nextIndex);
      setCurrentCase(casesToAnnotate[nextIndex]);
      setAnnotationStartTime(Date.now());
    } else {
      // Session terminée
      finishAnnotationSession();
    }
  };

  // Revenir au cas précédent
  const goToPrevious = () => {
    const prevIndex = currentCaseIndex - 1;

    if (prevIndex >= 0) {
      setCurrentCaseIndex(prevIndex);
      setCurrentCase(casesToAnnotate[prevIndex]);
      setAnnotationStartTime(Date.now());
    }
  };

  // Passer un cas difficile
  const skipCase = (reason: string) => {
    if (!currentCase || !currentSession) return;

    console.log(`Case ${currentCase.turn_data.id} skipped: ${reason}`);
    goToNext();
  };

  // Mettre à jour les métriques de session
  const updateSessionMetrics = (annotation: AnnotationData) => {
    if (!currentSession) return;

    const updatedSession = { ...currentSession };
    updatedSession.cases_completed += 1;

    // Calculer les métriques
    const allAnnotations = [...completedAnnotations, annotation];

    updatedSession.quality_metrics.avg_annotation_time =
      allAnnotations.reduce(
        (sum, ann) => sum + (ann.annotation_time_seconds || 0),
        0
      ) / allAnnotations.length;

    updatedSession.quality_metrics.agreement_with_algorithm =
      allAnnotations.filter(
        (ann) => ann.human_label === ann.algorithm_prediction
      ).length / allAnnotations.length;

    setCurrentSession(updatedSession);
  };

  // Terminer la session d'annotation
  const finishAnnotationSession = () => {
    if (!currentSession) return;

    console.log("Annotation session completed:", {
      session_id: currentSession.id,
      completed: currentSession.cases_completed,
      quality_metrics: currentSession.quality_metrics,
    });

    // Ici vous pourriez sauvegarder en base de données
    saveAnnotationsToDatabase(completedAnnotations);

    // Reset
    setCurrentSession(null);
    setCurrentCase(null);
    setCasesToAnnotate([]);
    setCurrentCaseIndex(0);
  };

  // Sauvegarder les annotations (à implémenter selon votre backend)
  const saveAnnotationsToDatabase = async (annotations: AnnotationData[]) => {
    try {
      setLoading(true);

      // Ici vous feriez un appel à votre API Supabase
      console.log("Saving annotations to database:", annotations);

      // Exemple d'appel Supabase :
      // const { error } = await supabase
      //   .from('metric_annotations')
      //   .insert(annotations);

      // if (error) throw error;
    } catch (err) {
      setError("Erreur lors de la sauvegarde des annotations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques d'annotation
  const annotationStats = useMemo(() => {
    if (!completedAnnotations.length) return null;

    const stats = {
      total_annotated: completedAnnotations.length,
      agreement_rate:
        completedAnnotations.filter(
          (ann) => ann.human_label === ann.algorithm_prediction
        ).length / completedAnnotations.length,

      avg_difficulty:
        completedAnnotations.reduce(
          (sum, ann) => sum + (ann.difficulty_rating || 3),
          0
        ) / completedAnnotations.length,

      avg_time:
        completedAnnotations.reduce(
          (sum, ann) => sum + (ann.annotation_time_seconds || 0),
          0
        ) / completedAnnotations.length,

      distribution: {
        alignement_fort: completedAnnotations.filter(
          (ann) => ann.human_label === "ALIGNEMENT_FORT"
        ).length,
        alignement_faible: completedAnnotations.filter(
          (ann) => ann.human_label === "ALIGNEMENT_FAIBLE"
        ).length,
        desalignement: completedAnnotations.filter(
          (ann) => ann.human_label === "DESALIGNEMENT"
        ).length,
      },
    };

    return stats;
  }, [completedAnnotations]);

  // Progress de la session
  const progress = useMemo(() => {
    if (!currentSession || !casesToAnnotate.length) return null;

    return {
      completed: currentCaseIndex,
      total: casesToAnnotate.length,
      percentage: Math.round((currentCaseIndex / casesToAnnotate.length) * 100),
    };
  }, [currentSession, currentCaseIndex, casesToAnnotate.length]);

  return {
    // État de session
    currentSession,
    currentCase,
    progress,

    // Actions principales
    startAnnotationSession,
    annotateCurrentCase,
    skipCase,
    goToNext,
    goToPrevious,

    // Données et statistiques
    completedAnnotations,
    annotationStats,

    // État
    loading,
    error,

    // Configuration
    config,

    // Export et qualité
    exportAnnotations: () => ({
      metadata: {
        session: currentSession,
        config,
        timestamp: new Date().toISOString(),
      },
      annotations: completedAnnotations,
      statistics: annotationStats,
    }),

    // Import d'annotations existantes
    importAnnotations: (annotations: AnnotationData[]) => {
      setCompletedAnnotations(annotations);
    },

    // Helpers pour l'interface
    getCaseContext: (case_item: AnnotationCase) => {
      // Retourner le contexte conversationnel si disponible
      return {
        conseiller_strategy: case_item.turn_data.tag,
        conseiller_verbatim:
          case_item.turn_data.verbatim.substring(0, 100) + "...",
        client_verbatim: case_item.turn_data.next_turn_verbatim,
        algorithm_prediction: case_item.algorithm_result.value,
        algorithm_confidence: Math.round(
          case_item.algorithm_result.confidence * 100
        ),
        algorithm_explanation: case_item.algorithm_result.explanation,
      };
    },
  };
};
