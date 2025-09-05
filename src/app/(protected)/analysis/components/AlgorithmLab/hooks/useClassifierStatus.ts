"use client";
import * as React from "react";
import { algorithmRegistry } from "@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared";

export type ClassifierItem = {
  registryName: string;
  displayName?: string;
  type?: string;
  version?: string;
  supportsBatch?: boolean;
  isValid?: boolean;
  isAvailable?: boolean;
  description?: string;
  targetDomain?: string; // => X | Y | M1 | M2 | M3
};

function mapApiToItems(data: any): ClassifierItem[] {
  // Nouvelle API: getAlgorithmStatus() => { algorithms: [{ key, ... }] }
  if (Array.isArray(data?.algorithms)) {
    return data.algorithms.map((a: any) => ({
      registryName: a.key,
      displayName: a.displayName,
      type: a.type,
      version: a.version,
      supportsBatch: a.supportsBatch,
      isValid: a.isValid,
      isAvailable: a.isAvailable,
      description: a.description,
      targetDomain: a.target,
    }));
  }
  // Ancien format (par sécurité)
  if (Array.isArray(data?.classifiers))
    return data.classifiers as ClassifierItem[];
  return [];
}

export function useClassifierStatus(selectedRegistryName: string) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<ClassifierItem[]>([]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/algolab/classifiers", {
          cache: "no-store",
        });
        const json = await res.json();
        const mapped = mapApiToItems(json);

        if (!alive) return;

        if (mapped.length === 0) {
          // Fallback: on mappe le registre client
          const local = algorithmRegistry.list().map(({ key, meta }) => ({
            registryName: key,
            displayName: meta.displayName ?? meta.name ?? key,
            type: meta.type,
            version: meta.version,
            supportsBatch: meta.batchSupported,
            isValid: true, // on suppose valide en local
            isAvailable: true,
            description: meta.description,
            targetDomain: meta.target,
          }));
          setItems(local);
        } else {
          setItems(mapped);
        }
        setError(null);
      } catch (e: any) {
        if (!alive) return;
        console.warn("useClassifierStatus: API KO, fallback registre local", e);
        const local = algorithmRegistry.list().map(({ key, meta }) => ({
          registryName: key,
          displayName: meta.displayName ?? meta.name ?? key,
          type: meta.type,
          version: meta.version,
          supportsBatch: meta.batchSupported,
          isValid: true,
          isAvailable: true,
          description: meta.description,
          targetDomain: meta.target,
        }));
        setItems(local);
        setError(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const selected = React.useMemo(
    () => items.find((c) => c.registryName === selectedRegistryName) || null,
    [items, selectedRegistryName]
  );

  const isConfigValid = !!selected?.isAvailable || !!selected?.isValid;
  const supportsBatch = !!selected?.supportsBatch;
  const domainLabel = selected?.targetDomain ?? "Général";

  return {
    loading,
    error,
    items,
    selected,
    isConfigValid,
    supportsBatch,
    domainLabel,
  };
}
