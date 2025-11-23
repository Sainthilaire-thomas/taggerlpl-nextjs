'use client';

import React, { useMemo, useState } from 'react';
import { useH2MediationData } from '@/features/phase3-analysis/level2-hypotheses/h2-mediation/hooks/useH2MediationData';
import { H2DescriptiveStatsService } from '@/features/phase3-analysis/level2-hypotheses/h2-mediation/statistics/domain/services/H2DescriptiveStatsService';
import { H2PathAnalysisService } from '@/features/phase3-analysis/level2-hypotheses/h2-mediation/statistics/domain/services/H2PathAnalysisService';
import { Box, Typography, Paper, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Card, CardContent, Tabs, Tab } from '@mui/material';
import { CheckCircle, Cancel, TrendingUp, AccountTree, BarChart, ArrowForward } from '@mui/icons-material';

export default function H2MediationPage() {
  const { mediationPairs, loading, error, completenessStats, isReady } = useH2MediationData();
  const [tabValue, setTabValue] = useState(0);

  const analysisData = useMemo(() => {
    return mediationPairs.map(pair => ({
      strategy: pair.strategyFamily,
      reaction: pair.reactionTag,
      m1: pair.m1_verb_density,
      m2: pair.m2_global_alignment,
      m3: pair.m3_cognitive_score,
    }));
  }, [mediationPairs]);

  const strategyStats = useMemo(() => {
    return H2DescriptiveStatsService.calculateStrategyStats(analysisData);
  }, [analysisData]);

  const correlations = useMemo(() => {
    return H2DescriptiveStatsService.calculateMediaReactionCorrelations(analysisData);
  }, [analysisData]);

  const pathAnalysis = useMemo(() => {
    return H2PathAnalysisService.analyzeStrategyPaths(analysisData);
  }, [analysisData]);

  const h2Validation = useMemo(() => {
    return H2PathAnalysisService.validateH2(pathAnalysis);
  }, [pathAnalysis]);

  const anovaResults = useMemo(() => {
    const m1Data = analysisData.filter(d => d.m1 !== null).map(d => ({ strategy: d.strategy, value: d.m1! }));
    const m2Data = analysisData.filter(d => d.m2 !== null).map(d => ({ strategy: d.strategy, value: d.m2! }));
    const m3Data = analysisData.filter(d => d.m3 !== null).map(d => ({ strategy: d.strategy, value: d.m3! }));

    return {
      m1: H2DescriptiveStatsService.anovaByStrategy(m1Data),
      m2: H2DescriptiveStatsService.anovaByStrategy(m2Data),
      m3: H2DescriptiveStatsService.anovaByStrategy(m3Data),
    };
  }, [analysisData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity='error'>Erreur: {error}</Alert>;
  }

  if (!isReady) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant='h4' gutterBottom>
          H2: Mécanismes Cognitifs de Médiation
        </Typography>
        <Alert severity='warning'>
          Données insuffisantes. Calculez M1, M2, M3 sur au moins 30 paires.
        </Alert>
      </Box>
    );
  }

  const isH2Validated = h2Validation.h2a_validated || h2Validation.h2b_validated;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant='h4' gutterBottom>
        H2: Mécanismes Cognitifs de Médiation
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        La réaction client est-elle corrélée à l'alignement linguistique (M2↑) et inversement corrélée à la charge cognitive (M3↑) ?
      </Typography>

      <Alert severity='info' sx={{ mb: 3 }}>
        Échantillon: {mediationPairs.length} paires | M1: {completenessStats.withM1} | M2: {completenessStats.withM2} | M3: {completenessStats.withM3}
      </Alert>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tab label='Statistiques Descriptives' />
        <Tab label='Corrélations M → Y' />
        <Tab label='Chemins Causaux' />
      </Tabs>

      {tabValue === 0 && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChart /> Moyennes des Médiateurs par Stratégie
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              H2 prédit : ENGAGEMENT/OUVERTURE ont M1↑ M2↑ M3↓ vs EXPLICATION qui a M1↓ M2↓ M3↑
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Stratégie</TableCell>
                    <TableCell align='center'>n</TableCell>
                    <TableCell align='center'>M1 (Verbes Action)<br/>Moyenne ± SD</TableCell>
                    <TableCell align='center'>M2 (Alignement)<br/>Moyenne ± SD</TableCell>
                    <TableCell align='center'>M3 (Charge Cogn.)<br/>Moyenne ± SD</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {strategyStats.map(stat => {
                    const isAction = stat.strategy === 'ENGAGEMENT' || stat.strategy === 'OUVERTURE';
                    const bgColor = isAction ? 'rgba(76, 175, 80, 0.1)' : 
                                    stat.strategy === 'EXPLICATION' ? 'rgba(244, 67, 54, 0.1)' : 'transparent';
                    
                    return (
                      <TableRow key={stat.strategy} sx={{ backgroundColor: bgColor }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{stat.strategy}</TableCell>
                        <TableCell align='center'>{stat.n}</TableCell>
                        <TableCell align='center'>
                          {stat.m1_mean.toFixed(2)} ± {stat.m1_std.toFixed(2)}
                          <Typography variant='caption' display='block' color='text.secondary'>
                            [{stat.m1_min.toFixed(1)} - {stat.m1_max.toFixed(1)}]
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          {stat.m2_mean.toFixed(3)} ± {stat.m2_std.toFixed(3)}
                          <Typography variant='caption' display='block' color='text.secondary'>
                            [{stat.m2_min.toFixed(2)} - {stat.m2_max.toFixed(2)}]
                          </Typography>
                        </TableCell>
                        <TableCell align='center'>
                          {stat.m3_mean.toFixed(2)} ± {stat.m3_std.toFixed(2)}
                          <Typography variant='caption' display='block' color='text.secondary'>
                            [{stat.m3_min.toFixed(1)} - {stat.m3_max.toFixed(1)}]
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>Tests ANOVA - Différences entre Stratégies</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Card variant='outlined' sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant='caption'>ANOVA M1</Typography>
                  <Typography variant='h5'>F = {anovaResults.m1.f.toFixed(2)}</Typography>
                  <Typography variant='caption'>p = {anovaResults.m1.p < 0.001 ? '<0.001' : anovaResults.m1.p.toFixed(3)}</Typography>
                  <Chip 
                    label={anovaResults.m1.isSignificant ? 'Significatif' : 'Non significatif'} 
                    color={anovaResults.m1.isSignificant ? 'success' : 'default'} 
                    size='small' 
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
              <Card variant='outlined' sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant='caption'>ANOVA M2</Typography>
                  <Typography variant='h5'>F = {anovaResults.m2.f.toFixed(2)}</Typography>
                  <Typography variant='caption'>p = {anovaResults.m2.p < 0.001 ? '<0.001' : anovaResults.m2.p.toFixed(3)}</Typography>
                  <Chip 
                    label={anovaResults.m2.isSignificant ? 'Significatif' : 'Non significatif'} 
                    color={anovaResults.m2.isSignificant ? 'success' : 'default'} 
                    size='small' 
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
              <Card variant='outlined' sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant='caption'>ANOVA M3</Typography>
                  <Typography variant='h5'>F = {anovaResults.m3.f.toFixed(2)}</Typography>
                  <Typography variant='caption'>p = {anovaResults.m3.p < 0.001 ? '<0.001' : anovaResults.m3.p.toFixed(3)}</Typography>
                  <Chip 
                    label={anovaResults.m3.isSignificant ? 'Significatif' : 'Non significatif'} 
                    color={anovaResults.m3.isSignificant ? 'success' : 'default'} 
                    size='small' 
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Box>
            <Alert severity='info' sx={{ mt: 2 }}>
              <Typography variant='body2'>
                <strong>ANOVA</strong> teste si les moyennes diffèrent significativement entre stratégies. Un F élevé et p &lt; 0.05 indiquent des différences significatives.
              </Typography>
            </Alert>
          </Paper>
        </>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp /> Corrélations Médiateurs → Réactions Client
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            H2 prédit : M1↑ → POSITIF, M2↑ → POSITIF, M3↑ → NEGATIF
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Médiateur</TableCell>
                  <TableCell align='center'>Corrélation (r)</TableCell>
                  <TableCell align='center'>p-value</TableCell>
                  <TableCell align='center'>Significatif</TableCell>
                  <TableCell>Interprétation</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {correlations.map(corr => (
                  <TableRow key={corr.mediator}>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {corr.mediator === 'M1' && 'M1 - Densité verbes action'}
                      {corr.mediator === 'M2' && 'M2 - Alignement lexical'}
                      {corr.mediator === 'M3' && 'M3 - Charge cognitive'}
                    </TableCell>
                    <TableCell align='center'>
                      <Typography variant='h6' color={corr.correlation > 0 ? 'success.main' : 'error.main'}>
                        {corr.correlation.toFixed(3)}
                      </Typography>
                    </TableCell>
                    <TableCell align='center'>
                      {corr.pValue < 0.001 ? '<0.001' : corr.pValue.toFixed(3)}
                    </TableCell>
                    <TableCell align='center'>
                      {corr.isSignificant ? (
                        <Chip icon={<CheckCircle />} label='OUI' color='success' size='small' />
                      ) : (
                        <Chip icon={<Cancel />} label='NON' color='default' size='small' />
                      )}
                    </TableCell>
                    <TableCell>{corr.interpretation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity={correlations.some(c => c.isSignificant) ? 'success' : 'warning'} sx={{ mt: 3 }}>
            <Typography variant='body2'>
              <strong>Validation H2:</strong> {correlations.some(c => c.isSignificant)
                ? 'Au moins une corrélation significative détectée. Les médiateurs jouent un rôle dans la relation Stratégie → Réaction.'
                : 'Aucune corrélation significative. Les médiateurs testés n\'expliquent pas la relation Stratégie → Réaction.'}
            </Typography>
          </Alert>
        </Paper>
      )}

      {tabValue === 2 && (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountTree /> Chemins Causaux : Stratégie → Médiateurs → Réactions
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
              Analyse des chemins : Les stratégies d'ACTION (ENGAGEMENT/OUVERTURE) ont-elles M1↑ et génèrent-elles plus de réactions positives ?
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Stratégie</TableCell>
                    <TableCell align='center'>Profil</TableCell>
                    <TableCell align='center'>n</TableCell>
                    <TableCell align='center'>M1 Moyen</TableCell>
                    <TableCell align='center'>M2 Moyen</TableCell>
                    <TableCell align='center'>M3 Moyen</TableCell>
                    <TableCell align='center'>% Positif</TableCell>
                    <TableCell align='center'>% Négatif</TableCell>
                    <TableCell align='center'>Efficacité</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pathAnalysis.map(path => {
                    const bgColor = path.profile === 'ACTION' ? 'rgba(76, 175, 80, 0.1)' : 
                                    path.profile === 'EXPLANATION' ? 'rgba(244, 67, 54, 0.1)' : 'transparent';
                    
                    return (
                      <TableRow key={path.strategy} sx={{ backgroundColor: bgColor }}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{path.strategy}</TableCell>
                        <TableCell align='center'>
                          <Chip 
                            label={path.profile} 
                            color={path.profile === 'ACTION' ? 'success' : path.profile === 'EXPLANATION' ? 'error' : 'default'}
                            size='small'
                          />
                        </TableCell>
                        <TableCell align='center'>{path.n}</TableCell>
                        <TableCell align='center' sx={{ fontWeight: path.profile === 'ACTION' ? 'bold' : 'normal' }}>
                          {path.m1_mean.toFixed(2)}
                        </TableCell>
                        <TableCell align='center'>{path.m2_mean.toFixed(3)}</TableCell>
                        <TableCell align='center'>{path.m3_mean.toFixed(2)}</TableCell>
                        <TableCell align='center'>
                          <Typography color='success.main'>{path.positif_pct.toFixed(1)}%</Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Typography color='error.main'>{path.negatif_pct.toFixed(1)}%</Typography>
                        </TableCell>
                        <TableCell align='center'>
                          <Typography 
                            variant='h6' 
                            color={path.effectiveness > 0 ? 'success.main' : 'error.main'}
                          >
                            {path.effectiveness > 0 ? '+' : ''}{path.effectiveness.toFixed(1)}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant='h6' gutterBottom>Validation Hypothèse H2</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Card 
                variant='outlined' 
                sx={{ 
                  flex: 1,
                  backgroundColor: h2Validation.h2a_validated ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                  border: h2Validation.h2a_validated ? '2px solid #4caf50' : '2px solid #f44336'
                }}
              >
                <CardContent>
                  <Typography variant='caption'>H2a - Médiateur M1</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    {h2Validation.h2a_validated ? (
                      <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                    ) : (
                      <Cancel sx={{ fontSize: 40, color: 'error.main' }} />
                    )}
                    <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                      {h2Validation.h2a_validated ? 'VALIDÉE' : 'NON VALIDÉE'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Card 
                variant='outlined' 
                sx={{ 
                  flex: 1,
                  backgroundColor: h2Validation.h2b_validated ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                  border: h2Validation.h2b_validated ? '2px solid #4caf50' : '2px solid #f44336'
                }}
              >
                <CardContent>
                  <Typography variant='caption'>H2b - Efficacité différentielle</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    {h2Validation.h2b_validated ? (
                      <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
                    ) : (
                      <Cancel sx={{ fontSize: 40, color: 'error.main' }} />
                    )}
                    <Typography variant='body2' sx={{ fontWeight: 'bold' }}>
                      {h2Validation.h2b_validated ? 'VALIDÉE' : 'NON VALIDÉE'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            <Alert severity={isH2Validated ? 'success' : 'warning'}>
              <Typography variant='body2' sx={{ whiteSpace: 'pre-line' }}>
                {h2Validation.summary}
              </Typography>
            </Alert>
          </Paper>
        </>
      )}
    </Box>
  );
}
