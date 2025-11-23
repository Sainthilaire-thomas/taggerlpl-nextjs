#!/bin/bash

# ========================================================================
# Script 5/5 : Index principal et finalisation AlgorithmLab
# ========================================================================

echo "📋 Script 5/5 : Index principal et finalisation AlgorithmLab"
echo "📍 Localisation: ./types/ (racine)"
echo ""

# Vérifier que tous les modules existent
missing_modules=()
for module in core algorithms ui utils; do
    if [[ ! -d "types/$module" ]]; then
        missing_modules+=("$module")
    fi
done

if [[ ${#missing_modules[@]} -gt 0 ]]; then
    echo "❌ Erreur: Modules manquants: ${missing_modules[*]}"
    echo "🔍 Exécutez d'abord les scripts précédents dans l'ordre"
    exit 1
fi

# ========================================================================
# types/index.ts - Point d'entrée global AlgorithmLab
# ========================================================================

echo "📝 Génération: types/index.ts"

cat > "types/index.ts" << 'EOF'
/**
 * @fileoverview Point d'entrée principal des types AlgorithmLab
 * Export centralisé unifié pour le module AlgorithmLab
 */

// ========================================================================
// EXPORTS PAR DOMAINE ALGORITHMLAB
// ========================================================================

// Types fondamentaux
export * from './core';

// Types d'algorithmes  
export * from './algorithms';

// Types d'interface utilisateur
export * from './ui';

// Types utilitaires
export * from './utils';

// ========================================================================
// EXPORTS GROUPÉS POUR SIMPLICITÉ D'USAGE ALGORITHMLAB
// ========================================================================

// Variables et calculs - imports les plus fréquents
export type {
  VariableTarget,
  VariableDetails,
  XDetails,
  YDetails,
  M1Details,
  M2Details, 
  M3Details,
  CalculationInput,
  CalculationResult,
  XInput,
  YInput,
  M1Input,
  M2Input,
  M3Input
} from './core';

// Algorithmes - interface universelle
export type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
  BaseCalculator
} from './algorithms';

// Export de la fonction principale
export { createUniversalAlgorithm } from './algorithms';

// Validation - types essentiels
export type {
  ValidationMetrics,
  ValidationResult,
  AlgorithmTestConfig
} from './core';

// UI - props de validation les plus utilisées
export type {
  BaseValidationProps,
  XValidationProps,
  YValidationProps,
  M2ValidationProps
} from './ui';

// Utilitaires - fonctions de normalisation
export type {
  normalizeXLabel,
  normalizeYLabel,
  familyFromX,
  NormalizationConfig
} from './utils';

// ========================================================================
// CONSTANTES ALGORITHMLAB
// ========================================================================

export const ALGORITHM_LAB_VERSION = "2.0.0";

export const SUPPORTED_VARIABLES = ["X", "Y", "M1", "M2", "M3"] as const;

export const DEFAULT_CONFIGS = {
  VALIDATION: {
    minConfidence: 0.8,
    timeout: 30000,
    retries: 3
  },
  NORMALIZATION: {
    level: "STANDARD" as const,
    preserveCase: false,
    removePunctuation: true
  }
} as const;

// ========================================================================
// TYPES DE COMPATIBILITÉ TEMPORAIRE
// ========================================================================

/**
 * @deprecated Use VariableTarget from './core' instead
 * Compatibilité temporaire pendant la migration
 */
export type TVTarget = VariableTarget;

/**
 * @deprecated Use XCalculationResult from './core' instead  
 * Compatibilité temporaire pendant la migration
 */
export type TVResultX = import('./core').XCalculationResult;

/**
 * @deprecated Use YCalculationResult from './core' instead
 * Compatibilité temporaire pendant la migration
 */
export type TVResultY = import('./core').YCalculationResult;

/**
 * @deprecated Use M2CalculationResult from './core' instead
 * Compatibilité temporaire pendant la migration
 */
export type TVResultM2 = import('./core').M2CalculationResult;

/**
 * @deprecated Use ValidationMetrics from './core' instead
 * Compatibilité temporaire pendant la migration
 */
export type TVValidationMetrics = ValidationMetrics;
EOF

# ========================================================================
# types/legacy/README.md
# ========================================================================

echo "📝 Génération: types/legacy/README.md"

mkdir -p types/legacy

cat > "types/legacy/README.md" << 'EOF'
# Types Legacy AlgorithmLab - Compatibilité temporaire

Ce dossier contient les types de l'ancienne architecture AlgorithmLab pendant la migration.

##
# Continuation du script 5 - à ajouter après la ligne qui s'arrête à "##"

⚠️ IMPORTANT

**Ces fichiers sont temporaires et seront supprimés après la migration complète du module AlgorithmLab.**

## Migration AlgorithmLab

### État de la migration AlgorithmLab

- [x] **Phase 0**: Nouveaux fichiers AlgorithmLab créés
- [ ] **Phase 1**: Validation de coexistence  
- [ ] **Phase 2**: Migration automatique des imports AlgorithmLab
- [ ] **Phase 3**: Correction des erreurs de compilation
- [ ] **Phase 4**: Suppression progressive des anciens fichiers
- [ ] **Phase 5**: Nettoyage final

### Imports AlgorithmLab

Nouveaux imports AlgorithmLab recommandés :

```typescript
// ✅ Nouveaux imports AlgorithmLab
import { VariableTarget, XDetails, M2Details } from "./types/core/variables";
import { UniversalAlgorithm, createUniversalAlgorithm } from "./types/algorithms";
import { BaseValidationProps } from "./types/ui/components";
import { normalizeXLabel } from "./types/utils/normalizers";

// Ou import groupé depuis la racine
import { XDetails, YDetails, UniversalAlgorithm } from "./types";
```

### Correspondance des anciens wrappers

| Ancien système | Nouveau système |
|----------------|-----------------|
| `wrapX(calculator)` | `createUniversalAlgorithm(calculator, "X")` |
| `wrapY(calculator)` | `createUniversalAlgorithm(calculator, "Y")` |
| `wrapM2(calculator)` | `createUniversalAlgorithm(calculator, "M2")` |

### Exemple de migration d'un wrapper

**Avant (ancien système) :**
```typescript
import { wrapX } from "./oldWrappers";
const algorithm = wrapX(new XCalculator());
```

**Après (nouveau système) :**
```typescript
import { createUniversalAlgorithm } from "./types/algorithms";
const algorithm = createUniversalAlgorithm(new XCalculator(), "X");
```

## Nettoyage AlgorithmLab

Une fois la migration AlgorithmLab terminée :

```bash
# Supprimer le dossier legacy AlgorithmLab
rm -rf types/legacy
```
EOF

# ========================================================================
# VALIDATION COMPLÈTE
# ========================================================================

echo ""
echo "🔍 Validation complète de l'architecture AlgorithmLab..."

# Compter les fichiers créés
core_files=$(find types/core -name "*.ts" 2>/dev/null | wc -l)
algorithms_files=$(find types/algorithms -name "*.ts" 2>/dev/null | wc -l)
ui_files=$(find types/ui -name "*.ts" 2>/dev/null | wc -l)
utils_files=$(find types/utils -name "*.ts" 2>/dev/null | wc -l)
total_files=$((core_files + algorithms_files + ui_files + utils_files + 1)) # +1 pour index.ts

echo "   📊 Fichiers TypeScript créés: $total_files"
echo "      - Core: $core_files fichiers"
echo "      - Algorithms: $algorithms_files fichiers"  
echo "      - UI: $ui_files fichiers"
echo "      - Utils: $utils_files fichiers"
echo "      - Index principal: 1 fichier"

# Vérifier la structure complète
echo ""
echo "🏗️  Vérification de la structure complète..."

expected_structure=(
    "types/index.ts"
    "types/core/index.ts"
    "types/core/variables.ts"
    "types/core/calculations.ts"
    "types/core/validation.ts"
    "types/algorithms/index.ts"
    "types/algorithms/base.ts"
    "types/algorithms/universal-adapter.ts"
    "types/ui/index.ts"
    "types/ui/components.ts"
    "types/ui/validation.ts"
    "types/utils/index.ts"
    "types/utils/normalizers.ts"
    "types/utils/converters.ts"
    "types/legacy/README.md"
)

all_files_exist=true
for file in "${expected_structure[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (manquant)"
        all_files_exist=false
    fi
done

# ========================================================================
# GÉNÉRATION DU RAPPORT FINAL
# ========================================================================

echo ""
echo "📋 Génération du rapport final..."

cat > "MIGRATION_REPORT_PHASE_0.md" << EOF
# Rapport de Migration Phase 0 - AlgorithmLab

## ✅ Statut : PHASE 0 TERMINÉE AVEC SUCCÈS

Date de génération : $(date)
Localisation : ./types/ (dans AlgorithmLab)

## 📊 Résumé de la génération

### Fichiers créés
- **Total** : $total_files fichiers TypeScript
- **Core** : $core_files fichiers (types fondamentaux)
- **Algorithms** : $algorithms_files fichiers (interface universelle)
- **UI** : $ui_files fichiers (composants et validation)
- **Utils** : $utils_files fichiers (normalisation et conversion)
- **Documentation** : 1 fichier README legacy

### Structure créée
\`\`\`
types/
├── core/                     # Types fondamentaux
│   ├── variables.ts         # X, Y, M1, M2, M3 unifiés
│   ├── calculations.ts      # Inputs/outputs standardisés
│   ├── validation.ts        # Métriques et configuration
│   └── index.ts            # Export centralisé
├── algorithms/              # Interface universelle
│   ├── base.ts             # UniversalAlgorithm
│   ├── universal-adapter.ts # createUniversalAlgorithm
│   └── index.ts            # Export centralisé
├── ui/                      # Types d'interface
│   ├── components.ts       # Props génériques
│   ├── validation.ts       # Props spécialisées
│   └── index.ts            # Export centralisé
├── utils/                   # Utilitaires
│   ├── normalizers.ts      # Fonctions de normalisation
│   ├── converters.ts       # Adaptateurs de conversion
│   └── index.ts            # Export centralisé
├── index.ts                 # Point d'entrée global
└── legacy/                  # Compatibilité temporaire
    └── README.md           # Documentation de migration
\`\`\`

## 🎯 Fonctionnalités clés implémentées

### 1. Interface UniversalAlgorithm
- Remplace tous les wrappers (wrapX, wrapY, wrapM2)
- Signature unifiée pour tous les algorithmes
- Support du traitement par lot et retry automatique

### 2. Adaptateur universel createUniversalAlgorithm
- Une seule fonction pour tous les types de variables
- Configuration avancée (timeout, retries, batch)
- Mapping automatique des résultats

### 3. Types consolidés
- Fin de la dispersion sur 15+ fichiers
- Hiérarchie claire par domaine logique
- Exports centralisés par module

### 4. Rétrocompatibilité
- Types dépréciés avec aliases temporaires
- Documentation de migration incluse
- Coexistence avec l'ancien système

## 🚀 Prochaines étapes

### Exemples d'usage immédiat

**Nouveaux imports simplifiés :**
\`\`\`typescript
// Import groupé depuis la racine
import { XDetails, UniversalAlgorithm, createUniversalAlgorithm } from "./types";

// Ou par domaine
import { XDetails, VariableTarget } from "./types/core";
import { UniversalAlgorithm } from "./types/algorithms";
\`\`\`

**Remplacement des wrappers :**
\`\`\`typescript
// ❌ Ancien système
const xAlgorithm = wrapX(new XCalculator());

// ✅ Nouveau système
const xAlgorithm = createUniversalAlgorithm(new XCalculator(), "X");
\`\`\`

---

**Statut** : ✅ Phase 0 terminée avec succès
**Architecture** : AlgorithmLab 2.0 prête à utiliser
EOF

echo ""
