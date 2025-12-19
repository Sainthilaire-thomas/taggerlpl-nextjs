'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  SkipNext as SkipNextIcon,
} from '@mui/icons-material';
import { DisagreementValidationService } from '../../domain/services/DisagreementValidationService';
import { DisagreementDetailView, ValidationDecision } from './DisagreementDetailView';
import { supabase } from '@/lib/supabaseClient';

interface Disagreement {
  pair_id: number;
  call_id: string;
  manual_tag: string;
  llm_tag: string;
  llm_confidence?: number;
  llm_reasoning?: string;
}

interface DisagreementValidationPanelProps {
  testId: string;
  onComplete?: () => void;
}

export const DisagreementValidationPanel: React.FC<DisagreementValidationPanelProps> = ({
  testId,
  onComplete,
}) => {
  const [disagreements, setDisagreements] = useState<Disagreement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatedCount, setValidatedCount] = useState(0);

  useEffect(() => {
    loadDisagreements();
  }, [testId]);

  const loadDisagreements = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await DisagreementValidationService.getPendingDisagreements(testId);

      if (!result.success) {
        setError(result.error || 'Erreur lors du chargement des désaccords');
        return;
      }

      const pending = result.data || [];

      // Enrichir avec call_id depuis analysis_pairs
      const enriched: Disagreement[] = await Promise.all(
        pending.map(async (d) => {
          const { data: pair } = await supabase
            .from('analysis_pairs')
            .select('call_id')
            .eq('pair_id', d.pair_id)
            .single();

          return {
            pair_id: d.pair_id,
            call_id: pair?.call_id || '',
            manual_tag: d.manual_tag,
            llm_tag: d.llm_tag,
            llm_confidence: d.llm_confidence,
            llm_reasoning: d.llm_reasoning,
          };
        })
      );

      setDisagreements(enriched);
    } catch (err) {
      console.error('Error loading disagreements:', err);
      setError('Erreur lors du chargement des désaccords');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (decision: ValidationDecision, comment: string) => {
    try {
      setSubmitting(true);
      setError(null);

      const currentDisagreement = disagreements[currentIndex];

      // Récupérer charte_id et autres infos nécessaires
      const { data: test } = await supabase
        .from('level0_charte_tests')
        .select('charte_id')
        .eq('test_id', testId)
        .single();

      if (!test) {
        throw new Error('Test introuvable');
      }

      // Récupérer verbatim et contexte depuis analysis_pairs
      const { data: pair } = await supabase
        .from('analysis_pairs')
        .select('client_verbatim, prev1_verbatim, next1_verbatim')
        .eq('pair_id', currentDisagreement.pair_id)
        .single();

      const validationInput = {
        test_id: testId,
        pair_id: currentDisagreement.pair_id,
        charte_id: test.charte_id,
        manual_tag: currentDisagreement.manual_tag,
        llm_tag: currentDisagreement.llm_tag,
        llm_confidence: currentDisagreement.llm_confidence,
        llm_reasoning: currentDisagreement.llm_reasoning,
        validation_decision: decision,
        corrected_tag: decision === 'CAS_A_LLM_CORRECT' ? currentDisagreement.llm_tag : undefined,
        validation_comment: comment,
        verbatim: pair?.client_verbatim || '',
        context_before: pair?.prev1_verbatim || null,
        context_after: pair?.next1_verbatim || null,
      };

      const result = await DisagreementValidationService.validateDisagreement(validationInput);

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la validation');
      }

      setValidatedCount((prev) => prev + 1);

      // Passer au suivant ou terminer
      if (currentIndex < disagreements.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // Tous les désaccords validés
        onComplete?.();
      }
    } catch (err) {
      console.error('Error validating disagreement:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (currentIndex < disagreements.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Chargement des désaccords...
        </Typography>
      </Box>
    );
  }

  if (disagreements.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity="success">
            Tous les désaccords ont été validés ! ✨
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const currentDisagreement = disagreements[currentIndex];
  const progress = ((currentIndex + validatedCount) / disagreements.length) * 100;

  return (
    <Box>
      {/* Barre de progression */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">
              Validation des Désaccords
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {currentIndex + 1} / {disagreements.length}
            </Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 1, mb: 1 }}
          />

          <Typography variant="caption" color="success.main">
            {validatedCount} désaccord{validatedCount > 1 ? 's' : ''} validé{validatedCount > 1 ? 's' : ''}
          </Typography>
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Affichage du désaccord avec DisagreementDetailView */}
      <DisagreementDetailView
  key={currentDisagreement.pair_id}  // ← AJOUT
  pairId={currentDisagreement.pair_id}
  callId={currentDisagreement.call_id}
  manualTag={currentDisagreement.manual_tag}
  llmTag={currentDisagreement.llm_tag}
  llmConfidence={currentDisagreement.llm_confidence}
  llmReasoning={currentDisagreement.llm_reasoning}
  mode="validation"
  onValidate={handleValidate}
  showCallLink={true}
/>

      {/* Navigation */}
      <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<NavigateBeforeIcon />}
          onClick={handlePrevious}
          disabled={currentIndex === 0 || submitting}
        >
          Précédent
        </Button>

        <Button
          variant="outlined"
          color="warning"
          endIcon={<SkipNextIcon />}
          onClick={handleSkip}
          disabled={currentIndex >= disagreements.length - 1 || submitting}
        >
          Passer
        </Button>
      </Stack>
    </Box>
  );
};
