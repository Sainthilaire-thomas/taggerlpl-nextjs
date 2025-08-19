// 🪝 HOOK - useAlgorithmDialog
// shared/hooks/useAlgorithmDialog.ts

import { useState } from "react";

export interface AlgorithmDetail {
  id: string;
  name: string;
  description: string;
  principle: string;
  source: string;
}

export const useAlgorithmDialog = (algorithms: AlgorithmDetail[]) => {
  const [selectedAlgorithm, setSelectedAlgorithm] =
    useState<AlgorithmDetail | null>(null);

  const openDialog = (algorithmName: string) => {
    const algorithm = algorithms.find((alg) => alg.name === algorithmName);
    if (algorithm) {
      setSelectedAlgorithm(algorithm);
    }
  };

  const closeDialog = () => {
    setSelectedAlgorithm(null);
  };

  return {
    selectedAlgorithm,
    isOpen: Boolean(selectedAlgorithm),
    openDialog,
    closeDialog,
  };
};

export default useAlgorithmDialog;
