"use client";

import { useMemo, useState } from "react";
import { Stack } from "@mui/material";

// ✅ bons chemins d’après ton arbo
import { RunPanel } from "../../shared/results/base/RunPanel";
import { ResultsPanel } from "../../shared/results/base/ResultsSample/ResultsPanel";
import ClassifierSelector from "../../../shared/../shared/ClassifierSelector";
// ^^^ ClassifierSelector.tsx est dans: components/shared/ClassifierSelector.tsx

import useM2AlgorithmTesting from "../../../../hooks/level1/useM2AlgorithmTesting";

export default function M2ValidationInterface() {
  const m2 = useM2AlgorithmTesting();
  const [sampleSize, setSampleSize] = useState(50);

  // L’UI de ton sélecteur (ClassifierSelector) attend généralement {id,name} + selected + onSelectClassifier.
  // Mais pour éviter les erreurs TS, on prépare un shape étendu si jamais il affiche d’autres colonnes.
  const selectorAlgorithms = useMemo(
    () =>
      m2.availableAlgorithms.map((a) => ({
        id: a.id,
        name: a.desc?.displayName ?? a.id,
        description: a.desc?.description ?? "—",
        differential: a.metrics?.differential ?? 0,
        time: a.metrics?.avgMs ?? 0,
        accuracy: a.metrics?.accuracy ?? 0,
      })),
    [m2.availableAlgorithms]
  );

  // ResultsPanel réclame souvent 'confidence' (ta capture montrait l’erreur).
  // On le déduit de 'score' si non fourni.
  const adaptedResults = useMemo(
    () =>
      m2.results.map((r) => ({
        ...r,
        confidence:
          typeof r.confidence === "number"
            ? r.confidence
            : typeof (r as any).score === "number"
            ? (r as any).score
            : 0,
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
        algorithms={selectorAlgorithms}
        selected={m2.selectedAlgorithm} // ✅ prop attendue par ClassifierSelector
        onSelectClassifier={(id: string) => m2.setSelectedAlgorithm(id)} // ✅ idem
        target="M2"
      />

      {adaptedResults.length > 0 && (
        <ResultsPanel
          results={adaptedResults}
          targetKind="M2" // ✅ ta capture montrait un 'target' erroné → c’est 'targetKind'
          classifierLabel={m2.selectedAlgorithm}
          initialPageSize={25}
        />
      )}
    </Stack>
  );
}
