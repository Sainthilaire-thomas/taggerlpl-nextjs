// components/Level1/algorithms/M2/M2ValidationInterface.tsx
"use client";
import { useState } from "react";
import { Stack } from "@mui/material";
import { RunPanel } from "../../../../components/Level1/shared/results/base/RunPanel"; // ajuste chemins
import { ResultsPanel } from "../../../../components/Level1/shared/results/base/ResultsSample/ResultsPanel";
import AlgorithmSelector from "../../../shared/ClassifierSelector";
import useM2AlgorithmTesting from "../../../../hooks/level1/useM2AlgorithmTesting";

export default function M2ValidationInterface() {
  const m2 = useM2AlgorithmTesting();
  const [sampleSize, setSampleSize] = useState(50);

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

      <AlgorithmSelector
        algorithms={m2.availableAlgorithms.map((a) => ({
          id: a.id,
          name: a.name,
        }))}
        selectedAlgorithm={m2.selectedAlgorithm}
        onAlgorithmChange={m2.setSelectedAlgorithm}
        target="M2"
      />

      {m2.results.length > 0 && (
        <ResultsPanel
          results={m2.results}
          targetKind="M2"
          classifierLabel={m2.selectedAlgorithm}
          initialPageSize={25}
        />
      )}
    </Stack>
  );
}
