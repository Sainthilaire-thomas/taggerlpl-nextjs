// ============================================================================
// CharteRulesEditor - Éditeur des règles d'annotation
// ============================================================================

"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Stack,
  Button,
  Alert,
  Paper,
  Divider
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import { CharteDefinition } from "@/types/algorithm-lab/Level0Types";
import { CharteEditionService } from "../../../domain/services/CharteEditionService";

interface CharteRulesEditorProps {
  charte: CharteDefinition;
  onSave?: () => void;
}

interface RulesData {
  approach: 'few_shot' | 'zero_shot';
  context_included: boolean;
  examples_per_category: number;
}

export const CharteRulesEditor: React.FC<CharteRulesEditorProps> = ({
  charte,
  onSave
}) => {
  const [rules, setRules] = useState<RulesData>(
    (charte.definition as any).rules || {
      approach: 'few_shot',
      context_included: false,
      examples_per_category: 3
    }
  );
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSave = async () => {
    setLoading(true);
    setSaveMessage(null);

    try {
      // Calculer la nouvelle version
      const currentVersion = charte.version || '1.0.0';
      const [major, minor, patch] = currentVersion.split('.').map(Number);
      const newVersion = `${major}.${minor + 1}.${patch}`;

      // Créer nouvelle version avec CharteEditionService
      const editionService = new CharteEditionService();
      const result = await editionService.createNewVersion({
        base_charte_id: charte.charte_id,
        new_version: newVersion,
        changes: { rules: rules },
        reason: 'Mise à jour des règles via éditeur manuel',
        is_pending_validation: false
      });

      if (!result.success) {
        throw new Error(result.error || 'Erreur création version');
      }

      setSaveMessage({
        type: 'success',
        text: `✅ Nouvelle version créée : ${newVersion} (${result.charte_id})`
      });

      // Callback pour recharger les chartes
      if (onSave) {
        setTimeout(() => onSave(), 1500);
      }
    } catch (error) {
      console.error("Erreur sauvegarde règles:", error);
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
          <strong>Règles d'annotation</strong> - Configurez comment le LLM doit utiliser la charte.
        </Typography>
      </Alert>

      {/* Message de sauvegarde */}
      {saveMessage && (
        <Alert severity={saveMessage.type} sx={{ mb: 3 }} onClose={() => setSaveMessage(null)}>
          {saveMessage.text}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={4}>
          {/* Approche */}
          <FormControl fullWidth>
            <InputLabel>Approche d'annotation</InputLabel>
            <Select
              value={rules.approach}
              onChange={(e) => setRules({ ...rules, approach: e.target.value as 'few_shot' | 'zero_shot' })}
              label="Approche d'annotation"
            >
              <MenuItem value="few_shot">
                <Stack>
                  <Typography variant="body2" fontWeight={600}>Few-shot</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Utilise les exemples de chaque catégorie
                  </Typography>
                </Stack>
              </MenuItem>
              <MenuItem value="zero_shot">
                <Stack>
                  <Typography variant="body2" fontWeight={600}>Zero-shot</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Se base uniquement sur les descriptions
                  </Typography>
                </Stack>
              </MenuItem>
            </Select>
          </FormControl>

          <Divider />

          {/* Contexte */}
          <FormControlLabel
            control={
              <Switch
                checked={rules.context_included}
                onChange={(e) => setRules({ ...rules, context_included: e.target.checked })}
              />
            }
            label={
              <Stack>
                <Typography variant="body2" fontWeight={600}>
                  Inclure le contexte conversationnel
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ajoute les tours précédents/suivants dans le prompt
                </Typography>
              </Stack>
            }
          />

          <Divider />

          {/* Exemples par catégorie */}
          <Box>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Nombre d'exemples par catégorie
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              {rules.approach === 'zero_shot' 
                ? 'Non applicable en mode zero-shot' 
                : `Le prompt inclura ${rules.examples_per_category} exemple(s) pour guider le LLM`
              }
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" sx={{ minWidth: 30 }}>
                {rules.examples_per_category}
              </Typography>
              <Slider
                value={rules.examples_per_category}
                onChange={(_, value) => setRules({ ...rules, examples_per_category: value as number })}
                min={0}
                max={10}
                step={1}
                marks={[
                  { value: 0, label: '0' },
                  { value: 3, label: '3' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' }
                ]}
                disabled={rules.approach === 'zero_shot'}
                sx={{ flexGrow: 1 }}
              />
            </Stack>
            
            {rules.examples_per_category === 0 && rules.approach === 'few_shot' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Attention : 0 exemples en mode few-shot = comportement similaire à zero-shot
              </Alert>
            )}
          </Box>
        </Stack>
      </Paper>

      {/* Bouton Sauvegarder */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
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

      {/* Info versioning */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="caption">
          <strong>Versioning :</strong> Chaque sauvegarde crée une nouvelle version mineure (ex: 1.0.0 → 1.1.0).
        </Typography>
      </Alert>
    </Box>
  );
};
