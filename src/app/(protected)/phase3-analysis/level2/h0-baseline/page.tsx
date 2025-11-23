'use client';

import { useLevel2Data } from '@/features/phase3-analysis/level2-hypotheses/hooks/useLevel2Data';
import { Box, Typography, Paper, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useMemo } from 'react';

export default function H0BaselinePage() {
  const { analysisPairs, loading, error, stats } = useLevel2Data();

  // Calculer distributions
  const distributions = useMemo(() => {
    const strategies: Record<string, number> = {};
    const reactions: Record<string, number> = {};

    analysisPairs.forEach(pair => {
      strategies[pair.strategy_family] = (strategies[pair.strategy_family] || 0) + 1;
      reactions[pair.reaction_tag] = (reactions[pair.reaction_tag] || 0) + 1;
    });

    return { strategies, reactions };
  }, [analysisPairs]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity='error'>Erreur: {error}</Alert>;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant='h4' gutterBottom>
        H0: Distribution Baseline
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        Distribution naturelle des stratégies et réactions sans modèle prédictif
      </Typography>

      <Alert severity='info' sx={{ mb: 3 }}>
        Échantillon: {stats.totalPairs} paires sur {stats.totalCalls} appels
      </Alert>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
        {/* Stratégies */}
        <Paper sx={{ p: 3 }}>
          <Typography variant='h6' gutterBottom>Stratégies Conseiller</Typography>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Stratégie</TableCell>
                  <TableCell align='right'>Fréquence</TableCell>
                  <TableCell align='right'>%</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(distributions.strategies)
                  .sort(([,a], [,b]) => b - a)
                  .map(([strategy, count]) => (
                    <TableRow key={strategy}>
                      <TableCell>{strategy}</TableCell>
                      <TableCell align='right'>{count}</TableCell>
                      <TableCell align='right'>{((count / stats.totalPairs) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Réactions */}
        <Paper sx={{ p: 3 }}>
          <Typography variant='h6' gutterBottom>Réactions Client</Typography>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Réaction</TableCell>
                  <TableCell align='right'>Fréquence</TableCell>
                  <TableCell align='right'>%</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(distributions.reactions)
                  .sort(([,a], [,b]) => b - a)
                  .map(([reaction, count]) => (
                    <TableRow key={reaction}>
                      <TableCell>{reaction}</TableCell>
                      <TableCell align='right'>{count}</TableCell>
                      <TableCell align='right'>{((count / stats.totalPairs) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  );
}
