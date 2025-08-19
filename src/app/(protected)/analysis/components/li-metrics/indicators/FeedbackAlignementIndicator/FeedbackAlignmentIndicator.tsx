// ==========================================
// 📁 FeedbackAlignmentIndicator/FeedbackAlignmentIndicator.tsx
// ==========================================

import React from "react";
import { TurnTaggedData } from "./types";
import { useFeedbackAlignmentMetrics } from "./hooks";

interface FeedbackAlignmentIndicatorProps {
  data: TurnTaggedData[];
  algorithm?: "basic" | "sentiment_enhanced" | "ml_supervised";
  showDetailedResults?: boolean;
}

const FeedbackAlignmentIndicator: React.FC<FeedbackAlignmentIndicatorProps> = ({
  data,
  algorithm = "basic",
  showDetailedResults = false,
}) => {
  const { results, globalStats, familyResults, loading, error } =
    useFeedbackAlignmentMetrics(data, {
      algorithm,
      confidence_threshold: 0.5,
      enable_context_analysis: false,
    });

  if (loading) return <div>Analyse en cours...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!results.length) return <div>Aucun résultat d'analyse</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Indicateur Feedback Alignment</h2>
      <p>Algorithme: {algorithm}</p>

      {/* Statistiques par stratégie */}
      <div style={{ marginTop: "20px" }}>
        <h3>Efficacité par stratégie conseiller</h3>
        {familyResults.map((family) => (
          <div
            key={family.strategy}
            style={{
              margin: "10px 0",
              padding: "15px",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          >
            <strong>{family.strategy}</strong>
            <br />
            Efficacité: {(family.effectiveness * 100).toFixed(1)}%
            <br />
            Échantillon: {family.sample_size} tours
            <br />
            Confiance: {(family.confidence * 100).toFixed(1)}%
          </div>
        ))}
      </div>

      {/* Résultats détaillés si demandés */}
      {showDetailedResults && (
        <div style={{ marginTop: "30px" }}>
          <h3>Résultats détaillés</h3>
          {results.slice(0, 10).map((result, index) => (
            <div
              key={index}
              style={{
                margin: "10px 0",
                padding: "10px",
                backgroundColor: "#f5f5f5",
                borderRadius: "5px",
              }}
            >
              <strong>Alignement:</strong> {result.value}
              <br />
              <strong>Confiance:</strong> {(result.confidence * 100).toFixed(1)}
              %
              <br />
              <strong>Explication:</strong> {result.explanation}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackAlignmentIndicator;
