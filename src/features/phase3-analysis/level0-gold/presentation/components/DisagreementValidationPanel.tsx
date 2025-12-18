'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  TextField,
  Alert,
  Paper,
  Divider,
  LinearProgress,
  IconButton,
  Collapse,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Help as HelpIcon,
  NavigateNext as NavigateNextIcon,
  NavigateBefore as NavigateBeforeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { DisagreementValidationService } from '../../domain/services/DisagreementValidationService';
import { GoldStandardService } from '../../domain/services/GoldStandardService';
import { supabase } from '@/lib/supabaseClient';

interface Disagreement {
  pair_id: number;
  manual_tag: string;
  llm_tag: string;
  llm_confidence?: number;
  llm_reasoning?: string;
  verbatim: string;
  context_before?: string;
  context_after?: string;
  conseiller_verbatim?: string;
}

interface DisagreementValidationPanelProps {
  testId: string;
  onComplete?: () => void;
}

type ValidationDecision = 'CAS_A_LLM_CORRECT' | 'CAS_B_LLM_INCORRECT' | 'CAS_C_AMBIGUOUS' | null;

export const DisagreementValidationPanel: React.FC<DisagreementValidationPanelProps> = ({
  testId,
  onComplete,
}) => {
  const [disagreements, setDisagreements] = useState<Disagreement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [decision, setDecision] = useState<ValidationDecision>(null);
  const [comment, setComment] = useState('');
  const [showContext, setShowContext] = useState(true);

  // Stats
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

// Enrichir avec conseiller_verbatim depuis analysis_pairs si nécessaire
const enriched: Disagreement[] = await Promise.all(
  pending.map(async (d) => {
    // Charger conseiller_verbatim depuis analysis_pairs
    const { data: pair } = await supabase
      .from('analysis_pairs')
      .select('conseiller_verbatim')
      .eq('pair_id', d.pair_id)
      .single();

    return {
      pair_id: d.pair_id,
      manual_tag: d.manual_tag,
      llm_tag: d.llm_tag,
      llm_confidence: d.llm_confidence,
      llm_reasoning: d.llm_reasoning,
      verbatim: d.verbatim,
      context_before: d.context_before,
      context_after: d.context_after,
      conseiller_verbatim: pair?.conseiller_verbatim,
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

const handleValidate = async () => {
  if (!decision) {
    setError('Veuillez sélectionner une décision (CAS A/B/C)');
    return;
  }

  if (comment.trim().length < 10) {
    setError('Veuillez fournir une justification (minimum 10 caractères)');
    return;
  }

  try {
    setSubmitting(true);
    setError(null);

    const currentDisagreement = disagreements[currentIndex];

    // Récupérer charte_id depuis le test
    const { data: test } = await supabase
      .from('level0_charte_tests')
      .select('charte_id')
      .eq('test_id', testId)
      .single();

    if (!test) {
      throw new Error('Test introuvable');
    }

    // Construire l'objet de validation complet
    const validationInput = {
      test_id: testId,
      pair_id: currentDisagreement.pair_id,
      charte_id: test.charte_id,
      manual_tag: currentDisagreement.manual_tag,
      llm_tag: currentDisagreement.llm_tag,
      llm_confidence: currentDisagreement.llm_confidence,
      llm_reasoning: currentDisagreement.llm_reasoning,
      validation_decision: decision,
      corrected_tag: decision === 'CAS_A_LLM_CORRECT' ? currentDisagreement.llm_tag : currentDisagreement.manual_tag,
      validation_comment: comment.trim(),
      verbatim: currentDisagreement.verbatim,
      context_before: currentDisagreement.context_before,
      context_after: currentDisagreement.context_after,
    };

    const result = await DisagreementValidationService.validateDisagreement(validationInput);
    
    if (!result.success) {
      setError(result.error || 'Erreur lors de la validation');
      return;
    }

    setValidatedCount((prev) => prev + 1);

    // Passer au suivant ou terminer
    if (currentIndex < disagreements.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setDecision(null);
      setComment('');
    } else {
      // Tous les désaccords validés
      if (onComplete) {
        onComplete();
      }
    }
  } catch (err: any) {
    console.error('Error validating disagreement:', err);
    setError(err.message || 'Erreur lors de la validation');
  } finally {
    setSubmitting(false);
  }
};

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setDecision(null);
      setComment('');
      setError(null);
    }
  };

  const handleNext = () => {
    if (currentIndex < disagreements.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setDecision(null);
      setComment('');
      setError(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          Chargement des désaccords...
        </Typography>
      </Box>
    );
  }

  if (disagreements.length === 0) {
    return (
      <Alert severity="success" icon={<CheckCircleIcon />}>
        <Typography variant="body1" fontWeight="medium">
          Tous les désaccords ont été validés ! ✨
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Vous pouvez maintenant consulter les métriques corrigées du test.
        </Typography>
      </Alert>
    );
  }

  const currentDisagreement = disagreements[currentIndex];
  const progress = ((currentIndex + validatedCount) / disagreements.length) * 100;

  return (
    <Box>
      {/* Header avec progression */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
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
          sx={{ height: 8, borderRadius: 4 }}
        />

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {validatedCount} désaccord{validatedCount > 1 ? 's' : ''} validé{validatedCount > 1 ? 's' : ''} sur {disagreements.length}
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Info CAS A/B/C */}
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight="medium" gutterBottom>
          Types de désaccords :
        </Typography>
        <Stack spacing={0.5}>
          <Typography variant="caption">
            <strong>CAS A (LLM correct) :</strong> Le LLM a raison → Le gold standard sera corrigé automatiquement
          </Typography>
          <Typography variant="caption">
            <strong>CAS B (LLM incorrect) :</strong> Thomas avait raison → Le gold standard reste inchangé
          </Typography>
          <Typography variant="caption">
            <strong>CAS C (Ambigu) :</strong> Difficile à trancher → Exclu du calcul du Kappa corrigé
          </Typography>
        </Stack>
      </Alert>

      {/* Affichage du désaccord */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {/* Contexte avant (collapsible) */}
          {currentDisagreement.context_before && (
            <Box sx={{ mb: 2 }}>
              <Button
                size="small"
                onClick={() => setShowContext(!showContext)}
                endIcon={showContext ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              >
                Contexte
              </Button>
              <Collapse in={showContext}>
                <Paper sx={{ p: 1.5, mt: 1, bgcolor: 'grey.50' }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Avant :
                  </Typography>
                  <Typography variant="body2">
                    {currentDisagreement.context_before}
                  </Typography>
                </Paper>
              </Collapse>
            </Box>
          )}

          {/* Tour conseiller */}
          {currentDisagreement.conseiller_verbatim && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.50' }}>
              <Typography variant="caption" color="primary.main" fontWeight="medium" display="block" gutterBottom>
                🎧 Conseiller :
              </Typography>
              <Typography variant="body1">
                {currentDisagreement.conseiller_verbatim}
              </Typography>
            </Paper>
          )}

          {/* Tour client (verbatim du désaccord) */}
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'secondary.50' }}>
            <Typography variant="caption" color="secondary.main" fontWeight="medium" display="block" gutterBottom>
              💬 Client :
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              "{currentDisagreement.verbatim}"
            </Typography>
          </Paper>

          {/* Contexte après */}
          {currentDisagreement.context_after && showContext && (
            <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Après :
              </Typography>
              <Typography variant="body2">
                {currentDisagreement.context_after}
              </Typography>
            </Paper>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Comparaison tags */}
          <Stack direction="row" spacing={3} justifyContent="center" alignItems="center">
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Gold Standard (Thomas Audio)
              </Typography>
              <Chip
                label={currentDisagreement.manual_tag}
                color="primary"
                size="medium"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>

            <Typography variant="h6" color="text.secondary">
              ≠
            </Typography>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                LLM (Texte seul)
              </Typography>
              <Chip
                label={currentDisagreement.llm_tag}
                color="secondary"
                size="medium"
                sx={{ fontWeight: 'bold' }}
              />
              {currentDisagreement.llm_confidence && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Confiance : {(currentDisagreement.llm_confidence * 100).toFixed(0)}%
                </Typography>
              )}
            </Box>
          </Stack>

          {/* Raisonnement LLM */}
          {currentDisagreement.llm_reasoning && (
            <Paper sx={{ p: 2, mt: 3, bgcolor: 'info.50' }}>
              <Typography variant="caption" color="info.main" fontWeight="medium" display="block" gutterBottom>
                💭 Raisonnement LLM :
              </Typography>
              <Typography variant="body2">
                {currentDisagreement.llm_reasoning}
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Formulaire de validation */}
      <Card>
        <CardContent>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="medium">
                Quelle est votre décision ?
              </Typography>
            </FormLabel>

            <RadioGroup
              value={decision}
              onChange={(e) => setDecision(e.target.value as ValidationDecision)}
            >
              <FormControlLabel
                value="CAS_A_LLM_CORRECT"
                control={<Radio />}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        CAS A : Le LLM a raison
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Le gold standard sera corrigé automatiquement
                      </Typography>
                    </Box>
                  </Stack>
                }
                sx={{
                  p: 1.5,
                  mb: 1,
                  border: '1px solid',
                  borderColor: decision === 'CAS_A_LLM_CORRECT' ? 'success.main' : 'grey.300',
                  borderRadius: 1,
                  bgcolor: decision === 'CAS_A_LLM_CORRECT' ? 'success.50' : 'transparent',
                }}
              />

              <FormControlLabel
                value="CAS_B_LLM_INCORRECT"
                control={<Radio />}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CancelIcon color="error" fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        CAS B : Thomas avait raison
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Le gold standard reste inchangé
                      </Typography>
                    </Box>
                  </Stack>
                }
                sx={{
                  p: 1.5,
                  mb: 1,
                  border: '1px solid',
                  borderColor: decision === 'CAS_B_LLM_INCORRECT' ? 'error.main' : 'grey.300',
                  borderRadius: 1,
                  bgcolor: decision === 'CAS_B_LLM_INCORRECT' ? 'error.50' : 'transparent',
                }}
              />

              <FormControlLabel
                value="CAS_C_AMBIGUOUS"
                control={<Radio />}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <HelpIcon color="warning" fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        CAS C : Ambigu / Difficile à trancher
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Exclu du calcul du Kappa corrigé
                      </Typography>
                    </Box>
                  </Stack>
                }
                sx={{
                  p: 1.5,
                  border: '1px solid',
                  borderColor: decision === 'CAS_C_AMBIGUOUS' ? 'warning.main' : 'grey.300',
                  borderRadius: 1,
                  bgcolor: decision === 'CAS_C_AMBIGUOUS' ? 'warning.50' : 'transparent',
                }}
              />
            </RadioGroup>
          </FormControl>

          {/* Justification */}
          <TextField
            label="Justification (obligatoire)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Expliquez votre décision (minimum 10 caractères)..."
            multiline
            rows={4}
            fullWidth
            required
            sx={{ mt: 3 }}
            helperText={`${comment.length} / 10 caractères minimum`}
            error={comment.length > 0 && comment.length < 10}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ mt: 3 }}>
        <Button
          startIcon={<NavigateBeforeIcon />}
          onClick={handlePrevious}
          disabled={currentIndex === 0 || submitting}
        >
          Précédent
        </Button>

        <Stack direction="row" spacing={2}>
          <Tooltip title="Passer sans valider (revenir plus tard)">
            <Button
              variant="outlined"
              onClick={handleNext}
              disabled={currentIndex >= disagreements.length - 1 || submitting}
            >
              Passer
            </Button>
          </Tooltip>

          <Button
            variant="contained"
            color="primary"
            onClick={handleValidate}
            disabled={!decision || comment.trim().length < 10 || submitting}
            endIcon={<NavigateNextIcon />}
          >
            {submitting ? 'Validation...' : 'Valider et Suivant'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};
