/**
 * Hook: useDisagreementValidation
 * Gère l'état et la logique de validation des désaccords
 * 
 * Emplacement: src/features/phase3-analysis/level0-gold/ui/hooks/useDisagreementValidation.ts
 */

import { useState, useEffect, useCallback } from 'react';
import { DisagreementValidationService } from '../../domain/services';
import type {
  PendingDisagreement,
  DisagreementValidationInput,
  CorrectedKappaResult,
  ValidationStats,
  ValidationDecision
} from '@/types/algorithm-lab/Level0Types';

interface UseDisagreementValidationProps {
  testId: string;
  autoLoad?: boolean;
}

interface UseDisagreementValidationReturn {
  // État
  disagreements: PendingDisagreement[];
  currentIndex: number;
  currentDisagreement: PendingDisagreement | null;
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;
  
  // Statistiques
  stats: ValidationStats | null;
  correctedKappa: CorrectedKappaResult | null;
  
  // Actions
  loadDisagreements: () => Promise<void>;
  validateDisagreement: (
    decision: ValidationDecision,
    comment: string,
    correctedTag?: string
  ) => Promise<void>;
  goToNext: () => void;
  goToPrevious: () => void;
  goToIndex: (index: number) => void;
  refresh: () => Promise<void>;
}

export function useDisagreementValidation({
  testId,
  autoLoad = true
}: UseDisagreementValidationProps): UseDisagreementValidationReturn {
  
  // États
  const [disagreements, setDisagreements] = useState<PendingDisagreement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [correctedKappa, setCorrectedKappa] = useState<CorrectedKappaResult | null>(null);

  // Désaccord courant
  const currentDisagreement = disagreements[currentIndex] || null;

  /**
   * Charger les désaccords en attente
   */
  const loadDisagreements = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await DisagreementValidationService.getPendingDisagreements(testId);
      
      if (response.success && response.data) {
        setDisagreements(response.data);
        setCurrentIndex(0);
      } else {
        setError(response.error || 'Erreur lors du chargement des désaccords');
        setDisagreements([]);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inattendue');
      setDisagreements([]);
    } finally {
      setIsLoading(false);
    }
  }, [testId]);

  /**
   * Charger les statistiques
   */
  const loadStats = useCallback(async () => {
    try {
      const [statsResponse, kappaResponse] = await Promise.all([
        DisagreementValidationService.getValidationStats(testId),
        DisagreementValidationService.getCorrectedKappa(testId)
      ]);

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }

      if (kappaResponse.success && kappaResponse.data) {
        setCorrectedKappa(kappaResponse.data);
      }
    } catch (err: any) {
      console.error('Error loading stats:', err);
    }
  }, [testId]);

  /**
   * Valider un désaccord
   */
  const validateDisagreement = useCallback(async (
    decision: ValidationDecision,
    comment: string,
    correctedTag?: string
  ) => {
    if (!currentDisagreement) {
      setError('Aucun désaccord sélectionné');
      return;
    }

    if (comment.length < 10) {
      setError('Le commentaire doit contenir au moins 10 caractères');
      return;
    }

    if (decision === 'CAS_A_LLM_CORRECT' && !correctedTag) {
      setError('CAS A nécessite un tag corrigé');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const input: DisagreementValidationInput = {
        test_id: currentDisagreement.test_id,
        pair_id: currentDisagreement.pair_id,
        charte_id: currentDisagreement.charte_id,
        manual_tag: currentDisagreement.manual_tag,
        llm_tag: currentDisagreement.llm_tag,
        llm_confidence: currentDisagreement.llm_confidence,
        llm_reasoning: currentDisagreement.llm_reasoning,
        validation_decision: decision,
        corrected_tag: correctedTag,
        validation_comment: comment,
        verbatim: currentDisagreement.verbatim,
        context_before: currentDisagreement.context_before,
        context_after: currentDisagreement.context_after
      };

      const response = await DisagreementValidationService.validateDisagreement(input);

      if (response.success) {
        // Mettre à jour le Kappa corrigé
        if (response.correctedKappa) {
          setCorrectedKappa(response.correctedKappa);
        }

        // Recharger la liste et passer au suivant
        await loadDisagreements();
        await loadStats();
      } else {
        setError(response.error || 'Erreur lors de la validation');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setIsValidating(false);
    }
  }, [currentDisagreement, loadDisagreements, loadStats]);

  /**
   * Navigation
   */
  const goToNext = useCallback(() => {
    if (currentIndex < disagreements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, disagreements.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < disagreements.length) {
      setCurrentIndex(index);
    }
  }, [disagreements.length]);

  /**
   * Rafraîchir tout
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      loadDisagreements(),
      loadStats()
    ]);
  }, [loadDisagreements, loadStats]);

  /**
   * Auto-load au montage
   */
  useEffect(() => {
    if (autoLoad && testId) {
      refresh();
    }
  }, [testId, autoLoad]); // Ne pas inclure refresh pour éviter boucle

  return {
    // État
    disagreements,
    currentIndex,
    currentDisagreement,
    isLoading,
    isValidating,
    error,
    
    // Statistiques
    stats,
    correctedKappa,
    
    // Actions
    loadDisagreements,
    validateDisagreement,
    goToNext,
    goToPrevious,
    goToIndex,
    refresh
  };
}
