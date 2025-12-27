/**
 * CreateCharteDialog.tsx
 * 
 * Dialog pour créer une nouvelle charte avec wizard:
 * - Nom de la charte
 * - Variable (X ou Y)
 * - Philosophie (Minimaliste, Enrichie, Binaire)
 * - Modalité (Texte seul, Audio, Contexte)
 * - Option copie depuis charte existante
 * 
 * Résout problème ergonomique #3 (Pas de création chartes)
 * 
 * Sprint 6 - Session 7
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  Checkbox,
  FormGroup,
  Box,
  Typography,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import type { CharteDefinition } from '@/types/algorithm-lab/Level0Types';

interface CreateCharteDialogProps {
  /** Dialog ouvert ou fermé */
  open: boolean;
  
  /** Callback fermeture dialog */
  onClose: () => void;
  
  /** Callback création charte */
  onCreate: (charteData: NewCharteData) => Promise<void>;
  
  /** Variable pré-sélectionnée (optionnel) */
  defaultVariable?: 'X' | 'Y';
  
  /** Liste chartes existantes pour copie (optionnel) */
  existingChartes?: CharteDefinition[];
}

export interface NewCharteData {
  name: string;
  variable: 'X' | 'Y';
  philosophy: 'Minimaliste' | 'Enrichie' | 'Binaire';
  modality: 'text_only' | 'audio_full' | 'text_context';
  copyFromCharteId?: string;
}

const STEPS = ['Informations de base', 'Configuration', 'Confirmation'];

export const CreateCharteDialog: React.FC<CreateCharteDialogProps> = ({
  open,
  onClose,
  onCreate,
  defaultVariable,
  existingChartes = [],
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [variable, setVariable] = useState<'X' | 'Y'>(defaultVariable || 'Y');
  const [philosophy, setPhilosophy] = useState<'Minimaliste' | 'Enrichie' | 'Binaire'>('Enrichie');
  const [modality, setModality] = useState<'text_only' | 'audio_full' | 'text_context'>('audio_full');
  const [copyFrom, setCopyFrom] = useState(false);
  const [copyFromCharteId, setCopyFromCharteId] = useState('');

  const handleClose = () => {
    // Reset form
    setActiveStep(0);
    setName('');
    setVariable(defaultVariable || 'Y');
    setPhilosophy('Enrichie');
    setModality('audio_full');
    setCopyFrom(false);
    setCopyFromCharteId('');
    setError(null);
    onClose();
  };

  const handleNext = () => {
    // Validation étape 0
    if (activeStep === 0) {
      if (!name || name.length < 3) {
        setError('Le nom doit contenir au moins 3 caractères');
        return;
      }
      setError(null);
    }

    // Validation étape 1
    if (activeStep === 1) {
      if (copyFrom && !copyFromCharteId) {
        setError('Sélectionnez une charte source pour la copie');
        return;
      }
      setError(null);
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError(null);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      const charteData: NewCharteData = {
        name,
        variable,
        philosophy,
        modality,
        ...(copyFrom && copyFromCharteId ? { copyFromCharteId } : {}),
      };

      await onCreate(charteData);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const getModalityLabel = (mod: string): string => {
    switch (mod) {
      case 'text_only': return 'Texte seul';
      case 'audio_full': return 'Audio complet (texte + prosodie)';
      case 'text_context': return 'Texte + Contexte conversationnel';
      default: return mod;
    }
  };

  const getPhilosophyDescription = (phil: string): string => {
    switch (phil) {
      case 'Minimaliste': return 'Prompt court, 1 exemple par catégorie (~200 tokens)';
      case 'Enrichie': return 'Prompt détaillé, 3+ exemples, contraintes explicites (~500 tokens)';
      case 'Binaire': return 'Classification binaire simplifiée';
      default: return '';
    }
  };

  // Filtrer chartes par variable
  const availableChartes = existingChartes.filter(c => c.variable === variable);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Créer une Nouvelle Charte
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Étape 0 : Informations de base */}
        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Nom de la charte"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="CharteY_Test_Audio"
              helperText="Nom unique et descriptif (min 3 caractères)"
              fullWidth
              required
              autoFocus
            />

            <FormControl component="fieldset">
              <FormLabel component="legend">Variable</FormLabel>
              <RadioGroup
                value={variable}
                onChange={(e) => setVariable(e.target.value as 'X' | 'Y')}
              >
                <FormControlLabel 
                  value="X" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        X - Stratégies Conseiller
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        4 catégories : ENGAGEMENT, OUVERTURE, REFLET, EXPLICATION
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="Y" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Y - Réactions Client
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        3 catégories : CLIENT_POSITIF, CLIENT_NEUTRE, CLIENT_NEGATIF
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Box>
        )}

        {/* Étape 1 : Configuration */}
        {activeStep === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Philosophie de la charte</FormLabel>
              <RadioGroup
                value={philosophy}
                onChange={(e) => setPhilosophy(e.target.value as any)}
              >
                <FormControlLabel 
                  value="Minimaliste" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2">Minimaliste</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getPhilosophyDescription('Minimaliste')}
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="Enrichie" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2">Enrichie</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getPhilosophyDescription('Enrichie')}
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel 
                  value="Binaire" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body2">Binaire</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getPhilosophyDescription('Binaire')}
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            <FormControl component="fieldset">
              <FormLabel component="legend">Modalité d'annotation</FormLabel>
              <RadioGroup
                value={modality}
                onChange={(e) => setModality(e.target.value as any)}
              >
                <FormControlLabel 
                  value="text_only" 
                  control={<Radio />} 
                  label={getModalityLabel('text_only')}
                />
                <FormControlLabel 
                  value="audio_full" 
                  control={<Radio />} 
                  label={getModalityLabel('audio_full')}
                />
                <FormControlLabel 
                  value="text_context" 
                  control={<Radio />} 
                  label={getModalityLabel('text_context')}
                />
              </RadioGroup>
            </FormControl>

            <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={copyFrom}
                      onChange={(e) => setCopyFrom(e.target.checked)}
                    />
                  }
                  label="Copier depuis une charte existante"
                />
              </FormGroup>

              {copyFrom && (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Charte source</InputLabel>
                  <Select
                    value={copyFromCharteId}
                    onChange={(e) => setCopyFromCharteId(e.target.value)}
                    label="Charte source"
                  >
                    {availableChartes.length === 0 && (
                      <MenuItem disabled>
                        Aucune charte disponible pour Variable {variable}
                      </MenuItem>
                    )}
                    {availableChartes.map((charte) => (
                      <MenuItem key={charte.charte_id} value={charte.charte_id}>
                        {charte.charte_name} ({charte.version})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </Box>
        )}

        {/* Étape 2 : Confirmation */}
        {activeStep === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Vérifiez les informations avant de créer la charte
            </Alert>

            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Récapitulatif
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                <Typography variant="body2">
                  <strong>Nom :</strong> {name}
                </Typography>
                <Typography variant="body2">
                  <strong>Variable :</strong> {variable === 'X' ? 'X - Stratégies Conseiller' : 'Y - Réactions Client'}
                </Typography>
                <Typography variant="body2">
                  <strong>Philosophie :</strong> {philosophy}
                </Typography>
                <Typography variant="body2">
                  <strong>Modalité :</strong> {getModalityLabel(modality)}
                </Typography>
                {copyFrom && copyFromCharteId && (
                  <Typography variant="body2">
                    <strong>Copie depuis :</strong> {availableChartes.find(c => c.charte_id === copyFromCharteId)?.charte_name}
                  </Typography>
                )}
              </Box>
            </Box>

            <Typography variant="caption" color="text.secondary">
              La charte sera créée en version 1.0.0 avec une structure prompt_structure par défaut selon la philosophie sélectionnée.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Annuler
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Précédent
          </Button>
        )}
        {activeStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} variant="contained">
            Suivant
          </Button>
        ) : (
          <Button 
            onClick={handleCreate} 
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Création...' : 'Créer'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateCharteDialog;
