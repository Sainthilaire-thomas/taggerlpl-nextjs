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
        predicted: r.predicted ?? r.metadata?.m2?.value ?? "",
        goldStandard: r.goldStandard ?? r.metadata?.m2?.gold ?? "",
        correct:
          typeof r.correct === "boolean"
            ? r.correct
            : (r.predicted ?? "") ===
              (r.goldStandard ?? r.metadata?.m2?.gold ?? ""),
        confidence: r.confidence ?? 0,
        processingTime: r.processingTime ?? 0,
        metadata: {
          ...(r.metadata || {}),

          // ✅ ensure the context keys the table reads are present
          prev2_turn_verbatim:
            r.metadata?.prev2_turn_verbatim ?? (r as any).prev2 ?? null,
          prev1_turn_verbatim:
            r.metadata?.prev1_turn_verbatim ?? (r as any).prev1 ?? null,
          next_turn_verbatim:
            r.metadata?.next_turn_verbatim ?? r.metadata?.clientTurn ?? null,

          // an id for annotations
          turnId: r.metadata?.turnId ?? r.metadata?.id ?? r.id ?? undefined,

          // classifier/type hints for header chips
          classifier: r.metadata?.classifier ?? "M2LexicalAlignment",
          type: r.metadata?.type ?? "rule-based",
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
