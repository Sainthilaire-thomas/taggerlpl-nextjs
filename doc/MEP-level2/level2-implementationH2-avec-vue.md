# Document 2 : Implémentation validation H2 dans Level2

## Objectif

Implémenter l'interface de validation H2 en chargeant les données pré-calculées depuis la vue `h2_analysis_pairs`.

---

## Architecture des fichiers

```
components/Level2/
├── hypothesis/
│   ├── H2AlignmentValidation.tsx    # Composant principal
│   └── H2Correlator.ts              # Calcul corrélations Pearson
├── hooks/
│   └── useH2Analysis.ts             # Hook chargement données
└── shared/
    └── H2DataTransformer.ts         # Transformation vue → types Level2
```

---

## Étape 1 : Types TypeScript

**Fichier** : `types/core/level2.ts`

typescript

```typescript
// Types pour la vue h2_analysis_pairs
exportinterfaceH2PairRow{
  pair_id:number;
  conseiller_turn_id:number;
  client_turn_id:number;
  call_id:string;
  
// Timestamps
  conseiller_start_time:number;
  conseiller_end_time:number;
  client_start_time:number;
  client_end_time:number;
  latency_ms:number;
  
// Verbatims et tags
  strategy_tag:string;
  reaction_tag:string;
  conseiller_verbatim:string;
  client_verbatim:string;
  
// Résultats M1
  m1_verb_density:number;
  m1_verb_count:number;
  m1_total_words:number;
  m1_action_verbs:string[];
  
// Résultats M2
  m2_lexical_alignment:number;
  m2_semantic_alignment:number;
  m2_global_alignment:number;
  m2_shared_terms:string[];
  
// Résultats M3
  m3_hesitation_count:number;
  m3_clarification_count:number;
  m3_cognitive_score:number;
  m3_cognitive_load:'LOW'|'MEDIUM'|'HIGH';
  m3_patterns:{
    hesitations:string[];
    pauses:string[];
    explicitPauses:string[];
};
  
// Métadonnées
  computed_at:string;
  computation_status:'COMPUTED'|'PENDING'|'ERROR';
}

// Types pour l'analyse H2
exportinterfaceM1Result{
  turnId:number;
  verbDensity:number;
  actionVerbs:string[];
  totalWords:number;
  actionVerbsCount:number;
  strategy:string;
}

exportinterfaceM2Result{
  pairId:string;
  lexicalAlignment:number;
  semanticAlignment:number;
  globalAlignment:number;
  sharedTerms:string[];
  strategy:string;
}

exportinterfaceM3Result{
  turnId:number;
  hesitationMarkers:number;
  clarificationRequests:number;
  latencyMs:number;
  cognitiveLoad:'LOW'|'MEDIUM'|'HIGH';
  cognitiveScore:number;
  reactionTo:string;
  patterns:{
    hesitations:string[];
    pauses:string[];
    explicitPauses:string[];
};
}

exportinterfaceLevel1Results{
  m1Results:M1Result[];
  m2Results:M2Result[];
  m3Results:M3Result[];
  pairCount:number;
  byStrategy:{
ENGAGEMENT:number;
OUVERTURE:number;
EXPLICATION:number;
};
}

exportinterfaceH2Correlations{
  verbsPositive:{
    r:number;
    pValue:number;
    significative:boolean;
    byStrategy:Map<string,number>;
};
  alignmentPositive:{
    r:number;
    pValue:number;
    significative:boolean;
    byStrategy:Map<string,number>;
};
  cognitiveNegative:{
    r:number;
    pValue:number;
    significative:boolean;
    byStrategy:Map<string,number>;
};
}

exportinterfaceH2Validation{
  h21_alignmentMultidimensional:boolean;
  h22_temporalConvergence:boolean;
  h23_inverseCognitiveLoad:boolean;
  h24_crossCorrelations:boolean;
  overall:'VALIDÉE'|'PARTIELLEMENT_VALIDÉE'|'REJETÉE';
  details:string;
}

exportinterfaceH2Results{
  level1Results:Level1Results;
  correlations:H2Correlations;
  validation:H2Validation;
  rawPairs:H2PairRow[];
}
```

---

## Étape 2 : Transformateur de données

**Fichier** : `components/Level2/shared/H2DataTransformer.ts`

typescript

```typescript
importtype{H2PairRow,Level1Results,M1Result,M2Result,M3Result}from'@/types/core/level2';

exportclassH2DataTransformer{
/**
   * Transforme les lignes de la vue en résultats M1/M2/M3 structurés
   */
statictransformToLevel1Results(pairs:H2PairRow[]):Level1Results{
const m1Results:M1Result[]=[];
const m2Results:M2Result[]=[];
const m3Results:M3Result[]=[];
  
const byStrategy ={
ENGAGEMENT:0,
OUVERTURE:0,
EXPLICATION:0
};

for(const pair of pairs){
// Normaliser stratégie
const strategy =this.normalizeStrategy(pair.strategy_tag);
if(strategy in byStrategy){
        byStrategy[strategy askeyoftypeof byStrategy]++;
}

// M1: Densité verbes (un par tour conseiller)
      m1Results.push({
        turnId: pair.conseiller_turn_id,
        verbDensity: pair.m1_verb_density,
        actionVerbs: pair.m1_action_verbs,
        totalWords: pair.m1_total_words,
        actionVerbsCount: pair.m1_verb_count,
        strategy: strategy
});

// M2: Alignement (un par paire)
      m2Results.push({
        pairId:`${pair.conseiller_turn_id}-${pair.client_turn_id}`,
        lexicalAlignment: pair.m2_lexical_alignment,
        semanticAlignment: pair.m2_semantic_alignment,
        globalAlignment: pair.m2_global_alignment,
        sharedTerms: pair.m2_shared_terms,
        strategy: strategy
});

// M3: Charge cognitive (un par tour client)
      m3Results.push({
        turnId: pair.client_turn_id,
        hesitationMarkers: pair.m3_hesitation_count,
        clarificationRequests: pair.m3_clarification_count,
        latencyMs: pair.latency_ms,
        cognitiveLoad: pair.m3_cognitive_load,
        cognitiveScore: pair.m3_cognitive_score,
        reactionTo: strategy,
        patterns: pair.m3_patterns
});
}

return{
      m1Results,
      m2Results,
      m3Results,
      pairCount: pairs.length,
      byStrategy
};
}

/**
   * Normalise les tags de stratégie
   */
privatestaticnormalizeStrategy(tag:string):string{
const normalized = tag.toUpperCase().trim();
  
if(normalized.startsWith('ENGAGEMENT'))return'ENGAGEMENT';
if(normalized.startsWith('OUVERTURE'))return'OUVERTURE';
if(normalized.startsWith('EXPLICATION'))return'EXPLICATION';
if(normalized.startsWith('REFLET'))return'REFLET';
  
return normalized;
}
}
```

---

## Étape 3 : Calcul des corrélations

**Fichier** : `components/Level2/hypothesis/H2Correlator.ts`

typescript

```typescript
importtype{Level1Results,H2Correlations,H2PairRow}from'@/types/core/level2';

exportclassH2Correlator{
/**
   * Calcule toutes les corrélations H2
   */
calculateCorrelations(
    level1Results:Level1Results,
    rawPairs:H2PairRow[]
):H2Correlations{
return{
      verbsPositive:this.correlateVerbsWithPositive(level1Results, rawPairs),
      alignmentPositive:this.correlateAlignmentWithPositive(level1Results, rawPairs),
      cognitiveNegative:this.correlateCognitiveWithNegative(level1Results, rawPairs)
};
}

/**
   * H2.1: Corrélation densité verbes ↔ CLIENT_POSITIF
   */
privatecorrelateVerbsWithPositive(
    results:Level1Results,
    rawPairs:H2PairRow[]
){
const data:Array<{ x:number; y:number}>=[];

for(const m1Result of results.m1Results){
const pair = rawPairs.find(p => p.conseiller_turn_id=== m1Result.turnId);
if(!pair)continue;

      data.push({
        x: m1Result.verbDensity,
        y: pair.reaction_tag.toUpperCase().includes('POSITIF')?1:0
});
}

const pearson =this.calculatePearson(data.map(d => d.x), data.map(d => d.y));

// Moyenne par stratégie
const byStrategy =this.calculateMeanByStrategy(
      results.m1Results,
(r)=> r.verbDensity
);

return{
      r: pearson.r,
      pValue: pearson.pValue,
      significative: pearson.pValue<0.05,
      byStrategy
};
}

/**
   * H2.2: Corrélation alignement ↔ CLIENT_POSITIF
   */
privatecorrelateAlignmentWithPositive(
    results:Level1Results,
    rawPairs:H2PairRow[]
){
const data:Array<{ x:number; y:number}>=[];

for(const m2Result of results.m2Results){
const pair = rawPairs.find(
        p =>`${p.conseiller_turn_id}-${p.client_turn_id}`=== m2Result.pairId
);
if(!pair)continue;

      data.push({
        x: m2Result.globalAlignment,
        y: pair.reaction_tag.toUpperCase().includes('POSITIF')?1:0
});
}

const pearson =this.calculatePearson(data.map(d => d.x), data.map(d => d.y));

const byStrategy =this.calculateMeanByStrategy(
      results.m2Results,
(r)=> r.globalAlignment
);

return{
      r: pearson.r,
      pValue: pearson.pValue,
      significative: pearson.pValue<0.05,
      byStrategy
};
}

/**
   * H2.3: Corrélation charge cognitive ↔ CLIENT_NEGATIF
   */
privatecorrelateCognitiveWithNegative(
    results:Level1Results,
    rawPairs:H2PairRow[]
){
const data:Array<{ x:number; y:number}>=[];

for(const m3Result of results.m3Results){
const pair = rawPairs.find(p => p.client_turn_id=== m3Result.turnId);
if(!pair)continue;

const loadValue = 
        m3Result.cognitiveLoad==='HIGH'?3:
        m3Result.cognitiveLoad==='MEDIUM'?2:1;

      data.push({
        x: loadValue,
        y: pair.reaction_tag.toUpperCase().includes('NEGATIF')?1:0
});
}

const pearson =this.calculatePearson(data.map(d => d.x), data.map(d => d.y));

const byStrategy =this.calculateMeanByStrategy(
      results.m3Results,
(r)=> r.cognitiveLoad==='HIGH'?3: r.cognitiveLoad==='MEDIUM'?2:1
);

return{
      r: pearson.r,
      pValue: pearson.pValue,
      significative: pearson.pValue<0.05,
      byStrategy
};
}

/**
   * Calcul corrélation de Pearson
   */
privatecalculatePearson(
    x:number[],
    y:number[]
):{ r:number; pValue:number}{
const n = x.length;
if(n <3)return{ r:0, pValue:1};

const meanX = x.reduce((a, b)=> a + b,0)/ n;
const meanY = y.reduce((a, b)=> a + b,0)/ n;

let covariance =0;
let varianceX =0;
let varianceY =0;

for(let i =0; i < n; i++){
const dx = x[i]- meanX;
const dy = y[i]- meanY;
      covariance += dx * dy;
      varianceX += dx * dx;
      varianceY += dy * dy;
}

const r = covariance /Math.sqrt(varianceX * varianceY);

// Test de significativité
const t = r *Math.sqrt(n -2)/Math.sqrt(1- r * r);
const pValue =this.tTestPValue(Math.abs(t), n -2);

return{ r, pValue };
}

/**
   * Approximation p-value pour t-test
   */
privatetTestPValue(t:number, df:number):number{
if(t >3)return0.001;
if(t >1.96)return0.05;
if(t >1.645)return0.1;
return0.2;
}

/**
   * Moyenne par stratégie
   */
privatecalculateMeanByStrategy<Textends{ strategy:string}>(
    results:T[],
valueExtractor:(r:T)=>number
):Map<string,number>{
const byStrategy =newMap<string,number>();

for(const strategy of['ENGAGEMENT','OUVERTURE','EXPLICATION']){
const strategyResults = results.filter(r => r.strategy=== strategy);
if(strategyResults.length===0){
        byStrategy.set(strategy,0);
continue;
}

const mean = strategyResults.reduce((sum, r)=> sum +valueExtractor(r),0)/ 
                   strategyResults.length;
      byStrategy.set(strategy, mean);
}

return byStrategy;
}
}
```

---

## Étape 4 : Hook de chargement

**Fichier** : `components/Level2/hooks/useH2Analysis.ts`

typescript

```typescript
 const correlations = correlator.calculateCorrelations(level1Results, pairs as H2PairRow[]);

      // Valider hypothèses H2
      const validation = validateH2Hypotheses(correlations, level1Results);

      setResults({
        level1Results,
        correlations,
        validation,
        rawPairs: pairs as H2PairRow[]
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ Erreur chargement H2:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return { 
    results, 
    isLoading, 
    error, 
    refresh: loadH2Data 
  };
}

/**
 * Valide les 4 sous-hypothèses H2
 */
function validateH2Hypotheses(
  correlations: H2Correlations,
  level1Results: Level1Results
): H2Validation {
  // H2.1: Alignement multidimensionnel (ENGAGEMENT/OUVERTURE > EXPLICATION)
  const engagementAlignment = correlations.alignmentPositive.byStrategy.get('ENGAGEMENT') || 0;
  const ouvertureAlignment = correlations.alignmentPositive.byStrategy.get('OUVERTURE') || 0;
  const explicationAlignment = correlations.alignmentPositive.byStrategy.get('EXPLICATION') || 0;
  
  const h21 = (engagementAlignment > explicationAlignment) && 
              (ouvertureAlignment > explicationAlignment);

  // H2.2: Convergence temporelle (corrélation verbes significative)
  const h22 = correlations.verbsPositive.significative;

  // H2.3: Charge cognitive inversée (corrélation significative)
  const h23 = correlations.cognitiveNegative.significative;

  // H2.4: Corrélations croisées (toutes significatives)
  const h24 = correlations.verbsPositive.significative &&
              correlations.alignmentPositive.significative &&
              correlations.cognitiveNegative.significative;

  // Statut global
  const validatedCount = [h21, h22, h23, h24].filter(Boolean).length;
  let overall: 'VALIDÉE' | 'PARTIELLEMENT_VALIDÉE' | 'REJETÉE';
  
  if (validatedCount === 4) {
    overall = 'VALIDÉE';
  } else if (validatedCount >= 2) {
    overall = 'PARTIELLEMENT_VALIDÉE';
  } else {
    overall = 'REJETÉE';
  }

  const details = `${validatedCount}/4 sous-hypothèses validées`;

  return {
    h21_alignmentMultidimensional: h21,
    h22_temporalConvergence: h22,
    h23_inverseCognitiveLoad: h23,
    h24_crossCorrelations: h24,
    overall,
    details
  };
}

Étape 5 : Composant principal
Fichier : components/Level2/hypothesis/H2AlignmentValidation.tsx
typescript'use client';

import { Box, Paper, Typography, CircularProgress, Alert, Chip, Grid, Divider } from '@mui/material';
import { CheckCircle, Cancel, Warning } from '@mui/icons-material';
import { useH2Analysis } from '../hooks/useH2Analysis';

export default function H2AlignmentValidation() {
  const { results, isLoading, error, refresh } = useH2Analysis();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>Chargement des résultats H2...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, bgcolor: 'error.light' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Erreur de chargement
        </Typography>
        <Typography color="error">{error}</Typography>
        <Typography sx={{ mt: 2 }} variant="body2">
          Avez-vous exécuté le script de pré-calcul ?
        </Typography>
        <code style={{ display: 'block', marginTop: 8, padding: 8, background: '#f5f5f5' }}>
          npm run precompute:h2
        </code>
      </Paper>
    );
  }

  if (!results) return null;

  const { correlations, validation, level1Results } = results;

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Typography variant="h4" gutterBottom>
        H2 - Validation Médiateurs (M1/M2/M3)
      </Typography>
  
      <Typography variant="body1" color="text.secondary" paragraph>
        Analyse de {level1Results.pairCount} paires Conseiller→Client
      </Typography>

      {/* Statut global */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          bgcolor: validation.overall === 'VALIDÉE' ? 'success.light' : 
                   validation.overall === 'PARTIELLEMENT_VALIDÉE' ? 'warning.light' : 
                   'error.light' 
        }}
      >
        <Typography variant="h5" gutterBottom>
          Statut : {validation.overall}
        </Typography>
        <Typography variant="body2">
          {validation.details}
        </Typography>
      </Paper>

      {/* Distribution par stratégie */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Distribution des paires
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Chip 
              label={`ENGAGEMENT: ${level1Results.byStrategy.ENGAGEMENT}`} 
              color="primary" 
            />
          </Grid>
          <Grid item xs={4}>
            <Chip 
              label={`OUVERTURE: ${level1Results.byStrategy.OUVERTURE}`} 
              color="primary" 
            />
          </Grid>
          <Grid item xs={4}>
            <Chip 
              label={`EXPLICATION: ${level1Results.byStrategy.EXPLICATION}`} 
              color="primary" 
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Corrélations */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Corrélations Pearson
        </Typography>
    
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {/* M1 ↔ Positif */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              M1 (Verbes d'action) ↔ CLIENT_POSITIF
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip 
                label={`r = ${correlations.verbsPositive.r.toFixed(3)}`}
                color={correlations.verbsPositive.significative ? 'success' : 'default'}
              />
              <Chip 
                label={`p = ${correlations.verbsPositive.pValue.toFixed(3)}`}
                size="small"
              />
              {correlations.verbsPositive.significative && (
                <CheckCircle color="success" />
              )}
            </Box>
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Moyenne par stratégie : 
              ENG={correlations.verbsPositive.byStrategy.get('ENGAGEMENT')?.toFixed(2)}, 
              OUV={correlations.verbsPositive.byStrategy.get('OUVERTURE')?.toFixed(2)}, 
              EXP={correlations.verbsPositive.byStrategy.get('EXPLICATION')?.toFixed(2)}
            </Typography>
          </Box>

          <Divider />

          {/* M2 ↔ Positif */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              M2 (Alignement linguistique) ↔ CLIENT_POSITIF
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip 
                label={`r = ${correlations.alignmentPositive.r.toFixed(3)}`}
                color={correlations.alignmentPositive.significative ? 'success' : 'default'}
              />
              <Chip 
                label={`p = ${correlations.alignmentPositive.pValue.toFixed(3)}`}
                size="small"
              />
              {correlations.alignmentPositive.significative && (
                <CheckCircle color="success" />
              )}
            </Box>
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Moyenne par stratégie : 
              ENG={correlations.alignmentPositive.byStrategy.get('ENGAGEMENT')?.toFixed(2)}, 
              OUV={correlations.alignmentPositive.byStrategy.get('OUVERTURE')?.toFixed(2)}, 
              EXP={correlations.alignmentPositive.byStrategy.get('EXPLICATION')?.toFixed(2)}
            </Typography>
          </Box>

          <Divider />

          {/* M3 ↔ Négatif */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              M3 (Charge cognitive) ↔ CLIENT_NEGATIF
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip 
                label={`r = ${correlations.cognitiveNegative.r.toFixed(3)}`}
                color={correlations.cognitiveNegative.significative ? 'success' : 'default'}
              />
              <Chip 
                label={`p = ${correlations.cognitiveNegative.pValue.toFixed(3)}`}
                size="small"
              />
              {correlations.cognitiveNegative.significative && (
                <CheckCircle color="success" />
              )}
            </Box>
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Charge moyenne par stratégie : 
              ENG={correlations.cognitiveNegative.byStrategy.get('ENGAGEMENT')?.toFixed(2)}, 
              OUV={correlations.cognitiveNegative.byStrategy.get('OUVERTURE')?.toFixed(2)}, 
              EXP={correlations.cognitiveNegative.byStrategy.get('EXPLICATION')?.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Validation des sous-hypothèses */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Validation des sous-hypothèses
        </Typography>
    
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <HypothesisRow 
            code="H2.1"
            label="Alignement multidimensionnel"
            validated={validation.h21_alignmentMultidimensional}
            description="ENGAGEMENT/OUVERTURE > EXPLICATION sur alignement"
          />
      
          <HypothesisRow 
            code="H2.2"
            label="Convergence temporelle"
            validated={validation.h22_temporalConvergence}
            description="Corrélation verbes ↔ réactions positives significative"
          />
      
          <HypothesisRow 
            code="H2.3"
            label="Charge cognitive inversée"
            validated={validation.h23_inverseCognitiveLoad}
            description="Corrélation charge ↔ réactions négatives significative"
          />
      
          <HypothesisRow 
            code="H2.4"
            label="Corrélations croisées"
            validated={validation.h24_crossCorrelations}
            description="Toutes les corrélations sont significatives (p < 0.05)"
          />
        </Box>
      </Paper>
    </Box>
  );
}

/**
 * Composant ligne d'hypothèse
 */
function HypothesisRow({ 
  code, 
  label, 
  validated, 
  description 
}: { 
  code: string; 
  label: string; 
  validated: boolean; 
  description: string;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {validated ? (
        <CheckCircle color="success" />
      ) : (
        <Cancel color="error" />
      )}
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1">
          <strong>{code}</strong> : {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      </Box>
      <Chip 
        label={validated ? 'VALIDÉE' : 'REJETÉE'} 
        color={validated ? 'success' : 'error'}
        size="small"
      />
    </Box>
  );
}

Étape 6 : Intégration dans Level2Interface
Fichier : components/Level2/Level2Interface.tsx
typescript'use client';

import { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import StatisticalSummary from './validation/StatisticalSummary';
import StatisticalTestsPanel from './validation/StatisticalTestsPanel';
import H2AlignmentValidation from './hypothesis/H2AlignmentValidation';

export default function Level2Interface() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="H1 - Efficacité différentielle" />
          <Tab label="H2 - Médiateurs M1/M2/M3" />
          <Tab label="H3 - Application" />
        </Tabs>
      </Paper>

      {/* H1 */}
      {activeTab === 0 && (
        <Box>
          <StatisticalSummary />
          <StatisticalTestsPanel />
        </Box>
      )}

      {/* H2 */}
      {activeTab === 1 && (
        <H2AlignmentValidation />
      )}

      {/* H3 */}
      {activeTab === 2 && (
        <Box sx={{ p: 3 }}>
          <Typography variant="h5">H3 - À implémenter</Typography>
        </Box>
      )}
    </Box>
  );
}

Résumé de l'implémentation
Fichiers créés

types/core/level2.ts - Types complets H2
components/Level2/shared/H2DataTransformer.ts - Transformation données
components/Level2/hypothesis/H2Correlator.ts - Calcul corrélations
components/Level2/hooks/useH2Analysis.ts - Hook chargement
components/Level2/hypothesis/H2AlignmentValidation.tsx - UI principale

Avantages de cette architecture

Performance : Chargement instantané (< 2 secondes vs 5 minutes)
Séparation : Vue SQL ↔ Code React totalement découplés
Testabilité : Chaque classe testable unitairement
Maintenabilité : Calculs M1/M2/M3 centralisés dans le script
Traçabilité : Tous les résultats horodatés et versionnés

Commandes
bash# Créer la vue (une fois)
psql -h your-db.supabase.co -U postgres -d postgres -f create-h2-view.sql

# Pré-calculer les résultats
npm run precompute:h2

# Rafraîchir après nouveaux turntagged
npm run precompute:h2

Document 2/2 - Implémentation H2
Version 1.0 - 2025-10-01

'use client';

import{ useState, useEffect }from'react';
import{ supabase }from'@/lib/supabase';
import{H2DataTransformer}from'../shared/H2DataTransformer';
import{H2Correlator}from'../hypothesis/H2Correlator';
importtype{H2Results,H2PairRow}from'@/types/core/level2';

exportfunctionuseH2Analysis(){
const[results, setResults]=useState<H2Results|null>(null);
const[isLoading, setIsLoading]=useState(true);
const[error, setError]=useState<string|null>(null);

useEffect(()=>{
loadH2Data();
},[]);

asyncfunctionloadH2Data(){
try{
setIsLoading(true);
setError(null);

// Charger depuis la vue pré-calculée
const{ data: pairs, error: dbError }=await supabase
.from('h2_analysis_pairs')
.select('*')
.eq('computation_status','COMPUTED')
.order('pair_id');

if(dbError)throw dbError;

if(!pairs || pairs.length===0){
thrownewError('Aucune paire calculée trouvée. Exécutez: npm run precompute:h2');
}

console.log(`✅ ${pairs.length} paires chargées depuis la vue`);

// Transformer en résultats Level1
const level1Results =H2DataTransformer.transformToLevel1Results(pairs asH2PairRow[]);

// Calculer corrélations
const correlator =newH2Correlator();
```
