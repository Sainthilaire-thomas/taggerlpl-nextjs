
# 🎯 Mission: Investigation Level 1 → Level 2 Integration

*Session du 2025-01-24*

## Objectif

Enrichir l'interface Level 1 pour afficher dès la validation algorithmique les indicateurs qui seront pertinents pour Level 2, évitant ainsi les allers-retours incessants entre niveaux.

**Problématique** : Actuellement, il faut valider les algorithmes en Level 1, puis passer à Level 2 pour découvrir si les résultats sont exploitables pour les hypothèses H1/H2.

---

## ✅ Travail accompli

### Investigation complète de l'architecture

1. **Exploration Level 2** via PowerShell :
   * Seuils H1 dans `config/hypotheses.ts` (3 modes : STRICT/REALISTIC/EMPIRICAL)
   * Services statistiques : `H1StatisticsService.ts`, `H2MediationService.ts`
   * Interface principale : `Level2Interface.tsx`
   * Calculs H1 : `utils/stats.ts` (computeH1Analysis, summarizeH1, evaluateH1Criteria)
2. **Exploration Level 1** :
   * Composant principal : `BaseAlgorithmTesting.tsx`
   * Hook central : `useLevel1Testing.ts`
   * Système de versioning : `useAlgorithmVersioning.ts`
   * Update H2 optimisé : `updateH2WithResultsBatch()` (bulk RPC)
3. **Documentation des seuils statistiques** :
   * Critères H1 : 6 critères (taux positif/négatif actions/explications, écart empirique, significativité)
   * Médiation H2 : Baron-Kenny, Sobel Test, effets directs/indirects

---

## 📁 Fichiers analysés (non modifiés)

| Fichier                                                                             | Analyse | Informations extraites         |
| ----------------------------------------------------------------------------------- | ------- | ------------------------------ |
| `level2-hypotheses/config/hypotheses.ts`                                          | Lecture | Seuils H1 (3 modes)            |
| `level2-hypotheses/statistics/domain/services/H1StatisticsService.ts`             | Lecture | Chi², V de Cramér            |
| `level2-hypotheses/h2-mediation/statistics/domain/services/H2MediationService.ts` | Lecture | Baron-Kenny, Sobel             |
| `level2-hypotheses/utils/stats.ts`                                                | Lecture | computeH1Analysis, summarizeH1 |
| `level2-hypotheses/hooks/useLevel2Data.ts`                                        | Lecture | Couverture M1/M2/M3            |
| `level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx`      | Lecture | Point d'intégration           |
| `level1-validation/ui/hooks/useLevel1Testing.ts`                                  | Lecture | validateAlgorithm, updateH2    |

---

## 📋 Spécification Level 2 Preview Component

### Architecture proposée

```
src/features/phase3-analysis/level1-validation/ui/components/Level2Preview/
├── Level2PreviewPanel.tsx      # Container principal
├── H1ReadinessIndicator.tsx    # Indicateur H1 avec checklist
├── H2ReadinessIndicator.tsx    # Indicateur H2 avec couverture
├── ThresholdChecklist.tsx      # Liste critères avec ✅/❌
└── QuickActionsBar.tsx         # Boutons navigation Level 2
```

### Données à calculer

**H1 Preview** :

```typescript
interface H1PreviewData {
  // Qualité algorithme X
  xAccuracy: number;
  xF1Macro: number;
  xKappa: number;
  
  // Simulation Chi² (sur prédictions)
  estimatedChiSquare: number;
  estimatedCramersV: number;
  estimatedPValue: number;
  
  // Écarts empiriques
  actionsPositiveRate: number;
  explanationsPositiveRate: number;
  empiricalDifference: number;
  
  // Score global
  h1ReadinessScore: number; // 0-100
  h1ReadinessLevel: 'READY' | 'PARTIAL' | 'INSUFFICIENT';
}
```

**H2 Preview** :

```typescript
interface H2PreviewData {
  // Couverture médiateurs
  m1Coverage: number;
  m2Coverage: number;
  m3Coverage: number;
  
  // Corrélations préliminaires
  m1Correlation: number;
  m2Correlation: number;
  m3Correlation: number;
  
  // Score global
  h2ReadinessScore: number;
  h2ReadinessLevel: 'READY' | 'PARTIAL' | 'INSUFFICIENT';
}
```

### UI cible

```
┌─────────────────────────────────────────────────────────┐
│ 📊 Prévisualisation Level 2 - Prêt pour Hypothèses     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ✅ H1 Readiness: 85/100 (READY)                        │
│ ├─ ✅ Accuracy X: 87% (seuil: 70%)                     │
│ ├─ ✅ F1 Macro: 0.82 (seuil: 0.65)                     │
│ ├─ ✅ Chi² estimé: p<0.001 (significatif)              │
│ ├─ ✅ V Cramér: 0.45 (effet fort)                      │
│ └─ ✅ Écart empirique: +52% (seuil: 50%)               │
│                                                         │
│ ⚠️ H2 Readiness: 65/100 (PARTIAL)                      │
│ ├─ ✅ M1 Coverage: 95% (seuil: 90%)                    │
│ ├─ ✅ M2 Coverage: 93% (seuil: 90%)                    │
│ ├─ ❌ M3 Coverage: 45% (seuil: 90%) ⚠️ INSUFFISANT     │
│ ├─ ✅ M1 Corrélation: r=0.42 (p<0.01)                  │
│ └─ ⚠️ M2 Corrélation: r=0.18 (p=0.08)                  │
│                                                         │
│ 💡 Recommandations:                                     │
│ • Exécuter M3Calculator sur les paires manquantes      │
│ • Vérifier qualité M2 (alignement faible)              │
│                                                         │
│ [🚀 Passer à Level 2] [📋 Rapport Détaillé]            │
└─────────────────────────────────────────────────────────┘
```

---

## ⏳ Reste à faire

### Phase 1 : Création Services Calcul (2-3h)

* [ ] `Level2PreviewService.ts` : Calcul H1/H2 preview
* [ ] `useLevel2Preview.ts` : Hook intégration
* [ ] Tests unitaires seuils

### Phase 2 : Composants UI (3-4h)

* [ ] `Level2PreviewPanel.tsx` : Container principal
* [ ] `H1ReadinessIndicator.tsx` : Indicateur H1 avec checklist
* [ ] `H2ReadinessIndicator.tsx` : Indicateur H2 avec couverture
* [ ] `ThresholdChecklist.tsx` : Liste critères avec ✅/❌
* [ ] `QuickActionsBar.tsx` : Boutons navigation Level 2

### Phase 3 : Intégration BaseAlgorithmTesting (1-2h)

* [ ] Appel `useLevel2Preview()` après validation
* [ ] Affichage conditionnel `Level2PreviewPanel`
* [ ] Tests E2E

### Phase 4 : Documentation (1h)

* [ ] Guide utilisateur
* [ ] Exemples interprétation scores
* [ ] Troubleshooting

---

## 📝 Notes pour la prochaine session

### Fichiers clés à modifier

**Level 1 (à modifier)** :

* `src/features/phase3-analysis/level1-validation/ui/components/algorithms/shared/BaseAlgorithmTesting.tsx`
* `src/features/phase3-analysis/level1-validation/ui/hooks/useLevel1Testing.ts`

**Level 2 (référence, ne pas modifier)** :

* `src/features/phase3-analysis/level2-hypotheses/config/hypotheses.ts`
* `src/features/phase3-analysis/level2-hypotheses/statistics/domain/services/H1StatisticsService.ts`
* `src/features/phase3-analysis/level2-hypotheses/utils/stats.ts`

**À créer** :

* `src/features/phase3-analysis/level1-validation/ui/components/Level2Preview/` (nouveau dossier)

### Calculs techniques

**Chi² estimé** : Utiliser les prédictions de l'algorithme X pour simuler la table de contingence X×Y, puis appliquer `H1StatisticsService.calculateChiSquare()`.

**Couverture M1/M2/M3** :

```sql
SELECT 
  COUNT(*) FILTER (WHERE m1_verb_density IS NOT NULL) * 100.0 / COUNT(*) as m1_coverage,
  COUNT(*) FILTER (WHERE m2_global_alignment IS NOT NULL) * 100.0 / COUNT(*) as m2_coverage,
  COUNT(*) FILTER (WHERE m3_cognitive_score IS NOT NULL) * 100.0 / COUNT(*) as m3_coverage
FROM analysis_pairs;
```

**Corrélations préliminaires** : Pearson entre M1/M2/M3 et Y (codé numériquement : POSITIF=1, NEUTRE=0, NEGATIF=-1).

---

## 🔗 Continuité

Cette session a préparé le terrain pour l'implémentation. La prochaine session devrait :

1. Commencer par créer `Level2PreviewService.ts` avec les calculs
2. Créer le hook `useLevel2Preview.ts`
3. Puis implémenter les composants UI
4. Enfin intégrer dans `BaseAlgorithmTesting.tsx`

**Temps estimé total** : 8-10h de développement

---

*Mission d'investigation terminée - Prêt pour implémentation*
