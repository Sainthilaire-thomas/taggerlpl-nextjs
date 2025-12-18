'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Typography,
  Box,
  Stack,
  Chip,
  FormHelperText,
  LinearProgress,
  Paper,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { GoldStandardService } from '../../domain/services/GoldStandardService';
import { supabase } from '@/lib/supabaseClient';

interface DerivationWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (goldStandardId: string, pairsToReview: number[]) => void;
}

interface Test {
  test_id: string;
  charte_id: string;
  charte_name?: string;
  kappa: number;
  total_pairs: number;
  disagreements_count: number;
  tested_at: string;
  philosophy?: string;
}

const STEPS = ['Sélection Test Source', 'Configuration Gold Standard', 'Confirmation'];

export const DerivationWizard: React.FC<DerivationWizardProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Sélection test source
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string>('');
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  // Step 2: Configuration nouveau GS
  const [newGoldStandardId, setNewGoldStandardId] = useState('');
  const [newGoldStandardName, setNewGoldStandardName] = useState('');
  const [newGoldStandardDescription, setNewGoldStandardDescription] = useState('');
  const [newGoldStandardModality, setNewGoldStandardModality] = useState<'audio' | 'text_only' | 'audio_text'>('text_only');
  const [methodologyNotes, setMethodologyNotes] = useState('');

  // Step 3: Résultats
  const [derivationResult, setDerivationResult] = useState<{
    copiedCount: number;
    toReviewCount: number;
    pairsToReview: number[];
    estimatedTimeMinutes: number;
  } | null>(null);

  // Charger les tests disponibles
  useEffect(() => {
    if (open) {
      loadAvailableTests();
    }
  }, [open]);

  const loadAvailableTests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('level0_charte_tests')
        .select(`
          test_id,
          charte_id,
          kappa,
          total_pairs,
          disagreements_count,
          tested_at,
          philosophy,
          level0_chartes!inner(charte_name)
        `)
        .order('tested_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const tests: Test[] = (data || []).map((row: any) => ({
        test_id: row.test_id,
        charte_id: row.charte_id,
        charte_name: row.level0_chartes?.charte_name || row.charte_id,
        kappa: row.kappa,
        total_pairs: row.total_pairs,
        disagreements_count: row.disagreements_count,
        tested_at: row.tested_at,
        philosophy: row.philosophy,
      }));

      setAvailableTests(tests);
    } catch (err) {
      console.error('Error loading tests:', err);
      setError('Erreur lors du chargement des tests');
    } finally {
      setLoading(false);
    }
  };

  const handleTestSelect = (testId: string) => {
    setSelectedTestId(testId);
    const test = availableTests.find(t => t.test_id === testId);
    setSelectedTest(test || null);
  };

  const handleNext = () => {
    if (activeStep === 0 && !selectedTestId) {
      setError('Veuillez sélectionner un test source');
      return;
    }

    if (activeStep === 1) {
      if (!newGoldStandardId || !newGoldStandardName || !newGoldStandardDescription) {
        setError('Veuillez remplir tous les champs obligatoires');
        return;
      }
    }

    setError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleCreateByDerivation = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!selectedTest) {
        throw new Error('Aucun test sélectionné');
      }

      // Récupérer la variable depuis la charte
      const { data: charte } = await supabase
        .from('level0_chartes')
        .select('variable')
        .eq('charte_id', selectedTest.charte_id)
        .single();

      if (!charte) {
        throw new Error('Charte introuvable');
      }

      const result = await GoldStandardService.createByDerivation(
        newGoldStandardId,
        {
          name: newGoldStandardName,
          description: newGoldStandardDescription,
          modality: newGoldStandardModality,
          variable: charte.variable as 'X' | 'Y',
          methodology_notes: methodologyNotes || undefined,
        },
        selectedTestId
      );

      setDerivationResult(result);
      setActiveStep(3); // Aller à l'écran de résultats

      if (onSuccess) {
        onSuccess(newGoldStandardId, result.pairsToReview);
      }
    } catch (err: any) {
      console.error('Error creating gold standard by derivation:', err);
      setError(err.message || 'Erreur lors de la création du gold standard');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedTestId('');
    setSelectedTest(null);
    setNewGoldStandardId('');
    setNewGoldStandardName('');
    setNewGoldStandardDescription('');
    setNewGoldStandardModality('text_only');
    setMethodologyNotes('');
    setDerivationResult(null);
    setError(null);
    onClose();
  };

  const agreementsCount = selectedTest ? selectedTest.total_pairs - selectedTest.disagreements_count : 0;
  const disagreementsCount = selectedTest?.disagreements_count || 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Créer un Gold Standard par Dérivation ⚡
      </DialogTitle>

      <DialogContent>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Step 1: Sélection Test Source */}
        {activeStep === 0 && (
          <Box>
            <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Principe :</strong> Copiez automatiquement les paires en accord et ne ré-annotez que les désaccords.
              </Typography>
            </Alert>

            <FormControl fullWidth>
              <InputLabel>Test source</InputLabel>
              <Select
                value={selectedTestId}
                onChange={(e) => handleTestSelect(e.target.value)}
                label="Test source"
              >
                {availableTests.map((test) => (
                  <MenuItem key={test.test_id} value={test.test_id}>
                    <Stack direction="row" spacing={2} alignItems="center" width="100%">
                      <Typography variant="body2" fontWeight="medium" sx={{ flex: 1 }}>
                        {test.charte_name}
                      </Typography>
                      <Chip
                        label={test.philosophy || 'N/A'}
                        size="small"
                        color="primary"
                      />
                      <Typography variant="caption" color="text.secondary">
                        κ={test.kappa.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {agreementsCount} accords / {test.disagreements_count} désaccords
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Les paires en accord seront copiées automatiquement
              </FormHelperText>
            </FormControl>

            {selectedTest && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: 'success.50' }}>
                <Typography variant="subtitle2" gutterBottom color="success.main">
                  📊 Estimation
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    ✅ <strong>{agreementsCount} paires</strong> copiées automatiquement ({((agreementsCount / selectedTest.total_pairs) * 100).toFixed(0)}%)
                  </Typography>
                  <Typography variant="body2">
                    ⚠️ <strong>{disagreementsCount} paires</strong> à ré-annoter manuellement ({((disagreementsCount / selectedTest.total_pairs) * 100).toFixed(0)}%)
                  </Typography>
                  <Divider />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TimerIcon fontSize="small" color="primary" />
                    <Typography variant="body2">
                      <strong>Temps estimé :</strong> ~{Math.ceil(disagreementsCount * 1.5)} minutes
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    (au lieu de ~15 heures pour annotation complète)
                  </Typography>
                </Stack>
              </Paper>
            )}
          </Box>
        )}

        {/* Step 2: Configuration Nouveau GS */}
        {activeStep === 1 && (
          <Box>
            <Stack spacing={3}>
              <TextField
                label="ID Gold Standard"
                value={newGoldStandardId}
                onChange={(e) => setNewGoldStandardId(e.target.value)}
                placeholder="thomas_texte_y"
                helperText="Identifiant unique (ex: thomas_texte_y)"
                required
                fullWidth
              />

              <TextField
                label="Nom"
                value={newGoldStandardName}
                onChange={(e) => setNewGoldStandardName(e.target.value)}
                placeholder="Thomas Texte Seul (Réactions Y)"
                required
                fullWidth
              />

              <TextField
                label="Description"
                value={newGoldStandardDescription}
                onChange={(e) => setNewGoldStandardDescription(e.target.value)}
                placeholder="Annotations manuelles sur transcription uniquement, sans écouter audio"
                multiline
                rows={3}
                required
                fullWidth
              />

              <FormControl fullWidth required>
                <InputLabel>Modalité</InputLabel>
                <Select
                  value={newGoldStandardModality}
                  onChange={(e) => setNewGoldStandardModality(e.target.value as any)}
                  label="Modalité"
                >
                  <MenuItem value="text_only">📝 Texte seul</MenuItem>
                  <MenuItem value="audio">🎧 Audio</MenuItem>
                  <MenuItem value="audio_text">🎧📝 Audio + Texte</MenuItem>
                </Select>
                <FormHelperText>
                  Modalité d'annotation utilisée pour ce gold standard
                </FormHelperText>
              </FormControl>

              <TextField
                label="Notes méthodologiques (optionnel)"
                value={methodologyNotes}
                onChange={(e) => setMethodologyNotes(e.target.value)}
                placeholder="Consignes spécifiques d'annotation..."
                multiline
                rows={2}
                fullWidth
              />
            </Stack>
          </Box>
        )}

        {/* Step 3: Confirmation */}
        {activeStep === 2 && (
          <Box>
            <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
              <Typography variant="body2">
                Vous êtes sur le point de créer un nouveau gold standard par dérivation.
              </Typography>
            </Alert>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                📋 Récapitulatif
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Gold Standard :</strong> {newGoldStandardName}
                </Typography>
                <Typography variant="body2">
                  <strong>ID :</strong> <code>{newGoldStandardId}</code>
                </Typography>
                <Typography variant="body2">
                  <strong>Modalité :</strong> {newGoldStandardModality}
                </Typography>
                <Typography variant="body2">
                  <strong>Test source :</strong> {selectedTest?.charte_name}
                </Typography>
              </Stack>
            </Paper>

            <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
              <Typography variant="subtitle2" gutterBottom color="info.main">
                📊 Résumé de la dérivation
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  ✅ {agreementsCount} paires seront copiées automatiquement
                </Typography>
                <Typography variant="body2">
                  ⚠️ {disagreementsCount} paires à ré-annoter manuellement
                </Typography>
                <Typography variant="body2">
                  ⏱️ Temps estimé : ~{Math.ceil(disagreementsCount * 1.5)} minutes
                </Typography>
              </Stack>
            </Paper>
          </Box>
        )}

        {/* Step 4: Résultats */}
        {activeStep === 3 && derivationResult && (
          <Box>
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight="medium">
                Gold Standard créé avec succès ! ✨
              </Typography>
            </Alert>

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                📊 Résultats de la dérivation
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2">
                    ✅ <strong>{derivationResult.copiedCount} paires</strong> copiées automatiquement
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(derivationResult.copiedCount / (derivationResult.copiedCount + derivationResult.toReviewCount)) * 100}
                    color="success"
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Divider />

                <Typography variant="body2">
                  ⚠️ <strong>{derivationResult.toReviewCount} paires</strong> à ré-annoter manuellement
                </Typography>
                <Typography variant="body2">
                  ⏱️ Temps estimé : <strong>~{derivationResult.estimatedTimeMinutes} minutes</strong>
                </Typography>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Vous pouvez maintenant commencer la ré-annotation des {derivationResult.toReviewCount} paires en désaccord.
                  </Typography>
                </Alert>
              </Stack>
            </Paper>
          </Box>
        )}

        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {activeStep === 3 ? 'Fermer' : 'Annuler'}
        </Button>

        {activeStep > 0 && activeStep < 3 && (
          <Button onClick={handleBack} disabled={loading}>
            Retour
          </Button>
        )}

        {activeStep < 2 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading || (activeStep === 0 && !selectedTestId)}
          >
            Suivant
          </Button>
        )}

        {activeStep === 2 && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateByDerivation}
            disabled={loading}
          >
            Créer Gold Standard
          </Button>
        )}

        {activeStep === 3 && derivationResult && derivationResult.toReviewCount > 0 && (
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              handleClose();
              // TODO: Navigate to re-annotation interface
            }}
          >
            Commencer la Ré-annotation
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
