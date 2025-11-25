// src/features/phase3-analysis/level1-validation/ui/components/Investigation/InvestigationSummaryDialog.tsx

/**
 * Dialog de synthÃ¨se d'investigation
 * Affiche le rÃ©sumÃ© des annotations et permet de finaliser l'investigation
 * Phase 3 - Level 1 Validation
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Chip,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import type { InvestigationAnnotation } from '@/types/algorithm-lab/versioning';

interface InvestigationSummaryDialogProps {
  open: boolean;
  runId: string;
  annotations: InvestigationAnnotation[];
  summary?: Record<string, any>;
  onClose: () => void;
  onComplete: (summary: Record<string, any>, notes?: string) => void;
}

export function InvestigationSummaryDialog({
  open,
  runId,
  annotations,
  summary,
  onClose,
  onComplete,
}: InvestigationSummaryDialogProps) {
  const [notes, setNotes] = useState('');

  // Grouper les annotations par catÃ©gorie
  const annotationsByCategory = React.useMemo(() => {
    const grouped: Record<string, InvestigationAnnotation[]> = {};
    
    annotations.forEach(ann => {
      const category = ann.error_category || 'Autres';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(ann);
    });

    return grouped;
  }, [annotations]);

  // Compter par type et sÃ©vÃ©ritÃ©
  const stats = React.useMemo(() => {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    annotations.forEach(ann => {
      byType[ann.annotation_type] = (byType[ann.annotation_type] || 0) + 1;
      bySeverity[ann.severity] = (bySeverity[ann.severity] || 0) + 1;
    });

    return { byType, bySeverity };
  }, [annotations]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorIcon fontSize="small" color="error" />;
      case 'minor': return <InfoIcon fontSize="small" color="info" />;
      case 'edge_case': return <WarningIcon fontSize="small" color="warning" />;
      default: return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'minor': return 'info';
      case 'edge_case': return 'warning';
      default: return 'default';
    }
  };

  const handleComplete = () => {
    const finalSummary = summary || {
      total: annotations.length,
      byType: stats.byType,
      bySeverity: stats.bySeverity,
      topCategories: Object.entries(annotationsByCategory)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 5)
        .map(([category, anns]) => ({
          category,
          count: anns.length,
        })),
      actionableCount: annotations.filter(a => a.actionable).length,
    };

    onComplete(finalSummary, notes);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        ðŸ“Š SynthÃ¨se de l'investigation
        <Typography variant="caption" display="block" color="text.secondary">
          Run ID: {runId.slice(0, 8)}...
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* Statistiques globales */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            {annotations.length} annotation{annotations.length > 1 ? 's' : ''} au total
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            {Object.entries(stats.bySeverity).map(([severity, count]) => {
              const icon = getSeverityIcon(severity);
              return (
                <Chip
                  key={severity}
                  icon={icon || undefined}
                  label={`${severity}: ${count}`}
                  size="small"
                  color={getSeverityColor(severity) as any}
                  variant="outlined"
                />
              );
            })}
          </Stack>
        </Alert>

        {/* Annotations par catÃ©gorie */}
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, mb: 1 }}>
          Annotations par catégorie d'erreur
        </Typography>

        <Box sx={{ mb: 3 }}>
          {Object.entries(annotationsByCategory)
            .sort((a, b) => b[1].length - a[1].length)
            .map(([category, categoryAnnotations]) => (
              <Accordion key={category} defaultExpanded={categoryAnnotations.length >= 3}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography fontWeight={600}>{category}</Typography>
                    <Chip
                      label={categoryAnnotations.length}
                      size="small"
                      color="primary"
                    />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {categoryAnnotations.map((ann, idx) => (
                      <React.Fragment key={ann.id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1} alignItems="center">
                                {getSeverityIcon(ann.severity)}
                                <Typography variant="body2">
                                  {ann.content}
                                </Typography>
                              </Stack>
                            }
                            secondary={
                              ann.expected_tag && ann.predicted_tag ? (
                                <Typography variant="caption" color="text.secondary">
                                  Attendu: {ann.expected_tag} â†’ PrÃ©dit: {ann.predicted_tag}
                                </Typography>
                              ) : null
                            }
                          />
                        </ListItem>
                        {idx < categoryAnnotations.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
        </Box>

        {/* Notes de conclusion */}
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
          Notes de conclusion (optionnel)
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="Ajoutez vos observations gÃ©nÃ©rales, pistes d'amÃ©lioration, dÃ©cisions Ã  prendre..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          variant="outlined"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<CancelIcon />}>
          Annuler
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<CompleteIcon />}
          onClick={handleComplete}
        >
          Terminer l'investigation
        </Button>
      </DialogActions>
    </Dialog>
  );
}
