// ============================================================================
// ChartePromptEditor - Éditeur de prompt inline WYSIWYG
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  Alert,
} from "@mui/material";
import { Save as SaveIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { PromptSectionCard, PromptSection } from "./PromptSectionCard";
import { PromptBuilder } from "../../../domain/services/PromptBuilder";
import { CharteDefinition } from "@/types/algorithm-lab/Level0Types";

// Mapping des clés vers labels lisibles
const SECTION_LABELS: Record<string, string> = {
  system_instructions: "System Instructions",
  task_description: "Task Description",
  preprocessing_instructions: "Preprocessing Instructions",
  examples: "Examples",
  context_template: "Context Template",
  constraints: "Constraints",
  reasoning_instructions: "Reasoning Instructions",
  quality_criteria: "Quality Criteria",
  warnings: "Warnings",
  edge_cases: "Edge Cases",
  fallback_instructions: "Fallback Instructions",
  output_format: "Output Format",
};

// Textes d'aide par section
const SECTION_HELP_TEXTS: Record<string, string> = {
  system_instructions: "Définit le rôle et l'expertise du LLM",
  task_description: "Description de la tâche d'annotation (REQUIS)",
  preprocessing_instructions:
    "Instructions de nettoyage des artefacts de transcription",
  context_template:
    "Template du contexte conversationnel (avec variables {{xxx}})",
  output_format: "Format de sortie attendu (REQUIS)",
};

interface ChartePromptEditorProps {
  charte: CharteDefinition;
  onSave: (updatedDefinition: CharteDefinition["definition"]) => Promise<void>;
}

export const ChartePromptEditor: React.FC<ChartePromptEditorProps> = ({
  charte,
  onSave,
}) => {
  const [sections, setSections] = useState<PromptSection[]>([]);
  const [previewPrompt, setPreviewPrompt] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialiser sections depuis charte
  useEffect(() => {
    if (!charte?.definition) return;

    const promptStructure = charte.definition.prompt_structure;
    if (!promptStructure) return;

    const sectionsList: PromptSection[] = [];

    Object.entries(promptStructure).forEach(([key, data]: [string, any]) => {
      sectionsList.push({
        key,
        label: SECTION_LABELS[key] || key,
        content: data.content || "",
        enabled: data.enabled ?? false,
        order: data.order || 100,
        editable: true, // Toutes les sections sont éditables
        placeholder: `Entrez le contenu pour ${SECTION_LABELS[key] || key}...`,
        helpText: SECTION_HELP_TEXTS[key],
      });
    });

    // Trier par order
    sectionsList.sort((a, b) => a.order - b.order);

    setSections(sectionsList);
    updatePreview(charte);
  }, [charte]);

  // Mettre à jour preview
  const updatePreview = (charteData: CharteDefinition) => {
    try {
      const preview = PromptBuilder.buildPreview(charteData);
      setPreviewPrompt(preview);
    } catch (error) {
      console.error("Erreur génération preview:", error);
      setPreviewPrompt("Erreur de génération du preview");
    }
  };

  // Sauvegarder une section
  const handleSaveSection = (key: string, content: string, enabled: boolean) => {
    const updatedSections = sections.map((section) =>
      section.key === key ? { ...section, content, enabled } : section
    );

    setSections(updatedSections);

    // Créer charte temporaire pour preview
    const tempCharte: CharteDefinition = {
      ...charte,
      definition: {
        ...charte.definition,
        prompt_structure: updatedSections.reduce((acc, section) => {
          acc[section.key] = {
            content: section.content,
            enabled: section.enabled,
            order: section.order,
          };
          return acc;
        }, {} as any),
      },
    };

    updatePreview(tempCharte);
    setHasChanges(true);
  };

  // Toggle enabled/disabled
  const handleToggleSection = (key: string, enabled: boolean) => {
    const section = sections.find((s) => s.key === key);
    if (section) {
      handleSaveSection(key, section.content, enabled);
    }
  };

  // Sauvegarder toutes les modifications
  const handleSaveAll = async () => {
    setIsSaving(true);

    const updatedDefinition = {
      ...charte.definition,
      prompt_structure: sections.reduce((acc, section) => {
        acc[section.key] = {
          content: section.content,
          enabled: section.enabled,
          order: section.order,
        };
        return acc;
      }, {} as any),
    };

    try {
      await onSave(updatedDefinition);
      setHasChanges(false);
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      {/* Header avec actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Édition Prompt - {charte.charte_name}</Typography>

        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => updatePreview(charte)}
          >
            Actualiser Preview
          </Button>

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveAll}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </Box>
      </Box>

      {hasChanges && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Modifications non sauvegardées
        </Alert>
      )}

      {/* Sections éditables */}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" mb={2}>
          Cliquez sur une section pour l'éditer
        </Typography>

        {sections.map((section) => (
          <PromptSectionCard
            key={section.key}
            section={section}
            onSave={handleSaveSection}
            onToggle={handleToggleSection}
          />
        ))}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Preview du prompt final */}
      <Box>
        <Typography variant="h6" mb={2}>
          Preview Prompt Final
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            backgroundColor: "background.paper",
            fontFamily: "monospace",
            fontSize: "0.875rem",
            whiteSpace: "pre-wrap",
            maxHeight: "400px",
            overflow: "auto",
          }}
        >
          {previewPrompt}
        </Paper>
      </Box>
    </Box>
  );
};
