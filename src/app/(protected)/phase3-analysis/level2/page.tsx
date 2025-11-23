'use client';

import { useLevel2Data } from '@/features/phase3-analysis/level2-hypotheses/hooks/useLevel2Data';
import { Box, Typography, Paper, Grid, Card, CardContent, CardActionArea, Chip, Alert, CircularProgress, Divider } from '@mui/material';
import { useRouter } from 'next/navigation';
import { TrendingUp, Assessment, Science, BarChart } from '@mui/icons-material';

export default function Level2DashboardPage() {
  const { stats, loading, error } = useLevel2Data();
  const router = useRouter();

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity='error'>Erreur: {error}</Alert>;

  const m1Label = stats.withM1 > 0 ? 'Données partielles (' + stats.withM1 + ' paires)' : 'En attente de données';
  const m1Color = stats.withM1 > 0 ? 'warning' : 'default';

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant='h4' gutterBottom>
        Level 2: Test des Hypothèses de la Thèse
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        Validation empirique des hypothèses scientifiques
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant='h6' gutterBottom>Données disponibles</Typography>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Box>
              <Typography variant='h4' color='primary'>{stats.totalPairs}</Typography>
              <Typography variant='body2' color='text.secondary'>Paires analysées</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box>
              <Typography variant='h4' color='primary'>{stats.totalCalls}</Typography>
              <Typography variant='body2' color='text.secondary'>Appels</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box>
              <Typography variant='h4' color='success.main'>{stats.withX}</Typography>
              <Typography variant='body2' color='text.secondary'>Avec X et Y</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box>
              <Typography variant='h4' color='warning.main'>{stats.withM1}</Typography>
              <Typography variant='body2' color='text.secondary'>Avec M1/M2/M3</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant='h5' gutterBottom sx={{ mt: 4, mb: 2 }}>
        Analyse Descriptive
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card sx={{ border: '2px solid #2196f3' }}>
            <CardActionArea 
              onClick={() => router.push('/phase3-analysis/level2/h0-baseline')}
              sx={{ p: 3 }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ color: '#2196f3', mr: 2 }}>
                    <BarChart sx={{ fontSize: 40 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='h6'>
                      Distribution Baseline (H0)
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Analyse descriptive : distribution naturelle des stratégies et réactions
                    </Typography>
                  </Box>
                  <Chip label='Descriptif' color='info' size='small' />
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant='h5' gutterBottom sx={{ mb: 2 }}>
        Hypothèses de la Thèse
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', border: '2px solid #4caf50' }}>
            <CardActionArea 
              onClick={() => router.push('/phase3-analysis/level2/h1-correlation')}
              sx={{ height: '100%', p: 3 }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: '#4caf50', mr: 2 }}>
                    <TrendingUp sx={{ fontSize: 40 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='h6' gutterBottom>
                      H1: Stratégie → Réaction
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                      La stratégie du conseiller prédit la réaction du client
                    </Typography>
                    <Typography variant='caption' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      X → Y
                    </Typography>
                  </Box>
                </Box>
                <Chip label={'Prêt (' + stats.totalPairs + ' paires)'} color='success' size='small' />
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', border: '2px solid #ff9800' }}>
            <CardActionArea 
              onClick={() => router.push('/phase3-analysis/level2/h2-mediation')}
              sx={{ height: '100%', p: 3 }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ color: '#ff9800', mr: 2 }}>
                    <Science sx={{ fontSize: 40 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='h6' gutterBottom>
                      H2: Médiation par M1, M2, M3
                    </Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                      Les médiateurs médient la relation X → Y
                    </Typography>
                    <Typography variant='caption' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      X → M1, M2, M3 → Y
                    </Typography>
                  </Box>
                </Box>
                <Chip label={m1Label} color={m1Color} size='small' />
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ border: '2px solid #9c27b0' }}>
            <CardActionArea 
              onClick={() => router.push('/phase3-analysis/level2/h3-moderation')}
              sx={{ p: 3 }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ color: '#9c27b0', mr: 2 }}>
                    <Assessment sx={{ fontSize: 40 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='h6' gutterBottom>
                      H3: Effets Modérateurs
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Des facteurs contextuels modèrent la relation X → Y
                    </Typography>
                  </Box>
                  <Chip label='Optionnel' color='default' size='small' />
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
