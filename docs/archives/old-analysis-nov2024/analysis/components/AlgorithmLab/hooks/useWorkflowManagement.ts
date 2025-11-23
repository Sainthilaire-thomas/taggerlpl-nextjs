// Hook de gestion workflow - useWorkflowManagement.ts
import { useState, useCallback, useMemo } from "react";
import { ValidationLevel } from "@/app/(protected)/analysis/components/AlgorithmLab/types";

export const useWorkflowManagement = () => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [levelStates, setLevelStates] = useState<Record<number, any>>({});

  const validationLevels: ValidationLevel[] = useMemo(
    () => [
      {
        id: 0,
        name: "Gold Standard",
        description: "Validation de l'accord inter-annotateur",
        status: "pending",
        progress: 0,
        prerequisites: [],
      },
      {
        id: 1,
        name: "Validation Technique",
        description: "Performance des algorithmes vs experts",
        status: "pending",
        progress: 0,
        prerequisites: [0],
      },
      {
        id: 2,
        name: "Validation Scientifique",
        description: "Test des hypothèses de recherche",
        status: "pending",
        progress: 0,
        prerequisites: [0, 1],
      },
    ],
    []
  );

  const canAccessLevel = useCallback(
    (levelId: number) => {
      // Flag de développement - mettre à false en production
      const DEV_BYPASS_PREREQUISITES = true;

      if (DEV_BYPASS_PREREQUISITES) {
        return true;
      }

      const level = validationLevels.find((l) => l.id === levelId);
      if (!level) return false;

      return level.prerequisites.every(
        (prereq) =>
          validationLevels.find((l) => l.id === prereq)?.status === "validated"
      );
    },
    [validationLevels]
  );

  const updateLevelStatus = useCallback(
    (levelId: number, status: ValidationLevel["status"], progress?: number) => {
      setLevelStates((prev) => ({
        ...prev,
        [levelId]: { ...prev[levelId], status, progress },
      }));
    },
    []
  );

  return {
    currentLevel,
    setCurrentLevel,
    validationLevels,
    canAccessLevel,
    updateLevelStatus,
    levelStates,
  };
};
