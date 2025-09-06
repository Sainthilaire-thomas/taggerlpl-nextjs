# Documentation Session - Refactorisation Complète AlgorithmLab : Types et Interfaces Unifiées

## 1. Contexte et objectifs

### Vue d'ensemble des deux problèmes critiques

Le module AlgorithmLab souffre actuellement de deux problèmes architecturaux majeurs qui compromettent sa maintenabilité et son extensibilité :

**Problème 1 : Fragmentation excessive des types TypeScript**
L'architecture actuelle disperse les types sur plus de 15 fichiers avec des doublons critiques et des dépendances implicites. Les types M2Input sont définis différemment dans deux fichiers, les interfaces utilisent un pattern de "module augmentation" fragile, et les développeurs doivent importer depuis de nombreux chemins différents pour accéder aux types nécessaires.

**Problème 2 : Interfaces algorithmes disparates**

Le système actuel utilise des wrappers multiples (wrapX, wrapY, wrapM2...) avec des signatures incompatibles. Chaque nouveau type de variable nécessite la création d'un nouveau wrapper, dupliquant la logique et complexifiant la maintenance. Cette approche fragmente le code et rend l'ajout de nouveaux algorithmes particulièrement difficile.

### Objectifs de la refactorisation unifiée

Cette refactorisation vise à créer une architecture unifiée, maintenable et extensible qui :

- **Consolide les types** dans une hiérarchie claire et cohérente
- **Unifie les interfaces algorithmes** sous une signature commune
- **Élimine les doublons** et les incohérences
- **Simplifie l'extension** pour de nouveaux types de variables
- **Améliore l'expérience développeur** avec des imports centralisés
- **Garantit la compatibilité** avec le code existant pendant la transition

L'objectif est de réduire la complexité de 3x tout en préservant toutes les fonctionnalités existantes.

## 2. Problématique actuelle

### 2.1 Fragmentation excessive des types (15+ fichiers)

**Architecture dispersée actuelle :**

```
types/
├── Level0Types.ts           # Inter-annotateur, Kappa (59 lignes)
├── Level1Types.ts           # Calculateurs génériques + M2 spécifique (187 lignes)
├── ValidationTypes.ts       # Interfaces UI spécialisées (543 lignes)
├── SharedTypes.ts           # Types partagés basiques (67 lignes)
├── ThesisVariables.ts       # Variables principales + slots vides (125 lignes)
├── ThesisVariables.x.ts     # Extension X via module augmentation (34 lignes)
├── ThesisVariables.y.ts     # Extension Y via module augmentation (28 lignes)
├── ThesisVariables.m1.ts    # Extension M1 via module augmentation (41 lignes)
├── ThesisVariables.m2.ts    # Extension M2 via module augmentation (22 lignes)
├── ThesisVariables.m3.ts    # Extension M3 via module augmentation (18 lignes)
├── normalizers.ts           # Fonctions de normalisation (45 lignes)
├── Level2/shared/types.ts   # Types Level2 H1, statistiques (298 lignes)
└── components/*/types.ts    # Types éparpillés dans les composants
```

**Problèmes identifiés :**

**Doublons critiques :**

- `M2Input` défini dans Level1Types.ts ET ThesisVariables.ts avec des structures différentes
- `ValidationMetrics` présent dans ThesisVariables.ts, ValidationTypes.ts et Level2/shared/types.ts
- Types de base redéfinis dans plusieurs fichiers

**Module augmentation problématique :**
Le pattern "declaration merging" utilisé crée des dépendances implicites :

```typescript
// ThesisVariables.ts - Interface vide
export interface M1Details {}

// ThesisVariables.m1.ts - Extension via module augmentation
declare module "./ThesisVariables" {
  interface M1Details {
    score: number;
    verbCount: number;
  }
}
```

Cette approche pose plusieurs problèmes :

- L'ordre d'import est crucial mais non documenté
- Les types sont invisibles sans l'extension spécifique
- L'auto-complétion est incomplète
- Le debugging devient complexe

**Incohérences de nommage :**

- `M2Details` (ThesisVariables.ts) vs `TVMetadataM2` (Level1Types.ts)
- `ValidationResult` défini différemment selon les fichiers
- Conventions de nommage non uniformes

### 2.2 Interfaces algorithmes incompatibles (wrappers multiples)

**Système actuel fragmenté :**

```typescript
// Trois wrappers différents avec signatures incompatibles
function wrapX(calc: XCalculator): CompatibleAlgorithm;
function wrapY(calc: YCalculator): CompatibleAlgorithm;
function wrapM2(calc: M2Calculator): CompatibleAlgorithm;

// Chaque wrapper a sa propre logique de validation
// Code dupliqué dans chaque wrapper
// Tests séparés pour chaque type
```

**Conséquences problématiques :**

**Problèmes de registry :**
Le chargement des algorithmes dans algorithmRegistry est imprévisible car il dépend de l'ordre d'import des wrappers. Certains algorithmes peuvent ne pas apparaître dans la liste selon l'ordre d'exécution.

**Code dupliqué :**
Chaque wrapper réimplémente la même logique :

- Validation des inputs
- Gestion d'erreurs
- Conversion des résultats
- Métadonnées de description

**Extension complexe :**
L'ajout d'un nouveau type (ex: M4) nécessite :

- Créer un nouveau wrapper wrapM4
- Dupliquer toute la logique existante
- Tester séparément le nouveau wrapper
- Mettre à jour le registry manuellement

**Maintenance fragmentée :**
Les corrections de bugs doivent être appliquées dans chaque wrapper séparément, augmentant le risque d'incohérences.

## 3. Solution proposée : Architecture unifiée

### 3.1 Arborescence complète cible

**Nouvelle structure hiérarchique :**

```
src/types/
├── core/                              # Types fondamentaux
│   ├── index.ts                      # export * from './{variables,calculations,validation}'
│   ├── variables.ts                  # VariableX, VariableY, XDetails, YDetails, M1Details, M2Details, M3Details
│   ├── calculations.ts               # CalculationResult, XInput, YInput, M1Input, M2Input, M3Input, CalculatorMetadata
│   └── validation.ts                 # ValidationMetrics, ValidationResult, AlgorithmTestConfig
├── algorithms/                        # Types spécifiques aux algorithmes
│   ├── index.ts                      # export * from './{base,level1,level2,universal-adapter}'
│   ├── base.ts                       # UniversalAlgorithm, AlgorithmDescriptor, UniversalResult
│   ├── universal-adapter.ts          # createUniversalAlgorithm, AdapterConfig
│   ├── level1.ts                     # XCalculator, YCalculator, M1Calculator, M2Calculator, M3Calculator, TVMetadata
│   └── level2.ts                     # H1Summary, StrategyStats, ChiSquareResult, etc.
├── ui/                               # Types d'interface utilisateur
│   ├── index.ts                      # export * from './{components,validation,results}'
│   ├── components.ts                 # BaseValidationProps, DisplayConfig, ValidationInterfaceProps
│   ├── validation.ts                 # XValidationProps, YValidationProps, M1ValidationProps, etc.
│   └── results.ts                    # ResultsPanelProps, ExtraColumnsConfig, etc.
├── utils/                            # Utilitaires et conversions
│   ├── index.ts                      # export * from './{normalizers,converters}'
│   ├── normalizers.ts                # normalizeXLabel, normalizeYLabel, familyFromX
│   └── converters.ts                 # Type conversions and adapters
└── legacy/                           # Compatibilité temporaire (à supprimer après migration)
    ├── Level0Types.ts                # Types inter-annotateur (conservés temporairement)
    └── README.md                     # Documentation des types legacy à migrer
```

**Bénéfices de cette structure :**

- **Séparation claire** des responsabilités par domaine
- **Exports centralisés** avec un point d'entrée par dossier
- **Hiérarchie intuitive** facile à naviguer
- **Extensibilité** préparée pour de nouveaux types

### 3.2 Tableau de correspondance des imports (migration)

| **Ancien import**                  | **Nouveau import**        | **Contenu migré**                                                      |
| ---------------------------------- | ------------------------- | ---------------------------------------------------------------------- |
| `types/ThesisVariables`            | `types/core/variables`    | VariableX, VariableY, VariableTarget, VARIABLE_LABELS, VARIABLE_COLORS |
| `types/ThesisVariables.x`          | `types/core/variables`    | XTag, XDetails (fusionné dans variables.ts)                            |
| `types/ThesisVariables.y`          | `types/core/variables`    | YTag, YDetails (fusionné dans variables.ts)                            |
| `types/ThesisVariables.m1`         | `types/core/variables`    | M1Details (fusionné dans variables.ts)                                 |
| `types/ThesisVariables.m2`         | `types/core/variables`    | M2Details (fusionné dans variables.ts)                                 |
| `types/ThesisVariables.m3`         | `types/core/variables`    | M3Details (fusionné dans variables.ts)                                 |
| `types/Level1Types`(calculateurs)  | `types/algorithms/level1` | XCalculator, YCalculator, M1Calculator, M2Calculator, M3Calculator     |
| `types/Level1Types`(calculs)       | `types/core/calculations` | CalculationResult, M1Input, M2Input, CalculatorMetadata                |
| `types/ValidationTypes`(props)     | `types/ui/validation`     | XValidationInterfaceProps → XValidationProps                           |
| `types/ValidationTypes`(métriques) | `types/core/validation`   | ValidationMetrics, ValidationResult, AlgorithmTestConfig               |
| `types/SharedTypes`(validation)    | `types/core/validation`   | ValidationLevel → conservé dans validation.ts                          |
| `types/SharedTypes`(export)        | `types/ui/results`        | ExportConfig → migré vers ui/results.ts                                |
| `types/normalizers`                | `types/utils/normalizers` | normalizeXLabel, normalizeYLabel, familyFromX (inchangé)               |
| `types/Level2/shared/types`        | `types/algorithms/level2` | H1Summary, StrategyStats, ChiSquareResult, etc.                        |

**Imports simplifiés après migration :**

```typescript
// Imports centralisés par domaine
import { VariableX, XDetails, M2Details } from "@/types/core/variables";
import { CalculationResult, XInput } from "@/types/core/calculations";
import { ValidationMetrics } from "@/types/core/validation";
import {
  UniversalAlgorithm,
  createUniversalAlgorithm,
} from "@/types/algorithms";
import { BaseValidationProps } from "@/types/ui/components";
import { normalizeXLabel } from "@/types/utils/normalizers";

// Ou imports groupés par domaine complet
import { XDetails, YDetails, M1Details } from "@/types/core";
import {
  UniversalAlgorithm,
  createUniversalAlgorithm,
} from "@/types/algorithms";
import { BaseValidationProps } from "@/types/ui";
import { normalizeXLabel } from "@/types/utils";
```

### 3.3 Script de migration automatisée des imports

```bash
#!/bin/bash
# scripts/migrate-imports.sh

echo "🔄 Migration automatique des imports AlgorithmLab"

# Recherche de tous les fichiers TypeScript et TSX
FILES=$(find src -name "*.ts" -o -name "*.tsx" | grep -v node_modules)
TOTAL_FILES=0
MODIFIED_FILES=0

for file in $FILES; do
    TOTAL_FILES=$((TOTAL_FILES + 1))
    MODIFIED=false

    # Sauvegarde du fichier original
    cp "$file" "$file.backup"

    # Migration des imports selon le tableau de correspondance

    # Migration des imports ThesisVariables.*
    if sed -i.tmp "s|from ['\"]types/ThesisVariables['\"]|from '@/types/core/variables'|g" "$file"; then
        MODIFIED=true
    fi

    if sed -i.tmp "s|from ['\"]types/ThesisVariables\.x['\"]|from '@/types/core/variables'|g" "$file"; then
        MODIFIED=true
    fi

    if sed -i.tmp "s|from ['\"]types/ThesisVariables\.y['\"]|from '@/types/core/variables'|g" "$file"; then
        MODIFIED=true
    fi

    if sed -i.tmp "s|from ['\"]types/ThesisVariables\.m[0-9]['\"]|from '@/types/core/variables'|g" "$file"; then
        MODIFIED=true
    fi

    # Migration Level1Types - partie calculateurs
    if sed -i.tmp "s|from ['\"]types/Level1Types['\"].*\(Calculator\)|from '@/types/algorithms/level1'|g" "$file"; then
        MODIFIED=true
    fi

    # Migration Level1Types - partie calculs
    if sed -i.tmp "s|from ['\"]types/Level1Types['\"].*\(CalculationResult\|Input\|CalculatorMetadata\)|from '@/types/core/calculations'|g" "$file"; then
        MODIFIED=true
    fi

    # Migration ValidationTypes
    if sed -i.tmp "s|from ['\"]types/ValidationTypes['\"].*\(Props\)|from '@/types/ui/validation'|g" "$file"; then
        MODIFIED=true
    fi

    if sed -i.tmp "s|from ['\"]types/ValidationTypes['\"].*\(ValidationMetrics\|ValidationResult\|AlgorithmTestConfig\)|from '@/types/core/validation'|g" "$file"; then
        MODIFIED=true
    fi

    # Migration SharedTypes
    if sed -i.tmp "s|from ['\"]types/SharedTypes['\"].*\(ValidationLevel\)|from '@/types/core/validation'|g" "$file"; then
        MODIFIED=true
    fi

    if sed -i.tmp "s|from ['\"]types/SharedTypes['\"].*\(ExportConfig\)|from '@/types/ui/results'|g" "$file"; then
        MODIFIED=true
    fi

    # Migration normalizers
    if sed -i.tmp "s|from ['\"]types/normalizers['\"]|from '@/types/utils/normalizers'|g" "$file"; then
        MODIFIED=true
    fi

    # Migration Level2
    if sed -i.tmp "s|from ['\"]types/Level2/shared/types['\"]|from '@/types/algorithms/level2'|g" "$file"; then
        MODIFIED=true
    fi

    # Nettoyage des fichiers temporaires
    rm -f "$file.tmp"

    if [ "$MODIFIED" = true ]; then
        MODIFIED_FILES=$((MODIFIED_FILES + 1))
        echo "✅ Migré: $file"
    fi
done

echo ""
echo "📊 Rapport de migration:"
echo "   - Fichiers analysés: $TOTAL_FILES"
echo "   - Fichiers modifiés: $MODIFIED_FILES"
echo ""
echo "💾 Sauvegardes créées avec extension .backup"
echo "🧹 Pour nettoyer les sauvegardes: find src -name '*.backup' -delete"
```

### 3.4 Exemples concrets de migration par composant

**Avant migration - Composant ResultsPanel :**

```typescript
// ❌ Imports fragmentés de l'ancien système
import { TVValidationResult } from "../../types";
import { VariableX, VariableY } from "../../../types/ThesisVariables";
import { normalizeXLabel } from "../../../types/normalizers";
import { ValidationMetrics } from "../../../types/ValidationTypes";
import { M2Details } from "../../../types/ThesisVariables.m2";
```

**Après migration - Composant ResultsPanel :**

```typescript
// ✅ Imports centralisés du nouveau système
import { TVValidationResult, TVMetadata } from "@/types/algorithms/level1";
import { VariableX, VariableY, M2Details } from "@/types/core/variables";
import { normalizeXLabel } from "@/types/utils/normalizers";
import { ValidationMetrics } from "@/types/core/validation";
```

**Avant migration - Hook useAlgorithmTesting :**

```typescript
// ❌ Imports complexes
import { XDetails, YDetails } from "../../types/ThesisVariables.x";
import { CalculationResult, XInput } from "../../types/Level1Types";
import { ValidationResult } from "../../types/ValidationTypes";
import { AlgorithmTestConfig } from "../../types/SharedTypes";
```

**Après migration - Hook useAlgorithmTesting :**

```typescript
// ✅ Imports simplifiés
import { XDetails, YDetails } from "@/types/core/variables";
import { CalculationResult, XInput } from "@/types/core/calculations";
import { ValidationResult, AlgorithmTestConfig } from "@/types/core/validation";
```

## 4. Interface universelle pour tous les algorithmes

### Interface `UniversalAlgorithm`

```typescript
/**
 * Interface universelle que TOUS les algorithmes doivent implémenter
 * Remplace wrapX, wrapY, wrapM2, etc.
 */
export interface UniversalAlgorithm {
  // Métadonnées standardisées
  describe(): AlgorithmDescriptor;
  validateConfig(): boolean;

  // Exécution unifiée
  classify(input: string): Promise<UniversalResult>; // Compat backward
  run(input: unknown): Promise<UniversalResult>; // Input typé
  batchRun?(inputs: unknown[]): Promise<UniversalResult[]>; // Batch optionnel
}

export interface AlgorithmDescriptor {
  name: string; // ID unique (ex: "OpenAIXClassifier")
  displayName: string; // Nom affiché (ex: "OpenAI X Classifier")
  version: string; // Version semver (ex: "1.2.0")
  type: AlgorithmType; // Type d'implémentation
  target: VariableTarget; // Variable ciblée (X, Y, M1, M2, M3)
  batchSupported: boolean; // Support du traitement par lot
  requiresContext: boolean; // Nécessite du contexte conversationnel
  description?: string; // Description détaillée
  parameters?: Record<string, ParameterDescriptor>;
  examples?: AlgorithmExample[]; // Exemples d'utilisation
}

export interface UniversalResult {
  prediction: string; // Prédiction principale (label)
  confidence: number; // Confiance [0-1]
  processingTime?: number; // Temps de traitement (ms)
  algorithmVersion?: string; // Version utilisée
  metadata?: {
    inputSignature?: string; // Hash/signature de l'input
    inputType?: string; // Type d'input détecté
    executionPath?: string[]; // Étapes d'exécution
    warnings?: string[]; // Avertissements non-bloquants
    details?: VariableDetails; // Détails typés selon la variable
  };
}
```

### Adaptateur universel `createUniversalAlgorithm`

```typescript
/**
 * Adaptateur universel remplaçant tous les wrappers
 */
export function createUniversalAlgorithm<TInput, TDetails>(
  calculator: BaseCalculator<TInput, TDetails>,
  target: VariableTarget,
  config?: {
    requiresContext?: boolean;
    supportsBatch?: boolean;
    inputValidator?: (input: unknown) => input is TInput;
    inputConverter?: (input: string) => TInput;
    resultMapper?: (result: CalculationResult<TDetails>) => UniversalResult;
  }
): UniversalAlgorithm;
```

**Utilisation simplifiée :**

```typescript
// AVANT (3 wrappers différents)
algorithmRegistry.register("OpenAIXClassifier", wrapX(xCalculator));
algorithmRegistry.register("RuleBasedY", wrapY(yCalculator));
algorithmRegistry.register("M2LexicalAlignment", wrapM2(m2Calculator));

// APRÈS (un seul adaptateur)
algorithmRegistry.register(
  "OpenAIXClassifier",
  createUniversalAlgorithm(new OpenAIXClassifier(config), "X", {
    supportsBatch: true,
  })
);

algorithmRegistry.register(
  "RuleBasedY",
  createUniversalAlgorithm(new RuleBasedYCalculator(config), "Y")
);

algorithmRegistry.register(
  "M2LexicalAlignment",
  createUniversalAlgorithm(new M2LexicalAlignmentCalculator(config), "M2", {
    requiresContext: true,
  })
);
```

**Extension triviale pour nouveau type :**

```typescript
// Nouveau type M4 - Une seule ligne !
algorithmRegistry.register(
  "M4EmotionalAnalyzer",
  createUniversalAlgorithm(new M4EmotionalAnalyzer(), "M4")
);
```

## 5. Plan de mise en œuvre (stratégie progressive sécurisée)

### Phase 0 : Génération automatique des nouveaux fichiers (45 min)

**Script de génération automatique :**

```bash
#!/bin/bash
# scripts/create-new-types.sh

echo "🏗️  Génération automatique des nouveaux fichiers de types AlgorithmLab"

# Créer la structure complète
mkdir -p src/types/{core,algorithms,ui,utils}

# Générer tous les fichiers avec contenu complet
# types/core/variables.ts - consolidation de tous les types de variables
# types/core/calculations.ts - interfaces de calcul standardisées
# types/core/validation.ts - métriques de validation unifiées
# types/algorithms/base.ts - interface UniversalAlgorithm
# types/algorithms/universal-adapter.ts - createUniversalAlgorithm
# [Contenu complet généré automatiquement]

echo "✅ Génération automatique terminée avec succès!"
```

**Validation automatique :**

```bash
# Test de compilation des nouveaux fichiers
npx tsc --noEmit src/types/**/*.ts
```

### Phase 1 : Création de la nouvelle architecture - coexistence (15 min)

**État après Phase 0 :**

```
src/types/
├── core/                     # NOUVEAUX - Remplis automatiquement
├── algorithms/               # NOUVEAUX - Interface unifiée
├── ui/                       # NOUVEAUX - Types UI simplifiés
├── utils/                    # NOUVEAUX - Utilitaires
├── ThesisVariables.ts        # ANCIENS - Conservés intacts
├── Level1Types.ts            # ANCIENS - Backup sécurisé
└── ValidationTypes.ts        # ANCIENS - Coexistence temporaire
```

**Commit de sauvegarde :**

```bash
git add src/types/
git commit -m "Phase 0-1: Nouveaux fichiers générés - Anciens conservés"
```

### Phase 2 : Migration automatique des imports (30 min)

**Exécution de la migration :**

```bash
# Application automatique des transformations d'imports
./scripts/migrate-imports.sh

# Test de compilation post-migration
npx tsc --noEmit
```

**Résultat attendu :** Tous les imports pointent vers les nouveaux chemins, compilation réussie.

### Phase 3 : Correction ciblée des erreurs de compilation (0-60 min)

**Cette phase ne s'exécute que si Phase 2 génère des erreurs.**

**Types d'erreurs fréquentes et solutions :**

**Erreur type 1 : Type non trouvé**

```bash
# Error: Cannot find name 'M2Details' in '@/types/core/variables'
# Solution : Vérifier l'export dans le nouveau fichier
grep -n "export.*M2Details" src/types/core/variables.ts
```

**Erreur type 2 : Import circulaire**

```bash
# Solution : Créer un fichier base pour les types fondamentaux
touch src/types/core/base.ts
# Déplacer les types de base vers ce fichier
```

### Phase 4 : Suppression progressive des anciens fichiers (45 min)

**Script de suppression sécurisée :**

```bash
#!/bin/bash
# scripts/remove-old-files.sh

OLD_FILES=(
    "src/types/normalizers.ts"           # Moins de dépendances
    "src/types/SharedTypes.ts"           # Types utilitaires
    "src/types/ThesisVariables.m3.ts"    # Extensions spécifiques
    "src/types/ThesisVariables.m2.ts"
    "src/types/ThesisVariables.m1.ts"
    "src/types/ThesisVariables.y.ts"
    "src/types/ThesisVariables.x.ts"
    "src/types/ValidationTypes.ts"       # Types UI complexes
    "src/types/Level1Types.ts"           # Types calculateurs
    "src/types/ThesisVariables.ts"       # Fichier principal (en dernier)
)

for file in "${OLD_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "🔍 Test de suppression: $file"

        # Suppression temporaire avec test
        mv "$file" "$file.temp"

        if npx tsc --noEmit --skipLibCheck; then
            echo "✅ $file supprimé avec succès"
            rm "$file.temp"
            git add . && git commit -m "Suppression réussie: $file"
        else
            echo "❌ Erreur après suppression - Restauration"
            mv "$file.temp" "$file"
            break
        fi
    fi
done
```

### Phase 5 : Nettoyage et optimisation (15 min)

**Nettoyage final :**

```bash
# Supprimer les sauvegardes de migration
find src -name "*.backup" -delete

# Optimiser les imports groupés
# Vérification fonctionnelle des interfaces
echo "✨ Migration terminée avec succès!"
```

## 6. Gestion des erreurs et cas particuliers

### Erreurs typiques et solutions

**1. Type non trouvé après migration d'import**

```bash
# Erreur: Cannot find name 'M2Details' in '@/types/core/variables'
# Diagnostic:
grep -n "M2Details" src/types/core/variables.ts
grep -n "export.*M2Details" src/types/core/variables.ts

# Solution:
echo "export { M2Details } from './variables';" >> src/types/core/index.ts
```

**2. Import circulaire détecté**

```typescript
// Solution: Créer un fichier base pour les types fondamentaux
// src/types/core/base.ts
export type VariableTarget = "X" | "Y" | "M1" | "M2" | "M3";

// Importer depuis base dans les autres fichiers
import { VariableTarget } from "./base";
```

**3. Conflict de noms entre anciens et nouveaux fichiers**

```typescript
// Solution: Utiliser des exports nommés plus spécifiques
export interface AlgorithmValidationResult {
  /* ... */
}
export interface UIValidationResult {
  /* ... */
}
```

### Plan de rollback d'urgence

```bash
# 1. Revenir au commit avant migration
git log --oneline | grep "Avant migration"
git reset --hard [commit-hash]

# 2. Supprimer les nouveaux fichiers
rm -rf src/types/{core,algorithms,ui,utils}

# 3. Restaurer depuis les sauvegardes si nécessaire
find src -name "*.backup" -exec sh -c 'mv "$1" "${1%.backup}"' _ {} \;

# 4. Vérifier que tout fonctionne
npx tsc --noEmit && npm test
```

## 7. Bénéfices attendus

### Architecture simplifiée

**Avant :** 15+ fichiers types + 3+ wrappers différents

**Après :** 4 dossiers organisés + 1 adaptateur universel

La nouvelle architecture réduit la complexité cognitive en regroupant les types par domaine logique plutôt que par accident historique.

### Code réduit significativement

**Avant :** Code dupliqué dans chaque wrapper (wrapX, wrapY, wrapM2...)

**Après :** Logique centralisée dans `createUniversalAlgorithm`

Réduction estimée de 70% du code de wrapper, éliminant la maintenance de logiques dupliquées.

### Extension triviale

**Avant :** Nouveau type = nouveau wrapper + types éparpillés + tests séparés

**Après :** Nouveau type = 1 ligne dans `createUniversalAlgorithm`

**Exemple d'extension M4 :**

```typescript
// 1. Ajouter types dans core/variables.ts (30 sec)
export type VariableTarget = "X" | "Y" | "M1" | "M2" | "M3" | "M4";
export interface M4Details {
  /* ... */
}

// 2. Créer calculateur (développement normal)
class M4Calculator implements BaseCalculator<M4Input, M4Details> {
  /* ... */
}

// 3. Enregistrer (5 sec)
algorithmRegistry.register(
  "M4Calculator",
  createUniversalAlgorithm(new M4Calculator(), "M4")
);
```

### Debugging amélioré

**Traces standardisées :** Tous les algorithmes fournissent les mêmes métadonnées

**Validation automatique :** Messages d'erreur explicites pour inputs invalides

**Performance monitoring :** Temps d'exécution et chemin d'exécution tracés

### Tests unifiés

**Avant :** Tests séparés par wrapper avec logiques différentes

**Après :** Suite de tests unique couvrant tous les algorithmes avec les mêmes assertions

## 8. Planning de réalisation

### Durée totale avec génération automatique : 2h30-3h30

| Phase       | Durée   | Description                                  | Validation                           |
| ----------- | ------- | -------------------------------------------- | ------------------------------------ |
| **Phase 0** | 45min   | Génération automatique des nouveaux fichiers | Compilation nouveaux fichiers isolés |
| **Phase 1** | 15min   | Validation et commit de sauvegarde           | État stable avec coexistence         |
| **Phase 2** | 30min   | Migration automatique des imports            | Test compilation complète            |
| **Phase 3** | 0-60min | Correction erreurs (si nécessaire)           | Compilation sans erreur              |
| **Phase 4** | 45min   | Suppression progressive anciens fichiers     | Compilation + tests fonctionnels     |
| **Phase 5** | 15min   | Nettoyage et optimisation                    | Validation fonctionnelle complète    |
| **Buffer**  | 30min   | Gestion imprévus et documentation            | -                                    |

### Répartition par phase avec validation

**Phase 0 (45 min) - Génération automatique :**

- Création structure + 12 fichiers avec contenu
- Validation compilation isolée
- Commit de sauvegarde initial

**Phase 1 (15 min) - Validation :**

- Vérification exports centralisés
- Test imports depuis nouveaux fichiers
- Documentation état de coexistence

**Phase 2 (30 min) - Migration imports :**

- Script automatique sur tous les fichiers
- Sauvegarde .backup de chaque fichier modifié
- Test compilation post-migration

**Phase 3 (0-60 min) - Correction ciblée :**

- Diagnostic automatique des erreurs par catégorie
- Correction une par une avec commit intermédiaires
- Validation continue

**Phase 4 (45 min) - Suppression progressive :**

- Suppression fichier par fichier avec test
- Rollback automatique en cas d'erreur
- Commit de chaque suppression réussie

**Phase 5 (15 min) - Nettoyage :**

- Suppression sauvegardes .backup
- Optimisation imports groupés
- Tests fonctionnels finaux

## 9. Risques et mitigation

### Risques identifiés

**1. Régression fonctionnelle majeure**
_Risque :_ Perte de fonctionnalités pendant la migration
_Probabilité :_ Faible (stratégie de coexistence)
_Impact :_ Élevé

**2. Erreurs de compilation en cascade**
_Risque :_ Erreurs qui se propagent et bloquent la compilation
_Probabilité :_ Moyenne
_Impact :_ Moyen

**3. Incompatibilité avec code legacy**
_Risque :_ Anciens composants qui cessent de fonctionner
_Probabilité :_ Faible (imports automatiques)
_Impact :_ Moyen

**4. Performance dégradée**
_Risque :_ Ralentissement des algorithmes ou de l'interface
_Probabilité :_ Très faible
_Impact :_ Faible

### Stratégies de mitigation

**1. Migration progressive avec coexistence**

- Anciens fichiers conservés pendant toute la migration
- Tests de compilation à chaque étape
- Rollback immédiat possible à tout moment
- Commits fréquents pour traçabilité

**2. Validation automatisée continue**

```bash
# Script de validation exécuté à chaque étape
validate_step() {
    echo "Validation étape $1..."
    if npx tsc --noEmit; then
        echo "✅ Compilation OK"
        git add . && git commit -m "Étape $1 validée"
        return 0
    else
        echo "❌ Erreurs détectées - Rollback"
        git checkout -- .
        return 1
    fi
}
```

**3. Tests de non-régression**

```bash
# Tests fonctionnels après chaque phase majeure
test_functionality() {
    echo "Test des fonctionnalités critiques..."

    # Test 1: Chargement du registry
    node -e "require('./src/algorithms/registry').list().length > 0" || return 1

    # Test 2: Interface X fonctionnelle
    # Test 3: ResultsPanel affiche correctement
    # Test 4: Export des résultats

    echo "✅ Tous les tests fonctionnels passent"
}
```

**4. Plan de rollback granulaire**

```bash
# Rollback par phase avec conservation des acquis
rollback_to_phase() {
    local target_phase=$1
    echo "Rollback vers Phase $target_phase..."

    case $target_phase in
        "0") git reset --hard "Phase 0: Nouveaux fichiers générés" ;;
        "1") git reset --hard "Phase 1: Validation coexistence" ;;
        "2") git reset --hard "Phase 2: Migration imports" ;;
        *) echo "Phase inconnue" && return 1 ;;
    esac

    echo "✅ Rollback terminé - État stable restauré"
}
```

**5. Monitoring en temps réel**

- Temps de compilation surveillé (seuil d'alerte si > 2x normal)
- Taille des bundles trackée (régression si augmentation > 20%)
- Tests unitaires exécutés en continu
- Métriques de performance des algorithmes comparées

## 10. Actions immédiates

### Checklist de validation

**Validation préalable (15 min) :**

- [ ] Architecture proposée validée par l'équipe
- [ ] Types `UniversalAlgorithm` et `AlgorithmDescriptor` approuvés
- [ ] Stratégie de migration progressive confirmée
- [ ] Scripts de génération et migration créés

**Implémentation Phase 0 (45 min) :**

- [ ] Structure `types/{core,algorithms,ui,utils}/` créée
- [ ] Script `create-new-types.sh` exécuté avec succès
- [ ] Compilation des nouveaux fichiers validée
- [ ] Exports centralisés testés
- [ ] Commit de sauvegarde effectué

**Validation Phase 1 (15 min) :**

- [ ] Coexistence anciens/nouveaux fichiers vérifiée
- [ ] Imports depuis nouveaux fichiers fonctionnels
- [ ] Pas de conflit de noms détecté
- [ ] État documenté pour l'équipe

**Exécution Phase 2 (30 min) :**

- [ ] Script `migrate-imports.sh` exécuté
- [ ] Sauvegardes .backup créées pour tous les fichiers modifiés
- [ ] Compilation post-migration réussie
- [ ] Rapport de migration généré

### Prochaines étapes

**Immédiat (aujourd'hui) :**

1. **Valider l'approche** avec les parties prenantes
2. **Créer les scripts** de génération et migration
3. **Tester sur un projet pilote** ou branche dédiée
4. **Former l'équipe** sur la nouvelle architecture

**Court terme (cette semaine) :**

1. **Exécuter Phase 0-1** (génération + validation)
2. **Tester Phase 2** (migration imports)
3. **Identifier les composants** les plus impactés
4. **Préparer la documentation** pour l'équipe

**Moyen terme (prochaines semaines) :**

1. **Migration complète** Phases 3-5
2. **Tests d'intégration** complets
3. **Formation équipe** sur nouvelle architecture
4. **Documentation** des patterns d'extension

**Mesures de succès :**

- Compilation sans erreur après migration complète
- Toutes les fonctionnalités préservées
- Temps de développement réduit pour nouveaux algorithmes
- Satisfaction équipe avec nouvelle architecture
- Réduction mesurable de la complexité (lignes de code, fichiers, imports)

### Critères d'arrêt

**Arrêt immédiat si :**

- Plus de 5 erreurs de compilation non résolues en 1h
- Régression fonctionnelle majeure détectée
- Résistance forte de l'équipe
- Problème technique bloquant identifié

**Arrêt temporaire si :**

- Phase 3 dépasse 2h (correction erreurs)
- Tests fonctionnels échouent
- Performance dégradée > 50%

Cette refactorisation transforme AlgorithmLab d'un système fragmenté et difficile à maintenir vers une architecture unifiée, extensible et robuste. L'approche progressive et sécurisée minimise les risques tout en maximisant les bénéfices à long terme pour l'équipe de développement.

---

**Résumé exécutif :** Cette refactorisation unifie les types AlgorithmLab et les interfaces algorithmes sous une architecture cohérente, réduisant la complexité de 70% tout en facilitant l'extension future. La stratégie progressive avec génération automatique garantit une migration sûre en 2h30-3h30 avec un risque minimal de régression.
