// ============================================================================
// CharteCategoriesEditor - Éditeur des catégories d'une charte
// ============================================================================

"use client";

import React, { useState } from "react";
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TextField,
  Button,
  IconButton,
  Stack,
  Chip,
  Alert,
  Divider
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon
} from "@mui/icons-material";
import { CharteDefinition } from "@/types/algorithm-lab/Level0Types";
import { CharteEditionService } from "../../../domain/services/CharteEditionService";

interface CharteCategoriesEditorProps {
  charte: CharteDefinition;
  onSave?: () => void; // Callback après sauvegarde réussie
}

interface CategoryData {
  description: string;
  examples: string[];
  counter_examples?: string[];
  keywords?: string[];
}

export const CharteCategoriesEditor: React.FC<CharteCategoriesEditorProps> = ({
  charte,
  onSave
}) => {
  const [categories, setCategories] = useState<Record<string, CategoryData>>(
    (charte.definition as any).categories || {}
  );
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // ========== Gestion Description ==========
  const updateCategoryField = (
    catName: string, 
    field: keyof CategoryData, 
    value: any
  ) => {
    setCategories(prev => ({
      ...prev,
      [catName]: {
        ...prev[catName],
        [field]: value
      }
    }));
  };

  // ========== Gestion Exemples ==========
  const updateExample = (catName: string, index: number, value: string) => {
    const cat = categories[catName];
    const newExamples = [...(cat.examples || [])];
    newExamples[index] = value;
    updateCategoryField(catName, 'examples', newExamples);
  };

  const addExample = (catName: string) => {
    const cat = categories[catName];
    updateCategoryField(catName, 'examples', [...(cat.examples || []), '']);
  };

  const removeExample = (catName: string, index: number) => {
    const cat = categories[catName];
    const newExamples = (cat.examples || []).filter((_, i) => i !== index);
    updateCategoryField(catName, 'examples', newExamples);
  };

  // ========== Sauvegarde ==========
  const handleSave = async () => {
    setLoading(true);
    setSaveMessage(null);

    try {
      // Validation : vérifier qu'aucune description n'est vide
      const emptyDescriptions = Object.entries(categories)
        .filter(([_, cat]) => !cat.description?.trim())
        .map(([name, _]) => name);

      if (emptyDescriptions.length > 0) {
        setSaveMessage({
          type: 'error',
          text: `Descriptions vides pour : ${emptyDescriptions.join(', ')}`
        });
        setLoading(false);
        return;
      }

      // Validation : vérifier qu'il y a au moins 1 exemple par catégorie
      const categoriesWithoutExamples = Object.entries(categories)
        .filter(([_, cat]) => !cat.examples || cat.examples.length === 0)
        .map(([name, _]) => name);

      if (categoriesWithoutExamples.length > 0) {
        setSaveMessage({
          type: 'error',
          text: `Au moins 1 exemple requis pour : ${categoriesWithoutExamples.join(', ')}`
        });
        setLoading(false);
        return;
      }

// Calculer la nouvelle version (ex: 1.0.0 → 1.1.0)
const currentVersion = charte.version || '1.0.0';
const [major, minor, patch] = currentVersion.split('.').map(Number);
      const newVersion = `${major}.${minor + 1}.${patch}`;

      // Créer nouvelle version avec CharteEditionService
      const editionService = new CharteEditionService();
      const result = await editionService.createNewVersion({
        base_charte_id: charte.charte_id,
        new_version: newVersion,
        changes: { categories: categories },
        reason: 'Mise à jour des catégories via éditeur manuel',
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
      console.error("Erreur sauvegarde catégories:", error);
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
          <strong>Édition des catégories</strong> - Modifiez les descriptions et exemples.
          La sauvegarde créera une nouvelle version de la charte.
        </Typography>
      </Alert>

      {/* Message de sauvegarde */}
      {saveMessage && (
        <Alert severity={saveMessage.type} sx={{ mb: 3 }} onClose={() => setSaveMessage(null)}>
          {saveMessage.text}
        </Alert>
      )}

      {/* Accordions par catégorie */}
      {Object.entries(categories).map(([categoryName, categoryData]) => (
        <Accordion key={categoryName} defaultExpanded={false}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {categoryName}
              </Typography>
              <Chip 
                label={`${categoryData.examples?.length || 0} exemple(s)`} 
                size="small" 
                color={categoryData.examples?.length > 0 ? "success" : "error"}
              />
            </Stack>
          </AccordionSummary>

          <AccordionDetails>
            <Stack spacing={3}>
              {/* Description */}
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Description
                </Typography>
                <TextField
                  value={categoryData.description || ''}
                  onChange={(e) => updateCategoryField(categoryName, 'description', e.target.value)}
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Décrivez cette catégorie..."
                  helperText="Soyez précis pour guider le LLM"
                />
              </Box>

              <Divider />

              {/* Exemples */}
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Exemples ({categoryData.examples?.length || 0})
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => addExample(categoryName)}
                    variant="outlined"
                  >
                    Ajouter exemple
                  </Button>
                </Stack>

                {(!categoryData.examples || categoryData.examples.length === 0) ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Aucun exemple. Ajoutez au moins 1 exemple pour guider le LLM.
                  </Alert>
                ) : (
                  <Stack spacing={1}>
                    {categoryData.examples.map((example, idx) => (
                      <Stack 
                        key={idx} 
                        direction="row" 
                        spacing={1} 
                        alignItems="center"
                      >
                        <Chip 
                          label={`#${idx + 1}`} 
                          size="small" 
                          sx={{ minWidth: 50 }}
                        />
                        <TextField
                          value={example}
                          onChange={(e) => updateExample(categoryName, idx, e.target.value)}
                          size="small"
                          fullWidth
                          placeholder="Ex: 'oui', 'd'accord', 'très bien'"
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeExample(categoryName, idx)}
                          title="Supprimer cet exemple"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}

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
          L'ancienne version reste disponible dans l'historique.
        </Typography>
      </Alert>
    </Box>
  );
};
