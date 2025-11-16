"use client";

import React from "react";
import { BaseAlgorithmTesting } from '../shared/BaseAlgorithmTesting';

/**
 * Interface de test pour la variable X (classification conseiller).
 * S'appuie entièrement sur la base générique.
 * Tu pourras ajouter ici des métriques ou vues propres à X plus tard.
 */
const XAlgorithmTesting: React.FC = () => {
  return (
    <BaseAlgorithmTesting
      variableLabel="Validation X (Conseiller)"
      defaultClassifier="RegexXClassifier" // adapte si besoin
      target="X"
    />
  );
};

export default XAlgorithmTesting;
