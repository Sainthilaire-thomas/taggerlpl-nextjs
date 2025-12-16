# 🔄 ADDENDUM : Réutilisation des Composants Level 1 pour Level 0

*Ajout au document mission-2025-12-15-level0-llm-contra-annotation.md*

---

## 🎯 Principe : Réutiliser, ne pas recréer

Tu as raison Thomas - on a déjà **tous les composants d'affichage** dans Level 1. Au lieu de recréer, on va :

1. **Adapter les données** : Transformer les résultats de contre-annotation en format compatible `TVValidationResultCore`
2. **Réutiliser les composants** : `ResultsPanel`, `AnalysisPairContext`, `QuickTagEditDialog`, etc.
3. **Créer juste la logique métier** : Services OpenAI et Kappa

---

## 📦 Composants Level 1 déjà disponibles

### 1. ResultsPanel (affichage principal)

**Localisation** : `src/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel.tsx`

**Props** :
```typescript
interface ResultsPanelProps {
  results: TVValidationResultCore[];
  initialPageSize?: number;
  targetKind: TargetKind;
  classifierLabel: string;
}
```

**Ce qu'il affiche** :
- Tableau paginé avec tous les résultats
- Colonnes : Verbatim, Gold, Predicted, Correct, Confidence, Timestamps, Actions
- Filtrage par résultat (tous / corrects / erreurs)
- Clic sur ligne pour voir détails

**Usage Level 0** :
```typescript
<ResultsPanel
  results={level0Results}  // Résultats adaptés depuis contre-annotation
  initialPageSize={10}
  targetKind="X"  // ou "Y"
  classifierLabel="OpenAI GPT-4 (Annotateur 2)"
/>
```

### 2. AnalysisPairContext (affichage contexte)

**Localisation** : `src/features/shared/ui/components/AnalysisPairContext.tsx`

**Props** :
```typescript
interface AnalysisPairContextProps {
  pairId?: number;  // Fetch auto depuis analysis_pairs
  // OU mode manuel :
  prev3?: string;
  prev2?: string;
  prev1?: string;
  conseiller: string;
  client: string;
  next1?: string;
  next2?: string;
  next3?: string;
}
```

**Ce qu'il affiche** :
- Contexte complet : prev3 → prev2 → prev1 → **X (conseiller)** → **Y (client)** → next1 → next2 → next3
- Toggle pour masquer/afficher le contexte étendu
- Fond bleu pour conseiller, orange pour client
- **Hook intégré** : fetch automatique si juste `pairId`

**Usage Level 0** :
```typescript
// Mode autonome (le plus simple)
<AnalysisPairContext pairId={disagreement.pairId} />

// Mode manuel si tu veux contrôler
<AnalysisPairContext
  prev1={disagreement.prev1_verbatim}
  conseiller={disagreement.conseiller_verbatim}
  client={disagreement.client_verbatim}
  next1={disagreement.next1_verbatim}
/>
```

### 3. QuickTagEditDialog (édition rapide)

**Localisation** : `src/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/components/QuickTagEditDialog.tsx`

**Props** :
```typescript
interface QuickTagEditDialogProps {
  open: boolean;
  onClose: () => void;
  turnId: number;
  pairId: number;
  currentTag: string;
  speaker: 'conseiller' | 'client';
  verbatim: string;
  onSuccess?: () => void;
}
```

**Ce qu'il fait** :
- Dialog modal avec sélecteur de tags
- Mise à jour de `turntagged.tag` (source de vérité)
- Synchronisation automatique avec `analysis_pairs`
- Callback `onSuccess` pour refresh UI

**Usage Level 0** : Parfait pour résoudre les désaccords !
```typescript
<QuickTagEditDialog
  open={resolveDialogOpen}
  onClose={() => setResolveDialogOpen(false)}
  turnId={disagreement.conseiller_turn_id}  // ou client_turn_id
  pairId={disagreement.pairId}
  currentTag={disagreement.manualTag}  // Tag actuel
  speaker="conseiller"  // ou "client"
  verbatim={disagreement.conseiller_verbatim}
  onSuccess={handleResolutionSuccess}
/>
```

### 4. ResultsTableBody (tableau détaillé)

**Localisation** : `src/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/components/ResultsTableBody.tsx`

**Ce qu'il affiche** :
- Tableau avec colonnes enrichies (timestamp, durée, actions)
- Bouton "Speed" (icône Speed) → ouvre `QuickTagEditDialog`
- Bouton "OpenInNew" → ouvre l'appel complet au timestamp exact
- Coloration rouge/vert selon correct/incorrect

**Usage Level 0** : Utilisé automatiquement par `ResultsPanel`

### 5. ConfusionMatrixPanel (matrice de confusion)

**Localisation** : `src/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ConfusionMatrixPanel.tsx`

**Props** :
```typescript
interface ConfusionMatrixPanelProps {
  metrics: ClassificationMetrics;  // Contient confusionMatrix
}
```

**Ce qu'il affiche** :
- Matrice de confusion avec heatmap
- Lignes = Gold (annotation manuelle)
- Colonnes = Predicted (annotation LLM)
- Diagonale = accords, hors diagonale = désaccords

**Usage Level 0** :
```typescript
<ConfusionMatrixPanel metrics={level0Metrics} />
```

### 6. ErrorAnalysisPanel (analyse erreurs)

**Localisation** : `src/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ErrorAnalysisPanel.tsx`

**Props** :
```typescript
interface ErrorAnalysisPanelProps {
  errorAnalysis?: {
    totalErrors: number;
    errorRate: number;
    errorsByCategory: Record<string, number>;
    // ...
  };
}
```

**Ce qu'il affiche** :
- Nombre total d'erreurs
- Distribution par catégorie (tag)
- Graphique des erreurs fréquentes

**Usage Level 0** :
```typescript
<ErrorAnalysisPanel errorAnalysis={level0ErrorAnalysis} />
```

---

## 🔄 Architecture simplifiée pour Level 0

### Workflow d'affichage

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LEVEL 0 INTERFACE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1️⃣ Onglet "Contre-Annotation OpenAI"                              │
│     • Bouton "Lancer contre-annotation" (901 paires)               │
│     • Barre de progression (0/901)                                  │
│     • Sauvegarde résultats en mémoire                              │
│                                                                     │
│  2️⃣ Onglet "Comparaison X (Stratégie)"                             │
│     • <ResultsPanel> avec results adaptés                          │
│     • Filtrage : Tous / Accords / Désaccords                       │
│     • Clic ligne → <AnalysisPairContext> + détails                 │
│                                                                     │
│  3️⃣ Onglet "Comparaison Y (Réaction)"                              │
│     • <ResultsPanel> avec results adaptés                          │
│     • Filtrage : Tous / Accords / Désaccords                       │
│     • Clic ligne → <AnalysisPairContext> + détails                 │
│                                                                     │
│  4️⃣ Onglet "Métriques Kappa"                                        │
│     • <ConfusionMatrixPanel> pour X et Y                           │
│     • Affichage Kappa, Po, Pe                                       │
│     • <ErrorAnalysisPanel> pour désaccords                         │
│                                                                     │
│  5️⃣ Onglet "Résolution Désaccords"                                 │
│     • Liste filtrée : UNIQUEMENT les désaccords                    │
│     • Pour chaque désaccord :                                       │
│       - <AnalysisPairContext pairId={...} />                       │
│       - Bouton "Résoudre" → <QuickTagEditDialog>                   │
│       - Choix : Garder manuel / Adopter LLM / Autre               │
│                                                                     │
│  6️⃣ Onglet "Validation Finale"                                      │
│     • Résumé : X paires validées, Y désaccords restants           │
│     • Bouton "Appliquer Consensus" (remplir level0_gold_*)        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Adaptateur de données

### Transformation OpenAI → TVValidationResultCore

**Fichier à créer** : `src/features/phase3-analysis/level0-gold/domain/adapters/Level0ToTVAdapter.ts`

```typescript
import type { TVValidationResultCore } from '@/types/algorithm-lab';
import type { OpenAIAnnotationResult } from '../services/OpenAIAnnotatorService';

export class Level0ToTVAdapter {
  /**
   * Convertit les résultats de contre-annotation OpenAI
   * en format compatible avec les composants Level 1
   */
  static adaptXResults(
    pairs: AnalysisPair[],
    openaiResults: OpenAIAnnotationResult[]
  ): TVValidationResultCore[] {
    return pairs.map((pair, index) => {
      const openaiResult = openaiResults[index];
      const manualTag = pair.strategy_tag;  // Annotation manuelle
      const llmTag = openaiResult.x_predicted;  // Annotation LLM
      
      return {
        verbatim: pair.conseiller_verbatim,
        goldStandard: manualTag,  // Gold = annotation manuelle
        predicted: llmTag,         // Predicted = annotation LLM
        confidence: openaiResult.x_confidence,
        correct: manualTag === llmTag,  // Accord ?
        metadata: {
          pairId: pair.pair_id,
          turnId: pair.conseiller_turn_id,
          callId: pair.call_id,
          start: pair.start_time,
          end: pair.end_time,
          prev1_turn_verbatim: pair.prev1_turn_verbatim,
          next1_turn_verbatim: pair.next1_turn_verbatim,
          prev2_turn_verbatim: pair.prev2_turn_verbatim,
          next2_turn_verbatim: pair.next2_turn_verbatim,
          prev3_turn_verbatim: pair.prev3_turn_verbatim,
          next3_turn_verbatim: pair.next3_turn_verbatim,
          client_verbatim: pair.client_verbatim,
          // Métadonnées Level 0
          llm_reasoning: openaiResult.x_reasoning,
          annotator1: 'Manuel',
          annotator2: 'OpenAI GPT-4',
        },
      };
    });
  }
  
  static adaptYResults(
    pairs: AnalysisPair[],
    openaiResults: OpenAIAnnotationResult[]
  ): TVValidationResultCore[] {
    return pairs.map((pair, index) => {
      const openaiResult = openaiResults[index];
      const manualTag = pair.reaction_tag;
      const llmTag = openaiResult.y_predicted;
      
      return {
        verbatim: pair.client_verbatim,
        goldStandard: manualTag,
        predicted: llmTag,
        confidence: openaiResult.y_confidence,
        correct: manualTag === llmTag,
        metadata: {
          pairId: pair.pair_id,
          turnId: pair.client_turn_id,
          callId: pair.call_id,
          start: pair.start_time,
          end: pair.end_time,
          prev1_turn_verbatim: pair.conseiller_verbatim,  // Pour Y, prev = conseiller
          next1_turn_verbatim: pair.next1_turn_verbatim,
          conseiller_verbatim: pair.conseiller_verbatim,
          llm_reasoning: openaiResult.y_reasoning,
          annotator1: 'Manuel',
          annotator2: 'OpenAI GPT-4',
        },
      };
    });
  }
  
  /**
   * Filtre uniquement les désaccords pour résolution
   */
  static getDisagreements(results: TVValidationResultCore[]): TVValidationResultCore[] {
    return results.filter(r => !r.correct);
  }
  
  /**
   * Calcule les métriques pour ConfusionMatrixPanel
   */
  static calculateMetrics(results: TVValidationResultCore[]): ClassificationMetrics {
    const total = results.length;
    const correct = results.filter(r => r.correct).length;
    const accuracy = correct / total;
    
    // Matrice de confusion
    const confusionMatrix: Record<string, Record<string, number>> = {};
    results.forEach(r => {
      if (!confusionMatrix[r.goldStandard]) confusionMatrix[r.goldStandard] = {};
      if (!confusionMatrix[r.goldStandard][r.predicted]) {
        confusionMatrix[r.goldStandard][r.predicted] = 0;
      }
      confusionMatrix[r.goldStandard][r.predicted]++;
    });
    
    // Calculer precision, recall, F1 par tag
    const tags = [...new Set([...results.map(r => r.goldStandard), ...results.map(r => r.predicted)])];
    const precision: Record<string, number> = {};
    const recall: Record<string, number> = {};
    const f1Score: Record<string, number> = {};
    
    tags.forEach(tag => {
      const tp = confusionMatrix[tag]?.[tag] || 0;
      const fp = Object.keys(confusionMatrix).reduce((sum, goldTag) => {
        return goldTag !== tag ? sum + (confusionMatrix[goldTag][tag] || 0) : sum;
      }, 0);
      const fn = Object.keys(confusionMatrix[tag] || {}).reduce((sum, predTag) => {
        return predTag !== tag ? sum + confusionMatrix[tag][predTag] : sum;
      }, 0);
      
      precision[tag] = tp / (tp + fp) || 0;
      recall[tag] = tp / (tp + fn) || 0;
      f1Score[tag] = 2 * (precision[tag] * recall[tag]) / (precision[tag] + recall[tag]) || 0;
    });
    
    return {
      accuracy,
      precision,
      recall,
      f1Score,
      confusionMatrix,
      avgProcessingTime: 0,  // Non applicable pour Level 0
      avgConfidence: results.reduce((sum, r) => sum + (r.confidence || 0), 0) / total,
    };
  }
}
```

---

## 📋 Composants Level 0 simplifiés

### Level0Interface.tsx (orchestrateur)

```typescript
import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { ResultsPanel } from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/ResultsPanel';
import { ConfusionMatrixPanel } from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ConfusionMatrixPanel';
import { ErrorAnalysisPanel } from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ErrorAnalysisPanel';
import { AnnotationLauncher } from './AnnotationLauncher';
import { DisagreementResolver } from './DisagreementResolver';
import { GoldStandardValidator } from './GoldStandardValidator';

import { Level0ToTVAdapter } from '../../domain/adapters/Level0ToTVAdapter';
import { OpenAIAnnotatorService } from '../../domain/services/OpenAIAnnotatorService';
import { KappaCalculationService } from '../../domain/services/KappaCalculationService';

export const Level0Interface: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [openaiResults, setOpenaiResults] = useState<OpenAIAnnotationResult[]>([]);
  const [analysisPairs, setAnalysisPairs] = useState<AnalysisPair[]>([]);
  
  // Adapter les résultats pour les composants Level 1
  const xResults = Level0ToTVAdapter.adaptXResults(analysisPairs, openaiResults);
  const yResults = Level0ToTVAdapter.adaptYResults(analysisPairs, openaiResults);
  
  const xMetrics = Level0ToTVAdapter.calculateMetrics(xResults);
  const yMetrics = Level0ToTVAdapter.calculateMetrics(yResults);
  
  const xDisagreements = Level0ToTVAdapter.getDisagreements(xResults);
  const yDisagreements = Level0ToTVAdapter.getDisagreements(yResults);
  
  const handleAnnotationComplete = (results: OpenAIAnnotationResult[]) => {
    setOpenaiResults(results);
  };
  
  return (
    <Box>
      <Typography variant="h4">Level 0: Gold Standard - Contre-Annotation LLM</Typography>
      
      <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)}>
        <Tab label="1. Lancer Annotation" />
        <Tab label="2. Comparaison X" disabled={!openaiResults.length} />
        <Tab label="3. Comparaison Y" disabled={!openaiResults.length} />
        <Tab label="4. Métriques Kappa" disabled={!openaiResults.length} />
        <Tab label="5. Résolution" disabled={!xDisagreements.length && !yDisagreements.length} />
        <Tab label="6. Validation" />
      </Tabs>
      
      {/* Onglet 1: Lancement */}
      {currentTab === 0 && (
        <AnnotationLauncher onComplete={handleAnnotationComplete} />
      )}
      
      {/* Onglet 2: Comparaison X */}
      {currentTab === 1 && (
        <Box mt={2}>
          <Typography variant="h6">Comparaison Variable X (Stratégie Conseiller)</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Gold = Annotation manuelle | Predicted = OpenAI GPT-4
          </Typography>
          <ResultsPanel
            results={xResults}
            initialPageSize={20}
            targetKind="X"
            classifierLabel="OpenAI GPT-4 (Annotateur 2)"
          />
        </Box>
      )}
      
      {/* Onglet 3: Comparaison Y */}
      {currentTab === 2 && (
        <Box mt={2}>
          <Typography variant="h6">Comparaison Variable Y (Réaction Client)</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Gold = Annotation manuelle | Predicted = OpenAI GPT-4
          </Typography>
          <ResultsPanel
            results={yResults}
            initialPageSize={20}
            targetKind="Y"
            classifierLabel="OpenAI GPT-4 (Annotateur 2)"
          />
        </Box>
      )}
      
      {/* Onglet 4: Métriques */}
      {currentTab === 3 && (
        <Box mt={2}>
          <Typography variant="h6" mb={2}>Métriques Cohen's Kappa</Typography>
          
          <Box mb={4}>
            <Typography variant="subtitle1">Variable X (Stratégie)</Typography>
            <Typography>Kappa: {xMetrics.kappa?.toFixed(3)}</Typography>
            <Typography>Accuracy: {(xMetrics.accuracy * 100).toFixed(2)}%</Typography>
            <ConfusionMatrixPanel metrics={xMetrics} />
          </Box>
          
          <Box>
            <Typography variant="subtitle1">Variable Y (Réaction)</Typography>
            <Typography>Kappa: {yMetrics.kappa?.toFixed(3)}</Typography>
            <Typography>Accuracy: {(yMetrics.accuracy * 100).toFixed(2)}%</Typography>
            <ConfusionMatrixPanel metrics={yMetrics} />
          </Box>
        </Box>
      )}
      
      {/* Onglet 5: Résolution */}
      {currentTab === 4 && (
        <DisagreementResolver
          xDisagreements={xDisagreements}
          yDisagreements={yDisagreements}
          onResolve={handleResolve}
        />
      )}
      
      {/* Onglet 6: Validation */}
      {currentTab === 5 && (
        <GoldStandardValidator
          totalPairs={analysisPairs.length}
          xDisagreements={xDisagreements.length}
          yDisagreements={yDisagreements.length}
          onValidate={handleFinalValidation}
        />
      )}
    </Box>
  );
};
```

### DisagreementResolver.tsx (résolution désaccords)

```typescript
import React, { useState } from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { AnalysisPairContext } from '@/features/shared/ui/components/AnalysisPairContext';
import { QuickTagEditDialog } from '@/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/components/QuickTagEditDialog';

interface DisagreementResolverProps {
  xDisagreements: TVValidationResultCore[];
  yDisagreements: TVValidationResultCore[];
  onResolve: (pairId: number, variable: 'X' | 'Y', resolvedTag: string) => void;
}

export const DisagreementResolver: React.FC<DisagreementResolverProps> = ({
  xDisagreements,
  yDisagreements,
  onResolve,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentDisagreement, setCurrentDisagreement] = useState<TVValidationResultCore | null>(null);
  const [currentVariable, setCurrentVariable] = useState<'X' | 'Y'>('X');
  
  const handleOpenEdit = (disagreement: TVValidationResultCore, variable: 'X' | 'Y') => {
    setCurrentDisagreement(disagreement);
    setCurrentVariable(variable);
    setEditDialogOpen(true);
  };
  
  const handleAdoptLLM = (disagreement: TVValidationResultCore, variable: 'X' | 'Y') => {
    onResolve(disagreement.metadata.pairId, variable, disagreement.predicted);
  };
  
  return (
    <Box mt={2}>
      <Typography variant="h6">Résolution des Désaccords</Typography>
      
      {/* Désaccords X */}
      {xDisagreements.length > 0 && (
        <Box mb={4}>
          <Typography variant="subtitle1" color="primary" mb={2}>
            Variable X - {xDisagreements.length} désaccords
          </Typography>
          {xDisagreements.map((disagreement, index) => (
            <Box key={index} mb={3} p={2} border="1px solid #ddd" borderRadius={2}>
              {/* Affichage du contexte avec le composant réutilisable */}
              <AnalysisPairContext pairId={disagreement.metadata.pairId} />
              
              {/* Affichage des annotations */}
              <Stack direction="row" spacing={2} mt={2} alignItems="center">
                <Typography>
                  <strong>Annotation manuelle:</strong> {disagreement.goldStandard}
                </Typography>
                <Typography>
                  <strong>Annotation LLM:</strong> {disagreement.predicted} ({(disagreement.confidence * 100).toFixed(0)}%)
                </Typography>
              </Stack>
              
              {/* Raisonnement LLM */}
              {disagreement.metadata.llm_reasoning && (
                <Typography variant="body2" color="text.secondary" mt={1}>
                  <em>Raisonnement LLM:</em> {disagreement.metadata.llm_reasoning}
                </Typography>
              )}
              
              {/* Boutons de résolution */}
              <Stack direction="row" spacing={2} mt={2}>
                <Button variant="outlined" onClick={() => handleOpenEdit(disagreement, 'X')}>
                  Éditer manuellement
                </Button>
                <Button variant="contained" onClick={() => handleAdoptLLM(disagreement, 'X')}>
                  Adopter suggestion LLM
                </Button>
                <Button variant="outlined" color="secondary">
                  Marquer comme ambiguë
                </Button>
              </Stack>
            </Box>
          ))}
        </Box>
      )}
      
      {/* Désaccords Y (même structure) */}
      {yDisagreements.length > 0 && (
        <Box>
          <Typography variant="subtitle1" color="primary" mb={2}>
            Variable Y - {yDisagreements.length} désaccords
          </Typography>
          {/* Même structure que X */}
        </Box>
      )}
      
      {/* Dialog d'édition réutilisé */}
      {currentDisagreement && (
        <QuickTagEditDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          turnId={currentDisagreement.metadata.turnId}
          pairId={currentDisagreement.metadata.pairId}
          currentTag={currentDisagreement.goldStandard}
          speaker={currentVariable === 'X' ? 'conseiller' : 'client'}
          verbatim={currentDisagreement.verbatim}
          onSuccess={() => {
            setEditDialogOpen(false);
            // Callback pour refresh
          }}
        />
      )}
    </Box>
  );
};
```

---

## 📊 Résumé des bénéfices

| Composant réutilisé | Gain | Effort économisé |
|---------------------|------|------------------|
| `ResultsPanel` | Affichage tableau complet avec pagination, filtres | ~4h développement |
| `AnalysisPairContext` | Contexte prev3→next3, toggle, fetch auto | ~3h développement |
| `QuickTagEditDialog` | Édition tags avec sync turntagged/analysis_pairs | ~2h développement |
| `ConfusionMatrixPanel` | Matrice de confusion avec heatmap | ~2h développement |
| `ErrorAnalysisPanel` | Analyse erreurs par catégorie | ~1h développement |
| **TOTAL** | | **~12h économisées** |

---

## ✅ Plan d'action révisé

### Session 1 (2-3h) - Services métier

- [ ] Créer `OpenAIAnnotatorService.ts`
- [ ] Créer `KappaCalculationService.ts`
- [ ] Créer `Level0ToTVAdapter.ts` ⭐ **CLÉ**
- [ ] Tester sur 10 paires échantillon

### Session 2 (2-3h) - Interface UI

- [ ] Créer `Level0Interface.tsx` (orchestrateur)
- [ ] Créer `AnnotationLauncher.tsx` (bouton + progress)
- [ ] Créer `DisagreementResolver.tsx` (réutilise composants)
- [ ] Créer `GoldStandardValidator.tsx` (bouton final)

### Session 3 (2h) - Annotation complète

- [ ] Annoter 901 paires avec OpenAI
- [ ] Calculer Kappa
- [ ] Afficher dans `ResultsPanel` ✅
- [ ] Identifier désaccords

### Session 4 (1-2h) - Résolution et validation

- [ ] Résoudre désaccords avec `QuickTagEditDialog` ✅
- [ ] Appliquer consensus → `level0_gold_*`
- [ ] Vérifier cohérence

---

## 🎯 Points clés à retenir

1. **Ne PAS recréer** les composants d'affichage
2. **Adapter les données** avec `Level0ToTVAdapter`
3. **Réutiliser** `ResultsPanel`, `AnalysisPairContext`, `QuickTagEditDialog`
4. **Focus sur** la logique métier (OpenAI, Kappa)
5. **Économie** : ~12h de développement UI

---

*Intégration parfaite avec l'existant = mission plus rapide et code plus maintenable* ✅
