'use client';

import { useLevel2Data } from '@/features/phase3-analysis/level2-hypotheses/hooks/useLevel2Data';
import { Box, Typography, Paper, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Card, CardContent, ToggleButton, ToggleButtonGroup, Tabs, Tab } from '@mui/material';
import { useMemo, useState } from 'react';
import { H1StatisticsService } from '@/features/phase3-analysis/level2-hypotheses/statistics/domain/services/H1StatisticsService';
import { H1StrategyAnalysisService } from '@/features/phase3-analysis/level2-hypotheses/statistics/domain/services/H1StrategyAnalysisService';
import { CheckCircle, Cancel, TrendingUp, Science } from '@mui/icons-material';

type NeutralMode = 'middle' | 'positive' | 'negative';

export default function H1CorrelationPage() {
  const { analysisPairs, loading, error, stats } = useLevel2Data();
  const [neutralMode, setNeutralMode] = useState<NeutralMode>('middle');
  const [tabValue, setTabValue] = useState(0);

  const contingencyMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    const strategies = new Set<string>();
    const reactions = new Set<string>();

    analysisPairs.forEach(pair => {
      const strat = pair.strategy_family;
      const react = pair.reaction_tag;
      
      strategies.add(strat);
      reactions.add(react);
      
      if (!matrix[strat]) matrix[strat] = {};
      matrix[strat][react] = (matrix[strat][react] || 0) + 1;
    });

    return { 
      matrix, 
      strategies: Array.from(strategies).sort(), 
      reactions: Array.from(reactions).sort() 
    };
  }, [analysisPairs]);

  const strategyStats = useMemo(() => {
    return contingencyMatrix.strategies.map(strategy => {
      const total = contingencyMatrix.reactions.reduce((sum, reaction) => 
        sum + (contingencyMatrix.matrix[strategy]?.[reaction] || 0), 0
      );
      
      const positif = contingencyMatrix.matrix[strategy]?.['CLIENT_POSITIF'] || 0;
      const negatif = contingencyMatrix.matrix[strategy]?.['CLIENT_NEGATIF'] || 0;
      const neutre = contingencyMatrix.matrix[strategy]?.['CLIENT_NEUTRE'] || 0;

      const positifPct = (positif / total) * 100;
      const negatifPct = (negatif / total) * 100;
      const neutrePct = (neutre / total) * 100;

      // Calcul efficacité selon mode NEUTRE
      let effMiddle = positifPct - negatifPct;
      let effPositive = (positifPct + neutrePct) - negatifPct;
      let effNegative = positifPct - (neutrePct + negatifPct);

      return {
        strategy,
        total,
        positif,
        negatif,
        neutre,
        positifPct,
        negatifPct,
        neutrePct,
        effMiddle,
        effPositive,
        effNegative,
      };
    });
  }, [contingencyMatrix]);

  const statistics = useMemo(() => {
    if (contingencyMatrix.strategies.length === 0 || contingencyMatrix.reactions.length === 0) {
      return { chiSquare: 0, df: 0, pValue: 1, cramersV: 0, interpretation: 'Pas de données' };
    }

    const observed: number[][] = contingencyMatrix.strategies.map(strategy =>
      contingencyMatrix.reactions.map(reaction =>
        contingencyMatrix.matrix[strategy]?.[reaction] || 0
      )
    );

    if (observed.length === 0 || observed[0].length === 0) {
      return { chiSquare: 0, df: 0, pValue: 1, cramersV: 0, interpretation: 'Pas de données' };
    }

    const expected = H1StatisticsService.calculateExpectedFrequencies(observed);
    const { chiSquare, df, pValue } = H1StatisticsService.calculateChiSquare(observed, expected);
    const cramersV = H1StatisticsService.calculateCramersV(
      chiSquare,
      stats.totalPairs,
      contingencyMatrix.strategies.length,
      contingencyMatrix.reactions.length
    );
    const interpretation = H1StatisticsService.interpretCramersV(cramersV);

    return { chiSquare, df, pValue, cramersV, interpretation };
  }, [contingencyMatrix, stats.totalPairs]);

  // Analyses par stratégie
  const strategyAnalyses = useMemo(() => {
    return contingencyMatrix.strategies.map(strategy =>
      H1StrategyAnalysisService.analyzeStrategy(strategy, contingencyMatrix)
    );
  }, [contingencyMatrix]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity='error'>Erreur: {error}</Alert>;

  const isSignificant = statistics.pValue < 0.05;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant='h4' gutterBottom>
        H1: Corrélation Stratégie → Réaction
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        La stratégie du conseiller prédit-elle la réaction du client ?
      </Typography>

      <Alert severity='info' sx={{ mb: 3 }}>
        Échantillon: {stats.totalPairs} paires
      </Alert>

      {/* Statistiques de validation globales */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp /> Statistiques de Validation H1 (Globales)
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='caption' color='text.secondary'>Chi² de Pearson</Typography>
                <Typography variant='h4' color='primary'>
                  {statistics.chiSquare.toFixed(2)}
                </Typography>
                <Typography variant='caption'>df = {statistics.df}</Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='caption' color='text.secondary'>p-value</Typography>
                <Typography variant='h4' color={isSignificant ? 'success.main' : 'error.main'}>
                  {statistics.pValue < 0.001 ? '<0.001' : statistics.pValue.toFixed(3)}
                </Typography>
                <Typography variant='caption'>{isSignificant ? 'Significatif' : 'Non significatif'}</Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Card variant='outlined'>
              <CardContent>
                <Typography variant='caption' color='text.secondary'>V de Cramér</Typography>
                <Typography variant='h4' color='primary'>
                  {statistics.cramersV.toFixed(3)}
                </Typography>
                <Typography variant='caption'>{statistics.interpretation}</Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Card variant='outlined' sx={{ 
              backgroundColor: isSignificant ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
              border: isSignificant ? '2px solid #4caf50' : '2px solid #f44336'
            }}>
              <CardContent>
                <Typography variant='caption' color='text.secondary'>Validation H1</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  {isSignificant ? (
                    <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                  ) : (
                    <Cancel sx={{ fontSize: 40, color: 'error.main' }} />
                  )}
                  <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                    {isSignificant ? 'VALIDÉE' : 'NON VALIDÉE'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Alert severity={isSignificant ? 'success' : 'warning'} sx={{ mt: 2 }}>
          <Typography variant='body2'>
            <strong>Conclusion:</strong> {isSignificant 
              ? 'Il existe une association statistiquement significative entre la stratégie du conseiller et la réaction du client (p < 0.05). H1 est validée.'
              : 'Aucune association statistiquement significative détectée (p ≥ 0.05). H1 n\'est pas validée avec cet échantillon.'}
          </Typography>
        </Alert>
      </Paper>

      {/* Onglets */}
      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab label="Matrice & Efficacité" />
        <Tab label="Analyse par Stratégie" />
      </Tabs>

      {/* Onglet 1: Matrice */}
      {tabValue === 0 && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant='h6' gutterBottom>Matrice de Contingence</Typography>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Stratégie</TableCell>
                    {contingencyMatrix.reactions.map(reaction => (
                      <TableCell key={reaction} align='center'>{reaction.replace('CLIENT_', '')}</TableCell>
                    ))}
                    <TableCell align='center'>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contingencyMatrix.strategies.map(strategy => {
                    const total = contingencyMatrix.reactions.reduce((sum, reaction) => 
                      sum + (contingencyMatrix.matrix[strategy]?.[reaction] || 0), 0
                    );
                    
                    return (
                      <TableRow key={strategy}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{strategy}</TableCell>
                        {contingencyMatrix.reactions.map(reaction => {
                          const count = contingencyMatrix.matrix[strategy]?.[reaction] || 0;
                          const pct = total > 0 ? (count / total) * 100 : 0;
                          
                          return (
                            <TableCell 
                              key={reaction} 
                              align='center'
                              sx={{ 
                                backgroundColor: pct > 50 ? 'rgba(76, 175, 80, 0.2)' : 
                                                pct > 30 ? 'rgba(255, 235, 59, 0.2)' : 'transparent'
                              }}
                            >
                              {count}
                              <Typography variant='caption' display='block' color='text.secondary'>
                                ({pct.toFixed(0)}%)
                              </Typography>
                            </TableCell>
                          );
                        })}
                        <TableCell align='center' sx={{ fontWeight: 'bold' }}>{total}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Sélecteur mode NEUTRE */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant='h6' gutterBottom>Efficacité par Stratégie</Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                Comment traiter CLIENT_NEUTRE dans le calcul d'efficacité ?
              </Typography>
              <ToggleButtonGroup
                value={neutralMode}
                exclusive
                onChange={(_, v) => v && setNeutralMode(v)}
                size='small'
              >
                <ToggleButton value='middle'>
                  NEUTRE = Mi-chemin
                </ToggleButton>
                <ToggleButton value='positive'>
                  NEUTRE = Positif
                </ToggleButton>
                <ToggleButton value='negative'>
                  NEUTRE = Négatif
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography variant='caption' display='block' sx={{ mt: 1 }} color='text.secondary'>
                {neutralMode === 'middle' && 'Efficacité = % Positif - % Négatif (ignore neutre)'}
                {neutralMode === 'positive' && 'Efficacité = (% Positif + % Neutre) - % Négatif'}
                {neutralMode === 'negative' && 'Efficacité = % Positif - (% Neutre + % Négatif)'}
              </Typography>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Stratégie</TableCell>
                    <TableCell align='center'>Total</TableCell>
                    <TableCell align='center'>% Positif</TableCell>
                    <TableCell align='center'>% Neutre</TableCell>
                    <TableCell align='center'>% Négatif</TableCell>
                    <TableCell align='center'>Efficacité</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {strategyStats.map(stat => {
                    const effectiveness = neutralMode === 'middle' ? stat.effMiddle :
                                        neutralMode === 'positive' ? stat.effPositive :
                                        stat.effNegative;
                    
                    return (
                      <TableRow key={stat.strategy}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{stat.strategy}</TableCell>
                        <TableCell align='center'>{stat.total}</TableCell>
                        <TableCell align='center' sx={{ color: 'green' }}>
                          {stat.positifPct.toFixed(1)}%
                        </TableCell>
                        <TableCell align='center' sx={{ 
                          color: neutralMode === 'positive' ? 'green' : 
                                 neutralMode === 'negative' ? 'red' : 'gray' 
                        }}>
                          {stat.neutrePct.toFixed(1)}%
                        </TableCell>
                        <TableCell align='center' sx={{ color: 'red' }}>
                          {stat.negatifPct.toFixed(1)}%
                        </TableCell>
                        <TableCell align='center'>
                          <Chip 
                            label={effectiveness.toFixed(1) + '%'}
                            color={effectiveness > 0 ? 'success' : 'error'}
                            size='small'
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* Onglet 2: Analyse par stratégie */}
      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Science /> Chi² par Stratégie (vs Autres)
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            Test d'indépendance pour chaque stratégie individuellement
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Stratégie</TableCell>
                  <TableCell align='center'>Chi²</TableCell>
                  <TableCell align='center'>df</TableCell>
                  <TableCell align='center'>p-value</TableCell>
                  <TableCell align='center'>Significatif</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {strategyAnalyses.map(analysis => (
                  <TableRow key={analysis.strategy}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{analysis.strategy}</TableCell>
                    <TableCell align='center'>{analysis.chiSquare.toFixed(2)}</TableCell>
                    <TableCell align='center'>{analysis.df}</TableCell>
                    <TableCell align='center'>
                      {analysis.pValue < 0.001 ? '<0.001' : analysis.pValue.toFixed(3)}
                    </TableCell>
                    <TableCell align='center'>
                      {analysis.isSignificant ? (
                        <Chip icon={<CheckCircle />} label='OUI' color='success' size='small' />
                      ) : (
                        <Chip icon={<Cancel />} label='NON' color='default' size='small' />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity='info' sx={{ mt: 3 }}>
            <Typography variant='body2'>
              <strong>Interprétation:</strong> Un Chi² significatif (p &lt; 0.05) indique que cette stratégie a une distribution de réactions significativement différente des autres stratégies.
            </Typography>
          </Alert>
        </Paper>
      )}
    </Box>
  );
}
