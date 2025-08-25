// hooks/useLevel1Testing.ts
import { useState, useCallback } from "react";
import { useTaggingData } from "@/context/TaggingDataContext";
import { AlgorithmeClassificationConseiller } from "../algorithms/level1/AlgorithmeClassificationConseiller";
import { AlgorithmeClassificationClient } from "../algorithms/level1/AlgorithmeClassificationClient";
import { calculateValidationMetrics } from "../utils/metricsCalculation";
import {
  TechnicalValidationState,
  AlgorithmConfig,
  AlgorithmResult,
} from "../types/Level1Types";

export const useLevel1Testing = () => {
  const { allTurnTagged, loadingGlobalData, errorGlobalData, tags } =
    useTaggingData();
  const [state, setState] = useState<TechnicalValidationState>({
    selectedAlgorithm: "conseiller_classification",
    sampleSize: 1000,
    selectedOrigin: null,
    isRunning: false,
    results: [],
    metrics: null,
    errors: [],
    progress: 0,
  });
  // Fonction de normalisation
  const normalizeLabel = (label: string): string => {
    return label.replace(/\s+/g, "_").toUpperCase();
  };

  const availableAlgorithms: AlgorithmConfig[] = [
    {
      name: "conseiller_classification",
      description:
        "Classification des stratégies conseiller (ENGAGEMENT, OUVERTURE, REFLET, EXPLICATION)",
      type: "conseiller",
      parameters: {
        seuilEngagement: 0.6,
        seuilOuverture: 0.5,
        seuilExplication: 0.4,
        seuilReflet: 0.3,
      },
      enabled: true,
    },
    {
      name: "client_classification",
      description:
        "Classification des réactions client (POSITIF, NEGATIF, NEUTRE)",
      type: "client",
      parameters: {
        seuilPositif: 0.6,
        seuilNegatif: 0.4,
      },
      enabled: true,
    },
  ];

  const getFilteredData = useCallback(
    (origin?: string | null) => {
      let filtered = allTurnTagged;

      if (origin) {
        filtered = filtered.filter(
          (turn) => (turn as any).call_origine === origin
        );
      }

      return filtered;
    },
    [allTurnTagged]
  );

  const runValidation = useCallback(
    async (
      algorithmName: string,
      sampleSize: number,
      origin?: string | null
    ) => {
      setState((prev: TechnicalValidationState) => ({
        ...prev,
        isRunning: true,
        progress: 0,
        results: [],
        metrics: null,
        errors: [],
      }));

      try {
        const filteredData = getFilteredData(origin);

        if (filteredData.length === 0) {
          throw new Error("Aucune donnée disponible pour la validation");
        }

        console.log(
          `🔬 Validation ${algorithmName} sur ${filteredData.length} turns`
        );

        // NOUVEAU: Filtrage selon le type d'algorithme et les familles/tags
        let relevantData;

        if (algorithmName === "conseiller_classification") {
          // Récupérer les labels des tags conseiller via leur family dans lpltag
          const conseillerFamilies = [
            "ENGAGEMENT",
            "OUVERTURE",
            "REFLET",
            "EXPLICATION",
          ];
          const conseillerLabels = tags
            .filter((tag) => conseillerFamilies.includes(tag.family || ""))
            .map((tag) => tag.label);

          console.log(
            `📋 Familles conseiller: ${conseillerFamilies.join(", ")}`
          );
          console.log(
            `🏷️ Labels conseiller trouvés: ${conseillerLabels.length}`,
            conseillerLabels
          );

          relevantData = filteredData.filter(
            (turn) =>
              conseillerLabels.includes(turn.tag) &&
              turn.verbatim &&
              turn.verbatim.trim()
          );

          console.log(
            `🎯 Filtré conseiller: ${relevantData.length} turns avec stratégies conseiller`
          );
        } else if (algorithmName === "client_classification") {
          // Filtrage direct sur les tags client dans next_turn_tag
          const clientTags = [
            "CLIENT POSITIF",
            "CLIENT NEGATIF",
            "CLIENT NEUTRE",
          ];
          relevantData = filteredData.filter(
            (turn) =>
              turn.next_turn_tag &&
              clientTags.includes(turn.next_turn_tag) &&
              turn.next_turn_verbatim &&
              turn.next_turn_verbatim.trim()
          );

          console.log(
            `🎯 Filtré client: ${relevantData.length} turns avec réactions client`
          );
          console.log(`🏷️ Tags client recherchés: ${clientTags.join(", ")}`);
        } else {
          throw new Error(`Algorithme ${algorithmName} non reconnu`);
        }

        if (!relevantData || relevantData.length === 0) {
          throw new Error(`Aucune donnée pertinente trouvée pour ${algorithmName}. 
          Vérifiez les correspondances tags/familles dans lpltag.`);
        }

        // Échantillonnage stratifié sur les données filtrées
        const sampleData = relevantData
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(sampleSize, relevantData.length));

        console.log(
          `📊 Échantillon final de ${sampleData.length} turns sélectionné`
        );

        // Initialisation de l'algorithme
        let algorithm: any;
        const algorithmConfig = availableAlgorithms.find(
          (a) => a.name === algorithmName
        );

        if (algorithmName === "conseiller_classification") {
          algorithm = new AlgorithmeClassificationConseiller(
            algorithmConfig?.parameters
          );
        } else if (algorithmName === "client_classification") {
          algorithm = new AlgorithmeClassificationClient(
            algorithmConfig?.parameters
          );
        } else {
          throw new Error(`Algorithme ${algorithmName} non reconnu`);
        }

        // Fonction de normalisation des labels pour comparaison
        const normalizeLabel = (label: string): string => {
          return label.replace(/\s+/g, "_").toUpperCase();
        };

        const results: AlgorithmResult[] = [];
        const totalSteps = sampleData.length;

        console.log(`🔄 Début du traitement de ${totalSteps} échantillons...`);

        for (let i = 0; i < sampleData.length; i++) {
          const turn = sampleData[i];

          try {
            let input: string;
            let goldStandard: string;

            if (algorithmName === "conseiller_classification") {
              input = turn.verbatim || "";
              goldStandard = turn.tag;
            } else {
              input = turn.next_turn_verbatim || "";
              goldStandard = turn.next_turn_tag || "CLIENT_NEUTRE";
            }

            if (!input.trim()) {
              console.log(
                `⚠️ Input vide pour turn ${turn.id}, passage au suivant`
              );
              continue;
            }

            const prediction = algorithm.classify(input);
            const normalizedGold = normalizeLabel(goldStandard);

            const result: AlgorithmResult = {
              input,
              predicted: prediction.prediction,
              goldStandard: normalizedGold,
              confidence: prediction.confidence,
              correct: prediction.prediction === normalizedGold,
              callId: turn.call_id,
              speaker: turn.speaker,
              startTime: turn.start_time,
              endTime: turn.end_time,
              turnId: turn.id,
            };

            results.push(result);

            // Debug pour les premiers résultats
            if (i < 5) {
              console.log(`🔍 Résultat ${i + 1}:`, {
                input: input.substring(0, 50) + "...",
                predicted: prediction.prediction,
                goldStandard: normalizedGold,
                correct: result.correct,
                confidence: prediction.confidence,
              });
            }

            // Mise à jour du progrès
            const progress = ((i + 1) / totalSteps) * 100;
            setState((prev: TechnicalValidationState) => ({
              ...prev,
              progress,
            }));

            // Pause pour la responsivité UI
            if (i % 50 === 0) {
              await new Promise((resolve) => setTimeout(resolve, 1));
            }
          } catch (turnError) {
            console.error(`❌ Erreur sur le turn ${turn.id}:`, turnError);
            setState((prev: TechnicalValidationState) => ({
              ...prev,
              errors: [
                ...prev.errors,
                `Turn ${turn.id}: ${
                  turnError instanceof Error
                    ? turnError.message
                    : "Erreur inconnue"
                }`,
              ],
            }));
          }
        }

        if (results.length === 0) {
          throw new Error(
            "Aucun résultat généré - vérifiez les données d'entrée et le filtrage"
          );
        }

        // Calcul des métriques
        const metrics = calculateValidationMetrics(results);

        console.log(`✅ Validation terminée:`);
        console.log(`   - ${results.length} résultats générés`);
        console.log(`   - Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%`);
        console.log(`   - Kappa: ${metrics.kappa.toFixed(3)}`);
        console.log(
          `   - Prédictions correctes: ${metrics.correctPredictions}/${metrics.totalSamples}`
        );

        // Afficher quelques statistiques par classe
        Object.keys(metrics.precision).forEach((cls) => {
          console.log(
            `   - ${cls}: P=${(metrics.precision[cls] * 100).toFixed(1)}% R=${(
              metrics.recall[cls] * 100
            ).toFixed(1)}% F1=${(metrics.f1Score[cls] * 100).toFixed(1)}%`
          );
        });

        setState((prev: TechnicalValidationState) => ({
          ...prev,
          results,
          metrics,
          isRunning: false,
          progress: 100,
        }));
      } catch (error) {
        console.error("❌ Erreur lors de la validation:", error);
        setState((prev: TechnicalValidationState) => ({
          ...prev,
          isRunning: false,
          errors: [
            ...prev.errors,
            error instanceof Error ? error.message : "Erreur inconnue",
          ],
        }));
      }
    },
    [getFilteredData, availableAlgorithms, tags] // Ajouter 'tags' aux dépendances
  );

  const updateAlgorithmParameters = useCallback(
    (algorithmName: string, newParameters: Record<string, any>) => {
      // This would update the algorithm configuration
      console.log(`Mise à jour paramètres ${algorithmName}:`, newParameters);
    },
    []
  );

  return {
    state,
    setState,
    availableAlgorithms,
    runValidation,
    updateAlgorithmParameters,
    getFilteredData,
    isDataReady:
      !loadingGlobalData && !errorGlobalData && allTurnTagged.length > 0,
  };
};
