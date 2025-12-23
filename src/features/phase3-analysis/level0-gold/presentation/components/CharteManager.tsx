"use client";

// ============================================================================
// CharteManager - Gestion des chartes d'annotation (ENRICHI Session 4)
// ============================================================================

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Stack,
  Alert,
  Divider,
  Paper,
  Tabs,
  Tab
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";
import { CharteManagementService } from "../../domain/services/CharteManagementService";
import { CharteDefinition } from "@/types/algorithm-lab/Level0Types";
import { CharteTuningPanel } from "./tuning/CharteTuningPanel";
import { 
  CharteAliasesEditor,
  CharteCategoriesEditor, 
  CharteRulesEditor,
  CharteLLMParamsEditor
} from './chartes';
interface CharteManagerProps {
  variable: "X" | "Y";
}

export function CharteManager({ variable }: CharteManagerProps) {
  const [chartes, setChartes] = useState<CharteDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCharte, setSelectedCharte] = useState<CharteDefinition | null>(null);
  const [aliasDialogOpen, setAliasDialogOpen] = useState(false);

  // 🆕 États pour la sélection et zone détails
  const [selectedCharteForDetails, setSelectedCharteForDetails] = useState<CharteDefinition | null>(null);
  const [detailsTab, setDetailsTab] = useState<'aliases' | 'categories' | 'rules' | 'llm' | 'tuning' | 'history'>('aliases');

  // États pour l'édition des aliases
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [newAliasKey, setNewAliasKey] = useState("");
  const [newAliasValue, setNewAliasValue] = useState("");

  useEffect(() => {
    loadChartes();
  }, [variable]);

  // 🆕 Reset tab quand charte change
  useEffect(() => {
    if (selectedCharteForDetails) {
      setDetailsTab('aliases');
    }
  }, [selectedCharteForDetails?.charte_id]);

  const loadChartes = async () => {
    setLoading(true);
    try {
      const result = await CharteManagementService.getChartesForVariable(variable);
      if (result.data) {
        setChartes(result.data);
      }
    } catch (error) {
      console.error("Erreur chargement chartes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAliases = (charte: CharteDefinition) => {
    setSelectedCharte(charte);
    setAliases((charte.definition as any).aliases || {});
    setAliasDialogOpen(true);
  };

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

  const handleSaveAliases = async () => {
    if (!selectedCharte) return;

    try {
      setLoading(true);

      // Mettre à jour la définition avec les nouveaux aliases
      const updatedDefinition = {
        ...(selectedCharte.definition as any),
        aliases: aliases
      };

      // Mise à jour via le service
      const result = await CharteManagementService.updateCharte(
        selectedCharte.charte_id,
        {
          definition: updatedDefinition
        }
      );

      if (result.error) throw new Error(result.error);

      // Recharger les chartes
      await loadChartes();
      setAliasDialogOpen(false);
      alert("Aliases sauvegardés avec succès !");
    } catch (error) {
      console.error("Erreur sauvegarde aliases:", error);
      alert("Erreur lors de la sauvegarde: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoriesList = (charte: CharteDefinition): string[] => {
    const def = charte.definition as any;
    if (def.categories) {
      return Object.keys(def.categories);
    }
    return [];
  };

  // 🆕 Gestion du clic sur ligne
  const handleRowClick = (charte: CharteDefinition) => {
    setSelectedCharteForDetails(charte);
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h5" gutterBottom>
                📝 Gestion des Chartes - Variable {variable}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gérez les définitions, catégories et aliases de vos chartes d'annotation
              </Typography>
            </Box>
          </Stack>

          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>💡 Cliquez sur une ligne</strong> pour accéder aux détails et options d'édition de la charte.
            <br />
            <strong>Aliases :</strong> Permettent de normaliser automatiquement les tags LLM non-conformes
            (ex: CLIENT_NON_POSITIF → CLIENT_NEGATIF)
          </Alert>

          {/* Tableau des chartes */}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Charte</strong></TableCell>
                <TableCell><strong>Philosophie</strong></TableCell>
                <TableCell><strong>Version</strong></TableCell>
                <TableCell><strong>Catégories</strong></TableCell>
                <TableCell><strong>Aliases</strong></TableCell>
                <TableCell><strong>Gold Standard</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chartes.map((charte) => {
                const categories = getCategoriesList(charte);
                const aliasCount = Object.keys((charte.definition as any).aliases || {}).length;
                const isSelected = selectedCharteForDetails?.charte_id === charte.charte_id;

                return (
                  <TableRow 
                    key={charte.charte_id}
                    onClick={() => handleRowClick(charte)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: isSelected ? 'action.selected' : 'inherit',
                      '&:hover': { 
                        bgcolor: isSelected ? 'action.selected' : 'action.hover' 
                      },
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {charte.charte_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {charte.charte_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={charte.philosophy}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={charte.version} size="small" />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {categories.map((cat) => (
                          <Chip
                            key={cat}
                            label={cat}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={aliasCount === 0 ? "Aucun" : aliasCount + " alias"}
                        size="small"
                        color={aliasCount === 0 ? "default" : "success"}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {(charte as any).gold_standard_id || "Non associé"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation(); // 🆕 Empêcher sélection ligne
                            handleEditAliases(charte);
                          }}
                          title="Édition rapide aliases"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 🆕 Zone détails sous le tableau */}
      {selectedCharteForDetails && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            {/* Header avec bouton fermer */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                {selectedCharteForDetails.charte_name} v{selectedCharteForDetails.version}
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => setSelectedCharteForDetails(null)}
                title="Fermer les détails"
              >
                <CancelIcon />
              </IconButton>
            </Stack>

            {/* Tabs */}
            <Tabs 
              value={detailsTab} 
              onChange={(_, newValue) => setDetailsTab(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label="Aliases" value="aliases" />
              <Tab label="Catégories" value="categories" />
              <Tab label="Règles" value="rules" />
              <Tab label="Paramètres LLM" value="llm" />
              <Tab label="🔧 Tuning" value="tuning" />
              <Tab label="📜 Historique" value="history" />
            </Tabs>

            {/* Content selon tab */}
            <Box sx={{ minHeight: 300 }}>
             {detailsTab === 'aliases' && (
  <CharteAliasesEditor 
    charte={selectedCharteForDetails}
    onSave={loadChartes}
  />
)}
              
              {detailsTab === 'categories' && (
  <CharteCategoriesEditor 
    charte={selectedCharteForDetails}
    onSave={loadChartes}
  />
)}
              
              {detailsTab === 'rules' && (
  <CharteRulesEditor 
    charte={selectedCharteForDetails}
    onSave={loadChartes}
  />
)}
              
             {detailsTab === 'llm' && (
  <CharteLLMParamsEditor 
    charte={selectedCharteForDetails}
    onSave={loadChartes}
  />
)}
              
              {detailsTab === 'tuning' && (
  <CharteTuningPanel 
    charteId={selectedCharteForDetails.charte_id}
    testId={undefined}
  />
)}
              
              {detailsTab === 'history' && (
                <Alert severity="info">
                  Tab Historique - À implémenter : CharteVersionHistory (Optionnel)
                </Alert>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Dialog d'édition des aliases (GARDE LE COMPORTEMENT EXISTANT) */}
      <Dialog
        open={aliasDialogOpen}
        onClose={() => setAliasDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Gestion des Aliases - {selectedCharte?.charte_name}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Les aliases permettent de normaliser automatiquement les tags non-conformes retournés par le LLM.
          </Alert>

          {/* Liste des aliases existants */}
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Aliases existants :
          </Typography>

          {Object.keys(aliases).length === 0 ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
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
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Formulaire d'ajout */}
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            Ajouter un nouvel alias :
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
            <TextField
              label="Tag LLM (à normaliser)"
              value={newAliasKey}
              onChange={(e) => setNewAliasKey(e.target.value)}
              size="small"
              placeholder="CLIENT_NON_POSITIF"
              fullWidth
            />
            <Typography>→</Typography>
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
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="caption" display="block" gutterBottom>
              <strong>Suggestions courantes :</strong>
            </Typography>
            <Typography variant="caption" display="block">
              • CLIENT_NON_POSITIF → CLIENT_NEGATIF
            </Typography>
            <Typography variant="caption" display="block">
              • CLIENT_NON_NEGATIF → CLIENT_POSITIF
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAliasDialogOpen(false)}
            startIcon={<CancelIcon />}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSaveAliases}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
