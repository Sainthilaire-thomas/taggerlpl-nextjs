// ============================================================================
// useLevel0Testing - Hook pour gérer les tests Level 0
// ============================================================================

import { useState, useCallback } from "react";
import { CharteTestResult } from "@/types/algorithm-lab/Level0Types";
import { 
  MultiCharteAnnotator, 
  SupabaseLevel0Service,
  CharteRegistry  
} from "@/features/phase3-analysis/level0-gold/domain/services";
import { getSupabase } from "@/lib/supabaseClient";

export function useLevel0Testing() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, charteName: "" });
  const [results, setResults] = useState<CharteTestResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadSamplePairs = useCallback(async (sampleSize: number = 10) => {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from("analysis_pairs")
      .select("pair_id, conseiller_verbatim, client_verbatim, strategy_tag, reaction_tag, prev1_verbatim, next1_verbatim")
      .limit(sampleSize);

    if (error) {
      console.error("Error loading sample pairs:", error);
      throw new Error(error.message);
    }

    return data || [];
  }, []);

const testVariable = useCallback(async (
  variable: "X" | "Y",
  sampleSize: number = 10,
  selectedCharteIds?: string[]  // 🆕 Paramètre optionnel
) => {
  setLoading(true);
  setError(null);
  setResults([]);

  try {
    const pairs = await loadSamplePairs(sampleSize);
    if (pairs.length === 0) {
      throw new Error("Aucune paire trouvée");
    }

    console.log(`Testing ${variable} with ${pairs.length} pairs`);

    // 🆕 Filtrer les chartes si selectedCharteIds fourni
    let testResults: CharteTestResult[];
    
    if (selectedCharteIds && selectedCharteIds.length > 0) {
      // Tester seulement les chartes sélectionnées
      const allChartes = await CharteRegistry.getChartesForVariable(variable);
      const chartes = allChartes.filter(c => selectedCharteIds.includes(c.charte_id));
      
      console.log(`Testing ${chartes.length} selected charte(s)`);
      
      testResults = [];
      for (const charte of chartes) {
        const result = await MultiCharteAnnotator.testSingleCharte(
          charte,
          pairs,
          (current, total) => {
            setProgress({ charteName: charte.charte_name, current, total });
          }
        );
        
        console.log(`Charte ${result.charte_name} completed: κ=${result.kappa.toFixed(3)}`);
        setResults(prev => [...prev, result]);
        testResults.push(result);
        
        // Sauvegarder immédiatement
        await SupabaseLevel0Service.saveCharteTestResult(result);
      }
    } else {
      // Tester toutes les chartes (comportement par défaut)
      testResults = await MultiCharteAnnotator.testAllChartesForVariable(
        variable,
        pairs,
        (charteName, current, total) => {
          setProgress({ charteName, current, total });
        },
        (result) => {
          console.log(`Charte ${result.charte_name} completed: κ=${result.kappa.toFixed(3)}`);
          setResults(prev => [...prev, result]);
        }
      );

      for (const result of testResults) {
        await SupabaseLevel0Service.saveCharteTestResult(result);
      }
    }

    console.log("All tests completed:", testResults);
  } catch (err: any) {
    console.error("Error during testing:", err);
    setError(err.message || "Erreur inconnue");
  } finally {
    setLoading(false);
    setProgress({ current: 0, total: 0, charteName: "" });
  }
}, [loadSamplePairs]);

  const loadSavedResults = useCallback(async (variable: "X" | "Y") => {
    try {
      const savedResults = await SupabaseLevel0Service.getCharteTestResults(variable);
      setResults(savedResults);
    } catch (err: any) {
      console.error("Error loading saved results:", err);
      setError(err.message || "Erreur de chargement");
    }
  }, []);

  return {
    loading,
    progress,
    results,
    error,
    testVariable,
    loadSavedResults
  };
}
