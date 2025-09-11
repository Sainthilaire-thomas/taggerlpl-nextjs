// M1ValidationInterface.tsx - APRÈS
import { BaseAlgorithmTesting } from "../BaseAlgorithmTesting";
export default function M1ValidationInterface() {
  return (
    <BaseAlgorithmTesting
      variableLabel="M1 — Densité de verbes d'action"
      defaultClassifier="M1ActionVerbCounter"
      target="M1"
    />
  );
}
