// ============================================================================
// CharteLLMParamsEditor - Éditeur des paramètres LLM
// ============================================================================

"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Slider,
  Stack,
  Button,
  Alert,
  Paper,
  Divider,
  Chip
} from "@mui/material";
import { Save as SaveIcon } from "@mui/icons-material";
import { CharteDefinition } from "@/types/algorithm-lab/Level0Types";
import { CharteEditionService } from "../../../domain/services/CharteEditionService";

interface CharteLLMParamsEditorProps {
  charte: CharteDefinition;
  onSave?: () => void;
}

interface LLMParams {
  temperature: number;
  top_p: number;
  max_tokens: number;
}

export const CharteLLMParamsEditor: React.FC<CharteLLMParamsEditorProps> = ({
  charte,
  onSave
}) => {
  const defaultParams: LLMParams = {
  temperature: 0.7,
  top_p: 1.0,
  max_tokens: 150
};

const charteParams = (charte.definition as any).llm_params || (charte as any).prompt_params || {};

const [params, setParams] = useState<LLMParams>({
  temperature: charteParams.temperature ?? defaultParams.temperature,
  top_p: charteParams.top_p ?? defaultParams.top_p,
  max_tokens: charteParams.max_tokens ?? defaultParams.max_tokens
});
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
        changes: { llm_params: params },
        reason: 'Mise à jour des paramètres LLM via éditeur manuel',
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
      console.error("Erreur sauvegarde paramètres LLM:", error);
      setSaveMessage({
        type: 'error',
        text: `Erreur : ${(error as Error).message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const getTemperatureDescription = (temp: number): string => {
    if (temp < 0.3) return "Très déterministe - Réponses reproductibles";
    if (temp < 0.7) return "Équilibré - Bon compromis";
    if (temp < 1.2) return "Créatif - Réponses variées";
    return "Très créatif - Peut être imprévisible";
  };

  const getTopPDescription = (topP: number): string => {
    if (topP < 0.5) return "Très restrictif - Tokens les plus probables";
    if (topP < 0.9) return "Restrictif - Bonne qualité";
    if (topP < 1.0) return "Standard - Équilibré";
    return "Maximum - Tous les tokens possibles";
  };

  return (
    <Box>
      {/* Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Paramètres LLM</strong> - Configurez le comportement du modèle de langage.
          <br />
          Ces paramètres influencent la reproductibilité et la créativité des annotations.
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
          {/* Temperature */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" fontWeight={600}>
                Temperature
              </Typography>
              <Chip 
                label={params.temperature.toFixed(2)} 
                size="small" 
                color="primary"
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              {getTemperatureDescription(params.temperature)}
            </Typography>
            <Slider
              value={params.temperature}
              onChange={(_, value) => setParams({ ...params, temperature: value as number })}
              min={0}
              max={2}
              step={0.1}
              marks={[
                { value: 0, label: '0.0' },
                { value: 0.7, label: '0.7' },
                { value: 1.0, label: '1.0' },
                { value: 2.0, label: '2.0' }
              ]}
              valueLabelDisplay="auto"
            />
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>Recommandé : 0.3-0.7</strong> pour annotation Level 0 (besoin de reproductibilité)
              </Typography>
            </Alert>
          </Box>

          <Divider />

          {/* Top P */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" fontWeight={600}>
                Top P (Nucleus Sampling)
              </Typography>
              <Chip 
                label={params.top_p.toFixed(2)} 
                size="small" 
                color="primary"
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              {getTopPDescription(params.top_p)}
            </Typography>
            <Slider
              value={params.top_p}
              onChange={(_, value) => setParams({ ...params, top_p: value as number })}
              min={0}
              max={1}
              step={0.05}
              marks={[
                { value: 0, label: '0.0' },
                { value: 0.5, label: '0.5' },
                { value: 0.9, label: '0.9' },
                { value: 1.0, label: '1.0' }
              ]}
              valueLabelDisplay="auto"
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>Recommandé : 0.9-1.0</strong> pour conserver la diversité sémantique
              </Typography>
            </Alert>
          </Box>

          <Divider />

          {/* Max Tokens */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" fontWeight={600}>
                Max Tokens (Longueur réponse)
              </Typography>
              <Chip 
                label={`${params.max_tokens} tokens`} 
                size="small" 
                color="primary"
              />
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Nombre maximum de tokens générés (1 token ≈ 0.75 mots)
            </Typography>
            <Slider
              value={params.max_tokens}
              onChange={(_, value) => setParams({ ...params, max_tokens: value as number })}
              min={50}
              max={500}
              step={50}
              marks={[
                { value: 50, label: '50' },
                { value: 150, label: '150' },
                { value: 300, label: '300' },
                { value: 500, label: '500' }
              ]}
              valueLabelDisplay="auto"
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>Recommandé : 100-200</strong> pour annotations courtes (1 tag + justification brève)
              </Typography>
            </Alert>
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
