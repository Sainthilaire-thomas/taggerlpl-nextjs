// src/features/phase3-analysis/level1-validation/ui/components/VersionValidation/VersionValidationDialog.tsx

/**
 * Dialog de validation de version
 * Permet de créer une version officielle à partir d'un test validé
 * Phase 3 - Level 1 Validation
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  FormControlLabel,
  Checkbox,
  Alert,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as ValidateIcon,
  Cancel as CancelIcon,
  Star as BaselineIcon,
  Code as GitIcon,
} from '@mui/icons-material';
import type { ValidationMetrics } from '@/types/algorithm-lab/core/validation';
import type { CreateVersionInput } from '@/types/algorithm-lab/versioning';

interface VersionValidationDialogProps {
  open: boolean;
  runId: string;
  algorithmKey: string;
  algorithmVersion?: string;
  target: string;
  metrics: ValidationMetrics;
  onClose: () => void;
  onValidate: (versionData: CreateVersionInput) => void;
}

export function VersionValidationDialog({
  open,
  runId,
  algorithmKey,
  algorithmVersion,
  target,
  metrics,
  onClose,
  onValidate,
}: VersionValidationDialogProps) {
  const [versionName, setVersionName] = useState('');
  const [description, setDescription] = useState('');
  const [changelog, setChangelog] = useState('');
  const [isBaseline, setIsBaseline] = useState(false);
  const [gitCommit, setGitCommit] = useState<string | null>(null);
  const [gitBranch, setGitBranch] = useState<string | null>(null);
  const [loadingGit, setLoadingGit] = useState(false);
  const [hasUncommittedChanges, setHasUncommittedChanges] = useState(false);

  // Récupérer les infos Git au chargement
  useEffect(() => {
    if (open) {
      fetchGitInfo();
    }
  }, [open]);

  const fetchGitInfo = async () => {
    setLoadingGit(true);
    try {
      const response = await fetch('/api/git/current-commit');
      if (response.ok) {
        const data = await response.json();
        setGitCommit(data.commit);
        setGitBranch(data.branch);
        setHasUncommittedChanges(data.hasUncommittedChanges);
      }
    } catch (error) {
      console.error('Error fetching git info:', error);
    } finally {
      setLoadingGit(false);
    }
  };

  const handleValidate = () => {
    const versionData: CreateVersionInput = {
      version_name: versionName,
      description: description || undefined,
      changelog: changelog || undefined,
      is_baseline: isBaseline,
      git_commit_hash: gitCommit || undefined,
      status: isBaseline ? 'baseline' : 'validated',
    };

    onValidate(versionData);
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  const isValid = versionName.trim().length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        ✅ Créer une version validée
        <Typography variant="caption" display="block" color="text.secondary">
          Run ID: {runId.slice(0, 8)}...
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Résumé des métriques */}
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Test validé avec succès
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip
              label={`Accuracy: ${formatPercent(metrics.accuracy)}`}
              size="small"
              color="success"
              variant="outlined"
            />
            {metrics.kappa && (
              <Chip
                label={`Kappa: ${metrics.kappa.toFixed(3)}`}
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Stack>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Algorithme: {algorithmKey} {algorithmVersion && `v${algorithmVersion}`}
          </Typography>
        </Alert>

        {/* Nom de version */}
        <TextField
          fullWidth
          required
          label="Nom de la version"
          placeholder="Ex: v1.2.0, RegexX-2024-11-25, baseline-novembre"
          value={versionName}
          onChange={(e) => setVersionName(e.target.value)}
          sx={{ mb: 2 }}
          helperText="Nom unique pour identifier cette version"
        />

        {/* Description */}
        <TextField
          fullWidth
          label="Description"
          placeholder="Ex: Amélioration de la détection des REFLET avec nouveaux patterns"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 2 }}
          multiline
          rows={2}
        />

        {/* Changelog */}
        <TextField
          fullWidth
          label="Changelog"
          placeholder="Ex: - Ajout pattern 'je comprends que'\n- Fix classification tours courts"
          value={changelog}
          onChange={(e) => setChangelog(e.target.value)}
          sx={{ mb: 2 }}
          multiline
          rows={3}
        />

        <Divider sx={{ my: 2 }} />

        {/* Option Baseline */}
        <FormControlLabel
          control={
            <Checkbox
              checked={isBaseline}
              onChange={(e) => setIsBaseline(e.target.checked)}
              icon={<BaselineIcon />}
              checkedIcon={<BaselineIcon />}
            />
          }
          label={
            <Box>
              <Typography variant="body2" fontWeight={600}>
                Définir comme baseline de référence
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cette version servira de référence pour comparer les futurs tests
              </Typography>
            </Box>
          }
        />

        <Divider sx={{ my: 2 }} />

        {/* Info Git */}
        <Typography variant="subtitle2" gutterBottom>
          <GitIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
          Traçabilité Git
        </Typography>
        
        {loadingGit ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Récupération des infos Git...
            </Typography>
          </Box>
        ) : gitCommit ? (
          <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, my: 1 }}>
            <Typography variant="caption" component="div">
              <strong>Commit:</strong> {gitCommit.slice(0, 8)}
            </Typography>
            <Typography variant="caption" component="div">
              <strong>Branche:</strong> {gitBranch}
            </Typography>
            {hasUncommittedChanges && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                ⚠️ Modifications non commitées détectées
              </Alert>
            )}
          </Box>
        ) : (
          <Alert severity="info" sx={{ my: 1 }}>
            Informations Git non disponibles
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<CancelIcon />}>
          Annuler
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<ValidateIcon />}
          onClick={handleValidate}
          disabled={!isValid}
        >
          Créer la version
        </Button>
      </DialogActions>
    </Dialog>
  );
}
