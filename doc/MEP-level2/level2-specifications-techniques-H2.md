# H2 - Spécifications techniques d'implémentation

## 🎯 Objectif

Implémenter la **validation de l'hypothèse H2** (mécanismes d'alignement et charge cognitive) en **réutilisant les algorithmes Level 1** déjà opérationnels.

---

## 📊 Source de données : Table `turntagged`

### Structure de la base de vérité

```typescript
interface TurnTagged {
  id: number;
  call_id: string;
  
  // Tour actuel
  tag: string;                    // Tag du tour (ENGAGEMENT, CLIENT_POSITIF, etc.)
  verbatim: string;               // Texte du tour
  speaker: string;                // ⚠️ NON FIABLE - ne pas utiliser
  start_time: number;             // Timestamp début (ms)
  end_time: number;               // Timestamp fin (ms)
  
  // Tour suivant (pré-calculé)
  next_turn_tag: string | null;     // Tag du tour T+1
  next_turn_verbatim: string | null; // Texte du tour T+1
  
  // Métadonnées
  annotations: Annotation[];      // Annotations expertes
}
```

### ✅ Identification correcte des speakers

**CRITIQUE** : Ne PAS utiliser le champ `speaker` qui n'est pas fiable.

**Méthode correcte** (inspirée de `useLevel1Testing`) :

```typescript
// 1. CONSEILLER : Identifier via la FAMILLE du tag
const CONSEILLER_FAMILIES = new Set([
  'ENGAGEMENT',
  'OUVERTURE', 
  'REFLET',
  'EXPLICATION'
]);

function isConseillerTurn(turn: TurnTagged): boolean {
  const family = getFamilyFromTag(turn.tag);
  return CONSEILLER_FAMILIES.has(family);
}

function getFamilyFromTag(tag: string): string {
  const normalized = tag.toUpperCase().replace(/\s+/g, '_');
  
  if (normalized.startsWith('REFLET')) return 'REFLET';
  if (normalized === 'ENGAGEMENT') return 'ENGAGEMENT';
  if (normalized === 'OUVERTURE') return 'OUVERTURE';
  if (normalized === 'EXPLICATION') return 'EXPLICATION';
  
  // Si tag contient CLIENT → client
  if (normalized.includes('CLIENT')) return 'CLIENT';
  
  return 'UNKNOWN';
}

// 2. CLIENT : Identifier via le TAG directement
const CLIENT_TAGS = new Set([
  'CLIENT_POSITIF',
  'CLIENT_NEGATIF', 
  'CLIENT_NEUTRE',
  'CLIENT_QUESTION',
  'CLIENT_SILENCE'
]);

function isClientTurn(turn: TurnTagged): boolean {
  const normalized = normalizeTag(turn.tag);
  return CLIENT_TAGS.has(normalized);
}

function normalizeTag(tag: string): string {
  return tag.trim().toUpperCase().replace(/\s+/g, '_');
}
```

---

## 🔄 Construction des paires Conseiller → Client

### Algorithme de pairage

```typescript
interface TurnPair {
  conseillerTurn: TurnTagged;
  clientTurn: TurnTagged;
  latencyMs: number;
  strategyTag: string;      // ENGAGEMENT, OUVERTURE, EXPLICATION
  reactionTag: string;      // CLIENT_POSITIF, CLIENT_NEGATIF, CLIENT_NEUTRE
}

function buildTurnPairs(allTurnTagged: TurnTagged[]): TurnPair[] {
  const pairs: TurnPair[] = [];
  
  // Grouper par call_id et trier par start_time
  const byCall = groupBy(allTurnTagged, t => t.call_id);
  
  for (const [callId, turns] of byCall) {
    const sorted = turns.sort((a, b) => a.start_time - b.start_time);
  
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
    
      // Vérifier que c'est bien Conseiller → Client
      if (isConseillerTurn(current) && isClientTurn(next)) {
        pairs.push({
          conseillerTurn: current,
          clientTurn: next,
          latencyMs: next.start_time - current.end_time,
          strategyTag: normalizeTag(current.tag),
          reactionTag: normalizeTag(next.tag)
        });
      }
    }
  }
  
  return pairs;
}
```

---

## 🧪 Algorithmes Level 1 disponibles

### M1 : Densité verbes d'action

**Algorithme** : `M1ActionVerbCounter`

**Input** :

```typescript
const m1Input = conseillerTurn.verbatim; // string simple
```

**Output** (via UniversalResult) :

```typescript
interface M1Result {
  prediction: string;           // Densité formatée "25.00"
  confidence: number;           // Proxy de confiance
  metadata: {
    densityPer: number;         // Base de normalisation (100)
    density: number;            // Densité calculée
    actionVerbCount: number;    // Nombre de verbes
    totalTokens: number;        // Nombre de mots total
    verbsFound: string[];       // Liste des verbes détectés
  };
}
```

**Utilisation** :

```typescript
const m1Algo = algorithmRegistry.get('M1ActionVerbCounter');
const result = await m1Algo.run(conseillerTurn.verbatim);

const m1Data = {
  turnId: conseillerTurn.id,
  verbDensity: result.metadata.density,
  actionVerbs: result.metadata.verbsFound,
  totalWords: result.metadata.totalTokens,
  actionVerbsCount: result.metadata.actionVerbCount,
  strategy: normalizeTag(conseillerTurn.tag)
};
```

---

### M2 : Alignement linguistique

**Algorithme** : `M2CompositeAlignmentCalculator` (recommandé) ou `M2LexicalAlignmentCalculator`

**Input** :

```typescript
interface M2Input {
  t0: string;  // Tour conseiller (T0)
  t1: string;  // Tour client (T+1)
}

const m2Input: M2Input = {
  t0: conseillerTurn.verbatim,
  t1: clientTurn.verbatim
};
```

**Output** :

```typescript
interface M2Result {
  prediction: string;           // "ALIGNEMENT_FORT" | "ALIGNEMENT_FAIBLE" | "DESALIGNEMENT"
  confidence: number;           // Score composite [0-1]
  metadata: {
    details: {
      lexicalAlignment: number;    // Score lexical [0-1]
      semanticAlignment: number;   // Score sémantique [0-1]
      overall: number;             // Score global [0-1]
      sharedTerms: string[];       // Termes partagés
    };
    extra: {
      lexicalScore: number;
      semanticScore: number;
      components: {
        lexical: any;
        semantic: any;
      };
    };
  };
}
```

**Utilisation** :

```typescript
const m2Algo = algorithmRegistry.get('M2CompositeAlignment');
const result = await m2Algo.run({
  t0: conseillerTurn.verbatim,
  t1: clientTurn.verbatim
});

const m2Data = {
  pairId: `${conseillerTurn.id}-${clientTurn.id}`,
  lexicalAlignment: result.metadata.details.lexicalAlignment,
  semanticAlignment: result.metadata.details.semanticAlignment,
  pragmaticAlignment: undefined, // Non implémenté pour l'instant
  globalAlignment: result.metadata.details.overall,
  strategy: normalizeTag(conseillerTurn.tag)
};
```

---

### M3 : Charge cognitive

**Algorithme** : `PausesM3Calculator`

**Input** :

```typescript
// ✅ IMPORTANT : Utiliser le verbatim du CLIENT (tour T+1)
const m3Input = clientTurn.verbatim; // string simple
```

**Output** :

```typescript
interface M3Result {
  prediction: string;           // Score formatté "0.450"
  confidence: number;           // Toujours 0.7
  metadata: {
    details: {
      value: number;              // Score charge cognitive [0-1]
      pauseCount: number;         // Nombre de pauses
      hesitationCount: number;    // Nombre d'hésitations
      markers: Array<{
        type: 'hesitation' | 'pause';
        value: string;
      }>;
    };
    extra: {
      cognitiveScore: number;
      analysis: {
        words: number;
        hesitations: number;
        pauses: number;
        hesitationRate: number;
        pauseRate: number;
        lengthPenalty: number;
      };
      patterns: {
        hesitations: string[];    // ["euh", "ben"]
        pauses: string[];         // ["..."]
        explicitPauses: string[]; // ["(pause)"]
      };
    };
  };
}
```

**Utilisation** :

```typescript
const m3Algo = algorithmRegistry.get('PausesM3Calculator');

// Calcul latence
const latencyMs = clientTurn.start_time - conseillerTurn.end_time;

// Analyse hésitations/pauses
const result = await m3Algo.run(clientTurn.verbatim);

// Détection marqueurs clarification (hors M3Calculator)
const clarificationPattern = /(comment|quoi|pardon|c'est-à-dire|je ne comprends)/gi;
const clarifications = (clientTurn.verbatim.match(clarificationPattern) || []).length;

// Détermination charge cognitive
let cognitiveLoad: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
if (latencyMs > 800 || result.metadata.details.hesitationCount > 2 || clarifications > 0) {
  cognitiveLoad = 'HIGH';
} else if (latencyMs > 400 || result.metadata.details.hesitationCount > 0) {
  cognitiveLoad = 'MEDIUM';
}

const m3Data = {
  turnId: clientTurn.id,
  hesitationMarkers: result.metadata.details.hesitationCount,
  clarificationRequests: clarifications,
  latencyMs,
  cognitiveLoad,
  reactionTo: normalizeTag(conseillerTurn.tag)
};
```

---

## 🔧 Implémentation Level1ResultsAggregator

```typescript
// components/Level2/shared/Level1ResultsAggregator.ts

import { algorithmRegistry } from '@/algorithms/level1/shared/AlgorithmRegistry';
import type { TurnPair, Level1Results } from '@/types/core/level2';

export class Level1ResultsAggregator {
  /**
   * Agrège les résultats M1, M2, M3 pour validation H2
   */
  async aggregateResults(turnPairs: TurnPair[]): Promise<Level1Results> {
    console.log(`🔄 Agrégation Level 1 pour ${turnPairs.length} paires`);
  
    const m1Results = await this.runM1Analysis(turnPairs);
    const m2Results = await this.runM2Analysis(turnPairs);
    const m3Results = await this.runM3Analysis(turnPairs);
  
    return {
      m1Results,
      m2Results,
      m3Results,
      turnPairs
    };
  }
  
  /**
   * M1: Analyse densité verbes d'action sur tours conseiller
   */
  private async runM1Analysis(turnPairs: TurnPair[]) {
    console.log('📊 M1: Analyse densité verbes...');
  
    const m1Algorithm = algorithmRegistry.get('M1ActionVerbCounter');
    if (!m1Algorithm) {
      throw new Error('M1ActionVerbCounter introuvable dans le registre');
    }
  
    const results = [];
  
    for (const pair of turnPairs) {
      try {
        const m1Result = await m1Algorithm.run(pair.conseillerTurn.verbatim);
      
        results.push({
          turnId: pair.conseillerTurn.id,
          verbDensity: m1Result.metadata?.density || 0,
          actionVerbs: m1Result.metadata?.verbsFound || [],
          totalWords: m1Result.metadata?.totalTokens || 0,
          actionVerbsCount: m1Result.metadata?.actionVerbCount || 0,
          strategy: pair.strategyTag
        });
      } catch (error) {
        console.error(`❌ M1 error for turn ${pair.conseillerTurn.id}:`, error);
        results.push({
          turnId: pair.conseillerTurn.id,
          verbDensity: 0,
          actionVerbs: [],
          totalWords: 0,
          actionVerbsCount: 0,
          strategy: pair.strategyTag
        });
      }
    }
  
    console.log(`✅ M1: ${results.length} résultats`);
    return results;
  }
  
  /**
   * M2: Analyse alignement linguistique entre paires
   */
  private async runM2Analysis(turnPairs: TurnPair[]) {
    console.log('📊 M2: Analyse alignement...');
  
    const m2Algorithm = algorithmRegistry.get('M2CompositeAlignment');
    if (!m2Algorithm) {
      throw new Error('M2CompositeAlignment introuvable dans le registre');
    }
  
    const results = [];
  
    for (const pair of turnPairs) {
      try {
        const m2Result = await m2Algorithm.run({
          t0: pair.conseillerTurn.verbatim,
          t1: pair.clientTurn.verbatim
        });
      
        const details = m2Result.metadata?.details || {};
        const extra = m2Result.metadata?.extra || {};
      
        results.push({
          pairId: `${pair.conseillerTurn.id}-${pair.clientTurn.id}`,
          lexicalAlignment: details.lexicalAlignment || extra.lexicalScore || 0,
          semanticAlignment: details.semanticAlignment || extra.semanticScore || 0,
          pragmaticAlignment: undefined, // Non implémenté
          globalAlignment: details.overall || m2Result.confidence || 0,
          strategy: pair.strategyTag
        });
      } catch (error) {
        console.error(`❌ M2 error for pair ${pair.conseillerTurn.id}-${pair.clientTurn.id}:`, error);
        results.push({
          pairId: `${pair.conseillerTurn.id}-${pair.clientTurn.id}`,
          lexicalAlignment: 0,
          semanticAlignment: 0,
          pragmaticAlignment: undefined,
          globalAlignment: 0,
          strategy: pair.strategyTag
        });
      }
    }
  
    console.log(`✅ M2: ${results.length} résultats`);
    return results;
  }
  
  /**
   * M3: Analyse charge cognitive sur tours client
   */
  private async runM3Analysis(turnPairs: TurnPair[]) {
    console.log('📊 M3: Analyse charge cognitive...');
  
    const m3Algorithm = algorithmRegistry.get('PausesM3Calculator');
    if (!m3Algorithm) {
      throw new Error('PausesM3Calculator introuvable dans le registre');
    }
  
    const results = [];
  
    for (const pair of turnPairs) {
      try {
        // Calcul latence
        const latencyMs = pair.latencyMs;
      
        // Analyse hésitations/pauses via M3
        const m3Result = await m3Algorithm.run(pair.clientTurn.verbatim);
        const details = m3Result.metadata?.details || {};
        const extra = m3Result.metadata?.extra || {};
      
        // Détection marqueurs clarification (hors M3)
        const clarificationPattern = /(comment|quoi|pardon|c'est-à-dire|je ne comprends)/gi;
        const clarificationMatches = pair.clientTurn.verbatim.match(clarificationPattern) || [];
      
        // Détermination charge cognitive
        const hesitationCount = details.hesitationCount || 0;
        const clarificationCount = clarificationMatches.length;
      
        let cognitiveLoad: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        if (latencyMs > 800 || hesitationCount > 2 || clarificationCount > 0) {
          cognitiveLoad = 'HIGH';
        } else if (latencyMs > 400 || hesitationCount > 0) {
          cognitiveLoad = 'MEDIUM';
        }
      
        results.push({
          turnId: pair.clientTurn.id,
          hesitationMarkers: hesitationCount,
          clarificationRequests: clarificationCount,
          latencyMs,
          cognitiveLoad,
          reactionTo: pair.strategyTag,
          cognitiveScore: details.value || 0,
          patterns: extra.patterns || { hesitations: [], pauses: [], explicitPauses: [] }
        });
      } catch (error) {
        console.error(`❌ M3 error for turn ${pair.clientTurn.id}:`, error);
        results.push({
          turnId: pair.clientTurn.id,
          hesitationMarkers: 0,
          clarificationRequests: 0,
          latencyMs: pair.latencyMs,
          cognitiveLoad: 'LOW',
          reactionTo: pair.strategyTag,
          cognitiveScore: 0,
          patterns: { hesitations: [], pauses: [], explicitPauses: [] }
        });
      }
    }
  
    console.log(`✅ M3: ${results.length} résultats`);
    return results;
  }
}
```

---

## 📈 Tests statistiques H2

### Corrélations Pearson

```typescript
// components/Level2/hypothesis/H2Correlator.ts

/**
 * Calcul corrélation de Pearson entre deux variables
 */
function calculatePearsonCorrelation(
  x: number[],
  y: number[]
): { r: number; pValue: number } {
  const n = x.length;
  
  // Moyennes
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  // Covariance et écarts-types
  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    covariance += dx * dy;
    varianceX += dx * dx;
    varianceY += dy * dy;
  }
  
  const r = covariance / Math.sqrt(varianceX * varianceY);
  
  // Test de significativité
  const t = r * Math.sqrt(n - 2) / Math.sqrt(1 - r * r);
  const pValue = tTestPValue(t, n - 2);
  
  return { r, pValue };
}

/**
 * H2 Corrélation 1: Densité verbes → CLIENT_POSITIF
 */
function correlateVerbsWithReactions(
  m1Results: Level1Results['m1Results'],
  turnPairs: TurnPair[]
) {
  const data: Array<{ verbDensity: number; isPositive: number }> = [];
  
  for (const m1Result of m1Results) {
    const pair = turnPairs.find(p => p.conseillerTurn.id === m1Result.turnId);
    if (!pair) continue;
  
    data.push({
      verbDensity: m1Result.verbDensity,
      isPositive: pair.reactionTag === 'CLIENT_POSITIF' ? 1 : 0
    });
  }
  
  const pearsonResult = calculatePearsonCorrelation(
    data.map(d => d.verbDensity),
    data.map(d => d.isPositive)
  );
  
  // Densité moyenne par stratégie
  const byStrategy = new Map<string, number>();
  for (const strategy of ['ENGAGEMENT', 'OUVERTURE', 'EXPLICATION']) {
    const strategyResults = m1Results.filter(r => r.strategy === strategy);
    const avgDensity = strategyResults.reduce((sum, r) => sum + r.verbDensity, 0) / 
                      strategyResults.length;
    byStrategy.set(strategy, avgDensity);
  }
  
  return {
    pearsonR: pearsonResult.r,
    pValue: pearsonResult.pValue,
    significative: pearsonResult.pValue < 0.05,
    byStrategy
  };
}
```

---

## ✅ Checklist d'implémentation

### Phase 1 : Préparation données (Semaine 1)

* [ ] Fonction `buildTurnPairs()` depuis `turntagged`
* [ ] Tests identification speakers (conseiller vs client)
* [ ] Validation paires sur corpus test (300+ paires)
* [ ] Stats distributionnelles (ENGAGEMENT, OUVERTURE, EXPLICATION)

### Phase 2 : Agrégateur Level 1 (Semaine 2)

* [ ] `Level1ResultsAggregator.runM1Analysis()`
* [ ] `Level1ResultsAggregator.runM2Analysis()`
* [ ] `Level1ResultsAggregator.runM3Analysis()`
* [ ] Tests unitaires sur 10 paires
* [ ] Validation cohérence résultats vs attendus thèse

### Phase 3 : Corrélations H2 (Semaine 3)

* [ ] `H2Correlator.correlateVerbsWithReactions()`
* [ ] `H2Correlator.correlateAlignmentWithReactions()`
* [ ] `H2Correlator.correlateCognitiveLoadWithReactions()`
* [ ] Tests significativité (p < 0.05)

### Phase 4 : Tests statistiques (Semaine 4)

* [ ] ANOVA alignement par stratégie
* [ ] t-test latences ACTIONS vs EXPLICATIONS
* [ ] Chi² marqueurs cognitifs
* [ ] Intervalles de confiance 95%

### Phase 5 : UI Level 2 (Semaine 5-6)

* [ ] Composant `H2AlignmentValidation.tsx`
* [ ] Panels M1/M2/M3
* [ ] Matrice corrélations
* [ ] Tests validation UI

---

## 🎯 Résultats attendus H2

### H2.1 : Alignement multidimensionnel

| Stratégie  | Alignement lexical | Alignement sémantique | Alignement global |
| ----------- | ------------------ | ---------------------- | ----------------- |
| ENGAGEMENT  | **34,2%**    | **~80%**         | **~57%**    |
| OUVERTURE   | **41,7%**    | **~85%**         | **~63%**    |
| EXPLICATION | **12,4%**    | **~30%**         | **~21%**    |

**Test** : ANOVA, F(2,270) > 28, p < 0.001

### H2.2 : Convergence temporelle

| Stratégie  | Latence moyenne   | Catégorie  |
| ----------- | ----------------- | ----------- |
| ENGAGEMENT  | **< 400ms** | Automatique |
| OUVERTURE   | **< 400ms** | Automatique |
| EXPLICATION | **> 800ms** | Effortful   |

**Test** : t-test, t(273) > 12, p < 0.001

### H2.3 : Charge cognitive inversée

| Indicateur     | ENGAGEMENT/OUVERTURE | EXPLICATION     |
| -------------- | -------------------- | --------------- |
| Hésitations   | **< 10%**      | **> 30%** |
| Clarifications | **< 5%**       | **> 25%** |

**Test** : Chi², χ² > 23, p < 0.001

### H2.4 : Corrélations croisées

| Corrélation                 | Pearson r attendu  | Significativité |
| ---------------------------- | ------------------ | ---------------- |
| Verbes ↔ CLIENT_POSITIF     | **r = 0.73** | p < 0.001        |
| Alignement ↔ CLIENT_POSITIF | **r > 0.60** | p < 0.001        |
| Charge ↔ CLIENT_NEGATIF     | **r > 0.55** | p < 0.001        |

---

*Spécifications techniques v1.0 - 2025-10-01*
*AlgorithmLab Level 2 - Validation H2*
