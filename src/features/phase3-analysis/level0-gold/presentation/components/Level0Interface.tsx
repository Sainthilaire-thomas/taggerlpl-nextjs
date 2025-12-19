// ============================================================================
// Level0Interface - Interface de test des chartes
// ============================================================================

"use client";

import React, { useState, useMemo, useEffect } from "react";
import { CharteDefinition } from "@/types/algorithm-lab/Level0Types";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tabs,
  Tab
} from "@mui/material";
import { PlayArrow, Science, Visibility } from "@mui/icons-material";
import { useLevel0Testing } from "../hooks/useLevel0Testing";
import { CharteTestResult } from "@/types/algorithm-lab/Level0Types";
import { DisagreementsPanel } from "./DisagreementsPanel";
import { CharteRegistry } from "../../domain/services";

import { DisagreementValidationPanel } from './DisagreementValidationPanel';

import { KappaComparator } from './KappaComparator';
import { GoldStandardManager } from './GoldStandardManager';
import { DerivationWizard } from './DerivationWizard';
import Level0AuditPage from '@/app/(protected)/phase3-analysis/level0/audit/page';
import { CharteManager } from './CharteManager';

export const Level0Interface: React.FC = () => {
  const { loading, progress, results, error, testVariable, loadSavedResults } = useLevel0Testing();
  const [variable, setVariable] = useState<"X" | "Y">("Y");
  const [sampleSize, setSampleSize] = useState(10);
  const [selectedResult, setSelectedResult] = useState<CharteTestResult | null>(null);
  
  // 🆕 État pour les onglets
  const [currentTab, setCurrentTab] = useState<'tests' | 'goldstandards' | 'validation' | 'comparator' | 'audit' | 'chartes'>('tests');
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [showDerivationWizard, setShowDerivationWizard] = useState(false);
  
  // État pour sélection de chartes
  const [selectedChartes, setSelectedChartes] = useState<string[]>([]);

  // Récupérer la liste des chartes disponibles pour la variable
  const [availableChartes, setAvailableChartes] = useState<CharteDefinition[]>([]);

  useEffect(() => {
    CharteRegistry.getChartesForVariable(variable).then(setAvailableChartes);
  }, [variable]);

  // Reset sélection quand la variable change
  useEffect(() => {
    setSelectedChartes([]);
  }, [variable]);

  const handleTest = () => {
    testVariable(variable, sampleSize, selectedChartes);
    setSelectedResult(null);
  };

  const handleLoadSaved = () => {
    loadSavedResults(variable);
  };

  const handleViewDetails = (result: CharteTestResult) => {
    setSelectedResult(result);
  };

  const bestResult = results.length > 0
    ? results.reduce((best, current) => current.kappa > best.kappa ? current : best)
    : null;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Level 0 - Validation multi-chartes
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Test de différentes formulations de chartes d'annotation pour optimiser la reproductibilité LLM
      </Typography>

      {/* 🆕 Système d'onglets */}
<Tabs 
  value={currentTab} 
  onChange={(e, v) => setCurrentTab(v)} 
  sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
>
  <Tab label="Tests de Chartes" value="tests" />
  <Tab label="⭐ Gold Standards" value="goldstandards" />
  <Tab label="Validation Désaccords" value="validation" />
  <Tab label="Comparateur Kappa" value="comparator" />
  <Tab label="🔍 Audit & Debug" value="audit" />
  <Tab label="📝 Gestion Chartes" value="chartes" />
</Tabs>

      {/* ============ ONGLET TESTS ============ */}
      {currentTab === 'tests' && (
        <>
          {/* Section : Configuration */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuration du test
              </Typography>

              <Stack direction="row" spacing={2} mb={2}>
                <FormControl sx={{ minWidth: 200 }}>
                  <InputLabel>Variable</InputLabel>
                  <Select
                    value={variable}
                    onChange={(e) => setVariable(e.target.value as "X" | "Y")}
                    label="Variable"
                    disabled={loading}
                  >
                    <MenuItem value="Y">Y - Réaction Client</MenuItem>
                    <MenuItem value="X">X - Stratégie Conseiller</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Taille échantillon"
                  type="number"
                  value={sampleSize}
                  onChange={(e) => setSampleSize(Math.max(1, Math.min(901, parseInt(e.target.value) || 10)))}
                  disabled={loading}
                  sx={{ width: 200 }}
                  helperText="1-901 paires"
                />

                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={handleTest}
                  disabled={loading || selectedChartes.length === 0}
                  size="large"
                >
                  {loading 
                    ? `Test en cours... (${selectedChartes.length} charte${selectedChartes.length > 1 ? 's' : ''})`
                    : `Tester ${selectedChartes.length} charte${selectedChartes.length > 1 ? 's' : ''} sur ${sampleSize} paires`
                  }
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Science />}
                  onClick={handleLoadSaved}
                  disabled={loading}
                >
                  Charger résultats sauvegardés
                </Button>
              </Stack>

              {/* Section : Sélection des chartes */}
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Sélection des chartes ({selectedChartes.length} / {availableChartes.length})
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Sélectionnez les chartes à tester. Économisez les coûts API en testant une seule charte à la fois.
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                  {availableChartes.map(charte => (
                    <Chip
                      key={charte.charte_id}
                      label={charte.charte_name}
                      onClick={() => {
                        setSelectedChartes(prev => 
                          prev.includes(charte.charte_id)
                            ? prev.filter(id => id !== charte.charte_id)
                            : [...prev, charte.charte_id]
                        )
                      }}
                      color={selectedChartes.includes(charte.charte_id) ? "primary" : "default"}
                      variant={selectedChartes.includes(charte.charte_id) ? "filled" : "outlined"}
                      disabled={loading}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                  <Chip
                    label="Tout sélectionner"
                    onClick={() => setSelectedChartes(availableChartes.map(c => c.charte_id))}
                    variant="outlined"
                    color="secondary"
                    disabled={loading}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    label="Tout désélectionner"
                    onClick={() => setSelectedChartes([])}
                    variant="outlined"
                    disabled={loading}
                    sx={{ cursor: 'pointer' }}
                  />
                </Stack>
              </Box>

              {/* Alert dynamique basé sur la sélection */}
              {selectedChartes.length === 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Sélectionnez au moins une charte pour commencer le test
                </Alert>
              )}
              {selectedChartes.length === availableChartes.length && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Toutes les chartes seront testées ({availableChartes.length} chartes × {sampleSize} paires = {availableChartes.length * sampleSize} appels API)
                </Alert>
              )}
              {selectedChartes.length > 0 && selectedChartes.length < availableChartes.length && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {selectedChartes.length} charte{selectedChartes.length > 1 ? 's' : ''} sélectionnée{selectedChartes.length > 1 ? 's' : ''} ({selectedChartes.length} × {sampleSize} = {selectedChartes.length * sampleSize} appels API)
                  - Économie : {((availableChartes.length - selectedChartes.length) / availableChartes.length * 100).toFixed(0)}% 💰
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Section : Progression */}
          {loading && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Test en cours...
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {progress.charteName} - {progress.current}/{progress.total} paires annotées
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(progress.current / progress.total) * 100}
                />
              </CardContent>
            </Card>
          )}

          {/* Section : Erreur */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Section : Résultats */}
          {results.length > 0 && (
            <>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Résultats comparatifs
                  </Typography>

                  {bestResult && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <strong>Meilleure charte :</strong> {bestResult.charte_name} 
                      {" "}(κ={bestResult.kappa.toFixed(3)}, {bestResult.disagreements_count} désaccords)
                    </Alert>
                  )}

                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Charte</strong></TableCell>
                        <TableCell align="center"><strong>Kappa (κ)</strong></TableCell>
                        <TableCell align="center"><strong>Accuracy</strong></TableCell>
                        <TableCell align="center"><strong>Désaccords</strong></TableCell>
                        <TableCell align="center"><strong>Temps (s)</strong></TableCell>
                        <TableCell align="center"><strong>Interprétation</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results
                        .sort((a, b) => b.kappa - a.kappa)
                        .map((result) => {
                          const isBest = result.test_id === bestResult?.test_id;
                          const interpretation = interpretKappa(result.kappa);
                          
                          return (
                            <TableRow
                              key={result.test_id}
                              sx={{ 
                                bgcolor: isBest ? "success.light" : undefined,
                                fontWeight: isBest ? "bold" : undefined
                              }}
                            >
                              <TableCell>
                                {result.charte_name}
                                {isBest && <Chip label="⭐ Meilleure" size="small" color="success" sx={{ ml: 1 }} />}
                              </TableCell>
                              <TableCell align="center">
                                <Typography
                                  color={result.kappa > 0.8 ? "success.main" : result.kappa > 0.6 ? "warning.main" : "error.main"}
                                  fontWeight="bold"
                                >
                                  {result.kappa.toFixed(3)}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                {(result.accuracy * 100).toFixed(1)}%
                              </TableCell>
                              <TableCell align="center">
                                {result.disagreements_count} / {result.total_pairs}
                              </TableCell>
                              <TableCell align="center">
                                {(result.execution_time_ms / 1000).toFixed(1)}s
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={interpretation}
                                  size="small"
                                  color={getChipColor(result.kappa)}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={1} justifyContent="center">
                                  <IconButton 
                                    color="primary"
                                    onClick={() => handleViewDetails(result)}
                                    disabled={result.disagreements_count === 0}
                                    size="small"
                                  >
                                    <Visibility />
                                  </IconButton>
                                  {/* 🆕 Bouton Valider */}
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                      setSelectedTestId(result.test_id);
                                      setCurrentTab('validation');
                                    }}
                                    disabled={result.disagreements_count === 0}
                                  >
                                    Valider
                                  </Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Panneau de détails des désaccords */}
              {selectedResult && (
                <DisagreementsPanel result={selectedResult} />
              )}
            </>
          )}
        </>
      )}
      {/* ============ ONGLET GOLD STANDARDS ============ */}
{currentTab === 'goldstandards' && (
  <>
    <GoldStandardManager
      onCreateNew={() => {
        alert('Création manuelle : Annotation complète de 901 paires (fonctionnalité à venir)');
      }}
      onCreateByDerivation={() => {
        setShowDerivationWizard(true);
      }}
    />
    
    {/* Wizard de dérivation */}
    <DerivationWizard
      open={showDerivationWizard}
      onClose={() => setShowDerivationWizard(false)}
      onSuccess={(goldStandardId, pairsToReview) => {
        setShowDerivationWizard(false);
        alert(`✅ Gold standard ${goldStandardId} créé !\n\n${pairsToReview.length} paires à ré-annoter.\n\nTemps estimé : ~${Math.ceil(pairsToReview.length * 1.5)} minutes`);
        // TODO: Naviguer vers interface de ré-annotation
      }}
    />
  </>
)}

     {/* ============ ONGLET VALIDATION ============ */}
{currentTab === 'validation' && (
  <>
    {!selectedTestId ? (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sélectionner un test à valider
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Choisissez un test avec des désaccords pour valider les annotations
          </Typography>

          {/* Liste des tests avec désaccords */}
          {results.length === 0 ? (
            <Alert severity="info">
              Aucun test chargé. Cliquez sur "Charger résultats sauvegardés" dans l'onglet "Tests de Chartes" pour voir les tests existants.
            </Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Charte</strong></TableCell>
                  <TableCell align="center"><strong>Variable</strong></TableCell>
                  <TableCell align="center"><strong>Kappa</strong></TableCell>
                  <TableCell align="center"><strong>Désaccords</strong></TableCell>
                  <TableCell align="center"><strong>Date</strong></TableCell>
                  <TableCell align="center"><strong>Action</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results
                  .filter(r => r.disagreements_count > 0)
                  .sort((a, b) => new Date(b.tested_at).getTime() - new Date(a.tested_at).getTime())
                  .map((result) => (
                    <TableRow key={result.test_id}>
                      <TableCell>{result.charte_name}</TableCell>
                      <TableCell align="center">
                        <Chip label={variable} size="small" color="primary" />
                      </TableCell>
                      <TableCell align="center">
                        {result.kappa.toFixed(3)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`${result.disagreements_count} désaccords`}
                          size="small"
                          color="warning"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption">
                          {new Date(result.tested_at).toLocaleDateString('fr-FR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => setSelectedTestId(result.test_id)}
                        >
                          Valider
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}

          {results.length > 0 && results.filter(r => r.disagreements_count > 0).length === 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Aucun test avec désaccords trouvé. Tous les tests sont en accord parfait ! 🎉
            </Alert>
          )}
        </CardContent>
      </Card>
    ) : (
      <>
        <Button
          variant="outlined"
          onClick={() => setSelectedTestId(null)}
          sx={{ mb: 2 }}
        >
          ← Retour à la sélection
        </Button>
        
        <DisagreementValidationPanel 
          testId={selectedTestId}
          onComplete={() => {
            loadSavedResults(variable);
            setSelectedTestId(null);
            alert('Tous les désaccords ont été validés !');
          }}
        />
      </>
    )}
  </>
)}

      {/* ============ ONGLET COMPARATEUR ============ */}
      {currentTab === 'comparator' && (
        <KappaComparator 
          variable={variable}
          title={`Comparateur Kappa - Variable ${variable}`}
        />
      )}
      {/* ============ ONGLET AUDIT ============ */}
{currentTab === 'audit' && (
  <Level0AuditPage />
)}

{/* ============ ONGLET GESTION CHARTES ============ */}
{currentTab === 'chartes' && (
  <CharteManager variable={variable} />
)}
    </Box>
  );
};

function interpretKappa(kappa: number): string {
  if (kappa < 0) return "Inférieur au hasard";
  if (kappa < 0.2) return "Faible";
  if (kappa < 0.4) return "Acceptable";
  if (kappa < 0.6) return "Modéré";
  if (kappa < 0.8) return "Substantiel";
  return "Quasi-parfait";
}

function getChipColor(kappa: number): "success" | "warning" | "error" | "default" {
  if (kappa >= 0.8) return "success";
  if (kappa >= 0.6) return "warning";
  return "error";
}
