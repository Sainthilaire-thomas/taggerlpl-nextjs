// M3ValidationInterface.tsx - APRÈS
import { BaseAlgorithmTesting } from "../BaseAlgorithmTesting";
export default function M3ValidationInterface() {
  return (
    <BaseAlgorithmTesting
      variableLabel="M3 — Charge cognitive client"
      defaultClassifier="PausesM3Calculator"
      target="M3"
    />
  );
}
