"use client";

import { useMemo, useState } from "react";
import { Stack } from "@mui/material";

// Imports des composants
import { RunPanel } from "../../shared/results/base/RunPanel";
import { ResultsPanel } from "../../shared/results/base/ResultsSample/ResultsPanel";
import ClassifierSelector from "../../../shared/../shared/ClassifierSelector";

import useM2AlgorithmTesting from "../../../../hooks/level1/useM2AlgorithmTesting";

// Types locaux pour résoudre les erreurs temporairement
interface AvailableAlgorithm {
  id: string;
  name?: string;
  desc?: {
    displayName?: string;
    description?: string;
  };
  metrics?: {
    differential?: number;
    avgMs?: number;
    accuracy?: number;
  };
}

interface M2Result {
  id?: string;
  verbatim?: string;
  predicted?: string;
  goldStandard?: string;
  correct?: boolean;
  confidence?: number;
  processingTime?: number;
  metadata?: {
    clientTurn?: string;
    m2?: any;
    [key: string]: any;
  };
}

export default function M2ValidationInterface() {
  const m2 = useM2AlgorithmTesting();
  const [sampleSize, setSampleSize] = useState(50);

  // Adapter les résultats avec typage sécurisé
  const adaptedResults = useMemo(
    () =>
      (m2.results as M2Result[]).map((r) => ({
        id: r.id ?? Math.random().toString(),
        verbatim: r.verbatim ?? "",
        predicted: r.predicted ?? "",
        goldStandard: r.goldStandard ?? "",
        correct: r.correct ?? false,
        confidence: r.confidence ?? 0,
        processingTime: r.processingTime ?? 0,
        metadata: {
          verbatim: r.verbatim,
          clientTurn: r.metadata?.clientTurn,
          m2: r.metadata?.m2,
        },
      })),
    [m2.results]
  );

  return (
    <Stack gap={2}>
      <RunPanel
        isRunning={m2.isRunning}
        isConfigValid={true}
        goldStandardCount={m2.goldStandardCount}
        sampleSize={sampleSize}
        onSampleSizeChange={setSampleSize}
        onRun={() => m2.runTest(sampleSize)}
        domainLabel="Alignement M2"
        supportsBatch={true}
      />

      <ClassifierSelector
        selectedClassifier={m2.selectedAlgorithm}
        onSelectClassifier={(key: string) => m2.setSelectedAlgorithm(key)}
        target="M2"
        showDescription={true}
      />

      {adaptedResults.length > 0 && (
        <ResultsPanel
          results={adaptedResults}
          targetKind="M2"
          classifierLabel={m2.selectedAlgorithm}
          initialPageSize={25}
        />
      )}
    </Stack>
  );
}
