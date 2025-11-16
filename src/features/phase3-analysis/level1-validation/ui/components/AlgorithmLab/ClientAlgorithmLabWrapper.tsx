"use client";
import React from "react";
import { initializeAlgorithms } from "@/features/phase3-analysis/level1-validation/algorithms/shared/initializeAlgorithms";
import { algorithmRegistry } from "@/features/phase3-analysis/level1-validation/algorithms/shared/AlgorithmRegistry";
import Level1Interface from "./Level1Interface";

export default function ClientAlgorithmLabWrapper() {
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    // Initialiser le registre côté client si vide
    if (algorithmRegistry.list().length === 0) {
      console.log("🔧 Initialisation du registre côté client...");
      initializeAlgorithms();
      console.log("✅ " + algorithmRegistry.list().length + " algorithmes chargés côté client");
    }
    setIsInitialized(true);
  }, []);

  // Attendre que l'initialisation soit terminée avant de rendre l'interface
  if (!isInitialized) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Initialisation des algorithmes...</p>
      </div>
    );
  }

  return <Level1Interface />;
}