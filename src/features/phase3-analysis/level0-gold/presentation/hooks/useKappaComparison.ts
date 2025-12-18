/**
 * Hook: useKappaComparison
 * Gère la comparaison Kappa entre 2 annotateurs
 * 
 * Emplacement: src/features/phase3-analysis/level0-gold/ui/hooks/useKappaComparison.ts
 */

import { useState, useEffect, useCallback } from 'react';
import { KappaCalculationService } from '../../domain/services';
import type {
  AnnotatorForComparison,
  AnnotatorIdentifier,
  KappaComparisonResult
} from '@/types/algorithm-lab/Level0Types';

interface UseKappaComparisonProps {
  variable?: 'X' | 'Y';
  autoLoadAnnotators?: boolean;
}

interface UseKappaComparisonReturn {
  // Annotateurs disponibles
  annotators: AnnotatorForComparison[];
  isLoadingAnnotators: boolean;
  
  // Sélection
  annotator1: AnnotatorIdentifier | null;
  annotator2: AnnotatorIdentifier | null;
  setAnnotator1: (annotator: AnnotatorIdentifier | null) => void;
  setAnnotator2: (annotator: AnnotatorIdentifier | null) => void;
  
  // Comparaison
  comparisonResult: KappaComparisonResult | null;
  isComparing: boolean;
  error: string | null;
  
  // Actions
  loadAnnotators: () => Promise<void>;
  compare: () => Promise<void>;
  exportToCSV: () => string | null;
  reset: () => void;
}

export function useKappaComparison({
  variable,
  autoLoadAnnotators = true
}: UseKappaComparisonProps = {}): UseKappaComparisonReturn {
  
  // États
  const [annotators, setAnnotators] = useState<AnnotatorForComparison[]>([]);
  const [isLoadingAnnotators, setIsLoadingAnnotators] = useState(false);
  
  const [annotator1, setAnnotator1] = useState<AnnotatorIdentifier | null>(null);
  const [annotator2, setAnnotator2] = useState<AnnotatorIdentifier | null>(null);
  
  const [comparisonResult, setComparisonResult] = useState<KappaComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger la liste des annotateurs
   */
  const loadAnnotators = useCallback(async () => {
    setIsLoadingAnnotators(true);
    setError(null);

    try {
      const annotatorsList = await KappaCalculationService.getAvailableAnnotators(variable);
      setAnnotators(annotatorsList);
      
      // Auto-sélectionner les 2 premiers si disponibles
      if (annotatorsList.length >= 2 && !annotator1 && !annotator2) {
        setAnnotator1({
          annotator_type: annotatorsList[0].type,
          annotator_id: annotatorsList[0].id
        });
        setAnnotator2({
          annotator_type: annotatorsList[1].type,
          annotator_id: annotatorsList[1].id
        });
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des annotateurs');
      setAnnotators([]);
    } finally {
      setIsLoadingAnnotators(false);
    }
  }, [variable, annotator1, annotator2]);

  /**
   * Comparer 2 annotateurs
   */
  const compare = useCallback(async () => {
    if (!annotator1 || !annotator2) {
      setError('Veuillez sélectionner 2 annotateurs');
      return;
    }

    if (annotator1.annotator_type === annotator2.annotator_type && 
        annotator1.annotator_id === annotator2.annotator_id) {
      setError('Veuillez sélectionner 2 annotateurs différents');
      return;
    }

    setIsComparing(true);
    setError(null);
    setComparisonResult(null);

    try {
      const result = await KappaCalculationService.compareAnyAnnotators(
        annotator1,
        annotator2,
        variable
      );

      if (result.success) {
        setComparisonResult(result);
      } else {
        setError(result.error || 'Erreur lors de la comparaison');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setIsComparing(false);
    }
  }, [annotator1, annotator2, variable]);

  /**
   * Exporter résultats en CSV
   */
  const exportToCSV = useCallback((): string | null => {
    if (!comparisonResult) {
      setError('Aucun résultat à exporter');
      return null;
    }

    try {
      return KappaCalculationService.exportComparisonToCSV(comparisonResult);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'export');
      return null;
    }
  }, [comparisonResult]);

  /**
   * Réinitialiser
   */
  const reset = useCallback(() => {
    setAnnotator1(null);
    setAnnotator2(null);
    setComparisonResult(null);
    setError(null);
  }, []);

  /**
   * Auto-load au montage
   */
  useEffect(() => {
    if (autoLoadAnnotators) {
      loadAnnotators();
    }
  }, [variable]); // Recharger si variable change

  return {
    // Annotateurs disponibles
    annotators,
    isLoadingAnnotators,
    
    // Sélection
    annotator1,
    annotator2,
    setAnnotator1,
    setAnnotator2,
    
    // Comparaison
    comparisonResult,
    isComparing,
    error,
    
    // Actions
    loadAnnotators,
    compare,
    exportToCSV,
    reset
  };
}
