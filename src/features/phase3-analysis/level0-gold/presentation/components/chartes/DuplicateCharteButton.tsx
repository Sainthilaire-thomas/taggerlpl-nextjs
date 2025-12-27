/**
 * DuplicateCharteButton.tsx
 * 
 * Bouton et dialog pour dupliquer une charte existante:
 * - Copie complète de la définition (prompt_structure, categories, rules, params)
 * - Nouveau nom et version 1.0.0
 * - Options de sélection des éléments à copier
 * 
 * Résout problème ergonomique #3 (Pas de création chartes)
 * 
 * Sprint 6 - Session 7
 */

import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import { ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import type { CharteDefinition } from '@/types/algorithm-lab/Level0Types';

interface DuplicateCharteButtonProps {
  /** Charte source à dupliquer */
  sourceCharte: CharteDefinition;
  
  /** Callback duplication */
  onDuplicate: (newName: string, options: DuplicationOptions) => Promise<void>;
  
  /** Afficher comme bouton simple (vs IconButton) */
  asButton?: boolean;
}

export interface DuplicationOptions {
  copyPromptStructure: boolean;
  copyCategories: boolean;
  copyRules: boolean;
  copyLLMParams: boolean;
}

export const DuplicateCharteButton: React.FC<DuplicateCharteButtonProps> = ({
  sourceCharte,
  onDuplicate,
  asButton = false,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [newName, setNewName] = useState(`${sourceCharte.charte_name}_Copy`);
  const [copyPromptStructure, setCopyPromptStructure] = useState(true);
  const [copyCategories, setCopyCategories] = useState(true);
  const [copyRules, setCopyRules] = useState(true);
  const [copyLLMParams, setCopyLLMParams] = useState(true);

  const handleOpen = () => {
    setNewName(`${sourceCharte.charte_name}_Copy`);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleDuplicate = async () => {
    // Validation
    if (!newName || newName.length < 3) {
      setError('Le nom doit contenir au moins 3 caractères');
      return;
    }

    if (newName === sourceCharte.charte_name) {
      setError('Le nouveau nom doit être différent de la charte source');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const options: DuplicationOptions = {
        copyPromptStructure,
        copyCategories,
        copyRules,
        copyLLMParams,
      };

      await onDuplicate(newName, options);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la duplication');
    } finally {
      setLoading(false);
    }
  };

  const TriggerButton = asButton ? (
    <Button
      variant="outlined"
      startIcon={<ContentCopyIcon />}
      onClick={handleOpen}
      size="small"
    >
      Dupliquer
    </Button>
  ) : (
    <Tooltip title="Dupliquer cette charte">
      <IconButton onClick={handleOpen} size="small">
        <ContentCopyIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  return (
    <>
      {TriggerButton}

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Dupliquer Charte
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Charte source */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Charte source
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
              <Typography variant="body2">
                <strong>{sourceCharte.charte_name}</strong>
              </Typography>
              <Chip 
                label={sourceCharte.version} 
                size="small" 
                variant="outlined"
              />
              <Chip 
                label={sourceCharte.variable} 
                size="small" 
                color={sourceCharte.variable === 'X' ? 'primary' : 'secondary'}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Philosophie: {sourceCharte.philosophy || 'Non spécifiée'}
            </Typography>
          </Box>

          {/* Nouveau nom */}
          <TextField
            label="Nouveau nom"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            fullWidth
            required
            autoFocus
            helperText="Le nom doit être unique (min 3 caractères)"
            sx={{ mb: 3 }}
          />

          {/* Options de copie */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Éléments à copier
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={copyPromptStructure}
                    onChange={(e) => setCopyPromptStructure(e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Prompt Structure</Typography>
                    <Typography variant="caption" color="text.secondary">
                      12 sections du prompt (task, definitions, preprocessing, etc.)
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={copyCategories}
                    onChange={(e) => setCopyCategories(e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Catégories</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Descriptions et exemples de chaque catégorie
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={copyRules}
                    onChange={(e) => setCopyRules(e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Règles</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Approach (few-shot/zero-shot), contexte, nombre d'exemples
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={copyLLMParams}
                    onChange={(e) => setCopyLLMParams(e.target.checked)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Paramètres LLM</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Temperature, top_p, max_tokens
                    </Typography>
                  </Box>
                }
              />
            </FormGroup>
          </Box>

          {/* Info version */}
          <Alert severity="info" sx={{ mt: 2 }}>
            La charte dupliquée sera créée en <strong>version 1.0.0</strong> (nouvelle charte).
            L'historique de la charte source ne sera pas copié.
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Annuler
          </Button>
          <Button 
            onClick={handleDuplicate} 
            variant="contained"
            disabled={loading}
            startIcon={<ContentCopyIcon />}
          >
            {loading ? 'Duplication...' : 'Dupliquer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DuplicateCharteButton;
