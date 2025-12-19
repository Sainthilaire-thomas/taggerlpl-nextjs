'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Paper,
  Divider,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Alert,
  Link,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Help as HelpIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import AnalysisPairContext from '@/features/shared/ui/components/AnalysisPairContext';

// ============================================================================
// TYPES
// ============================================================================

export interface DisagreementDetailViewProps {
  // Identification
  pairId: number;
  callId: string;
  
  // Tags comparés
  manualTag: string;
  llmTag: string;
  llmConfidence?: number;
  llmReasoning?: string;
  
  // Mode d'affichage
  mode: 'read-only' | 'validation';
  
  // Callback validation (si mode="validation")
  onValidate?: (decision: ValidationDecision, comment: string) => void;
  
  // Options
  showCallLink?: boolean;
}

export type ValidationDecision = 'CAS_A_LLM_CORRECT' | 'CAS_B_LLM_INCORRECT' | 'CAS_C_AMBIGUOUS';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export const DisagreementDetailView: React.FC<DisagreementDetailViewProps> = ({
  pairId,
  callId,
  manualTag,
  llmTag,
  llmConfidence,
  llmReasoning,
  mode,
  onValidate,
  showCallLink = true,
}) => {
  const [decision, setDecision] = useState<ValidationDecision | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleValidate = () => {
    if (!decision) {
      setError('Veuillez sélectionner une décision (CAS A/B/C)');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Veuillez fournir une justification (minimum 10 caractères)');
      return;
    }

    setError(null);
    onValidate?.(decision, comment.trim());
  };

  return (
    <Box>
      {/* Header avec Pair ID + Call ID */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Paire #{pairId}
          </Typography>
          
          {showCallLink && (
            <Link
  href={`/phase2-annotation/supervision?call_id=${callId}`}
  target="_blank"
  rel="noopener noreferrer"
>
              <Typography variant="body2">
                Voir l'appel complet
              </Typography>
              <OpenInNewIcon fontSize="small" />
            </Link>
          )}
        </Stack>
      </Paper>

      {/* Contexte Conversationnel */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            💬 Contexte Conversationnel
          </Typography>
          <AnalysisPairContext pairId={pairId} />
        </CardContent>
      </Card>

      {/* Comparaison Tags */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            🏷️ Comparaison des Tags
          </Typography>
          
          <Stack direction="row" spacing={3} justifyContent="center" alignItems="center" sx={{ my: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Gold Standard (Manuel)
              </Typography>
              <Chip
                label={manualTag}
                color="primary"
                size="medium"
                sx={{ fontWeight: 'bold', minWidth: 180 }}
              />
            </Box>

            <Typography variant="h6" color="text.secondary">
              ≠
            </Typography>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                LLM (Automatique)
              </Typography>
              <Chip
                label={llmTag}
                color="secondary"
                size="medium"
                sx={{ fontWeight: 'bold', minWidth: 180 }}
              />
              {llmConfidence && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  Confiance : {(llmConfidence * 100).toFixed(0)}%
                </Typography>
              )}
            </Box>
          </Stack>

          {llmReasoning && (
            <Paper sx={{ p: 2, mt: 2, bgcolor: 'info.50' }}>
              <Typography variant="caption" color="info.main" fontWeight="medium" display="block" gutterBottom>
                💭 Raisonnement LLM :
              </Typography>
              <Typography variant="body2">
                {llmReasoning}
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* Formulaire Validation (si mode="validation") */}
      {mode === 'validation' && (
        <Card>
          <CardContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Types de désaccords :
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="caption">
                  <strong>CAS A :</strong> Le LLM a raison → Le gold standard sera corrigé automatiquement
                </Typography>
                <Typography variant="caption">
                  <strong>CAS B :</strong> L'annotation manuelle était correcte → Le gold standard reste inchangé
                </Typography>
                <Typography variant="caption">
                  <strong>CAS C :</strong> Ambigu → Exclu du calcul du Kappa corrigé
                </Typography>
              </Stack>
            </Alert>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

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
                          Le gold standard sera corrigé
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
                          CAS B : L'annotation manuelle était correcte
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

            <Button
              variant="contained"
              color="primary"
              onClick={handleValidate}
              disabled={!decision || comment.trim().length < 10}
              sx={{ mt: 2 }}
              fullWidth
            >
              Valider la Décision
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
