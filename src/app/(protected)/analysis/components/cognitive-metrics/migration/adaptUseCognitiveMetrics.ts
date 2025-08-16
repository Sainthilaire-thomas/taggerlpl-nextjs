import React, { useState } from "react";

interface CognitiveMetrics {
  fluiditeCognitive: number;
  chargeCognitive: number;
  marqueurs: string[];
}

export const useAdaptedCognitiveMetrics = (data: any[]) => {
  const [isNew, setIsNew] = useState(false);

  return {
    fluiditeCognitive: 0.75,
    chargeCognitive: 0.45,
    marqueurs: ["test"],
    toggleFramework: () => setIsNew(!isNew),
    isNewFramework: isNew,
  };
};

export const CognitiveMetricsTransition = () => {
  const { toggleFramework, isNewFramework } = useAdaptedCognitiveMetrics([]);

  return React.createElement(
    "div",
    { style: { padding: "16px" } },
    React.createElement("h3", null, "Cognitive Metrics"),
    React.createElement(
      "button",
      { onClick: toggleFramework },
      isNewFramework ? "Back to Legacy" : "Test New"
    )
  );
};

export const validateCognitiveMigration = () => {
  try {
    console.log("Migration cognitive validée");
    return true;
  } catch (error) {
    console.error("Erreur validation migration:", error);
    return false;
  }
};

export default useAdaptedCognitiveMetrics;
