# H2 - Guide d'implémentation (version courte)

## 🎯 Objectif

Valider que **M1 (verbes), M2 (alignement), M3 (charge cognitive)** expliquent pourquoi ENGAGEMENT/OUVERTURE fonctionnent mieux qu'EXPLICATION.

```
H1 (✅ fait) : Stratégie → Réaction
H2 (🚧 à faire) : Stratégie → M1/M2/M3 → Réaction
```

---

## 📂 Fichiers à créer

### 1. Types H2

**Fichier** : `types/core/level2.ts`

```typescript
// Paire Conseiller → Client
export interface TurnPair {
  conseillerTurn: TurnTagged;
  clientTurn: TurnTagged;
  latencyMs: number;
  strategyTag: string;      // ENGAGEMENT, OUVERTURE, EXPLICATION
  reactionTag: string;      // CLIENT_POSITIF, CLIENT_NEGATIF, CLIENT_NEUTRE
}

// Résultats M1/M2/M3
export interface M1Result {
  turnId: number;
  verbDensity: number;
  actionVerbs: string[];
  strategy: string;
}

export interface M2Result {
  pairId: string;
  lexicalAlignment: number;
  semanticAlignment: number;
  globalAlignment: number;
  strategy: string;
}

export interface M3Result {
  turnId: number;
  hesitationMarkers: number;
  clarificationRequests: number;
  latencyMs: number;
  cognitiveLoad: 'LOW' | 'MEDIUM' | 'HIGH';
  reactionTo: string;
}

// Résultats agrégés
export interface Level1Results {
  m1Results: M1Result[];
  m2Results: M2Result[];
  m3Results: M3Result[];
  turnPairs: TurnPair[];
}

// Corrélations
export interface H2Correlations {
  verbsPositive: { r: number; pValue: number; significative: boolean };
  alignmentPositive: { r: number; pValue: number; significative: boolean };
  cognitiveNegative: { r: number; pValue: number; significative: boolean };
}

// Résultats finaux
export interface H2Results {
  level1Results: Level1Results;
  correlations: H2Correlations;
  validation: {
    h21: boolean;  // Alignement multidimensionnel
    h22: boolean;  // Convergence temporelle
    h23: boolean;  // Charge cognitive inversée
    h24: boolean;  // Corrélations croisées
    overall: 'VALIDÉE' | 'PARTIELLEMENT_VALIDÉE' | 'REJETÉE';
  };
}
```

---

### 2. Construction des paires

**Fichier** : `components/Level2/shared/TurnPairBuilder.ts`

```typescript
import type { TurnTagged, TurnPair } from '@/types/core/level2';

export class TurnPairBuilder {
  /**
   * Construit les paires Conseiller → Client depuis turntagged
   */
  buildPairs(allTurns: TurnTagged[]): TurnPair[] {
    const pairs: TurnPair[] = [];
  
    // Grouper par call_id
    const byCall = this.groupBy(allTurns, t => t.call_id);
  
    for (const [callId, turns] of Object.entries(byCall)) {
      // Trier par start_time
      const sorted = turns.sort((a, b) => a.start_time - b.start_time);
    
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];
      
        // Vérifier Conseiller → Client
        if (this.isConseillerTurn(current) && this.isClientTurn(next)) {
          pairs.push({
            conseillerTurn: current,
            clientTurn: next,
            latencyMs: next.start_time - current.end_time,
            strategyTag: current.tag,
            reactionTag: next.tag
          });
        }
      }
    }
  
    return pairs;
  }
  
  // ⚠️ NE PAS utiliser le champ `speaker` (non fiable)
  private isConseillerTurn(turn: TurnTagged): boolean {
    const tag = turn.tag.toUpperCase();
    return tag.includes('ENGAGEMENT') || 
           tag.includes('OUVERTURE') || 
           tag.includes('EXPLICATION') ||
           tag.includes('REFLET');
  }
  
  private isClientTurn(turn: TurnTagged): boolean {
    const tag = turn.tag.toUpperCase();
    return tag.includes('CLIENT_POSITIF') ||
           tag.includes('CLIENT_NEGATIF') ||
           tag.includes('CLIENT_NEUTRE');
  }
  
  private groupBy<T>(array: T[], fn: (item: T) => string): Record<string, T[]> {
    return array.reduce((acc, item) => {
      const key = fn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }
}
```

---

### 3. Agrégation M1/M2/M3

**Fichier** : `components/Level2/shared/Level1ResultsAggregator.ts`

```typescript
import { algorithmRegistry } from '@/algorithms/level1/shared/AlgorithmRegistry';
import type { TurnPair, Level1Results } from '@/types/core/level2';

export class Level1ResultsAggregator {
  async aggregateResults(turnPairs: TurnPair[]): Promise<Level1Results> {
    console.log(`🔄 Agrégation M1/M2/M3 pour ${turnPairs.length} paires`);
  
    const m1Results = await this.runM1(turnPairs);
    const m2Results = await this.runM2(turnPairs);
    const m3Results = await this.runM3(turnPairs);
  
    return { m1Results, m2Results, m3Results, turnPairs };
  }
  
  // M1: Densité verbes sur tours conseiller
  private async runM1(pairs: TurnPair[]) {
    const algo = algorithmRegistry.get('M1ActionVerbCounter');
    const results = [];
  
    for (const pair of pairs) {
      const result = await algo.run({ text: pair.conseillerTurn.verbatim });
    
      results.push({
        turnId: pair.conseillerTurn.id,
        verbDensity: result.metadata?.density || 0,
        actionVerbs: result.metadata?.verbsFound || [],
        strategy: pair.strategyTag
      });
    }
  
    return results;
  }
  
  // M2: Alignement entre paires
  private async runM2(pairs: TurnPair[]) {
    const algo = algorithmRegistry.get('M2CompositeAlignment');
    const results = [];
  
    for (const pair of pairs) {
      const result = await algo.run({
        t0: pair.conseillerTurn.verbatim,
        t1: pair.clientTurn.verbatim
      });
    
      results.push({
        pairId: `${pair.conseillerTurn.id}-${pair.clientTurn.id}`,
        lexicalAlignment: result.metadata?.details?.lexicalAlignment || 0,
        semanticAlignment: result.metadata?.details?.semanticAlignment || 0,
        globalAlignment: result.metadata?.details?.overall || 0,
        strategy: pair.strategyTag
      });
    }
  
    return results;
  }
  
  // M3: Charge cognitive sur tours client
  private async runM3(pairs: TurnPair[]) {
    const results = [];
  
    for (const pair of pairs) {
      const latencyMs = pair.latencyMs;
    
      // Hésitations
      const hesitations = (pair.clientTurn.verbatim.match(/\b(euh|ben|alors)\b/gi) || []).length;
    
      // Clarifications
      const clarifications = (pair.clientTurn.verbatim.match(/\b(comment|quoi|pardon)\b/gi) || []).length;
    
      // Charge cognitive
      let cognitiveLoad: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (latencyMs > 800 || hesitations > 2 || clarifications > 0) {
        cognitiveLoad = 'HIGH';
      } else if (latencyMs > 400 || hesitations > 0) {
        cognitiveLoad = 'MEDIUM';
      }
    
      results.push({
        turnId: pair.clientTurn.id,
        hesitationMarkers: hesitations,
        clarificationRequests: clarifications,
        latencyMs,
        cognitiveLoad,
        reactionTo: pair.strategyTag
      });
    }
  
    return results;
  }
}
```

---

### 4. Corrélations Pearson

**Fichier** : `components/Level2/hypothesis/H2Correlator.ts`

```typescript
import type { Level1Results, H2Correlations } from '@/types/core/level2';

export class H2Correlator {
  calculateCorrelations(results: Level1Results): H2Correlations {
    return {
      verbsPositive: this.correlateVerbsWithPositive(results),
      alignmentPositive: this.correlateAlignmentWithPositive(results),
      cognitiveNegative: this.correlateCognitiveWithNegative(results)
    };
  }
  
  private correlateVerbsWithPositive(results: Level1Results) {
    const data = results.turnPairs.map((pair, i) => ({
      x: results.m1Results[i]?.verbDensity || 0,
      y: pair.reactionTag === 'CLIENT_POSITIF' ? 1 : 0
    }));
  
    return this.pearson(data.map(d => d.x), data.map(d => d.y));
  }
  
  private correlateAlignmentWithPositive(results: Level1Results) {
    const data = results.turnPairs.map((pair, i) => ({
      x: results.m2Results[i]?.globalAlignment || 0,
      y: pair.reactionTag === 'CLIENT_POSITIF' ? 1 : 0
    }));
  
    return this.pearson(data.map(d => d.x), data.map(d => d.y));
  }
  
  private correlateCognitiveWithNegative(results: Level1Results) {
    const data = results.turnPairs.map((pair, i) => {
      const load = results.m3Results[i]?.cognitiveLoad;
      const loadValue = load === 'HIGH' ? 3 : load === 'MEDIUM' ? 2 : 1;
      return {
        x: loadValue,
        y: pair.reactionTag === 'CLIENT_NEGATIF' ? 1 : 0
      };
    });
  
    return this.pearson(data.map(d => d.x), data.map(d => d.y));
  }
  
  // Corrélation de Pearson
  private pearson(x: number[], y: number[]) {
    const n = x.length;
    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = y.reduce((a, b) => a + b) / n;
  
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
  
    const r = num / Math.sqrt(denX * denY);
    const t = r * Math.sqrt(n - 2) / Math.sqrt(1 - r * r);
    const pValue = Math.abs(t) > 3 ? 0.001 : Math.abs(t) > 1.96 ? 0.05 : 0.1;
  
    return {
      r,
      pValue,
      significative: pValue < 0.05
    };
  }
}
```

---

### 5. Hook React

**Fichier** : `components/Level2/hooks/useH2Analysis.ts`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TurnPairBuilder } from '../shared/TurnPairBuilder';
import { Level1ResultsAggregator } from '../shared/Level1ResultsAggregator';
import { H2Correlator } from '../hypothesis/H2Correlator';
import type { H2Results } from '@/types/core/level2';

export function useH2Analysis() {
  const [results, setResults] = useState<H2Results | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadH2Data();
  }, []);

  async function loadH2Data() {
    try {
      setIsLoading(true);
    
      // 1. Charger turntagged
      const { data: turns, error: dbError } = await supabase
        .from('turntagged')
        .select('*')
        .order('call_id')
        .order('start_time');
    
      if (dbError) throw dbError;
    
      // 2. Construire paires
      const builder = new TurnPairBuilder();
      const pairs = builder.buildPairs(turns || []);
      console.log(`✅ ${pairs.length} paires construites`);
    
      // 3. Agréger M1/M2/M3
      const aggregator = new Level1ResultsAggregator();
      const level1Results = await aggregator.aggregateResults(pairs);
    
      // 4. Calculer corrélations
      const correlator = new H2Correlator();
      const correlations = correlator.calculateCorrelations(level1Results);
    
      // 5. Valider hypothèses
      const validation = {
        h21: correlations.alignmentPositive.significative,
        h22: correlations.verbsPositive.significative,
        h23: correlations.cognitiveNegative.significative,
        h24: correlations.verbsPositive.significative && 
             correlations.alignmentPositive.significative &&
             correlations.cognitiveNegative.significative,
        overall: (
          correlations.verbsPositive.significative &&
          correlations.alignmentPositive.significative &&
          correlations.cognitiveNegative.significative
        ) ? 'VALIDÉE' : 'PARTIELLEMENT_VALIDÉE'
      };
    
      setResults({ level1Results, correlations, validation });
    
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }

  return { results, isLoading, error, refresh: loadH2Data };
}
```

---

### 6. Composant UI simple

**Fichier** : `components/Level2/hypothesis/H2AlignmentValidation.tsx`

```tsx
'use client';

import { Box, Paper, Typography, CircularProgress, Chip } from '@mui/material';
import { useH2Analysis } from '../hooks/useH2Analysis';

export default function H2AlignmentValidation() {
  const { results, isLoading, error } = useH2Analysis();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Chargement H2...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, bgcolor: 'error.light' }}>
        <Typography color="error">Erreur: {error}</Typography>
      </Paper>
    );
  }

  if (!results) return null;

  const { correlations, validation } = results;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        H2 - Validation Médiateurs M1/M2/M3
      </Typography>

      {/* Statut global */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: validation.overall === 'VALIDÉE' ? 'success.light' : 'warning.light' }}>
        <Typography variant="h5">
          Statut: {validation.overall}
        </Typography>
      </Paper>

      {/* Corrélations */}
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Corrélations</Typography>
      
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`M1 ↔ Positif: r=${correlations.verbsPositive.r.toFixed(3)}`}
            color={correlations.verbsPositive.significative ? 'success' : 'default'}
          />
          <Chip 
            label={`M2 ↔ Positif: r=${correlations.alignmentPositive.r.toFixed(3)}`}
            color={correlations.alignmentPositive.significative ? 'success' : 'default'}
          />
          <Chip 
            label={`M3 ↔ Négatif: r=${correlations.cognitiveNegative.r.toFixed(3)}`}
            color={correlations.cognitiveNegative.significative ? 'success' : 'default'}
          />
        </Box>
      </Paper>

      {/* Validation hypothèses */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Hypothèses</Typography>
      
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography>H2.1 Alignement: {validation.h21 ? '✅' : '❌'}</Typography>
          <Typography>H2.2 Convergence: {validation.h22 ? '✅' : '❌'}</Typography>
          <Typography>H2.3 Charge cognitive: {validation.h23 ? '✅' : '❌'}</Typography>
          <Typography>H2.4 Corrélations: {validation.h24 ? '✅' : '❌'}</Typography>
        </Box>
      </Paper>
    </Box>
  );
}
```

---

## 🚀 Pour démarrer

1. **Crée les 6 fichiers** ci-dessus
2. **Intègre dans Level2Interface** :

```tsx
// components/Level2/Level2Interface.tsx
<Tab label="H2 - Médiateurs" />
<TabPanel value={activeTab} index={1}>
  <H2AlignmentValidation />
</TabPanel>
```

3. **Lance** et teste avec ton corpus

---

## 🎯 Résultats attendus

- **M1 ↔ Positif** : r > 0.70
- **M2 ↔ Positif** : r > 0.60
- **M3 ↔ Négatif** : r > 0.55
- **H2 VALIDÉE** si les 3 corrélations significatives (p < 0.05)

---

*On ajustera au fur et à mesure ! 🚀*
