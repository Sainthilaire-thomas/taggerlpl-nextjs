// src/features/phase3-analysis/level0-gold/presentation/components/tuning/SuggestionCard.tsx

'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  Chip,
  Typography,
  Box,
  Collapse,
  IconButton,
  Alert,
  Divider,
  Stack,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  MergeType as MergeIcon,
  Rule as RuleIcon,
} from '@mui/icons-material';
import type {
  CharteSuggestion,
  SuggestionStatus,
  SuggestionType,
  SuggestionPriority,
} from '@/types/algorithm-lab/core/tuning';

interface SuggestionCardProps {
  suggestion: CharteSuggestion;
  onApply?: (suggestionId: string) => void;
  onReject?: (suggestionId: string) => void;
  onView?: (suggestionId: string) => void;
  disabled?: boolean;
}

const getPriorityColor = (priority: SuggestionPriority): 'error' | 'warning' | 'success' => {
  switch (priority) {
    case 1: return 'error';
    case 2: return 'warning';
    case 3: return 'success';
  }
};

const getPriorityLabel = (priority: SuggestionPriority): string => {
  switch (priority) {
    case 1: return 'Priorité Haute';
    case 2: return 'Priorité Moyenne';
    case 3: return 'Priorité Basse';
  }
};

const getStatusColor = (status: SuggestionStatus): string => {
  switch (status) {
    case 'pending': return '#1976d2';
    case 'applied_pending_validation': return '#ed6c02';
    case 'applied_validated': return '#2e7d32';
    case 'applied_rolled_back': return '#d32f2f';
    case 'rejected': return '#757575';
  }
};

const getStatusLabel = (status: SuggestionStatus): string => {
  switch (status) {
    case 'pending': return 'En attente';
    case 'applied_pending_validation': return 'Appliquée (validation en cours)';
    case 'applied_validated': return 'Validée';
    case 'applied_rolled_back': return 'Annulée (régression)';
    case 'rejected': return 'Rejetée';
  }
};

const getSuggestionTypeIcon = (type: SuggestionType) => {
  switch (type) {
    case 'add_alias': return <AddIcon />;
    case 'remove_alias': return <RemoveIcon />;
    case 'add_example': return <AddIcon />;
    case 'add_counter_example': return <AddIcon />;
    case 'clarify_description': return <EditIcon />;
    case 'merge_categories': return <MergeIcon />;
    case 'adjust_rule': return <RuleIcon />;
  }
};

const getSuggestionTypeLabel = (type: SuggestionType): string => {
  switch (type) {
    case 'add_alias': return 'Ajouter alias';
    case 'remove_alias': return 'Supprimer alias';
    case 'add_example': return 'Ajouter exemple';
    case 'add_counter_example': return 'Ajouter contre-exemple';
    case 'clarify_description': return 'Clarifier description';
    case 'merge_categories': return 'Fusionner catégories';
    case 'adjust_rule': return 'Ajuster règle';
  }
};

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  onApply,
  onReject,
  onView,
  disabled = false,
}) => {
  const [expanded, setExpanded] = useState(false);

  const canApply = suggestion.status === 'pending' && !disabled;
  const canReject = suggestion.status === 'pending' && !disabled;
  const canView = suggestion.status !== 'pending';

  const {
    pattern,
    observation,
    recommended_action,
    current_definition,
    proposed_clarification,
    cas_a_count,
    cas_b_count,
    pairs_concerned,
    frequency,
    accuracy,
  } = suggestion.supporting_data || {};

  return (
    <Card
      sx={{
        borderLeft: `4px solid ${getStatusColor(suggestion.status)}`,
        '&:hover': { boxShadow: 4 },
        transition: 'box-shadow 0.2s',
      }}
    >
      <CardHeader
        avatar={
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${getPriorityColor(suggestion.priority)}.light`,
              color: `${getPriorityColor(suggestion.priority)}.contrastText`,
            }}
          >
            {getSuggestionTypeIcon(suggestion.suggestion_type)}
          </Box>
        }
        title={
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" component="div">
              {getSuggestionTypeLabel(suggestion.suggestion_type)}
            </Typography>
            <Chip
              label={getPriorityLabel(suggestion.priority)}
              color={getPriorityColor(suggestion.priority)}
              size="small"
            />
          </Stack>
        }
        subheader={
          <Stack direction="row" spacing={1} mt={0.5}>
            {suggestion.category && (
              <Chip
                label={`Catégorie: ${suggestion.category}`}
                size="small"
                variant="outlined"
              />
            )}
            <Chip
              label={getStatusLabel(suggestion.status)}
              size="small"
              sx={{
                bgcolor: getStatusColor(suggestion.status),
                color: 'white',
              }}
            />
          </Stack>
        }
        action={
          <IconButton
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label="voir détails"
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        }
      />

      <CardContent>
        <Typography variant="body1" gutterBottom>
          {suggestion.description}
        </Typography>

        {pattern && (
          <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Pattern détecté :</strong> {pattern}
            </Typography>
          </Alert>
        )}

        {(cas_a_count !== undefined || cas_b_count !== undefined || accuracy !== undefined) && (
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" spacing={2}>
              {cas_a_count !== undefined && (
                <Chip label={`${cas_a_count} CAS A`} size="small" color="error" variant="outlined" />
              )}
              {cas_b_count !== undefined && (
                <Chip label={`${cas_b_count} CAS B`} size="small" color="warning" variant="outlined" />
              )}
              {accuracy !== undefined && (
                <Chip
                  label={`Accuracy: ${(accuracy * 100).toFixed(1)}%`}
                  size="small"
                  color={accuracy < 0.5 ? 'error' : 'success'}
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>
        )}

        {suggestion.status === 'applied_validated' && suggestion.supporting_data?.kappa_improvement && (
          <Alert severity="success" icon={<TrendingUpIcon />} sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Amélioration Kappa :</strong>{' '}
              {suggestion.supporting_data.kappa_improvement > 0 ? '+' : ''}
              {(suggestion.supporting_data.kappa_improvement * 100).toFixed(1)}%
            </Typography>
          </Alert>
        )}
      </CardContent>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Divider />
        <CardContent>
          <Typography variant="subtitle2" gutterBottom color="primary">
            Détails de la suggestion
          </Typography>

          {observation && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Observation :</Typography>
              <Typography variant="body2">{observation}</Typography>
            </Box>
          )}

          {recommended_action && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Action recommandée :</Typography>
              <Typography variant="body2">{recommended_action}</Typography>
            </Box>
          )}

          {current_definition && proposed_clarification && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Définition actuelle :</Typography>
              <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                {current_definition}
              </Typography>
              
              <Typography variant="caption" color="text.secondary">Clarification proposée :</Typography>
              <Typography variant="body2" color="primary.main" fontWeight="medium">
                {proposed_clarification}
              </Typography>
            </Box>
          )}

          {pairs_concerned && pairs_concerned.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Paires concernées ({pairs_concerned.length}) :
              </Typography>
              <Typography variant="body2">
                {pairs_concerned.slice(0, 10).join(', ')}
                {pairs_concerned.length > 10 && '...'}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Typography variant="caption" color="text.secondary">
              ID: {suggestion.suggestion_id.substring(0, 8)}...
            </Typography>
            {suggestion.applied_at && (
              <Typography variant="caption" color="text.secondary">
                Appliquée: {new Date(suggestion.applied_at).toLocaleDateString('fr-FR')}
              </Typography>
            )}
            {suggestion.applied_in_version && (
              <Typography variant="caption" color="text.secondary">
                Version: {suggestion.applied_in_version}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Collapse>

      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        {canView && onView && (
          <Button size="small" startIcon={<InfoIcon />} onClick={() => onView(suggestion.suggestion_id)}>
            Voir détails
          </Button>
        )}

        {canReject && onReject && (
          <Button
            size="small"
            color="error"
            startIcon={<CancelIcon />}
            onClick={() => onReject(suggestion.suggestion_id)}
            disabled={disabled}
          >
            Rejeter
          </Button>
        )}

        {canApply && onApply && (
          <Button
            size="small"
            variant="contained"
            color="primary"
            startIcon={<CheckCircleIcon />}
            onClick={() => onApply(suggestion.suggestion_id)}
            disabled={disabled}
          >
            Appliquer
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default SuggestionCard;
