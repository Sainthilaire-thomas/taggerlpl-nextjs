# 🏗️ ARCHITECTURE CIBLE : Algorithmes avec analysis_pairs

**Date** : 21 novembre 2025  
**Statut** : 🔄 En cours de migration  
**Base de données** : `analysis_pairs` (901 paires)

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble des 3 niveaux](#vue-densemble-des-3-niveaux)
2. [Architecture technique](#architecture-technique)
3. [Les 5 types d'algorithmes](#les-5-types-dalgorithmes)
4. [Flux d'exécution détaillé](#flux-dexécution-détaillé)
5. [Système de samples (mapH2ToGoldStandard)](#système-de-samples)
6. [Filtrage et préparation des inputs](#filtrage-et-préparation)
7. [Types et interfaces](#types-et-interfaces)
8. [État actuel de la migration](#état-actuel-migration)

---

## 🎯 VUE D'ENSEMBLE DES 3 NIVEAUX

### Level 0 : Gold Standard (Référence absolue)

**Rôle** : Créer la vérité de référence

**Processus** :
- Double annotation (2 annotateurs indépendants)
- Calcul accord inter-annotateur (Cohen's Kappa)
- Résolution des désaccords
- Validation par expert

**Colonnes DB** :
```sql
level0_gold_conseiller       -- Tag consensuel conseiller
level0_gold_client           -- Tag consensuel client
level0_annotator_agreement   -- Score Cohen's Kappa
level0_validated_at          -- Date validation
```

**État** : ✅ Fait (901 paires annotées manuellement)

---

### Level 1 : Validation Algorithmique (En cours)

**Rôle** : Développer et valider les algorithmes

**Question** : "Nos algorithmes X et Y reproduisent-ils les annotations humaines ?"

**Processus** :
1. Tester différentes versions d'algorithmes
2. Comparer prédictions vs gold standard
3. Calculer métriques (accuracy, precision, recall, F1)
4. Itérer jusqu'à performance satisfaisante

**Colonnes DB** :
```sql
-- Algorithme X (conseiller)
x_predicted_tag              -- Prédiction
x_confidence                 -- Score confiance
x_algorithm_key              -- Nom algorithme
x_algorithm_version          -- Version
x_computed_at                -- Date calcul

-- Algorithme Y (client)
y_predicted_tag, y_confidence, ...

-- Médiateurs M1, M2, M3
m1_verb_density, m2_lexical_alignment, m3_cognitive_score, ...
```

**État** : 🔄 En cours (Phase 4)

---

### Level 2 : Test des Hypothèses Scientifiques

**Rôle** : Valider les hypothèses H1 et H2 de la thèse

**H1** : La réaction client est prévisible en fonction de la stratégie conseiller

```
X (stratégie) → Y (réaction)
```

**H2** : Cette relation est médiée par M1, M2, M3

```
X (stratégie) → M1, M2, M3 (médiateurs) → Y (réaction)
              ↘                        ↗
                  Effet direct résiduel
```

**Analyses** :
- Corrélations de Pearson
- Tests Chi-carré
- ANOVA
- Analyse de médiation

**État** : ⏳ À venir (nécessite Level 1 complet)

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Structure des Dossiers

```
src/
├── features/phase3-analysis/level1-validation/
│   │
│   ├── algorithms/                         # Les algorithmes
│   │   ├── classifiers/
│   │   │   ├── client/
│   │   │   │   └── RegexClientClassifier.ts      (Y)
│   │   │   └── conseiller/
│   │   │       ├── RegexConseillerClassifier.ts  (X)
│   │   │       ├── OpenAIConseillerClassifier.ts (X)
│   │   │       └── MistralConseillerClassifier.ts(X)
│   │   │
│   │   ├── mediators/
│   │   │   ├── M1Algorithms/
│   │   │   │   └── M1ActionVerbCounter.ts        (M1)
│   │   │   ├── M2Algorithms/
│   │   │   │   ├── M2LexicalAlignmentCalculator.ts
│   │   │   │   ├── M2SemanticAlignmentCalculator.ts
│   │   │   │   └── M2CompositeAlignmentCalculator.ts (M2)
│   │   │   └── M3Algorithms/
│   │   │       └── PausesM3Calculator.ts         (M3)
│   │   │
│   │   └── shared/
│   │       ├── BaseClassifier.ts
│   │       └── AlgorithmRegistry.ts
│   │
│   └── ui/
│       ├── hooks/
│       │   ├── useLevel1Testing.ts         ⭐ HOOK PRINCIPAL
│       │   ├── useAnalysisPairs.ts         (Lecture analysis_pairs)
│       │   └── normalizeUniversalToTV.ts   (Normalisation)
│       │
│       └── components/
│           └── AlgorithmLab/
│
├── types/algorithm-lab/                    # Types centralisés
│   ├── configs/
│   │   └── algorithmConfigs.ts             (Configurations algos)
│   ├── utils/
│   │   ├── corpusFilters.ts                (Filtrage samples)
│   │   └── inputPreparation.ts             (Préparation inputs)
│   └── ThesisVariables.*.ts                (Types M1, M2, M3)
│
└── app/(protected)/analysis/               # Ancienne architecture
    └── components/AlgorithmLab/            (En cours de dépréciation)
```

---

## 📊 LES 5 TYPES D'ALGORITHMES

### Tableau Récapitulatif

| Type | Cible | Input | Output | Colonnes DB |
|------|-------|-------|--------|-------------|
| **X** | Conseiller | `string` (verbatim) | ENGAGEMENT, OUVERTURE, REFLET_*, EXPLICATION | `x_predicted_tag`, `x_confidence` |
| **Y** | Client | `string` (verbatim) | CLIENT_POSITIF, CLIENT_NEUTRE, CLIENT_NEGATIF | `y_predicted_tag`, `y_confidence` |
| **M1** | Médiation | `string` (verbatim conseiller) | Densité verbes d'action | `m1_verb_density`, `m1_verb_count` |
| **M2** | Médiation | `M2Input` ({t0, t1}) | Alignement linguistique | `m2_lexical_alignment`, `m2_global_alignment` |
| **M3** | Médiation | `string` (verbatim client) | Charge cognitive | `m3_cognitive_score`, `m3_hesitation_count` |

### Détails par Type

#### X - Classification Conseiller

**Input** : `string` (verbatim conseiller)
```typescript
"je vais vérifier votre dossier"
```

**Output** : `UniversalResult`
```typescript
{
  prediction: "ENGAGEMENT",
  confidence: 0.85,
  metadata: {
    details: {
      family: "ACTION",
      matchedPatterns: ["verbe_action"],
      rationale: "Verbe d'action 'vérifier' + pronom 'je'"
    }
  }
}
```

**Algorithmes disponibles** :
- `RegexXClassifier` : Règles regex
- `OpenAIXClassifier` : GPT-4
- `MistralXClassifier` : Mistral

---

#### Y - Classification Client

**Input** : `string` (verbatim client)
```typescript
"d'accord merci beaucoup"
```

**Output** : `UniversalResult`
```typescript
{
  prediction: "CLIENT_POSITIF",
  confidence: 0.92,
  metadata: {
    details: {
      cues: ["accord", "remerciement"],
      sentimentProxy: "positive"
    }
  }
}
```

**Algorithmes disponibles** :
- `RegexYClassifier` : Règles regex

---

#### M1 - Densité de Verbes d'Action

**Input** : `string` (verbatim conseiller)
```typescript
"je vais vérifier votre dossier et traiter votre demande"
```

**Output** : `UniversalResult`
```typescript
{
  prediction: "FORTE_DENSITÉ",
  confidence: 0.75,
  metadata: {
    m1_verb_density: 0.25,        // 2 verbes / 8 mots
    m1_verb_count: 2,             // vérifier, traiter
    m1_total_words: 8,
    m1_action_verbs: ["vérifier", "traiter"]
  }
}
```

---

#### M2 - Alignement Linguistique

**Input** : `M2Input` (paire complète)
```typescript
interface M2Input {
  t0: string;  // Tour conseiller
  t1: string;  // Tour client
}

// Exemple
{
  t0: "je vais traiter votre demande",
  t1: "d'accord pour le traitement"
}
```

**Output** : `UniversalResult`
```typescript
{
  prediction: "ALIGNEMENT_FORT",
  confidence: 0.68,
  metadata: {
    m2_lexical_alignment: 0.5,    // Jaccard
    m2_semantic_alignment: 0.8,   // Patterns
    m2_global_alignment: 0.68,    // Composite
    m2_shared_terms: ["traiter", "demande"]
  }
}
```

**Algorithmes disponibles** :
- `M2LexicalAlignment` : Score Jaccard
- `M2SemanticAlignment` : Patterns FR
- `M2CompositeAlignment` : Fusion des deux

---

#### M3 - Charge Cognitive

**Input** : `string` (verbatim client)
```typescript
"euh... je... comment dire... c'est compliqué"
```

**Output** : `UniversalResult`
```typescript
{
  prediction: "CHARGE_ELEVEE",
  confidence: 0.85,
  metadata: {
    m3_hesitation_count: 3,       // euh, je, comment dire
    m3_clarification_count: 0,
    m3_cognitive_score: 0.75,
    m3_cognitive_load: "ELEVEE",
    m3_patterns: ["hesitation_repetee"]
  }
}
```

---

## 🔄 FLUX D'EXÉCUTION DÉTAILLÉ

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│ 1. CHARGEMENT DONNÉES                                   │
│    useAnalysisPairs() → 901 paires depuis DB            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CONVERSION SAMPLES                                   │
│    mapH2ToGoldStandard() → 2703 samples                 │
│    (901 × 3 : conseiller + client + M2)                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. FILTRAGE                                             │
│    filterCorpusForAlgorithm() → Selon target           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. PRÉPARATION INPUTS                                   │
│    prepareInputsForAlgorithm() → Format attendu        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. EXÉCUTION                                            │
│    classifier.run(input) → UniversalResult              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 6. NORMALISATION                                        │
│    normalizeUniversalToTV() → TVValidationResult        │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 7. ÉCRITURE DB                                          │
│    updateH2WithResults() → analysis_pairs               │
└─────────────────────────────────────────────────────────┘
```

---

## 🎲 SYSTÈME DE SAMPLES (mapH2ToGoldStandard)

### Principe : 3 Samples par Paire

Chaque paire dans `analysis_pairs` génère **3 samples** :

1. **Sample CONSEILLER** (target: 'conseiller') → Pour X, M1
2. **Sample CLIENT** (target: 'client') → Pour Y, M3  
3. **Sample M2** (target: 'M2') → Pour M2 uniquement

**Pourquoi 3 samples ?**
- Les algorithmes ont des besoins différents
- M2 nécessite les DEUX verbatims (conseiller + client)
- Le filtrage se fait sur `metadata.target`

### Code : mapH2ToGoldStandard

```typescript
const mapH2ToGoldStandard = useCallback(
  (pairs: AnalysisPair[]): GoldStandardSample[] => {
    const samples: GoldStandardSample[] = [];
    
    pairs.forEach(pair => {
      // 1️⃣ SAMPLE CONSEILLER
      samples.push({
        verbatim: pair.conseiller_verbatim,
        expectedTag: normalizeXLabelStrict(pair.strategy_tag),
        metadata: {
          target: 'conseiller',  // ⭐ Clé de filtrage
          pairId: pair.pair_id,
          callId: pair.call_id,
          turnId: pair.conseiller_turn_id,
          // Contexte
          client_verbatim: pair.client_verbatim,
          prev2_turn_verbatim: pair.prev2_verbatim,
          prev1_turn_verbatim: pair.prev1_verbatim,
          next1_turn_verbatim: pair.next1_verbatim,
          // ...
        }
      });
      
      // 2️⃣ SAMPLE CLIENT
      samples.push({
        verbatim: pair.client_verbatim,
        expectedTag: pair.reaction_tag,
        metadata: {
          target: 'client',      // ⭐ Clé de filtrage
          pairId: pair.pair_id,
          callId: pair.call_id,
          turnId: pair.client_turn_id,
          // Contexte
          conseiller_verbatim: pair.conseiller_verbatim,
          // ...
        }
      });

      // 3️⃣ SAMPLE M2 (PAIRE COMPLÈTE)
      samples.push({
        verbatim: pair.conseiller_verbatim,
        expectedTag: normalizeXLabelStrict(pair.strategy_tag),
        metadata: {
          target: 'M2' as any,   // ⭐ Clé de filtrage M2
          pairId: pair.pair_id,
          // 🎯 CRUCIAL : Les deux verbatims
          t0: pair.conseiller_verbatim,
          t1: pair.client_verbatim,
          // Aussi pour compatibilité
          conseiller_verbatim: pair.conseiller_verbatim,
          client_verbatim: pair.client_verbatim,
          // ...
        }
      });
    });
    
    return samples;  // 901 × 3 = 2703 samples
  },
  []
);
```

### Résultat

**Input** : 901 paires  
**Output** : 2703 samples

- 901 samples avec `target: 'conseiller'` (pour X, M1)
- 901 samples avec `target: 'client'` (pour Y, M3)
- 901 samples avec `target: 'M2'` (pour M2)

---

## 🔍 FILTRAGE ET PRÉPARATION

### Étape 1 : Filtrage par Target

**Fichier** : `src/types/algorithm-lab/utils/corpusFilters.ts`

```typescript
export const filterCorpusForAlgorithm = (
  goldStandardData: TVGoldStandardSample[],
  algorithmName: string
): TVGoldStandardSample[] => {
  const config = ALGORITHM_CONFIGS[algorithmName];
  
  return goldStandardData.filter((sample) => {
    // Filtrage par speakerType
    if (config.speakerType === "conseiller") {
      return sample.metadata?.target === "conseiller";
    }
    else if (config.speakerType === "client") {
      return sample.metadata?.target === "client";
    }
    else if (config.speakerType === "M2") {
      return sample.metadata?.target === "M2";
    }
    // ...
  });
};
```

**Exemple** :
```typescript
// Pour RegexXClassifier
filterCorpusForAlgorithm(2703 samples, "RegexXClassifier")
→ Retourne les 901 samples avec target='conseiller'

// Pour RegexYClassifier
filterCorpusForAlgorithm(2703 samples, "RegexYClassifier")
→ Retourne les 901 samples avec target='client'

// Pour M2LexicalAlignment
filterCorpusForAlgorithm(2703 samples, "M2LexicalAlignment")
→ Retourne les 901 samples avec target='M2'
```

---

### Étape 2 : Préparation des Inputs

**Fichier** : `src/types/algorithm-lab/utils/inputPreparation.ts`

```typescript
export const prepareInputsForAlgorithm = (
  samples: TVGoldStandardSample[],
  algorithmName: string
): any[] => {
  const config = ALGORITHM_CONFIGS[algorithmName];
  
  return samples.map(sample => {
    // Pour X et Y : juste le verbatim
    if (config.target === 'X' || config.target === 'Y') {
      return sample.verbatim;
    }
    
    // Pour M1 : verbatim conseiller
    if (config.target === 'M1') {
      return sample.verbatim;
    }
    
    // Pour M2 : objet {t0, t1}
    if (config.target === 'M2') {
      return {
        t0: sample.metadata?.t0 || sample.metadata?.conseiller_verbatim,
        t1: sample.metadata?.t1 || sample.metadata?.client_verbatim
      };
    }
    
    // Pour M3 : verbatim client
    if (config.target === 'M3') {
      return sample.metadata?.client_verbatim || sample.verbatim;
    }
  });
};
```

---

## 📐 TYPES ET INTERFACES

### Types Centralisés

**Fichier** : `src/app/(protected)/analysis/components/AlgorithmLab/types/core/calculations.ts`

```typescript
// Input M2
export interface M2Input {
  t0?: string;              // Tour conseiller
  t1?: string;              // Tour client
  
  // Variantes pour compatibilité
  conseiller_verbatim?: string;
  client_verbatim?: string;
  turnVerbatim?: string;
  nextTurnVerbatim?: string;
  
  // Contexte optionnel
  context?: {
    prevTurn?: string;
    speaker?: string;
    nextSpeaker?: string;
  };
  
  metadata?: {
    turnId?: number;
    callId?: string;
  };
}

// Input M3
export interface M3Input {
  clientTurn: string;
  id?: string | number;
}
```

### Configuration d'Algorithme

**Fichier** : `src/types/algorithm-lab/configs/algorithmConfigs.ts`

```typescript
export const ALGORITHM_CONFIGS: Record<string, AlgorithmConfig> = {
  "RegexXClassifier": {
    target: "X",
    speakerType: "conseiller",
    requiresContext: false
  },
  
  "RegexYClassifier": {
    target: "Y",
    speakerType: "client",
    requiresContext: false
  },
  
  "M1ActionVerbCounter": {
    target: "M1",
    speakerType: "conseiller",
    requiresContext: false
  },
  
  "M2LexicalAlignment": {
    target: "M2",
    speakerType: "M2",          // ⭐ Spécial M2
    requiresContext: true
  },
  
  "M3PausesCalculator": {
    target: "M3",
    speakerType: "client",
    requiresContext: false
  }
};
```

---

## 🚧 ÉTAT ACTUEL MIGRATION

### ✅ Ce qui fonctionne

1. **Table analysis_pairs** : Structure complète (901 paires)
2. **Hook useAnalysisPairs** : Lecture DB opérationnelle
3. **mapH2ToGoldStandard** : Création des 3 samples
4. **normalizeUniversalToTV** : Transmission pairId corrigée
5. **Algorithmes X** : RegexXClassifier fonctionne
6. **Algorithmes Y** : RegexYClassifier fonctionne
7. **Contexte** : prev2, prev1, next1 affichés correctement

### ⚠️ Problèmes en cours

1. **Filtrage M2** : Les samples avec `target: 'M2'` ne sont pas reconnus
   - **Cause** : `filterCorpusForAlgorithm` ne gère peut-être pas le type 'M2'
   - **Solution** : Vérifier et corriger `corpusFilters.ts`

2. **Performance UPDATE** : 901 requêtes individuelles (90 secondes)
   - **Solution proposée** : Bulk upsert (Option B, 30 min)

3. **Algorithmes M3** : Non testés encore

### 🎯 Prochaines étapes

**Priorité 1** : Corriger le filtrage M2
```powershell
# Vérifier corpusFilters.ts
Get-Content "src\types\algorithm-lab\utils\corpusFilters.ts" | Select-String "speakerType.*M2"
```

**Priorité 2** : Implémenter bulk upsert (Option B)
- Remplacer boucle `for` par `.upsert(bulkData)`
- Gain : < 2 secondes au lieu de 90 secondes

**Priorité 3** : Tester M3
- Vérifier que les samples client sont bien filtrés
- Tester PausesM3Calculator

---

## 📝 CHECKLIST MIGRATION COMPLÈTE

### Phase 1 : Infrastructure (✅ Terminée)
- [X] Table `analysis_pairs` créée
- [X] Fonction `refresh_analysis_pairs`
- [X] Workflow automatique TranscriptLPL → analysis_pairs

### Phase 2 : Hooks et Lecture (✅ Terminée)
- [X] `useAnalysisPairs` créé
- [X] `mapH2ToGoldStandard` avec 3 samples
- [X] Transmission `pairId` corrigée
- [X] Contexte (prev/next) transmis

### Phase 3 : Algorithmes X et Y (✅ Terminée)
- [X] RegexXClassifier fonctionnel
- [X] RegexYClassifier fonctionnel
- [X] Affichage résultats avec contexte

### Phase 4 : Médiateurs (🔄 En cours)
- [X] M1 : Architecture samples conseiller
- [ ] M2 : Corriger filtrage `target: 'M2'`  ⚠️ **BLOQUANT**
- [ ] M3 : Tester avec samples client

### Phase 5 : Performance (⏳ À venir)
- [ ] Implémenter bulk upsert
- [ ] Supprimer logs de debug
- [ ] Optimiser requêtes DB

---

**Dernière mise à jour** : 21 novembre 2025 - 00h30  
**Auteur** : Documentation technique complète  
**Statut** : Document de référence architecturale
