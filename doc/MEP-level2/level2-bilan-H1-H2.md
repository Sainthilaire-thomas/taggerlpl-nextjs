# AlgorithmLab Level 2 - Bilan de l'existant et Plan H2

## 📊 Bilan de l'existant : Validation H1

### ✅ Ce qui est implémenté pour H1

Le **Level 2** d'AlgorithmLab dispose actuellement d'une infrastructure pour valider l' **Hypothèse 1 (H1) : Efficacité différentielle des descriptions d'actions** .

#### Structure actuelle Level 2

```
components/Level2/
├── Level2Interface.tsx              # Point d'entrée
├── hypothesis/
│   ├── H2AlignmentValidation.tsx   # 🚧 Hypothèse 2 (à développer)
│   └── H3ApplicationValidation.tsx # 🚧 Hypothèse 3 (à développer)
├── validation/
│   ├── StatisticalSummary.tsx      # Synthèse descriptive
│   └── StatisticalTestsPanel.tsx   # Tests statistiques (ANOVA, t-tests)
├── shared/
│   ├── DataProcessing.ts           # Pipeline traitement données
│   ├── stats.ts                    # Fonctions statistiques partagées
│   └── types.ts                    # Types Level 2
├── config/
│   └── hypotheses.ts               # Configuration hypothèses
└── hooks/
    └── useH1Analysis.ts            # Hook analyse H1
```

#### Fonctionnalités H1 opérationnelles

**1. Tests statistiques implémentés**

* ✅ **Chi-carré** : Validation efficacité différentielle (ENGAGEMENT vs EXPLICATION)
* ✅ **ANOVA** : Comparaison multi-groupes
* ✅ **t-tests** : Comparaisons pairwise avec correction Bonferroni
* ✅ **Intervalles de confiance 95%**
* ✅ **V de Cramér** : Mesure taille d'effet

**2. Métriques calculées**

* ✅ Taux de réactions positives par stratégie
* ✅ Significativité statistique (p-values)
* ✅ Robustesse inter-secteurs
* ✅ Consistance temporelle

**3. Visualisations disponibles**

* ✅ Tableaux récapitulatifs par stratégie
* ✅ Graphiques d'efficacité
* ✅ Tests de robustesse

### 📈 Résultats H1 validés

D'après la thèse, H1 est **PLEINEMENT VALIDÉE** :

| Stratégie            | Réactions positives | Réactions négatives | n   | Significativité |
| --------------------- | -------------------- | --------------------- | --- | ---------------- |
| ENGAGEMENT            | 51,7%                | 24,1%                 | 87  | ***              |
| OUVERTURE             | 56,8%                | 16,1%                 | 81  | ***              |
| **EXPLICATION** | **0,93%**      | **81,3%**       | 107 | ***              |

* **Chi² = 127,43** , p < 0,001
* **V de Cramér = 0,509** (effet fort)
* **IC95% non chevauchants** : robustesse confirmée

---

## 🔬 Plan pour H2 : Mécanismes d'alignement et charge cognitive

### 🎯 Objectif H2

**Hypothèse H2** : La polarité de la réaction immédiate du client dans le tour adjacent est :

* ✅ **Positivement corrélée** à l'alignement linguistique entre tours conseiller-client
* ✅ **Négativement corrélée** aux marqueurs de charge cognitive

### 📐 Dimensions d'analyse H2

#### 1️⃣ Alignement linguistique (3 niveaux)

##### a) Alignement lexical

**Mesure** : Reprises du vocabulaire du conseiller par le client

```typescript
interface LexicalAlignment {
  overlapRatio: number;        // Ratio mots partagés
  lemmaOverlap: number;         // Overlap lemmatisé
  keyTermReuse: string[];       // Termes-clés repris
  alignmentScore: number;       // Score composite [0-1]
}
```

**Algorithme** :

* Tokenisation conseiller/client
* Lemmatisation (verbes, noms)
* Calcul overlap après stop-words
* Détection reprises exactes vs variations

##### b) Alignement sémantique

**Mesure** : Cohérence conceptuelle entre tours adjacents

```typescript
interface SemanticAlignment {
  topicCoherence: number;       // Cohérence thématique
  entityContinuity: number;     // Continuité référentielle
  semanticSimilarity: number;   // Similarité vectorielle
  alignmentScore: number;       // Score composite [0-1]
}
```

**Algorithme** :

* Extraction entités nommées (NER)
* Suivi des coréférences
* Embeddings sémantiques (sentence transformers)
* Calcul similarité cosinus

##### c) Alignement pragmatique

**Mesure** : Pertinence de la réaction du client

```typescript
interface PragmaticAlignment {
  responseRelevance: 'HIGH' | 'MEDIUM' | 'LOW';
  turnTakingFluency: number;    // Fluidité tour de parole
  cooperationMarkers: number;   // Marqueurs coopération
  alignmentScore: number;       // Score composite [0-1]
}
```

**Algorithme** :

* Classification type de question → type de réponse
* Détection marqueurs coopération ("d'accord", "oui", "je vais")
* Analyse latence de réponse

---

#### 2️⃣ Charge cognitive (4 indicateurs)

##### a) Marqueurs d'hésitation

**Mesure** : Pauses remplies et marqueurs d'effort

```typescript
interface HesitationMarkers {
  filledPauses: string[];       // ["euh", "ben", "alors"]
  frequency: number;            // Fréquence par tour
  hesitationRate: number;       // Ratio mots totaux
  cognitiveLoad: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

**Détection** :

* Regex patterns : `/(euh|ben|alors|hein|voilà)/gi`
* Comptage occurrences
* Normalisation par longueur verbatim

##### b) Latences de réponse

**Mesure** : Temps entre fin tour conseiller et début tour client

```typescript
interface ResponseLatency {
  latencyMs: number;            // Temps en millisecondes
  category: 'FAST' | 'NORMAL' | 'SLOW';
  processingType: 'AUTOMATIC' | 'EFFORTFUL';
}
```

**Seuils** :

* **< 400ms** : Traitement automatique (simulation motrice)
* **400-800ms** : Traitement normal
* **> 800ms** : Traitement coûteux (charge cognitive élevée)

##### c) Demandes de clarification

**Mesure** : Questions explicites de compréhension

```typescript
interface ClarificationRequests {
  count: number;
  examples: string[];           // ["comment ça ?", "que voulez-vous dire ?"]
  clarificationType: 'LEXICAL' | 'SEMANTIC' | 'PRAGMATIC';
  cognitiveLoad: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

**Détection** :

* Patterns : `/(comment|quoi|pardon|c'est-à-dire|je ne comprends)/gi`
* Classification par type

##### d) Variations prosodiques

**Mesure** : Stress vocal et intonation (si audio disponible)

```typescript
interface ProsodicVariation {
  f0Mean: number;               // Fréquence fondamentale moyenne
  f0Variance: number;           // Variance F0
  intensityMean: number;        // Intensité moyenne
  speechRate: number;           // Débit syllabique
  stressLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

---

### 🏗️ Architecture technique H2

#### Composants à créer

```typescript
// 1. Hook d'analyse H2
export function useH2Analysis(pairs: TurnPair[]) {
  // Calcul alignement + charge cognitive
  // Corrélations avec réactions CLIENT
  // Tests de significativité
}

// 2. Composant principal
export function H2AlignmentValidation() {
  const h2Results = useH2Analysis(turnPairs);
  
  return (
    <Box>
      <AlignmentAnalysisPanel results={h2Results.alignment} />
      <CognitiveLoadPanel results={h2Results.cognitiveLoad} />
      <CorrelationMatrix data={h2Results.correlations} />
      <ValidationSummary tests={h2Results.statisticalTests} />
    </Box>
  );
}

// 3. Sous-composants
<AlignmentAnalysisPanel />    // Visualisation alignement 3 niveaux
<CognitiveLoadPanel />         // Marqueurs charge cognitive
<CorrelationMatrix />          // Matrice corrélations alignement↔réactions
<ValidationSummary />          // Synthèse validation H2
```

---

### 📊 Prédictions testables H2

#### H2.1 - Alignement multidimensionnel

**Prédiction** : ENGAGEMENT/OUVERTURE > EXPLICATION sur les 3 niveaux d'alignement

| Stratégie  | Alignement lexical | Alignement sémantique | Alignement pragmatique |
| ----------- | ------------------ | ---------------------- | ---------------------- |
| ENGAGEMENT  | **Élevé**  | **Élevé**      | **Élevé**      |
| OUVERTURE   | **Élevé**  | **Élevé**      | **Élevé**      |
| EXPLICATION | Faible             | Faible                 | Faible                 |

**Test** : ANOVA + post-hoc Tukey, seuil p < 0.05

#### H2.2 - Convergence temporelle

**Prédiction** : Latences courtes (<400ms) pour actions vs longues (>800ms) pour explications

| Stratégie  | Latence moyenne   | Type de traitement |
| ----------- | ----------------- | ------------------ |
| ENGAGEMENT  | **< 400ms** | Automatique        |
| OUVERTURE   | **< 400ms** | Automatique        |
| EXPLICATION | **> 800ms** | Effortful          |

**Test** : t-test latences ACTIONS vs EXPLICATIONS

#### H2.3 - Charge cognitive inversée

**Prédiction** : Marqueurs d'effort élevés pour EXPLICATION vs faibles pour ENGAGEMENT/OUVERTURE

| Indicateur     | ENGAGEMENT/OUVERTURE | EXPLICATION       |
| -------------- | -------------------- | ----------------- |
| Hésitations   | **< 10%**      | **> 30%**   |
| Clarifications | **< 5%**       | **> 25%**   |
| Latence        | **< 400ms**    | **> 800ms** |

**Test** : Chi² + Risque Relatif (RR)

#### H2.4 - Corrélation croisée

**Prédiction** : Corrélation positive alignement↔CLIENT_POSITIF, négative charge↔CLIENT_NEGATIF

| Corrélation                         | Coefficient Pearson attendu | Significativité |
| ------------------------------------ | --------------------------- | ---------------- |
| Alignement lexical ↔ CLIENT_POSITIF | **r > 0.60**          | p < 0.001        |
| Charge cognitive ↔ CLIENT_NEGATIF   | **r > 0.55**          | p < 0.001        |

**Test** : Corrélations de Pearson + tests de significativité

---

## 🛠️ Ce qui manque dans le code

### 1. **Algorithmes d'alignement**

```typescript
// À créer dans algorithms/level2/alignment/

export class LexicalAlignmentCalculator extends BaseAlgorithm {
  async run(input: TurnPair): Promise<LexicalAlignment> {
    // Tokenisation + lemmatisation
    // Calcul overlap
    // Score composite
  }
}

export class SemanticAlignmentCalculator extends BaseAlgorithm {
  async run(input: TurnPair): Promise<SemanticAlignment> {
    // NER + coréférences
    // Embeddings sémantiques
    // Similarité cosinus
  }
}

export class PragmaticAlignmentCalculator extends BaseAlgorithm {
  async run(input: TurnPair): Promise<PragmaticAlignment> {
    // Classification question/réponse
    // Détection coopération
    // Latence réponse
  }
}
```

### 2. **Analyseurs charge cognitive**

```typescript
// À créer dans algorithms/level2/cognitive/

export class HesitationAnalyzer extends BaseAlgorithm {
  async run(input: Turn): Promise<HesitationMarkers> {
    // Détection pauses remplies
    // Calcul fréquence
  }
}

export class LatencyAnalyzer extends BaseAlgorithm {
  async run(input: TurnPair): Promise<ResponseLatency> {
    // Calcul latence end_time → start_time
    // Catégorisation
  }
}

export class ClarificationDetector extends BaseAlgorithm {
  async run(input: Turn): Promise<ClarificationRequests> {
    // Patterns clarification
    // Classification type
  }
}
```

### 3. **Composants UI Level 2**

```typescript
// À créer dans components/Level2/hypothesis/

// Panels d'analyse
<AlignmentAnalysisPanel />
<CognitiveLoadPanel />
<CorrelationMatrix />

// Visualisations
<AlignmentHeatmap />
<CognitiveLoadChart />
<ScatterPlotCorrelation />
```

### 4. **Pipeline de traitement**

```typescript
// À créer dans components/Level2/shared/

export async function processH2Analysis(
  turnPairs: TurnPair[]
): Promise<H2Results> {
  // 1. Calcul alignement pour chaque paire
  // 2. Calcul charge cognitive pour chaque tour client
  // 3. Corrélations avec réactions CLIENT
  // 4. Tests statistiques
  // 5. Validation hypothèses
}
```

### 5. **Types TypeScript**

```typescript
// À ajouter dans types/core/level2.ts

export interface TurnPair {
  conseillerTurn: Turn;
  clientTurn: Turn;
  latencyMs: number;
}

export interface H2Results {
  alignment: AlignmentResults;
  cognitiveLoad: CognitiveLoadResults;
  correlations: CorrelationMatrix;
  validation: H2ValidationSummary;
}

export interface AlignmentResults {
  lexical: LexicalAlignment[];
  semantic: SemanticAlignment[];
  pragmatic: PragmaticAlignment[];
  averageScores: {
    byStrategy: Map<string, number>;
    global: number;
  };
}

export interface CognitiveLoadResults {
  hesitation: HesitationMarkers[];
  latency: ResponseLatency[];
  clarification: ClarificationRequests[];
  averageLoad: {
    byStrategy: Map<string, number>;
    global: number;
  };
}
```

---

## 🎯 Plan d'implémentation prioritaire

### Phase 1 : Infrastructure de base (Semaine 1-2)

1. ✅ Créer types TypeScript H2
2. ✅ Pipeline `processH2Analysis()`
3. ✅ Hook `useH2Analysis()`

### Phase 2 : Algorithmes alignement (Semaine 3-4)

1. ✅ `LexicalAlignmentCalculator`
2. ✅ `SemanticAlignmentCalculator`
3. ✅ `PragmaticAlignmentCalculator`
4. ✅ Tests unitaires

### Phase 3 : Analyseurs cognitifs (Semaine 5-6)

1. ✅ `HesitationAnalyzer`
2. ✅ `LatencyAnalyzer`
3. ✅ `ClarificationDetector`
4. ✅ Tests unitaires

### Phase 4 : UI et visualisations (Semaine 7-8)

1. ✅ Composant `H2AlignmentValidation.tsx`
2. ✅ Panels d'analyse
3. ✅ Graphiques et matrices
4. ✅ Integration Level2Interface

### Phase 5 : Validation statistique (Semaine 9-10)

1. ✅ Tests corrélations Pearson
2. ✅ ANOVA alignement par stratégie
3. ✅ Tests charge cognitive
4. ✅ Rapport validation H2

---

## 📚 Ressources théoriques nécessaires

### Alignement linguistique

* Pickering & Garrod (2004) - Interactive Alignment Model
* Brennan & Clark (1996) - Conceptual pacts

### Charge cognitive

* Paas & Van Merriënboer (1994) - Cognitive Load Theory
* Sweller (2011) - Cognitive load during problem solving

### Traitement langage action

* Gallese (2007) - Mirror neurons and simulation
* Bergen (2012) - Louder Than Words (embodied cognition)

---

## ✅ Prochaines étapes

1. **Valider architecture H2** avec l'équipe
2. **Spécifier algorithmes** d'alignement et charge cognitive
3. **Implémenter Phase 1** : Types + Pipeline + Hook
4. **Itérer sur algorithmes** avec validation sur corpus test
5. **Intégrer UI** et visualisations
6. **Valider H2** statistiquement

---

*Document créé le 2025-10-01*
*AlgorithmLab v1.0 - Level 2 Scientific Validation*
