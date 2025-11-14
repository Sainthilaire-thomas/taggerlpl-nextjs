"use client";

// XValidationInterface.tsx - APRÈS
import { BaseAlgorithmTesting } from "../BaseAlgorithmTesting";
export default function XValidationInterface() {
  return (
    <BaseAlgorithmTesting
      variableLabel="X — Stratégies Conseiller"
      defaultClassifier="RegexXClassifier"
      target="X" // ← Auto-filtre les algorithmes X
    />
  );
}
