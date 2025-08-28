"use client";

import * as React from "react";

export type ClassifierItem = {
  registryName: string;
  displayName?: string;
  type?: string;
  version?: string;
  supportsBatch?: boolean;
  isValid?: boolean;
  isAvailable?: boolean;
  description?: string;
  targetDomain?: string;
};

export type ClassifierStatusResponse = {
  classifiers: ClassifierItem[];
  environment: { hasOpenAI: boolean };
};

// Hook pour récupérer tous les classificateurs une seule fois
function useClassifierItems() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<ClassifierItem[]>([]);

  React.useEffect(() => {
    let alive = true;

    const fetchClassifiers = async () => {
      try {
        const res = await fetch("/api/algolab/classifiers", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data: ClassifierStatusResponse = await res.json();
        if (!alive) return;

        setItems(data.classifiers || []);
        setError(null);
      } catch (e: any) {
        if (!alive) return;
        console.error("Erreur fetch classificateurs:", e);
        setError(e?.message || "Impossible de récupérer les classificateurs");
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchClassifiers();

    return () => {
      alive = false;
    };
  }, []); // Pas de dépendances - chargement unique

  return { loading, error, items };
}

// Hook principal pour le statut d'un classificateur spécifique
export function useClassifierStatus(selectedRegistryName: string) {
  const { loading, error, items } = useClassifierItems();

  // Sélection mémorisée du classificateur courant
  const selected = React.useMemo(() => {
    if (!selectedRegistryName || items.length === 0) return null;
    return items.find((c) => c.registryName === selectedRegistryName) || null;
  }, [items, selectedRegistryName]);

  // Propriétés calculées stables
  const isConfigValid = React.useMemo(() => {
    return Boolean(selected?.isAvailable);
  }, [selected?.isAvailable]);

  const supportsBatch = React.useMemo(() => {
    return Boolean(selected?.supportsBatch);
  }, [selected?.supportsBatch]);

  const domainLabel = React.useMemo(() => {
    return selected?.targetDomain || "Général";
  }, [selected?.targetDomain]);

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
