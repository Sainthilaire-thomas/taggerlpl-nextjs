// ============================================================================
// CharteAliasesEditor - Éditeur des aliases d'une charte
// ============================================================================

"use client";

import React, { useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Alert,
  Divider
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon
} from "@mui/icons-material";
import { CharteDefinition } from "@/types/algorithm-lab/Level0Types";
import { CharteManagementService } from "../../../domain/services/CharteManagementService";

interface CharteAliasesEditorProps {
  charte: CharteDefinition;
  onSave?: () => void;
}

export const CharteAliasesEditor: React.FC<CharteAliasesEditorProps> = ({
  charte,
  onSave
}) => {
  const [aliases, setAliases] = useState<Record<string, string>>(
    (charte.definition as any).aliases || {}
  );
  const [newAliasKey, setNewAliasKey] = useState("");
  const [newAliasValue, setNewAliasValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAddAlias = () => {
    if (newAliasKey && newAliasValue) {
      setAliases({
        ...aliases,
        [newAliasKey]: newAliasValue
      });
      setNewAliasKey("");
      setNewAliasValue("");
    }
  };

  const handleRemoveAlias = (key: string) => {
    const newAliases = { ...aliases };
    delete newAliases[key];
    setAliases(newAliases);
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveMessage(null);

    try {
      // Mettre à jour la définition avec les nouveaux aliases
      const updatedDefinition = {
        ...(charte.definition as any),
        aliases: aliases
      };

      // Mise à jour via le service
      const result = await CharteManagementService.updateCharte(
        charte.charte_id,
        {
          definition: updatedDefinition
        }
      );

      if (result.error) {
        throw new Error(result.error);
      }

      setSaveMessage({
        type: 'success',
        text: '✅ Aliases sauvegardés avec succès !'
      });

      // Callback pour recharger les chartes
      if (onSave) {
        setTimeout(() => onSave(), 1500);
      }
    } catch (error) {
      console.error("Erreur sauvegarde aliases:", error);
      setSaveMessage({
        type: 'error',
        text: `Erreur : ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Aliases</strong> - Permettent de normaliser automatiquement les tags LLM non-conformes.
          <br />
          Exemple : CLIENT_NON_POSITIF → CLIENT_NEGATIF
        </Typography>
      </Alert>

      {/* Message de sauvegarde */}
      {saveMessage && (
        <Alert severity={saveMessage.type} sx={{ mb: 3 }} onClose={() => setSaveMessage(null)}>
          {saveMessage.text}
        </Alert>
      )}

      {/* Liste des aliases existants */}
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
        Aliases existants ({Object.keys(aliases).length})
      </Typography>

      {Object.keys(aliases).length === 0 ? (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Aucun alias configuré pour cette charte
        </Alert>
      ) : (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Stack spacing={1}>
            {Object.entries(aliases).map(([key, value]) => (
              <Stack
                key={key}
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{
                  p: 1,
                  bgcolor: 'grey.50',
                  borderRadius: 1
                }}
              >
                <Chip label={key} color="error" size="small" />
                <Typography>→</Typography>
                <Chip label={value} color="success" size="small" />
                <Box sx={{ flexGrow: 1 }} />
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveAlias(key)}
                  title="Supprimer cet alias"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Formulaire d'ajout */}
      <Divider sx={{ my: 3 }} />
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
        Ajouter un nouvel alias
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <TextField
          label="Tag LLM (à normaliser)"
          value={newAliasKey}
          onChange={(e) => setNewAliasKey(e.target.value)}
          size="small"
          placeholder="CLIENT_NON_POSITIF"
          fullWidth
        />
        <Typography sx={{ minWidth: 30, textAlign: 'center' }}>→</Typography>
        <TextField
          label="Tag normalisé"
          value={newAliasValue}
          onChange={(e) => setNewAliasValue(e.target.value)}
          size="small"
          placeholder="CLIENT_NEGATIF"
          fullWidth
        />
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddAlias}
          disabled={!newAliasKey || !newAliasValue}
        >
          Ajouter
        </Button>
      </Stack>

      {/* Suggestions courantes */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="caption" display="block" gutterBottom>
          <strong>Suggestions courantes :</strong>
        </Typography>
        <Typography variant="caption" display="block">
          • CLIENT_NON_POSITIF → CLIENT_NEGATIF
        </Typography>
        <Typography variant="caption" display="block">
          • CLIENT_NON_NEGATIF → CLIENT_POSITIF
        </Typography>
        <Typography variant="caption" display="block">
          • CONSEILLER_EXPLICATION → CONSEILLER_EXPLIQUE
        </Typography>
      </Alert>

      {/* Bouton Sauvegarder */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Sauvegarde en cours...' : 'Sauvegarder modifications'}
        </Button>
      </Box>
    </Box>
  );
};
