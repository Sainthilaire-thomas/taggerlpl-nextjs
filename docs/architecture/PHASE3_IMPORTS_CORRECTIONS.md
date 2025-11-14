# 📋 CORRECTIONS D'IMPORTS - Phase 3 Migration

**Date:** 14/11/2025 15:30
**Branche:** refactor/architecture-phases
**Commit de référence:** before-phase3-cleanup

---

## 📊 Statistiques

- **Total erreurs:** 370
- **Fichiers affectés:** 88
- **Catégories principales:** 5

---

## 🎯 CATÉGORIE 1 : Types centralisés (PRIORITAIRE)

### Pattern à remplacer:
```
ANCIEN: '@/app/(protected)/analysis/components/AlgorithmLab/types'
NOUVEAU: '@/types/algorithm-lab'

ANCIEN: '@/app/(protected)/analysis/components/AlgorithmLab/types/algorithms/base'
NOUVEAU: '@/types/algorithm-lab/algorithms'

ANCIEN: '../types' (dans fichiers phase3-analysis)
NOUVEAU: '@/types/algorithm-lab'
```

### Fichiers concernés (37 fichiers):
- src/features/phase3-analysis/level1-validation/algorithms/classifiers/client/RegexClientClassifier.ts
- src/features/phase3-analysis/level1-validation/algorithms/mediators/M1Algorithms/M1ActionVerbCounter.ts
- src/features/phase3-analysis/level1-validation/algorithms/mediators/M1Algorithms/RegexM1Calculator.ts
- src/features/phase3-analysis/level1-validation/algorithms/mediators/M1Algorithms/shared/BaseM1Calculator.ts
- src/features/phase3-analysis/level1-validation/algorithms/mediators/M2Algorithms/*.ts (3 fichiers)
- src/features/phase3-analysis/level1-validation/algorithms/mediators/M2Algorithms/shared/BaseM2Calculator.ts
- src/features/phase3-analysis/level1-validation/algorithms/mediators/M3Algorithms/PausesM3Calculator.tsx
- src/features/phase3-analysis/level1-validation/algorithms/mediators/M3Algorithms/shared/BaseM3Calculator.ts
- src/features/phase3-analysis/level1-validation/algorithms/shared/AlgorithmRegistry.ts
- src/features/phase3-analysis/level1-validation/algorithms/shared/BaseAlgorithm.ts
- src/features/phase3-analysis/level1-validation/shared/utils/metricsCalculation.ts
- src/features/phase3-analysis/level1-validation/shared/utils/versionGenerator.ts
- src/features/phase3-analysis/level1-validation/ui/components/**/*.tsx (15+ fichiers)
- src/features/phase3-analysis/level1-validation/ui/hooks/*.ts (8 fichiers)
- src/features/phase3-analysis/level0-gold/ui/components/InterAnnotatorAgreement.tsx

---

## 🎯 CATÉGORIE 2 : Algorithms (imports relatifs)

### Pattern à remplacer:
```
ANCIEN: '../XAlgorithms/...'
NOUVEAU: '@/features/phase3-analysis/level1-validation/algorithms/classifiers/client/...'

ANCIEN: '../YAlgorithms/...'  
NOUVEAU: '@/features/phase3-analysis/level1-validation/algorithms/classifiers/conseiller/...'

ANCIEN: '../M1Algorithms/...'
NOUVEAU: '@/features/phase3-analysis/level1-validation/algorithms/mediators/M1Algorithms/...'

ANCIEN: '../M2Algorithms/...'
NOUVEAU: '@/features/phase3-analysis/level1-validation/algorithms/mediators/M2Algorithms/...'

ANCIEN: '../M3Algorithms/...'
NOUVEAU: '@/features/phase3-analysis/level1-validation/algorithms/mediators/M3Algorithms/...'

ANCIEN: '../shared/BaseClassifier'
NOUVEAU: '@/features/phase3-analysis/level1-validation/algorithms/shared/BaseClassifier'
```

### Fichiers concernés (15 fichiers):
- src/features/phase3-analysis/level1-validation/algorithms/shared/initializeAlgorithms.ts
- src/features/phase3-analysis/level1-validation/algorithms/classifiers/conseiller/*.ts (5 fichiers)

---

## 🎯 CATÉGORIE 3 : Shared UI Components

### Pattern à remplacer:
```
ANCIEN: '../../../../../shared/atoms/...'
NOUVEAU: '@/features/phase3-analysis/shared/ui/atoms/...'

ANCIEN: '../../../../../shared/molecules/...'
NOUVEAU: '@/features/phase3-analysis/shared/ui/molecules/...'

ANCIEN: '../../../../../shared/hooks/...'
NOUVEAU: '@/features/phase3-analysis/shared/ui/hooks/...'

ANCIEN: '@/analysis-components/shared/...'
NOUVEAU: '@/features/phase3-analysis/shared/ui/...'
```

### Fichiers concernés (20+ fichiers):
- src/features/phase3-analysis/level2-hypotheses/shared/li-metrics/indicators/FeedbackAlignementIndicator/components/tabs/*.tsx (7 fichiers)
- src/features/phase3-analysis/level1-validation/ui/components/algorithms/BaseAlgorithmTesting.tsx

---

## 🎯 CATÉGORIE 4 : Metrics Framework

### Pattern à remplacer:
```
ANCIEN: '../../../metrics-framework/...'
NOUVEAU: '@/features/phase3-analysis/shared/metrics-framework/...'

ANCIEN: '../../metrics-framework/...'
NOUVEAU: '@/features/phase3-analysis/shared/metrics-framework/...'
```

### Fichiers concernés (10+ fichiers):
- src/features/phase3-analysis/level2-hypotheses/shared/cognitive-metrics/**/*.ts
- src/features/phase3-analysis/level2-hypotheses/shared/li-metrics/**/*.ts

---

## 🎯 CATÉGORIE 5 : Analysis page & API routes

### Fichiers à réécrire complètement:
1. **src/app/(protected)/analysis/page.tsx**
   - Importe depuis ancien AlgorithmLab
   - Doit utiliser nouveaux composants depuis features/phase3-analysis/

2. **src/app/api/algolab/**
   - 3 fichiers routes API
   - Doivent pointer vers features/phase3-analysis/level1-validation/algorithms/

3. **scripts/precompute-h2-results.ts**
   - Doit utiliser nouveaux chemins algorithms

---

## 🎯 CATÉGORIE 6 : Fichiers legacy/obsolètes

### À corriger ou supprimer:
- src/app/(protected)/calls/page.legacy.tsx (imports obsolètes)
- src/app/api/calls/old_*.ts (2 fichiers - probablement obsolètes)
- src/components/TaggerLPL.tsx (imports obsolètes vers anciens composants)
- tests/*.test.ts (2 fichiers - imports obsolètes)

---

## 🎯 CATÉGORIE 7 : Phase 1 & Phase 2 (imports cassés)

### Fichiers à corriger:
- src/features/phase1-corpus/calls/CallImporter.tsx
- src/features/phase1-corpus/calls/CallList.tsx
- src/features/phase1-corpus/calls/CallPreparation.tsx
- src/features/phase1-corpus/calls/CallTableList/CallTableList.tsx
- src/features/phase1-corpus/calls/infrastructure/ServiceFactory.ts
- src/app/(protected)/phase1-corpus/workdrive/page.tsx
- src/app/(protected)/phase2-annotation/transcript/[callId]/page.tsx

---

## 📝 ORDRE DE CORRECTION RECOMMANDÉ

### Phase 1 : Types (1-2h)
1. Remplacer tous les imports vers \@/types/algorithm-lab\
2. Vérifier compilation après chaque batch

### Phase 2 : Algorithms relatifs (30min)
1. Corriger imports relatifs dans algorithms/
2. Compiler

### Phase 3 : Shared UI (30min)
1. Corriger imports shared components
2. Compiler

### Phase 4 : Metrics Framework (30min)
1. Corriger imports metrics-framework
2. Compiler

### Phase 5 : Pages & Routes (1h)
1. Réécrire analysis/page.tsx
2. Corriger API routes
3. Compiler

### Phase 6 : Cleanup (30min)
1. Corriger Phase 1 & 2
2. Décider du sort des fichiers legacy
3. Compilation finale

**Temps estimé total:** 4-5 heures

---

## 🛠️ OUTILS DISPONIBLES

### Script PowerShell de remplacement automatique
```powershell
# À créer - remplace automatiquement les patterns courants
.\scripts\fix-phase3-imports.ps1
```

### Vérification progressive
```powershell
# Compiler après chaque catégorie
npx tsc --noEmit --pretty
```

---

## ✅ CHECKLIST DE PROGRESSION

- [ ] Catégorie 1 : Types centralisés
- [ ] Catégorie 2 : Algorithms
- [ ] Catégorie 3 : Shared UI
- [ ] Catégorie 4 : Metrics Framework
- [ ] Catégorie 5 : Pages & Routes
- [ ] Catégorie 6 : Legacy files
- [ ] Catégorie 7 : Phase 1 & 2
- [ ] Compilation finale réussie
- [ ] Tests de fumée (npm run dev)
- [ ] Commit final

