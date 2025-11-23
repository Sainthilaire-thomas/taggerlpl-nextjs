'use client';

import { useLevel2Data } from '@/features/phase3-analysis/level2-hypotheses/hooks/useLevel2Data';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';

export default function Level2TestPage() {
  const { analysisPairs, loading, error, stats } = useLevel2Data();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Chargement analysis_pairs...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity='error'>Erreur: {error}</Alert>;
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant='h4' gutterBottom>
        Level 2 - Test Hook useLevel2Data
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant='h6' gutterBottom>
          Statistiques analysis_pairs
        </Typography>
        <Typography>Total paires: {stats.totalPairs}</Typography>
        <Typography>Total appels: {stats.totalCalls}</Typography>
        <Typography>Stratégies: {stats.strategiesCount}</Typography>
        <Typography>Réactions: {stats.reactionsCount}</Typography>
        <Typography>Avec X: {stats.withX}</Typography>
        <Typography>Avec Y: {stats.withY}</Typography>
        <Typography>Avec M1: {stats.withM1}</Typography>
        <Typography>Avec M2: {stats.withM2}</Typography>
        <Typography>Avec M3: {stats.withM3}</Typography>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant='h6' gutterBottom>
          Échantillon (5 premières paires)
        </Typography>
        {analysisPairs.slice(0, 5).map((pair) => (
          <Box key={pair.pair_id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography variant='body2'>
              <strong>Stratégie:</strong> {pair.strategy_family} ({pair.strategy_tag})
            </Typography>
            <Typography variant='body2'>
              <strong>Réaction:</strong> {pair.reaction_tag}
            </Typography>
            <Typography variant='body2' sx={{ mt: 1 }}>
              Conseiller: {pair.conseiller_verbatim?.substring(0, 100)}...
            </Typography>
            <Typography variant='body2'>
              Client: {pair.client_verbatim?.substring(0, 100)}...
            </Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
