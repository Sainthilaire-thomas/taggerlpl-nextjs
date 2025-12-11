# 🎯 Mission : Évolution Interface Level 1 - Affichage des Résultats

**Date** : 10 décembre 2025  
**Statut** : 📋 Spécifications validées - À implémenter  
**Estimation** : 6-8h de développement  

---

## 1. Contexte et Objectifs

### 1.1 Problème actuel

L'interface Level 1 (AlgorithmLab) mélange actuellement :
- La performance intrinsèque des algorithmes
- La prévisualisation Level 2 (H1/H2)

Cela crée une confusion sur ce qu'on évalue et pourquoi.

### 1.2 Objectif

Restructurer l'affichage des résultats de chaque run de test pour clarifier **3 niveaux d'analyse distincts** :

| Niveau | Question | Applicable à |
|--------|----------|--------------|
| **Performance intrinsèque** | L'algorithme calcule-t-il correctement ? | X, Y, M1, M2, M3 |
| **Contribution à H1** | Les prédictions permettent-elles de valider H1 ? | X, Y uniquement |
| **Contribution à H2** | Les calculs contribuent-ils à la médiation ? | X, Y, M1, M2, M3 |

### 1.3 Rappels théoriques

**H1 (validée sur Gold Standard)** : Les stratégies ENGAGEMENT et OUVERTURE génèrent des réactions client positives, EXPLICATION génère des réactions négatives, REFLET est intermédiaire.

**H2 (médiation)** : L'effet X → Y passe par des médiateurs :
- **M1** : Densité de verbes d'action (calculé sur conseiller_verbatim)
- **M2** : Alignement linguistique (calculé sur conseiller + client)
- **M3** : Charge cognitive (calculé sur client_verbatim)

**Médiation** : Si l'effet X → Y diminue quand on contrôle M, alors M est un médiateur. Types : totale, partielle, nulle.

---

## 2. Spécifications Fonctionnelles

### 2.1 Structure d'affichage

```
┌─────────────────────────────────────────────────────────────────────────┐
│  RÉSULTATS DU TEST : [Nom Algorithme] [Version]                         │
│  Target: X | Échantillon: 901 paires | Durée: 3.2s                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ SECTION A : PERFORMANCE INTRINSÈQUE                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ SECTION B : CONTRIBUTION À H1 (si X ou Y uniquement)            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ SECTION C : CONTRIBUTION À H2 (MÉDIATION)                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ SECTION D : DÉCISION                                            │   │
│  │ [REJETER] [INVESTIGUER] [VALIDER]                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 2.2 SECTION A : Performance Intrinsèque

#### 2.2.1 Pour X et Y (avec Gold Standard)

| Élément | Description | Composant |
|---------|-------------|-----------|
| Métriques globales | Accuracy, Kappa, F1 Macro | Chips/Cards |
| Matrice de confusion | Tableau interactif | ConfusionMatrix |
| Précision/Rappel par classe | Tableau détaillé | Table MUI |
| Échantillon d'erreurs | Liste paginée des paires mal classées | ResultsPanel filtré |
| Action | Bouton "Annoter les erreurs" | → investigation_annotations |

**Données affichées** :
```typescript
interface ClassificationMetrics {
  accuracy: number;
  kappa: number;
  f1Macro: number;
  precision: Record<string, number>;  // Par classe
  recall: Record<string, number>;     // Par classe
  confusionMatrix: Record<string, Record<string, number>>;
}
```

#### 2.2.2 Pour M1, M2, M3 (sans Gold Standard)

| Élément | Description | Composant |
|---------|-------------|-----------|
| Distribution globale | Histogramme des valeurs | Recharts BarChart |
| Statistiques descriptives | Min, Max, Moyenne, Médiane, Écart-type | Table |
| Distribution par stratégie X | Moyenne M par ENGAGEMENT/EXPLICATION/REFLET/OUVERTURE | BarChart groupé |
| Échantillon de calculs | Liste paginée avec verbatim + valeur + détail | Table expansible |
| Action | Bouton "Vérifier les calculs" | → investigation_annotations |

**Données affichées** :
```typescript
interface NumericMetrics {
  distribution: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
    histogram: Array<{ bin: string; count: number }>;
  };
  byStrategy: {
    ENGAGEMENT: { mean: number; count: number };
    OUVERTURE: { mean: number; count: number };
    REFLET: { mean: number; count: number };
    EXPLICATION: { mean: number; count: number };
  };
}
```

**Échantillon de calcul M1** (exemple) :

| pair_id | conseiller_verbatim | M1 density | M1 count | Verbes détectés |
|---------|---------------------|------------|----------|-----------------|
| 3440 | "je vais vérifier votre dossier" | 0.20 | 1 | ["vérifier"] |
| 3441 | "c'est la procédure normale" | 0.00 | 0 | [] |

Avec bouton "🔍 Annoter" pour ouvrir investigation_annotations.

---

### 2.3 SECTION B : Contribution à H1

**Visible uniquement si target = X ou Y**

Cette section compare la validation H1 selon 3 sources :
1. **Gold Standard** (référence absolue)
2. **Baseline validée** (dernière version promue)
3. **Ce test** (algorithme en cours d'évaluation)

#### Tableau comparatif

| Critère H1 | Gold Standard | Baseline | Ce test | Évolution |
|------------|---------------|----------|---------|-----------|
| Actions → Positif | 38% | 35% | 32% | ⬇️ -3 pts |
| Actions → Négatif | 28% | 30% | 35% | ⬆️ +5 pts ❌ |
| Explications → Positif | 8% | 10% | 14% | ⬆️ +4 pts ❌ |
| Explications → Négatif | 67% | 65% | 65% | = |
| Écart empirique | +24 pts | +20 pts | +18 pts | ⬇️ -2 pts |
| Chi² p-value | 0.001 | 0.001 | 0.001 | = |
| Cramér's V | 0.28 | 0.25 | 0.24 | ⬇️ -0.01 |
| **Critères validés** | **5/6** | **4/6** | **2/6** | **-2** ❌ |

#### Interprétation automatique

```
⚠️ Cet algorithme dégrade la validation H1 par rapport à la baseline (4/6 → 2/6).
   Les erreurs de classification diluent les différences entre stratégies.
   
💡 Recommandation : Investiguer les erreurs ou rejeter cette version.
```

---

### 2.4 SECTION C : Contribution à H2 (Médiation)

**Visible pour tous les targets** (X, Y, M1, M2, M3)

#### 2.4.1 Vue synthétique

Basée sur les seuils scientifiques (Cohen 1988, Kenny) :

| Médiateur | Effet indirect (a×b) | Sobel p | Verdict | Qualité données |
|-----------|---------------------|---------|---------|-----------------|
| M1 (Verbes) | 0.30 | < 0.001 | ✅ Substantielle | 901/901 |
| M2 (Alignement) | 0.06 | 0.042 | ⚡ Faible | 901/901 |
| M3 (Cognitif) | 0.02 | 0.180 | ❌ Non significatif | 901/901 |

**Légende** :
- ✅ **Substantielle** : effet ≥ 0.25, p < 0.01
- ⚠️ **Partielle** : effet 0.09-0.24, p < 0.05
- ⚡ **Faible** : effet 0.01-0.08, p < 0.10
- ❌ **Nulle** : effet < 0.01 ou p ≥ 0.10

#### 2.4.2 Détail des paths (accordéon dépliable)

Pour chaque médiateur :

```
                    M1 (Verbes d'action)
                  ↗                      ↘
           a = 0.60                    b = 0.50
          (X → M1)                    (M1 → Y)
               ↗                          ↘
    X (Stratégie)                          Y (Réaction)
               ↘                          ↗
                    c' = 0.15
                   (effet direct)
                
Effet total (c) : 0.45
Effet indirect (a × b) : 0.30
% médiation : 67%
Sobel Z : 3.42 (p < 0.001) ✅
Type : Médiation partielle
```

#### 2.4.3 Comparaison avec versions précédentes

Comparaison systématique avec **3 références** :
- **Gold** : Référence absolue (annotations manuelles)
- **Baseline** : Dernière version promue/validée
- **Dernier test** : Test précédent (même non promu)

| Métrique | Gold | Baseline | Dernier test | Ce test | vs Baseline |
|----------|------|----------|--------------|---------|-------------|
| Effet indirect (a×b) | 0.34 | 0.30 | 0.28 | 0.30 | = |
| Path a (X → M1) | 0.65 | 0.60 | 0.58 | 0.60 | = |
| Path b (M1 → Y) | 0.52 | 0.50 | 0.48 | 0.50 | = |
| Sobel p-value | <0.001 | <0.001 | 0.002 | <0.001 | ✅ |
| % médiation | 75% | 67% | 62% | 67% | = |

**Interprétation automatique** :
```
✅ Ce test maintient la contribution de M1 au niveau de la baseline.
   Effet indirect (0.30) = substantiel selon Cohen (seuil: 0.25).
   Médiation partielle confirmée (67% de l'effet passe par M1).
```

---

### 2.5 SECTION D : Décision

Identique à l'existant :

| Action | Effet BDD | Workflow suivant |
|--------|-----------|------------------|
| **REJETER** | outcome='discarded' | Ferme le panel |
| **INVESTIGUER** | outcome='investigating' | Ouvre InvestigationBanner + annotations |
| **VALIDER** | outcome='promoted' | Ouvre VersionValidationDialog |

---

## 3. Source de Données

### 3.1 Table `analysis_pairs` (901 paires)

| Colonne | Usage |
|---------|-------|
| `conseiller_verbatim` | Input pour X, M1, M2 (t0) |
| `client_verbatim` | Input pour Y, M2 (t1), M3 |
| `strategy_tag` | Gold Standard X |
| `reaction_tag` | Gold Standard Y |
| `x_predicted_tag`, `x_confidence` | Résultat algo X |
| `y_predicted_tag`, `y_confidence` | Résultat algo Y |
| `m1_verb_density`, `m1_verb_count` | Résultat algo M1 |
| `m2_lexical_alignment` | Résultat algo M2 |
| `m3_cognitive_score` | Résultat algo M3 |
| `prev1_verbatim` ... `next2_verbatim` | Contexte étendu |

### 3.2 Table `test_runs`

Stocke chaque run de test avec :
- `metrics` (JSONB) : Métriques calculées
- `error_pairs` (JSONB) : Liste des pair_id en erreur
- `outcome` : pending / discarded / investigating / promoted
- `baseline_version_id` : Référence pour comparaison

### 3.3 Table `investigation_annotations`

Pour les annotations manuelles lors de l'investigation :
- `run_id` : Lié au test_run
- `pair_id` : Paire concernée
- `annotation_type` : error_pattern / suggestion / note
- `content` : Texte de l'annotation
- `error_category` : Classification de l'erreur

---

## 4. Composants à Créer/Modifier

### 4.1 Nouveaux composants

| Composant | Emplacement | Description |
|-----------|-------------|-------------|
| `PerformanceSection.tsx` | `ui/components/Results/` | Section A - Performance intrinsèque |
| `H1ContributionSection.tsx` | `ui/components/Results/` | Section B - Contribution H1 |
| `H2ContributionSection.tsx` | `ui/components/Results/` | Section C - Contribution H2 |
| `NumericDistribution.tsx` | `ui/components/Results/` | Histogramme pour M1/M2/M3 |
| `CalculationSample.tsx` | `ui/components/Results/` | Échantillon de calculs M1/M2/M3 |
| `MediationPathDiagram.tsx` | `ui/components/Results/` | Visualisation paths a, b, c' |

### 4.2 Composants à modifier

| Composant | Modification |
|-----------|--------------|
| `BaseAlgorithmTesting.tsx` | Intégrer les nouvelles sections |
| `MetricsPanel.tsx` | Réorganiser pour Section A |
| `Level2PreviewPanel.tsx` | Adapter pour Sections B et C |
| `TestDecisionPanel.tsx` | Déplacer en Section D |

### 4.3 Hooks à créer/modifier

| Hook | Description |
|------|-------------|
| `useH1Comparison.ts` | Compare H1 : Gold vs Baseline vs Test |
| `useH2Mediation.ts` | Calcule paths médiation pour Section C |
| `useNumericDistribution.ts` | Stats descriptives pour M1/M2/M3 |

---

## 5. Plan d'Implémentation

### Phase 1 : Restructuration Section A (2h)

1. Créer `PerformanceSection.tsx` avec 2 modes (classification / numeric)
2. Extraire logique de `MetricsPanel.tsx`
3. Ajouter `NumericDistribution.tsx` pour M1/M2/M3
4. Ajouter `CalculationSample.tsx` avec détail des calculs

### Phase 2 : Section B - Contribution H1 (2h)

1. Créer `useH1Comparison.ts` pour comparer Gold/Baseline/Test
2. Créer `H1ContributionSection.tsx` avec tableau comparatif
3. Ajouter interprétation automatique
4. Conditionner affichage (X et Y uniquement)

### Phase 3 : Section C - Contribution H2 (2h)

1. Créer `useH2Mediation.ts` (adapter de H2MediationService existant)
2. Créer `H2ContributionSection.tsx` avec vue synthétique
3. Créer `MediationPathDiagram.tsx` pour visualisation
4. Ajouter comparaison avec versions précédentes

### Phase 4 : Intégration et Tests (2h)

1. Intégrer dans `BaseAlgorithmTesting.tsx`
2. Réorganiser l'ordre d'affichage (A → B → C → D)
3. Tests manuels complets (X, Y, M1, M2, M3)
4. Ajustements UI/UX

---

## 6. Critères de Validation

### Fonctionnel

- [ ] Section A affiche correctement les métriques pour X/Y (avec confusion matrix)
- [ ] Section A affiche correctement les distributions pour M1/M2/M3 (avec histogramme)
- [ ] Section B compare Gold/Baseline/Test pour H1 (visible seulement si X ou Y)
- [ ] Section C affiche la contribution à H2 avec paths de médiation
- [ ] Section D permet Rejeter/Investiguer/Valider
- [ ] Échantillons de calculs M1 montrent le détail (verbes détectés)
- [ ] Bouton "Annoter" ouvre investigation_annotations

### Non-fonctionnel

- [ ] 0 erreur TypeScript
- [ ] Temps de chargement < 2s pour 901 paires
- [ ] Interface responsive
- [ ] Accordéons pour masquer les détails par défaut

---

## 7. Décisions Validées (Questions Résolues)

### 7.1 Baseline
**Décision** : La baseline est la **dernière version promue** (la plus récente validée).

**Note** : L'historique des améliorations doit être documenté pour la thèse (traçabilité des versions).

### 7.2 Comparaisons
**Décision** : Comparer à **3 références** :
- Gold Standard (référence absolue)
- Baseline (dernière version promue)
- Dernier test (même non promu)

### 7.3 Niveau de détail M1/M2/M3
**Décision** : Afficher le détail des calculs :
- **M1** : Liste des verbes d'action détectés (ex: ["vérifier", "traiter"])
- **M2** : Tokens alignés entre t0 et t1 (ex: tokens communs, score Jaccard)
- **M3** : Marqueurs d'hésitation détectés (ex: ["euh", "..."], pauses)

### 7.4 Seuils H2 (Médiation) - Basés sur Cohen (1988) et Kenny

**Référence scientifique** : Pour l'effet indirect (a × b), les seuils sont les carrés des valeurs classiques de Cohen car c'est un produit de deux effets.

| Niveau | Effet indirect (a×b) | Sobel p-value | Label interface |
|--------|---------------------|---------------|-----------------|
| **Fort** | ≥ 0.25 | < 0.01 | ✅ Médiation substantielle |
| **Modéré** | 0.09 - 0.24 | < 0.05 | ⚠️ Médiation partielle |
| **Faible** | 0.01 - 0.08 | < 0.10 | ⚡ Médiation faible |
| **Nul** | < 0.01 | ≥ 0.10 | ❌ Pas de médiation |

**Critères de validation** :
1. Test de Sobel significatif (p < 0.05) OU bootstrap IC 95% ne contient pas 0
2. Paths a ET b significatifs (joint significance)
3. Direction des effets cohérente avec la théorie

**Sources** :
- Cohen, J. (1988). Statistical power analysis for the behavioral sciences.
- Kenny, D. A. - davidakenny.net/cm/mediate.htm
- Preacher, K. J., & Kelley, K. (2011). Effect size measures for mediation models.

---

## 8. Annexes

### A. Rappel structure existante

```
src/features/phase3-analysis/level1-validation/ui/
├── components/
│   ├── algorithms/shared/BaseAlgorithmTesting.tsx  ← Point d'entrée
│   ├── AlgorithmLab/
│   │   ├── MetricsPanel.tsx
│   │   ├── ResultsSample/ResultsPanel.tsx
│   │   └── Level2Preview/Level2PreviewPanel.tsx
│   ├── TestDecision/TestDecisionPanel.tsx
│   └── Investigation/InvestigationBanner.tsx
└── hooks/
    ├── useLevel1Testing.ts
    ├── useTestRuns.ts
    └── useLevel2Preview.ts
```

### B. Types existants utilisables

```typescript
// Déjà définis dans versioning.ts
interface TestRun { ... }
interface ClassificationMetrics { ... }

// À créer
interface NumericMetrics { ... }
interface H1Comparison { ... }
interface H2MediationResult { ... }
```

---

*Document créé le 10/12/2025 - Session de clarification avec Thomas*
