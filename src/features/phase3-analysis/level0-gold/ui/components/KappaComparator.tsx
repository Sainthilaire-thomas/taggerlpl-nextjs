/**
 * Composant: KappaComparator
 * Interface de comparaison Kappa entre 2 annotateurs
 * 
 * Emplacement: src/features/phase3-analysis/level0-gold/ui/components/KappaComparator.tsx
 */

'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Card,
  CardContent,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon
} from '@mui/icons-material';
import { useKappaComparison } from '../hooks/useKappaComparison';
import { formatKappa, interpretKappaValue } from '@/types/algorithm-lab/Level0Types';
import { KappaCalculationService } from '../../domain/services';

interface KappaComparatorProps {
  variable?: 'X' | 'Y';
  title?: string;
}

export function KappaComparator({
  variable,
  title = 'Comparateur Kappa Flexible'
}: KappaComparatorProps) {
  
  const {
    annotators,
    isLoadingAnnotators,
    annotator1,
    annotator2,
    setAnnotator1,
    setAnnotator2,
    comparisonResult,
    isComparing,
    error,
    loadAnnotators,
    compare,
    exportToCSV,
    reset
  } = useKappaComparison({ variable });

  const [showDisagreements, setShowDisagreements] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);

  /**
   * Télécharger CSV
   */
  const handleDownloadCSV = () => {
    const csv = exportToCSV();
    if (!csv) return;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kappa-comparison-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Obtenir couleur Kappa
   */
  const getKappaColor = (kappa: number | null | undefined): string => {
    return KappaCalculationService.getKappaColor(kappa);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">{title}</Typography>
            <Stack direction="row" spacing={1}>
              <IconButton onClick={loadAnnotators} disabled={isLoadingAnnotators}>
                <RefreshIcon />
              </IconButton>
              {comparisonResult && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={reset}
                >
                  Réinitialiser
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Erreur */}
          {error && (
            <Alert severity="error">{error}</Alert>
          )}

          {/* Sélection des annotateurs */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 300px' }}>
              <FormControl fullWidth>
                <InputLabel>Annotateur 1</InputLabel>
                <Select
                  value={annotator1 ? `${annotator1.annotator_type}:${annotator1.annotator_id}` : ''}
                  onChange={(e) => {
                    if (!e.target.value) {
                      setAnnotator1(null);
                      return;
                    }
                    const [type, id] = e.target.value.split(':');
                    setAnnotator1({ annotator_type: type as any, annotator_id: id });
                  }}
                  label="Annotateur 1"
                  disabled={isLoadingAnnotators || isComparing}
                >
                  {annotators.map((a) => (
                    <MenuItem
                      key={`${a.type}:${a.id}`}
                      value={`${a.type}:${a.id}`}
                    >
                      <Stack>
                        <Typography variant="body2">{a.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {a.modalityLabel} • {a.count} annotations
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 50 }}>
              <Typography variant="h6" color="text.secondary">vs</Typography>
            </Box>

            <Box sx={{ flex: '1 1 300px' }}>
              <FormControl fullWidth>
                <InputLabel>Annotateur 2</InputLabel>
                <Select
                  value={annotator2 ? `${annotator2.annotator_type}:${annotator2.annotator_id}` : ''}
                  onChange={(e) => {
                    if (!e.target.value) {
                      setAnnotator2(null);
                      return;
                    }
                    const [type, id] = e.target.value.split(':');
                    setAnnotator2({ annotator_type: type as any, annotator_id: id });
                  }}
                  label="Annotateur 2"
                  disabled={isLoadingAnnotators || isComparing}
                >
                  {annotators.map((a) => (
                    <MenuItem
                      key={`${a.type}:${a.id}`}
                      value={`${a.type}:${a.id}`}
                    >
                      <Stack>
                        <Typography variant="body2">{a.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {a.modalityLabel} • {a.count} annotations
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Bouton Calculer */}
          <Button
            variant="contained"
            size="large"
            startIcon={isComparing ? undefined : <CalculateIcon />}
            onClick={compare}
            disabled={!annotator1 || !annotator2 || isComparing}
            fullWidth
          >
            {isComparing ? 'Calcul en cours...' : 'Calculer Cohen\'s Kappa'}
          </Button>

          {isComparing && <LinearProgress />}

          {/* Résultats */}
          {comparisonResult && comparisonResult.success && (
            <>
              {/* Métriques principales */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 200px' }}>
                  <Card>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Cohen's Kappa
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{ color: getKappaColor(comparisonResult.kappa) }}
                      >
                        {formatKappa(comparisonResult.kappa ?? null)}
                      </Typography>
                      <Typography variant="caption">
                        {interpretKappaValue(comparisonResult.kappa ?? null)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box sx={{ flex: '1 1 200px' }}>
                  <Card>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Accuracy
                      </Typography>
                      <Typography variant="h4">
                        {comparisonResult.accuracy
                          ? `${(comparisonResult.accuracy * 100).toFixed(1)}%`
                          : 'N/A'}
                      </Typography>
                      <Typography variant="caption">
                        Accord observé
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box sx={{ flex: '1 1 200px' }}>
                  <Card>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Total Paires
                      </Typography>
                      <Typography variant="h4">
                        {comparisonResult.total_pairs}
                      </Typography>
                      <Typography variant="caption">
                        Annotations communes
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                <Box sx={{ flex: '1 1 200px' }}>
                  <Card>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Désaccords
                      </Typography>
                      <Typography variant="h4" color="error">
                        {comparisonResult.disagreements_count || 0}
                      </Typography>
                      <Typography variant="caption">
                        {comparisonResult.total_pairs > 0
                          ? `${((comparisonResult.disagreements_count || 0) / comparisonResult.total_pairs * 100).toFixed(1)}%`
                          : 'N/A'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* Matrice de confusion */}
              {comparisonResult.confusion_matrix && (
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">Matrice de Confusion</Typography>
                      <IconButton onClick={() => setShowMatrix(!showMatrix)}>
                        {showMatrix ? <CollapseIcon /> : <ExpandIcon />}
                      </IconButton>
                    </Stack>

                    <Collapse in={showMatrix}>
                      <TableContainer sx={{ mt: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell />
                              {comparisonResult.confusion_matrix.categories.map((cat) => (
                                <TableCell key={cat} align="center">
                                  <strong>{cat}</strong>
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {comparisonResult.confusion_matrix.categories.map((row, i) => (
                              <TableRow key={row}>
                                <TableCell><strong>{row}</strong></TableCell>
                                {comparisonResult.confusion_matrix!.matrix[i].map((val, j) => (
                                  <TableCell
                                    key={j}
                                    align="center"
                                    sx={{
                                      bgcolor: i === j ? 'success.lighter' : val > 0 ? 'error.lighter' : 'transparent'
                                    }}
                                  >
                                    {val}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Collapse>
                  </CardContent>
                </Card>
              )}

              {/* Top 10 Désaccords */}
              {comparisonResult.disagreements && comparisonResult.disagreements.length > 0 && (
                <Card>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6">
                        Désaccords ({comparisonResult.disagreements.length})
                      </Typography>
                      <IconButton onClick={() => setShowDisagreements(!showDisagreements)}>
                        {showDisagreements ? <CollapseIcon /> : <ExpandIcon />}
                      </IconButton>
                    </Stack>

                    <Collapse in={showDisagreements}>
                      <TableContainer sx={{ mt: 2, maxHeight: 400 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Pair ID</TableCell>
                              <TableCell>Annotateur 1</TableCell>
                              <TableCell>Annotateur 2</TableCell>
                              <TableCell>Verbatim</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {comparisonResult.disagreements.slice(0, 10).map((d) => (
                              <TableRow key={d.pair_id}>
                                <TableCell>{d.pair_id}</TableCell>
                                <TableCell>
                                  <Chip label={d.tag1} size="small" color="primary" />
                                </TableCell>
                                <TableCell>
                                  <Chip label={d.tag2} size="small" color="secondary" />
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      maxWidth: 300,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {d.verbatim}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {comparisonResult.disagreements.length > 10 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Affichage des 10 premiers désaccords sur {comparisonResult.disagreements.length}
                        </Typography>
                      )}
                    </Collapse>
                  </CardContent>
                </Card>
              )}

              {/* Export CSV */}
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadCSV}
                fullWidth
              >
                Exporter en CSV
              </Button>
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
