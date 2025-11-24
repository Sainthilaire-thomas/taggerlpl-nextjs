# 🎯 Mission: Investigation Phase 3 Level 1 - Préparation Level 2

*Session planifiée pour le 2025-01-24*

## Objectif

Investiguer et documenter le système de validation des algorithmes (Level 1) pour s'assurer que Level 2 produira des rapports statistiques pertinents sur les hypothèses H1 et H2.

---

## 📊 Contexte

### Hypothèses de thèse à valider

**H1** : Les stratégies orientées action (ENGAGEMENT, OUVERTURE) génèrent plus de réactions positives que EXPLICATION

**H2** : Cet effet est médié par :
- M1 (densité de verbes d'action)
- M2 (alignement lexical conseiller-client)
- M3 (charge cognitive)

### Tables Supabase clés

#### `analysis_pairs` (930+ paires)
| Colonnes | Description |
|----------|-------------|
| `strategy_tag`, `reaction_tag` | Tags annotés manuellement |
| `x_predicted_tag`, `x_confidence` | Prédiction algorithme X |
| `y_predicted_tag`, `y_confidence` | Prédiction algorithme Y |
| `m1_verb_density`, `m1_verb_count` | Médiateur M1 |
| `m2_global_alignment` | Médiateur M2 |
| `m3_cognitive_score` | Médiateur M3 |

#### `algorithm_version_registry`
- Registre des versions avec métriques Level 1

### Algorithmes disponibles (10)

| Algorithme | Cible | Type |
|------------|-------|------|
| RegexXClassifier | X | rule-based |
| SpacyXClassifier | X | ml |
| OpenAIXClassifier | X | llm |
| OpenAI3TXClassifier | X | llm (3 tours) |
| RegexYClassifier | Y | rule-based |
| RegexM1Calculator | M1 | metric |
| M2LexicalAlignmentCalculator | M2 | rule-based |
| M2SemanticAlignmentCalculator | M2 | rule-based |
| M2CompositeAlignmentCalculator | M2 | hybrid |
| PauseM3Calculator | M3 | metric |

---

## ❓ Questions à investiguer

### 1. Qualité des algorithmes X
- [ ] Quel algorithme X a le meilleur F1 ?
- [ ] Accuracy suffisante (>80%) pour Level 2 ?
- [ ] Biais par catégorie ?

### 2. Couverture des médiateurs
- [ ] Combien de paires ont M1, M2, M3 calculés ?
- [ ] Valeurs dans des plages exploitables ?

### 3. Versioning et comparaison
- [ ] Comment fonctionne le système de versions ?
- [ ] Peut-on comparer 2 versions ?

### 4. Préparation Level 2
- [ ] Données prêtes pour H1 (contingence X×Y) ?
- [ ] Données prêtes pour H2 (médiation) ?

---

## 📁 Fichiers clés
```
src/features/phase3-analysis/level1-validation/
├── algorithms/          # Classificateurs X, Y, M1, M2, M3
├── ui/hooks/
│   ├── useLevel1Testing.ts    # Exécution des tests
│   ├── useAnalysisPairs.ts    # Chargement données
│   └── useAlgorithmVersioning.ts
└── utils/
    └── metricsCalculation.ts  # Calcul F1, kappa

src/features/phase3-analysis/level2-hypotheses/
├── config/hypotheses.ts       # Seuils validation
├── hooks/useLevel2Data.ts
└── statistics/domain/services/
    ├── H1StatisticsService.ts
    └── H2MediationService.ts
```

---

## ✅ Actions planifiées

### Phase 1 : Diagnostic
- [ ] Lancer tests sur chaque algo X
- [ ] Vérifier couverture M1/M2/M3
- [ ] Identifier paires incomplètes

### Phase 2 : Comparaison
- [ ] Comparer F1 des algorithmes X
- [ ] Identifier le meilleur candidat

### Phase 3 : Validation Level 2
- [ ] Exécuter analyse H1
- [ ] Vérifier significativité statistique

---

## 📈 Critères de succès

| Critère | Minimum | Idéal |
|---------|---------|-------|
| Accuracy algo X | >70% | >85% |
| F1 macro | >0.65 | >0.80 |
| Paires avec M1 | >90% | 100% |
| p-value H1 | <0.05 | <0.01 |

---

## 🔗 Prérequis

- ✅ Build production fonctionne
- ✅ 10 algorithmes configurés
- ✅ Table analysis_pairs peuplée

---

*Préparé le 2025-01-23*
