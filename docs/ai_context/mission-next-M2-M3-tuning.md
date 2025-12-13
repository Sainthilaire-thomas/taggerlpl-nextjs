# 🎯 Mission: Tuning M2/M3 - Amélioration des Algorithmes Médiateurs

*Date de création : 12 décembre 2025*  
*Statut : À démarrer (prochaine session)*  
*Dépendance : Suite de la mission Section C Cascade*

---

## 📋 Contexte et objectif

### Pourquoi cette mission ?

La session du 12 décembre a révélé que :

1. **M1 n'est pas un médiateur indépendant** : Il est constitutif de X (les stratégies d'action SONT des stratégies à verbes d'action)

2. **M2 pose problème** :
   - Médiane = 0 (majorité des valeurs nulles)
   - r(M1, M2) = 0.000 (aucune corrélation avec M1)
   - EXPLICATION a PLUS d'alignement que ENGAGEMENT (contre-intuitif)
   - Baron-Kenny échoue : a = -0.01 (X ne prédit pas M2)

3. **Nouvelle hypothèse H2** :
   > L'effet X → Y est médiatisé par M2 (alignement) et M3 (charge cognitive), 
   > qui sont des CONSÉQUENCES de l'utilisation de verbes d'action, pas des caractéristiques constitutives.

### Objectif de la mission

Améliorer les algorithmes M2 et M3 pour qu'ils capturent correctement :
- **M2** : L'alignement linguistique (le client reprend-il les mots/structures du conseiller ?)
- **M3** : La charge cognitive (hésitations, pauses, difficulté de traitement)

---

## 🔍 État actuel des algorithmes

### M2 - Alignement linguistique

**Algorithmes disponibles** :
```
src/features/phase3-analysis/level1-validation/algorithms/mediators/M2Algorithms/
├── M2LexicalAlignmentCalculator    # Jaccard sur tokens
├── M2SemanticAlignmentCalculator   # Patterns sémantiques
└── M2CompositeAlignmentCalculator  # Fusion lex + sém
```

**Problèmes observés** :
| Métrique | Valeur | Problème |
|----------|--------|----------|
| Moyenne | 0.047 | Très faible |
| Médiane | **0.000** | Majorité = 0 |
| EXPLICATION | 0.059 | Plus haut que ENGAGEMENT (0.039) |

**Hypothèse** : L'algorithme mesure peut-être autre chose que l'alignement (ou le calcul est biaisé).

### M3 - Charge cognitive

**Algorithme disponible** :
```
src/features/phase3-analysis/level1-validation/algorithms/mediators/M3Algorithms/
└── PausesM3Calculator    # Hésitations, pauses
```

**À investiguer** : Résultats non analysés dans cette session.

---

## 🛠️ Tâche principale : Améliorer l'affichage contextuel

### Objectif

Pour tuner M2 et M3, il faut pouvoir examiner les paires en détail :
- Voir le verbatim conseiller (T0)
- Voir le verbatim client (T1)  
- Voir le contexte (T-1, T+1)
- Comparer visuellement l'alignement

### Deux affichages existants à comparer

#### 1. Supervision (Phase 2)

**Chemin** : `/phase2-annotation/supervision`  
**Code** : `src/features/phase2-annotation/supervision/ui/components/SupervisionTable.tsx`

**Utilise** : `TurnWithContext` (composant partagé)
```typescript
import TurnWithContext from "@/features/shared/ui/components/TurnWithContext";
```

**Fonctionnalités** :
- Affichage contextuel avec tours précédent/suivant
- Édition rapide des tags (QuickTagEditDialog)
- Accès au processing et à l'audio

#### 2. Échantillon de Résultats (Level 1)

**Chemin** : `/phase3-analysis/level1/algorithm-lab`  
**Code** : `src/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/`

**Structure** :
```
ResultsSample/
├── ResultsSample.tsx           # Composant principal
├── components/
│   ├── ResultsTableHeader.tsx  # En-tête avec métriques
│   ├── ResultsFilters.tsx      # Filtres
│   ├── ResultsTableBody.tsx    # Corps du tableau (contient ToneLine dupliqué)
│   ├── AnnotationList.tsx      # Liste annotations
│   └── FineTuningDialog/       # Export fine-tuning
├── hooks/
│   ├── useResultsFiltering.ts
│   └── useResultsPagination.ts
└── types.ts                    # TVValidationResult
```

**Problème identifié** : `ToneLine` est dupliqué dans `ResultsTableBody.tsx` au lieu d'utiliser le composant partagé.

### Composant partagé existant

**Chemin** : `src/features/shared/ui/components/TurnWithContext.tsx`

**Fonctionnalités** :
- `ToneLine` : Affiche un verbatim avec style (A/B/CURRENT)
- Gestion du contexte (tours précédent/suivant)
- Thème sombre/clair supporté

---

## 📝 Plan d'action proposé

### Étape 1 : Audit des affichages (1h)

1. Ouvrir les deux interfaces côte à côte :
   - `/phase2-annotation/supervision`
   - `/phase3-analysis/level1/algorithm-lab` (section Échantillon)

2. Comparer :
   - Informations affichées (quels champs ?)
   - Format du contexte (combien de tours ?)
   - Fonctionnalités d'interaction (édition, filtres)
   - Qualité visuelle et lisibilité

3. Documenter les forces/faiblesses de chaque approche

### Étape 2 : Unification du composant ToneLine (30min)

1. Supprimer la duplication dans `ResultsTableBody.tsx`
2. Importer `ToneLine` depuis le composant partagé ou créer un export dédié
3. Vérifier la compatibilité des props

### Étape 3 : Améliorer ResultsSample pour le tuning M2/M3 (2h)

Ajouter les fonctionnalités manquantes :

| Fonctionnalité | Priorité | Description |
|----------------|----------|-------------|
| Affichage M1/M2/M3 | 🔴 Haute | Montrer les valeurs calculées pour chaque paire |
| Contexte étendu | 🔴 Haute | Afficher T-1, T0, T1, T+1 |
| Highlight alignement | 🟡 Moyenne | Surligner les mots communs conseiller/client |
| Filtre par M2=0 | 🟡 Moyenne | Voir les paires où M2 échoue |
| Export pour analyse | 🟢 Basse | Exporter les paires problématiques |

### Étape 4 : Investiguer l'algorithme M2 (2h)

1. Lire le code de `M2LexicalAlignmentCalculator`
2. Comprendre pourquoi tant de valeurs = 0
3. Identifier pourquoi EXPLICATION > ENGAGEMENT
4. Proposer des améliorations

### Étape 5 : Investiguer M3 (1h)

1. Analyser les résultats M3 dans l'interface
2. Vérifier si M3 corrèle avec X et Y
3. Tester Baron-Kenny pour M3

---

## 📁 Fichiers clés à examiner

### Affichage

| Fichier | Rôle |
|---------|------|
| `src/features/shared/ui/components/TurnWithContext.tsx` | Composant partagé contexte |
| `src/features/phase2-annotation/supervision/ui/components/SupervisionTable.tsx` | Tableau supervision |
| `src/features/phase3-analysis/level1-validation/ui/components/AlgorithmLab/ResultsSample/` | Échantillon résultats |

### Algorithmes M2

| Fichier | Rôle |
|---------|------|
| `src/features/phase3-analysis/level1-validation/algorithms/mediators/M2Algorithms/M2LexicalAlignmentCalculator.ts` | Jaccard tokens |
| `src/features/phase3-analysis/level1-validation/algorithms/mediators/M2Algorithms/M2SemanticAlignmentCalculator.ts` | Patterns sémantiques |
| `src/features/phase3-analysis/level1-validation/algorithms/mediators/M2Algorithms/M2CompositeAlignmentCalculator.ts` | Fusion |

### Algorithmes M3

| Fichier | Rôle |
|---------|------|
| `src/features/phase3-analysis/level1-validation/algorithms/mediators/M3Algorithms/PausesM3Calculator.ts` | Hésitations/pauses |

---

## 📊 Données de référence

### Résultats M2 actuels

```
Moyenne par stratégie :
- ENGAGEMENT  : 0.039 (N=132)
- OUVERTURE   : 0.037 (N=128)  
- REFLET      : 0.031 (N=197)
- EXPLICATION : 0.059 (N=444) ← Le plus haut (inattendu)

Baron-Kenny M2 :
- a (X → M2) = -0.01 ❌
- b (M2 → Y) = -0.21
- Effet indirect = 0.003
- Sobel p = 0.958 ❌

Corrélation M1 → M2 = 0.000 (p = 0.999) ❌
```

### Résultats M1 de référence

```
Baron-Kenny M1 :
- a (X → M1) = 3.20 ✅ (X prédit bien M1)
- b (M1 → Y | X) = -0.00 ❌ (M1 = indicateur de X, pas médiateur)

Conclusion : M1 est constitutif de X, pas un médiateur indépendant.
```

---

## 🎯 Critères de succès

1. **Affichage unifié** : Un seul composant de contexte réutilisé partout
2. **Visualisation M2** : Pouvoir voir POURQUOI M2 = 0 pour une paire donnée
3. **Algorithme M2 amélioré** : 
   - Médiane > 0
   - ENGAGEMENT > EXPLICATION (comme attendu)
   - a (X → M2) > 0 significatif
4. **Validation H2** : Au moins M2 ou M3 montre une médiation significative

---

## 📚 Commits de la mission précédente

| Hash | Message |
|------|---------|
| `339209b` | feat(level1): restructure Section C for H2 cascade model |
| `2c496d6` | feat(level1): add intra-strategy variance and binary mediation tests |

---

## 🔗 Documents de référence

| Document | Contenu |
|----------|---------|
| `mission-2025-12-12-level1-section-c-final.md` | Conclusions sur M1 (pas un médiateur) |
| `base-context.md` | Architecture globale du projet |
| `ARCHITECTURE_CIBLE_WORKFLOW.md` | Workflow cible des 3 niveaux |

---

*Prochaine session : À planifier*  
*Durée estimée : 4-6 heures*
