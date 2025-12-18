/**
 * Composant: DisagreementValidationPanel
 * Interface de validation des désaccords LLM vs annotations manuelles
 * 
 * Emplacement: src/features/phase3-analysis/level0-gold/ui/components/DisagreementValidationPanel.tsx
 */

'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  TextField,
  LinearProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
  Card,
  CardContent,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useDisagreementValidation } from '../hooks/useDisagreementValidation';
import {
  VALIDATION_DECISIONS,
  formatKappa,
  interpretKappaValue,
  type ValidationDecision
} from '@/types/algorithm-lab/Level0Types';

interface DisagreementValidationPanelProps {
  testId: string;
  onValidationComplete?: () => void;
}

export function DisagreementValidationPanel({
  testId,
  onValidationComplete
}: DisagreementValidationPanelProps) {
  
  const {
    disagreements,
    currentIndex,
    currentDisagreement,
    isLoading,
    isValidating,
    error,
    stats,
    correctedKappa,
    validateDisagreement,
    goToNext,
    goToPrevious,
    goToIndex,
    refresh
  } = useDisagreementValidation({ testId });

  // État local pour le formulaire
  const [selectedDecision, setSelectedDecision] = useState<ValidationDecision | null>(null);
  const [comment, setComment] = useState('');
  const [correctedTag, setCorrectedTag] = useState('');

  /**
   * Gérer la validation
   */
  const handleValidate = async () => {
    if (!selectedDecision) {
      return;
    }

    await validateDisagreement(
      selectedDecision,
      comment,
      selectedDecision === 'CAS_A_LLM_CORRECT' ? correctedTag : undefined
    );

    // Réinitialiser le formulaire
    setSelectedDecision(null);
    setComment('');
    setCorrectedTag('');

    onValidationComplete?.();
  };

  /**
   * Render état vide
   */
  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }} align="center">
          Chargement des désaccords...
        </Typography>
      </Box>
    );
  }

  if (disagreements.length === 0 && !isLoading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="success" icon={<CheckIcon />}>
          <Typography variant="h6">Tous les désaccords ont été validés !</Typography>
         <Typography variant="body2" sx={{ mt: 1 }}>
  Kappa corrigé : <strong>{formatKappa(correctedKappa?.kappa_corrected ?? null)}</strong>
  {' '}({interpretKappaValue(correctedKappa?.kappa_corrected ?? null)})
</Typography>
        </Alert>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={refresh}
          sx={{ mt: 2 }}
        >
          Rafraîchir
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header avec statistiques */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6">
              Validation des Désaccords
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Désaccord {currentIndex + 1} sur {disagreements.length}
            </Typography>
          </Box>

          {correctedKappa && (
            <Stack direction="row" spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary">Kappa Brut</Typography>
                <Typography variant="h6">
                  {formatKappa(correctedKappa.kappa_brut)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Kappa Corrigé</Typography>
                <Typography variant="h6" color="primary">
                  {formatKappa(correctedKappa.kappa_corrected)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">En attente</Typography>
                <Typography variant="h6">
                  {correctedKappa.pending_validations}
                </Typography>
              </Box>
            </Stack>
          )}

          <IconButton onClick={refresh} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Stack>

        <LinearProgress
          variant="determinate"
          value={(currentIndex / disagreements.length) * 100}
          sx={{ mt: 2 }}
        />
      </Paper>

      {/* Erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
          {error}
        </Alert>
      )}

      {/* Désaccord courant */}
      {currentDisagreement && (
        <Stack spacing={3}>
          {/* Verbatim et Tags */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Verbatim
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  fontStyle: 'italic'
                }}
              >
                "{currentDisagreement.verbatim}"
              </Typography>

              <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tag Manuel
                  </Typography>
                  <Chip
                    label={currentDisagreement.manual_tag}
                    color="primary"
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tag LLM
                  </Typography>
                  <Chip
                    label={currentDisagreement.llm_tag}
                    color="secondary"
                    sx={{ mt: 1 }}
                  />
                  {currentDisagreement.llm_confidence && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      Confiance: {(currentDisagreement.llm_confidence * 100).toFixed(0)}%
                    </Typography>
                  )}
                </Box>
              </Stack>

              {/* Raisonnement LLM */}
              {currentDisagreement.llm_reasoning && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Raisonnement LLM
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      p: 1.5,
                      mt: 1,
                      bgcolor: 'info.lighter',
                      borderRadius: 1,
                      fontSize: '0.875rem'
                    }}
                  >
                    {currentDisagreement.llm_reasoning}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Contexte conversationnel */}
          {(currentDisagreement.context_before || currentDisagreement.context_after) && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contexte Conversationnel
                </Typography>
                
                {currentDisagreement.context_before && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Tour précédent
                    </Typography>
                    <Typography variant="body2" sx={{ pl: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                      "{currentDisagreement.context_before}"
                    </Typography>
                  </Box>
                )}

                {currentDisagreement.context_after && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Tour suivant
                    </Typography>
                    <Typography variant="body2" sx={{ pl: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                      "{currentDisagreement.context_after}"
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          <Divider />

          {/* Formulaire de validation */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Décision de Validation
              </Typography>

              {/* Boutons de décision */}
              <Stack spacing={2} sx={{ mt: 2 }}>
                {VALIDATION_DECISIONS.map((decision) => (
                  <Button
                    key={decision.value}
                    variant={selectedDecision === decision.value ? 'contained' : 'outlined'}
                    onClick={() => setSelectedDecision(decision.value)}
                    sx={{
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      borderColor: decision.color,
                      color: selectedDecision === decision.value ? 'white' : decision.color,
                      bgcolor: selectedDecision === decision.value ? decision.color : 'transparent',
                      '&:hover': {
                        bgcolor: selectedDecision === decision.value ? decision.color : `${decision.color}20`
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2">{decision.label}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {decision.description}
                      </Typography>
                    </Box>
                  </Button>
                ))}
              </Stack>

              {/* Tag corrigé (si CAS A) */}
              {selectedDecision === 'CAS_A_LLM_CORRECT' && (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Tag Corrigé</InputLabel>
                  <Select
                    value={correctedTag}
                    onChange={(e) => setCorrectedTag(e.target.value)}
                    label="Tag Corrigé"
                  >
                    <MenuItem value={currentDisagreement.llm_tag}>
                      {currentDisagreement.llm_tag} (Tag LLM)
                    </MenuItem>
                    <MenuItem value="CLIENT_POSITIF">CLIENT_POSITIF</MenuItem>
                    <MenuItem value="CLIENT_NEGATIF">CLIENT_NEGATIF</MenuItem>
                    <MenuItem value="CLIENT_NEUTRE">CLIENT_NEUTRE</MenuItem>
                    <MenuItem value="ENGAGEMENT">ENGAGEMENT</MenuItem>
                    <MenuItem value="OUVERTURE">OUVERTURE</MenuItem>
                    <MenuItem value="REFLET">REFLET</MenuItem>
                    <MenuItem value="EXPLICATION">EXPLICATION</MenuItem>
                  </Select>
                </FormControl>
              )}

              {/* Commentaire */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Justification (min. 10 caractères)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Expliquez votre décision..."
                required
                error={comment.length > 0 && comment.length < 10}
                helperText={
                  comment.length > 0 && comment.length < 10
                    ? `${10 - comment.length} caractères restants`
                    : undefined
                }
                sx={{ mt: 2 }}
              />

              {/* Bouton valider */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleValidate}
                disabled={
                  !selectedDecision ||
                  comment.length < 10 ||
                  (selectedDecision === 'CAS_A_LLM_CORRECT' && !correctedTag) ||
                  isValidating
                }
                sx={{ mt: 2 }}
              >
                {isValidating ? 'Validation en cours...' : 'Valider ce Désaccord'}
              </Button>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Button
                startIcon={<PrevIcon />}
                onClick={goToPrevious}
                disabled={currentIndex === 0}
              >
                Précédent
              </Button>

              <Typography variant="body2" color="text.secondary">
                {currentIndex + 1} / {disagreements.length}
              </Typography>

              <Button
                endIcon={<NextIcon />}
                onClick={goToNext}
                disabled={currentIndex === disagreements.length - 1}
              >
                Suivant
              </Button>
            </Stack>
          </Paper>
        </Stack>
      )}
    </Box>
  );
}
