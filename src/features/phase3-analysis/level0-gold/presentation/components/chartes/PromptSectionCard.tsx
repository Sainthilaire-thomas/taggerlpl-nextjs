// ============================================================================
// PromptSectionCard - Composant pour afficher et éditer une section de prompt
// ============================================================================

import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Box,
  Switch,
  FormControlLabel,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

export interface PromptSection {
  key: string; // 'task_description', 'preprocessing_instructions', etc.
  label: string; // "Task Description", "Preprocessing Instructions"
  content: string; // Texte de la section
  enabled: boolean; // Affiché dans prompt final ?
  order: number; // Ordre d'apparition
  editable: boolean; // Éditable ? (definitions = false)
  placeholder?: string; // Placeholder si vide
  helpText?: string; // Aide contextuelle
}

interface PromptSectionCardProps {
  section: PromptSection;
  onSave: (key: string, content: string, enabled: boolean) => void;
  onToggle: (key: string, enabled: boolean) => void;
}

export const PromptSectionCard: React.FC<PromptSectionCardProps> = ({
  section,
  onSave,
  onToggle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(section.content);

  const handleStartEdit = () => {
    if (!section.editable) return;
    setEditedContent(section.content);
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(section.key, editedContent, section.enabled);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(section.content);
    setIsEditing(false);
  };

  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(section.key, event.target.checked);
  };

  return (
    <Card
      sx={{
        mb: 2,
        cursor: section.editable && !isEditing ? "pointer" : "default",
        "&:hover":
          section.editable && !isEditing
            ? {
                boxShadow: 3,
                borderColor: "primary.main",
              }
            : {},
      }}
      onClick={section.editable && !isEditing ? handleStartEdit : undefined}
    >
      <CardContent>
        {/* Header avec label et toggle */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              [{section.label}]
            </Typography>

            {section.helpText && (
              <Tooltip title={section.helpText}>
                <Typography variant="caption" color="text.disabled">
                  ⓘ
                </Typography>
              </Tooltip>
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={section.enabled}
                  onChange={handleToggle}
                  size="small"
                  onClick={(e) => e.stopPropagation()}
                />
              }
              label={
                <Typography variant="caption">
                  {section.enabled ? "Activé" : "Désactivé"}
                </Typography>
              }
            />

            {section.editable && !isEditing && (
              <Tooltip title="Cliquer pour éditer">
                <IconButton size="small" onClick={handleStartEdit}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Contenu */}
        {isEditing ? (
          <Box>
            <TextField
              fullWidth
              multiline
              minRows={3}
              maxRows={10}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              placeholder={section.placeholder}
              variant="outlined"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              sx={{ mb: 1 }}
            />

            <Box display="flex" gap={1} justifyContent="flex-end">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
              >
                <CancelIcon />
              </IconButton>
              <IconButton
                size="small"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
              >
                <SaveIcon />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              fontSize: "0.875rem",
              color: section.content ? "text.primary" : "text.disabled",
              backgroundColor: "background.default",
              p: 1.5,
              borderRadius: 1,
              opacity: section.enabled ? 1 : 0.5,
            }}
          >
            {section.content || section.placeholder || "(vide)"}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
