# Session de Migration AlgorithmLab - Guide Complet d'Exécution

> **Session de migration des types AlgorithmLab vers l'architecture unifiée**
>
> Durée estimée : 2h30-3h30
>
> Prérequis : Node.js, TypeScript, jq installé
>
> **IMPORTANT** : Cette session doit être exécutée d'une traite pour maintenir la cohérence

---

## 📋 Vue d'ensemble de la session

### Objectifs de cette session

- **Migrer** tous les imports de types AlgorithmLab vers la nouvelle architecture unifiée
- **Consolider** 15+ fichiers de types en 4 dossiers organisés
- **Éliminer** les doublons et incohérences (M2Input, ValidationMetrics, etc.)
- **Unifier** les interfaces algorithmes sous `createUniversalAlgorithm`
- **Préserver** 100% des fonctionnalités existantes

### Stratégie de migration (3 étapes sécurisées)

1. **Audit complet** des imports existants → `old-imports-audit.json`
2. **Transformation contrôlée** basée sur des règles → Backup automatique
3. **Validation et nettoyage** → Suppression progressive des anciens fichiers

### Architecture cible

```
src/types/
├── core/           # Variables, calculs, validation
├── algorithms/     # Interface unifiée, adaptateur universel
├── ui/            # Props validation, composants
└── utils/         # Normalisation, conversion
```

---

## 🚀 Phase 0 : Préparation de l'environnement (15 min)

### Étape 0.1 : Vérification des prérequis

bash

```bash
# Terminal - Vérifier les outils nécessaires
node --version    # Doit afficher v18+
npm --version     # Doit afficher 8+
npx tsc --version # Doit afficher 4.9+
jq --version      # Doit afficher jq-1.6+

# Si jq n'est pas installé :
# Ubuntu/Debian : sudo apt install jq
# macOS : brew install jq
# Windows : winget install jq
```

### Étape 0.2 : Vérification de l'état initial

bash

```bash
# Terminal - État du projet avant migration
cd /path/to/taggerlpl-nextjs

# Test de compilation initial (OBLIGATOIRE)
npx tsc --noEmit

# ✅ Résultat attendu : Compilation réussie
# ❌ Si erreurs : Les corriger AVANT de continuer la migration
```

### Étape 0.3 : Création de la structure de migration

bash

```bash
# Terminal - Créer les dossiers de travail
mkdir -p migration/{audit,backups,scripts}
mkdir -p src/types/{core,algorithms,ui,utils}

echo"📁 Structure de migration créée"
ls -la migration/
```

### Étape 0.4 : Installation des scripts de migration

Créer le fichier `migration/scripts/audit-existing-imports.sh` :

bash

```bash
#!/bin/bash
# migration/scripts/audit-existing-imports.sh
# Génère un audit complet des imports AlgorithmLab existants

echo"🔍 Audit des imports AlgorithmLab existants"
echo"============================================"

AUDIT_DIR="migration/audit"
AUDIT_FILE="$AUDIT_DIR/old-imports-audit.json"
mkdir -p "$AUDIT_DIR"

# Initialiser le fichier JSON d'audit
cat>"$AUDIT_FILE"<<'EOF'
{
  "audit_metadata": {
    "generated_at": "",
    "project_root": "",
    "total_files_scanned": 0,
    "total_imports_found": 0,
    "algorithm_lab_imports_count": 0
  },
  "imports_by_file": {},
  "imports_summary": {
    "by_source_path": {},
    "by_import_type": {
      "default_imports": [],
      "named_imports": [],
      "namespace_imports": [],
      "type_imports": []
    },
    "most_used_imports": {},
    "deprecated_patterns": [],
    "potential_conflicts": []
  },
  "transformation_candidates": {}
}
EOF

# Fonction pour extraire les imports d'un fichier
extract_imports(){
localfile="$1"
localtemp_file=$(mktemp)

# Recherche des imports avec regex avancée
grep -n "import.*from.*['\"].*types.*['\"]""$file">"$temp_file"2>/dev/null ||true
grep -n "import.*from.*['\"].*AlgorithmLab.*['\"]""$file">>"$temp_file"2>/dev/null ||true
grep -n "import.*from.*['\"].*ThesisVariables.*['\"]""$file">>"$temp_file"2>/dev/null ||true
grep -n "import.*from.*['\"].*Level[0-9]Types.*['\"]""$file">>"$temp_file"2>/dev/null ||true
grep -n "import.*from.*['\"].*ValidationTypes.*['\"]""$file">>"$temp_file"2>/dev/null ||true
grep -n "import.*from.*['\"].*SharedTypes.*['\"]""$file">>"$temp_file"2>/dev/null ||true
grep -n "import.*from.*['\"].*normalizers.*['\"]""$file">>"$temp_file"2>/dev/null ||true

cat"$temp_file"
rm"$temp_file"
}

# Fonction pour analyser un import spécifique
analyze_import(){
localline="$1"
localfile="$2"
localline_number=$(echo"$line"|cut -d: -f1)
localimport_content=$(echo"$line"|cut -d: -f2-)

# Extraction du type d'import
localimport_type="unknown"
localimported_names=""
localsource_path=""

ifecho"$import_content"|grep -q "import {";then
import_type="named"
imported_names=$(echo"$import_content"|sed -n 's/.*import {\([^}]*\)}.*/\1/p'|tr -d ' ')
elifecho"$import_content"|grep -q "import \* as";then
import_type="namespace"
imported_names=$(echo"$import_content"|sed -n 's/.*import \* as \([^ ]*\).*/\1/p')
elifecho"$import_content"|grep -q "import type";then
import_type="type_only"
imported_names=$(echo"$import_content"|sed -n 's/.*import type {\([^}]*\)}.*/\1/p'|tr -d ' ')
else
import_type="default"
imported_names=$(echo"$import_content"|sed -n 's/import \([^ ]*\) from.*/\1/p')
fi

source_path=$(echo"$import_content"|sed -n "s/.*from ['\"]\\([^'\"]*\\)['\"].*/\\1/p")

# Créer l'objet JSON pour cet import
cat<<EOF
        {
          "line_number": $line_number,
          "type": "$import_type",
          "imported_names": "$imported_names",
          "source_path": "$source_path",
          "full_line": $(echo"$import_content"| jq -R .),
          "is_algorithm_lab": $(ifecho"$source_path"|grep -qE "(types|AlgorithmLab|ThesisVariables|Level[0-9]Types|ValidationTypes|SharedTypes|normalizers)";thenecho"true";elseecho"false";fi)
        }
EOF
}

# Scanner tous les fichiers TypeScript/TSX
echo"🔍 Recherche des fichiers TypeScript/TSX..."
FILES=$(find src -name "*.ts" -o -name "*.tsx"|grep -v node_modules |grep -v ".next"|sort)
TOTAL_FILES=0
TOTAL_IMPORTS=0
ALGORITHM_LAB_IMPORTS=0

# Début du traitement
temp_json=$(mktemp)
echo'{'>"$temp_json"
echo'  "audit_metadata": {'>>"$temp_json"
echo"    \"generated_at\": \"$(date -Iseconds)\",">>"$temp_json"
echo"    \"project_root\": \"$(pwd)\",">>"$temp_json"
echo'    "total_files_scanned": 0,'>>"$temp_json"
echo'    "total_imports_found": 0,'>>"$temp_json"
echo'    "algorithm_lab_imports_count": 0'>>"$temp_json"
echo'  },'>>"$temp_json"
echo'  "imports_by_file": {'>>"$temp_json"

FIRST_FILE=true

forfilein$FILES;do
TOTAL_FILES=$((TOTAL_FILES +1))

echo"📄 Analyse: $file"

# Extraire tous les imports de ce fichier
imports=$(extract_imports "$file")

if[ -n "$imports"];then
# Ajouter une virgule si ce n'est pas le premier fichier
if["$FIRST_FILE"=false];then
echo','>>"$temp_json"
fi
FIRST_FILE=false

echo"    \"$file\": {">>"$temp_json"
echo'      "imports": ['>>"$temp_json"

FIRST_IMPORT=true
whileIFS=read -r import_line;do
if[ -n "$import_line"];then
TOTAL_IMPORTS=$((TOTAL_IMPORTS +1))

# Ajouter une virgule si ce n'est pas le premier import
if["$FIRST_IMPORT"=false];then
echo','>>"$temp_json"
fi
FIRST_IMPORT=false

# Analyser l'import et l'ajouter au JSON
                analyze_import "$import_line""$file">>"$temp_json"

# Compter les imports AlgorithmLab
ifecho"$import_line"|grep -qE "(types|AlgorithmLab|ThesisVariables|Level[0-9]Types|ValidationTypes|SharedTypes|normalizers)";then
ALGORITHM_LAB_IMPORTS=$((ALGORITHM_LAB_IMPORTS +1))
fi
fi
done<<<"$imports"

echo'      ]'>>"$temp_json"
echo'    }'>>"$temp_json"
fi
done

echo'  },'>>"$temp_json"
echo'  "imports_summary": {},'>>"$temp_json"
echo'  "transformation_candidates": {}'>>"$temp_json"
echo'}'>>"$temp_json"

# Mettre à jour les métadonnées
jq ".audit_metadata.total_files_scanned = $TOTAL_FILES |
    .audit_metadata.total_imports_found = $TOTAL_IMPORTS |
    .audit_metadata.algorithm_lab_imports_count = $ALGORITHM_LAB_IMPORTS""$temp_json">"$AUDIT_FILE"

rm"$temp_json"

echo""
echo"✅ Audit terminé avec succès!"
echo"📊 Résultats:"
echo"   - Fichiers analysés: $TOTAL_FILES"
echo"   - Imports totaux trouvés: $TOTAL_IMPORTS"
echo"   - Imports AlgorithmLab: $ALGORITHM_LAB_IMPORTS"
echo""
echo"📁 Fichier d'audit généré: $AUDIT_FILE"
```

bash

```bash
# Terminal - Rendre le script exécutable
chmod +x migration/scripts/audit-existing-imports.sh
```

---

## 🔍 Phase 1 : Audit des imports existants (45 min)

### Étape 1.1 : Génération de l'audit

bash

```bash
# Terminal - Exécuter l'audit des imports
cd /path/to/taggerlpl-nextjs
./migration/scripts/audit-existing-imports.sh

# ✅ Résultat attendu :
# 🔍 Audit des imports AlgorithmLab existants
# ============================================
# 📄 Analyse: src/components/...
# ✅ Audit terminé avec succès!
# 📊 Résultats:
#    - Fichiers analysés: 45
#    - Imports totaux trouvés: 127
#    - Imports AlgorithmLab: 89
```

### Étape 1.2 : Analyse des résultats de l'audit

bash

```bash
# Terminal - Analyser les imports les plus fréquents
cat migration/audit/old-imports-audit.json | jq '.imports_by_file | to_entries[] | .value.imports[] | .source_path'|sort|uniq -c |sort -nr

# ✅ Résultat attendu (exemple) :
#      25 "types/ThesisVariables"
#      18 "types/Level1Types"
#      12 "types/ValidationTypes"
#       8 "types/SharedTypes"
#       6 "types/normalizers"
#       4 "types/ThesisVariables.x"
#       3 "types/ThesisVariables.m2"
```

bash

```bash
# Terminal - Identifier les types les plus importés
cat migration/audit/old-imports-audit.json | jq -r '.imports_by_file | to_entries[] | .value.imports[] | select(.type == "named") | .imported_names'|tr',''\n'|tr -d ' '|sort|uniq -c |sort -nr |head -10

# ✅ Résultat attendu (exemple) :
#      15 VariableX
#      12 XDetails
#      10 ValidationMetrics
#       9 M2Details
#       8 CalculationResult
```

### Étape 1.3 : Création du fichier de règles de transformation

Créer le fichier `migration/audit/import-transformation-rules.json` :

json

```json
{
  "transformation_metadata": {
    "version": "2.0.0",
    "created_at": "2025-09-06T12:00:00Z",
    "description": "Règles de transformation des imports AlgorithmLab vers architecture unifiée",
    "migration_strategy": "progressive",
    "rollback_supported": true
  },

  "source_path_mappings": {
    "description": "Mapping des anciens chemins vers les nouveaux",
    "mappings": {
      "types/ThesisVariables": "@/types/core/variables",
      "types/ThesisVariables.x": "@/types/core/variables",
      "types/ThesisVariables.y": "@/types/core/variables",
      "types/ThesisVariables.m1": "@/types/core/variables",
      "types/ThesisVariables.m2": "@/types/core/variables",
      "types/ThesisVariables.m3": "@/types/core/variables",
      "types/Level1Types": "@/types/algorithms/level1",
      "types/ValidationTypes": "@/types/ui/validation",
      "types/SharedTypes": "@/types/core/validation",
      "types/normalizers": "@/types/utils/normalizers",
      "types/Level2/shared/types": "@/types/algorithms/level2"
    }
  },

  "named_imports_mappings": {
    "description": "Mapping des imports nommés vers leurs nouveaux emplacements",
    "mappings": {
      "VariableX": "@/types/core/variables",
      "VariableY": "@/types/core/variables",
      "XTag": "@/types/core/variables",
      "YTag": "@/types/core/variables",
      "XDetails": "@/types/core/variables",
      "YDetails": "@/types/core/variables",
      "M1Details": "@/types/core/variables",
      "M2Details": "@/types/core/variables",
      "M3Details": "@/types/core/variables",
      "VariableTarget": "@/types/core/variables",

      "XInput": "@/types/core/calculations",
      "YInput": "@/types/core/calculations",
      "M1Input": "@/types/core/calculations",
      "M2Input": "@/types/core/calculations",
      "M3Input": "@/types/core/calculations",
      "CalculationResult": "@/types/core/calculations",
      "CalculatorMetadata": "@/types/core/calculations",

      "ValidationMetrics": "@/types/core/validation",
      "ValidationResult": "@/types/core/validation",
      "AlgorithmTestConfig": "@/types/core/validation",

      "XCalculator": "@/types/algorithms/level1",
      "YCalculator": "@/types/algorithms/level1",
      "M1Calculator": "@/types/algorithms/level1",
      "M2Calculator": "@/types/algorithms/level1",
      "M3Calculator": "@/types/algorithms/level1",
      "TVMetadata": "@/types/algorithms/level1",

      "UniversalAlgorithm": "@/types/algorithms/base",
      "AlgorithmDescriptor": "@/types/algorithms/base",
      "UniversalResult": "@/types/algorithms/base",
      "createUniversalAlgorithm": "@/types/algorithms/universal-adapter",

      "BaseValidationProps": "@/types/ui/components",
      "XValidationProps": "@/types/ui/validation",
      "YValidationProps": "@/types/ui/validation",
      "M2ValidationProps": "@/types/ui/validation",
      "DisplayConfig": "@/types/ui/components",
      "ResultsPanelProps": "@/types/ui/components",

      "normalizeXLabel": "@/types/utils/normalizers",
      "normalizeYLabel": "@/types/utils/normalizers",
      "familyFromX": "@/types/utils/normalizers",
      "familyFromY": "@/types/utils/normalizers"
    }
  },

  "validation_rules": {
    "description": "Règles de validation pre/post transformation",
    "pre_transformation": [
      {
        "rule": "compilation_success",
        "description": "Vérifier que le code compile avant transformation"
      }
    ],
    "post_transformation": [
      {
        "rule": "compilation_success",
        "description": "Vérifier que le code compile après transformation"
      },
      {
        "rule": "no_circular_dependencies",
        "description": "Vérifier l'absence de dépendances circulaires"
      }
    ]
  }
}
```

### Étape 1.4 : Validation de l'audit

bash

```bash
# Terminal - Valider la structure de l'audit
jq '.audit_metadata' migration/audit/old-imports-audit.json

# ✅ Résultat attendu :
# {
#   "generated_at": "2025-09-06T10:30:00+00:00",
#   "project_root": "/path/to/taggerlpl-nextjs",
#   "total_files_scanned": 45,
#   "total_imports_found": 127,
#   "algorithm_lab_imports_count": 89
# }
```

bash

```bash
# Terminal - Identifier les fichiers avec le plus d'imports à migrer
jq -r '.imports_by_file | to_entries[] | select(.value.imports | length > 0) | "\(.value.imports | length) imports - \(.key)"' migration/audit/old-imports-audit.json |sort -nr |head -5

# ✅ Résultat attendu (exemple) :
# 8 imports - src/components/AlgorithmLab/ValidationInterface.tsx
# 6 imports - src/hooks/useAlgorithmTesting.ts
# 5 imports - src/components/ResultsPanel/index.tsx
```

---

## 🔄 Phase 2 : Génération de la nouvelle architecture (30 min)

### Étape 2.1 : Génération automatique des nouveaux fichiers

Créer le script `migration/scripts/generate-new-types.sh` :

bash

```bash
#!/bin/bash
# migration/scripts/generate-new-types.sh
# Génère automatiquement tous les nouveaux fichiers de types

echo"🏗️  Génération des nouveaux fichiers de types AlgorithmLab"

# Créer la structure
mkdir -p src/types/{core,algorithms,ui,utils}

# Générer src/types/core/variables.ts
cat> src/types/core/variables.ts <<'EOF'
/**
 * @fileoverview Variables & détails AlgorithmLab — version unifiée et canonique
 */

export type VariableTarget = "X" | "Y" | "M1" | "M2" | "M3";

export type XTag =
  | "ENGAGEMENT"
  | "OUVERTURE"
  | "REFLET"
  | "EXPLICATION"
  | "CLOTURE"
  | "AUTRE_X";

export type YTag =
  | "CLIENT_POSITIF"
  | "CLIENT_NEUTRE"
  | "CLIENT_NEGATIF"
  | "CLIENT_QUESTION"
  | "CLIENT_SILENCE"
  | "AUTRE_Y";

export interface XDetails {
  family?: string;
  evidences?: string[];
  topProbs?: { label: string; prob: number }[];
  verbCount?: number;
  actionVerbs?: string[];
  pronounUsage?: {
    je: number;
    vous: number;
    nous: number;
  };
  questionMarkers?: string[];
  declarativeMarkers?: string[];
  effectiveness?: {
    clientResponse: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
    alignmentScore: number;
    nextTurnLabel?: string;
  };
}

export interface YDetails {
  family?: string;
  evidences?: string[];
  topProbs?: { label: string; prob: number }[];
  sentiment?: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  emotionalIntensity?: number;
  linguisticMarkers?: string[];
  responseType?: "ACCEPTANCE" | "RESISTANCE" | "INQUIRY" | "NEUTRAL";
  conversationalMetrics?: {
    latency: number;
    verbosity: number;
    coherence: number;
  };
}

export interface M1Details {
  value?: number;
  actionVerbCount?: number;
  totalTokens?: number;
  verbsFound?: string[];
  score?: number;
  verbCount?: number;
  averageWordLength?: number;
  sentenceComplexity?: number;
  lexicalDiversity?: number;
  syntacticComplexity?: number;
  semanticCoherence?: number;
}

export interface M2Details {
  value?: string | number;
  scale?: string;
  lexicalAlignment?: number;
  syntacticAlignment?: number;
  semanticAlignment?: number;
  overall?: number;
  sharedTerms?: string[];
  alignmentVector?: number[];
  distanceMetrics?: {
    euclidean: number;
    cosine: number;
    jaccard: number;
  };
}

export interface M3Details {
  value?: number;
  unit?: "ms" | "s";
  fluidity?: number;
  cognitiveLoad?: number;
  processingEfficiency?: number;
  attentionalFocus?: number;
  workingMemoryUsage?: number;
  executiveControl?: number;
  predictedSatisfaction?: number;
  predictedCompliance?: number;
}

export interface VariableX {
  tag: XTag;
  details: XDetails;
}

export interface VariableY {
  tag: YTag;
  details: YDetails;
}

export type VariableDetails =
  | XDetails
  | YDetails
  | M1Details
  | M2Details
  | M3Details;

export const VARIABLE_LABELS = {
  X: "Actes conversationnels conseiller",
  Y: "Réactions client",
  M1: "Métriques linguistiques",
  M2: "Alignement interactionnel",
  M3: "Indicateurs cognitifs",
} as const satisfies Record<VariableTarget, string>;

export const VARIABLE_COLORS = {
  X: "#2196F3",
  Y: "#4CAF50",
  M1: "#FF9800",
  M2: "#9C27B0",
  M3: "#F44336",
} as const satisfies Record<VariableTarget, string>;

export function isValidVariableTarget(target: string): target is VariableTarget {
  return ["X", "Y", "M1", "M2", "M3"].includes(target);
}

export function getVariableColor(target: VariableTarget): string {
  return VARIABLE_COLORS[target];
}

export function getVariableLabel(target: VariableTarget): string {
  return VARIABLE_LABELS[target];
}
EOF

# Générer src/types/core/calculations.ts
cat> src/types/core/calculations.ts <<'EOF'
/**
 * @fileoverview Interfaces de calcul AlgorithmLab
 */

import { VariableTarget, VariableDetails } from './variables';

export interface XInput {
  verbatim: string;
  context?: {
    previousTurn?: string;
    nextTurn?: string;
    callId?: string;
    turnIndex?: number;
  };
  metadata?: {
    speaker: string;
    timestamp: number;
    duration: number;
  };
}

export interface YInput {
  verbatim: string;
  previousConseillerTurn: string;
  context?: {
    conversationHistory?: string[];
    emotionalContext?: string;
    callMetadata?: Record<string, any>;
  };
}

export interface M1Input {
  verbatim: string;
  language?: string;
  analysisDepth?: "BASIC" | "ADVANCED" | "COMPREHENSIVE";
}

export interface M2Input {
  conseillerTurn: string;
  clientTurn: string;
  context?: {
    previousTurns?: Array<{speaker: string, text: string}>;
    conversationPhase?: "OPENING" | "DEVELOPMENT" | "RESOLUTION" | "CLOSING";
  };
}

export interface M3Input {
  conversationPair: {
    conseiller: string;
    client: string;
  };
  cognitiveContext?: {
    conversationLength: number;
    emotionalTone: string;
    complexityLevel: "LOW" | "MEDIUM" | "HIGH";
  };
}

export type CalculationInput = XInput | YInput | M1Input | M2Input | M3Input;

export interface CalculationResult<TDetails = VariableDetails> {
  prediction: string;
  confidence: number;
  processingTime: number;
  details: TDetails;
  metadata?: {
    algorithmVersion: string;
    inputSignature: string;
    executionPath: string[];
    warnings?: string[];
  };
}

export type XCalculationResult = CalculationResult<import('./variables').XDetails>;
export type YCalculationResult = CalculationResult<import('./variables').YDetails>;
export type M1CalculationResult = CalculationResult<import('./variables').M1Details>;
export type M2CalculationResult = CalculationResult<import('./variables').M2Details>;
export type M3CalculationResult = CalculationResult<import('./variables').M3Details>;

export interface CalculatorMetadata {
  name: string;
  version: string;
  target: VariableTarget;
  description: string;
  capabilities: {
    batchProcessing: boolean;
    contextAware: boolean;
    realTime: boolean;
    requiresTraining: boolean;
  };
  performance: {
    averageProcessingTime: number;
    accuracy: number;
    precision: number;
    recall: number;
  };
  parameters?: Record<string, {
    type: string;
    default: any;
    description: string;
    required: boolean;
  }>;
}

export function validateCalculationInput(
  input: unknown,
  target: VariableTarget
): input is CalculationInput {
  if (!input || typeof input !== 'object') return false;

  const obj = input as Record<string, any>;

  switch (target) {
    case 'X':
      return typeof obj.verbatim === 'string';
    case 'Y':
      return typeof obj.verbatim === 'string' && typeof obj.previousConseillerTurn === 'string';
    case 'M1':
      return typeof obj.verbatim === 'string';
    case 'M2':
      return typeof obj.conseillerTurn === 'string' && typeof obj.clientTurn === 'string';
    case 'M3':
      return obj.conversationPair &&
             typeof obj.conversationPair.conseiller === 'string' &&
             typeof obj.conversationPair.client === 'string';
    default:
      return false;
  }
}
EOF

# Générer src/types/core/validation.ts
cat> src/types/core/validation.ts <<'EOF'
/**
 * @fileoverview Types de validation AlgorithmLab
 */

import { VariableTarget } from "./variables";

export interface TVMetadataCore {
  turnId?: number | string;
  id?: number | string;
}

export interface TVValidationResultCore {
  verbatim: string;
  goldStandard: string;
  predicted: string;
  confidence: number;
  correct: boolean;
  processingTime?: number;
  metadata?: TVMetadataCore | Record<string, unknown>;
}

export interface ValidationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: Record<string, Record<string, number>>;
  classMetrics: Record<string, {
    precision: number;
    recall: number;
    f1Score: number;
    support: number;
  }>;
  totalSamples: number;
  correctPredictions: number;
  executionTime: number;
}

export interface ValidationResult {
  target: VariableTarget;
  algorithmName: string;
  metrics: ValidationMetrics;
  testSet: {
    size: number;
    source: string;
    createdAt: Date;
  };
  predictions: Array<{
    input: string;
    expected: string;
    predicted: string;
    confidence: number;
    correct: boolean;
  }>;
  validationDate: Date;
  validatorVersion: string;
  notes?: string;
}

export interface AlgorithmTestConfig {
  target: VariableTarget;
  algorithmName: string;
  testSet: {
    source: "MANUAL_ANNOTATIONS" | "SYNTHETIC" | "HISTORICAL";
    size?: number;
    stratified?: boolean;
    randomSeed?: number;
  };
  metrics: {
    basic: boolean;
    detailed: boolean;
    temporal?: boolean;
    crossValidation?: boolean;
  };
  thresholds: {
    minimumAccuracy: number;
    minimumPrecision?: number;
    minimumRecall?: number;
    minimumF1?: number;
  };
  execution: {
    parallel?: boolean;
    timeout?: number;
    retries?: number;
    saveResults?: boolean;
  };
}
EOF

# Générer src/types/core/index.ts
cat> src/types/core/index.ts <<'EOF'
/**
 * @fileoverview Export centralisé des types core AlgorithmLab
 */

export * from './variables';
export * from './calculations';
export * from './validation';
EOF

# Générer src/types/algorithms/base.ts
cat> src/types/algorithms/base.ts <<'EOF'
/**
 * @fileoverview Interface universelle AlgorithmLab
 */

import type { VariableTarget, VariableDetails } from "../core/variables";

export interface UniversalAlgorithm {
  describe(): AlgorithmDescriptor;
  validateConfig(): boolean;
  classify?(input: string): Promise<UniversalResult>;
  run(input: unknown): Promise<UniversalResult>;
  batchRun?(inputs: unknown[]): Promise<UniversalResult[]>;
}

export type AlgorithmType = "rule-based" | "ml" | "llm" | "hybrid";

export interface ParameterDescriptor {
  label: string;
  type: "boolean" | "number" | "string" | "select";
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ label: string; value: string }>;
  description?: string;
}

export interface AlgorithmDescriptor {
  name: string;
  displayName: string;
  version: string;
  type: AlgorithmType;
  target: VariableTarget;
  batchSupported: boolean;
  requiresContext: boolean;
  description?: string;
  parameters?: Record<string, ParameterDescriptor>;
  examples?: Array<{ input: unknown; output?: unknown; note?: string }>;
}

export interface UniversalResult {
  prediction: string;
  confidence: number;
  processingTime?: number;
  algorithmVersion?: string;
  metadata?: {
    inputSignature?: string;
    inputType?: string;
    executionPath?: string[];
    warnings?: string[];
    details?: VariableDetails;
  };
}

export function isValidAlgorithmResult(result: any): result is UniversalResult {
  return (
    result &&
    typeof result === "object" &&
    typeof result.prediction === "string" &&
    typeof result.confidence === "number" &&
    result.confidence >= 0 &&
    result.confidence <= 1
  );
}
EOF

# Générer src/types/algorithms/universal-adapter.ts
cat> src/types/algorithms/universal-adapter.ts <<'EOF'
/**
 * @fileoverview Adaptateur universel AlgorithmLab
 */

import { VariableTarget, VariableDetails } from "../core/variables";
import { CalculationInput, CalculationResult } from "../core/calculations";
import {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
  AlgorithmType,
} from "./base";

export interface BaseCalculator<TInput = any, TDetails = VariableDetails> {
  calculate(input: TInput): Promise<CalculationResult<TDetails>>;
  getName?(): string;
  getVersion?(): string;
  getDescription?(): string;
  getType?(): AlgorithmType;
}

export interface AdapterConfig<TInput = any, TDetails = VariableDetails> {
  requiresContext?: boolean;
  supportsBatch?: boolean;
  inputValidator?: (input: unknown) => input is TInput;
  inputConverter?: (input: string) => TInput;
  resultMapper?: (result: CalculationResult<TDetails>) => UniversalResult;
  displayName?: string;
  description?: string;
  algorithmType?: AlgorithmType;
  timeout?: number;
  retries?: number;
  batchSize?: number;
}

export function createUniversalAlgorithm<
  TInput = any,
  TDetails = VariableDetails
>(
  calculator: BaseCalculator<TInput, TDetails>,
  target: VariableTarget,
  config: AdapterConfig<TInput, TDetails> = {}
): UniversalAlgorithm {
  const {
    requiresContext = false,
    supportsBatch = false,
    inputValidator,
    inputConverter,
    resultMapper = defaultResultMapper,
    displayName,
    description,
    algorithmType = "rule-based",
    timeout = 30000,
    retries = 3,
    batchSize = 10,
  } = config;

  const universalAlgorithm: UniversalAlgorithm = {
    describe(): AlgorithmDescriptor {
      const name = calculator.getName?.() || `${target}Calculator`;
      return {
        name,
        displayName: displayName || name,
        version: calculator.getVersion?.() || "1.0.0",
        type: calculator.getType?.() || algorithmType,
        target,
        batchSupported: supportsBatch,
        requiresContext,
        description:
          description ||
          calculator.getDescription?.() ||
          `Calculateur AlgorithmLab pour variable ${target}`,
        examples: [],
      };
    },

    validateConfig(): boolean {
      try {
        if (!calculator || typeof calculator.calculate !== "function") {
          return false;
        }
        return true;
      } catch (error) {
        console.warn(`Validation failed for ${target} calculator:`, error);
        return false;
      }
    },

    async classify(input: string): Promise<UniversalResult> {
      return this.run(input);
    },

    async run(input: unknown): Promise<UniversalResult> {
      const startTime = Date.now();

      try {
        let typedInput: TInput;

        if (inputValidator) {
          if (!inputValidator(input)) {
            throw new Error(`Invalid input type for ${target} calculator`);
          }
          typedInput = input;
        } else if (inputConverter && typeof input === "string") {
          typedInput = inputConverter(input);
        } else {
          typedInput = input as TInput;
        }

        const result = await calculator.calculate(typedInput);
        const universalResult = resultMapper(result);
        universalResult.processingTime = Date.now() - startTime;

        return universalResult;
      } catch (error) {
        return {
          prediction: "ERROR",
          confidence: 0,
          processingTime: Date.now() - startTime,
          metadata: {
            warnings: [
              `Execution failed: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            ],
            executionPath: ["error"],
            inputType: typeof input,
          },
        };
      }
    },

    async batchRun(inputs: unknown[]): Promise<UniversalResult[]> {
      if (!supportsBatch) {
        const results: UniversalResult[] = [];
        for (const input of inputs) {
          results.push(await this.run(input));
        }
        return results;
      }

      const results: UniversalResult[] = [];
      for (let i = 0; i < inputs.length; i += batchSize) {
        const batch = inputs.slice(i, i + batchSize);
        const batchPromises = batch.map((input) => this.run(input));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }
      return results;
    },
  };

  return universalAlgorithm;
}

function defaultResultMapper<TDetails>(
  result: CalculationResult<TDetails>
): UniversalResult {
  return {
    prediction: result.prediction,
    confidence: result.confidence,
    processingTime: result.processingTime,
    algorithmVersion: result.metadata?.algorithmVersion,
    metadata: {
      inputSignature: result.metadata?.inputSignature,
      executionPath: result.metadata?.executionPath || ["calculate"],
      warnings: result.metadata?.warnings,
      details: result.details as VariableDetails,
    },
  };
}
EOF

# Générer src/types/algorithms/index.ts
cat> src/types/algorithms/index.ts <<'EOF'
/**
 * @fileoverview Export centralisé des types algorithms AlgorithmLab
 */

export * from './base';
export * from './universal-adapter';

export type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
  AlgorithmType
} from './base';

export type {
  BaseCalculator,
  AdapterConfig
} from './universal-adapter';

export { createUniversalAlgorithm } from './universal-adapter';
EOF

# Générer src/types/ui/components.ts
cat> src/types/ui/components.ts <<'EOF'
/**
 * @fileoverview Types de composants UI AlgorithmLab
 */

import type { ReactNode, CSSProperties } from "react";
import type {
  VariableTarget,
  ValidationMetrics,
  TVValidationResultCore,
} from "../core";

export interface BaseValidationProps {
  callId: string;
  algorithmName: string;
  target: VariableTarget;
  autoValidate?: boolean;
  showMetrics?: boolean;
  testData?: Array<{
    input: string;
    expected: string;
    metadata?: Record<string, any>;
  }>;
  onValidationComplete?: (metrics: ValidationMetrics) => void;
  onValidationError?: (error: Error) => void;
  onConfigChange?: (config: any) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: CSSProperties;
}

export interface DisplayConfig {
  theme?: "light" | "dark" | "auto";
  compact?: boolean;
  showAdvanced?: boolean;
  visibleColumns?: string[];
  collapsedSections?: string[];
  showConfidence?: boolean;
  showProcessingTime?: boolean;
  showMetadata?: boolean;
  chartsEnabled?: boolean;
  animationsEnabled?: boolean;
  colorScheme?: "default" | "accessibility" | "colorblind";
  pageSize?: number;
  defaultFilters?: Record<string, any>;
  sortOrder?: "asc" | "desc";
  sortBy?: string;
}

export interface ResultsPanelProps {
  results: TVValidationResultCore[];
  display?: DisplayConfig;
}
EOF

# Générer src/types/ui/validation.ts
cat> src/types/ui/validation.ts <<'EOF'
/**
 * @fileoverview Types de validation UI AlgorithmLab
 */

import { BaseValidationProps } from './components';
import { XInput, YInput, M2Input } from '../core/calculations';
import { XDetails, YDetails, M2Details } from '../core/variables';

export interface XValidationProps extends BaseValidationProps {
  target: "X";
  xConfig: {
    analyzeActionVerbs: boolean;
    detectPronouns: boolean;
    classifyQuestions: boolean;
    contextWindow: number;
  };
  testInputs?: XInput[];
  expectedOutputs?: Array<{
    tag: string;
    details: Partial<XDetails>;
  }>;
  onActionVerbsAnalyzed?: (verbs: string[]) => void;
  onPronounUsageDetected?: (usage: {je: number, vous: number, nous: number}) => void;
  onQuestionTypeClassified?: (type: "OPEN" | "CLOSED" | "NONE") => void;
}

export interface YValidationProps extends BaseValidationProps {
  target: "Y";
  yConfig: {
    analyzeSentiment: boolean;
    detectEmotion: boolean;
    classifyResponse: boolean;
    emotionThreshold: number;
  };
  testInputs?: YInput[];
  expectedOutputs?: Array<{
    tag: string;
    details: Partial<YDetails>;
  }>;
  onSentimentAnalyzed?: (sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL") => void;
  onEmotionDetected?: (intensity: number) => void;
  onResponseClassified?: (type: "ACCEPTANCE" | "RESISTANCE" | "INQUIRY" | "NEUTRAL") => void;
}

export interface M2ValidationProps extends BaseValidationProps {
  target: "M2";
  m2Config: {
    calculateLexicalAlignment: boolean;
    calculateSyntacticAlignment: boolean;
    calculateSemanticAlignment: boolean;
    extractSharedTerms: boolean;
    distanceMetrics: Array<"euclidean" | "cosine" | "jaccard">;
  };
  testInputs?: M2Input[];
  expectedOutputs?: Array<{
    alignment: number;
    details: Partial<M2Details>;
  }>;
  onAlignmentCalculated?: (
    lexical: number,
    syntactic: number,
    semantic: number,
    overall: number
  ) => void;
  onSharedTermsExtracted?: (terms: string[]) => void;
  onDistanceMetricsCalculated?: (metrics: {euclidean: number, cosine: number, jaccard: number}) => void;
}

export type AllValidationProps =
  | XValidationProps
  | YValidationProps
  | M2ValidationProps;
EOF

# Générer src/types/ui/index.ts
cat> src/types/ui/index.ts <<'EOF'
/**
 * @fileoverview Export centralisé des types UI AlgorithmLab
 */

export * from './components';
export * from './validation';
EOF

# Générer src/types/utils/normalizers.ts
cat> src/types/utils/normalizers.ts <<'EOF'
/**
 * @fileoverview Types pour les fonctions de normalisation AlgorithmLab
 */

import { XTag, YTag } from '../core/variables';

export type NormalizationLevel = "BASIC" | "STANDARD" | "AGGRESSIVE";

export interface NormalizationConfig {
  level: NormalizationLevel;
  preserveCase: boolean;
  removePunctuation: boolean;
  removeAccents: boolean;
  removeStopWords: boolean;
  stemming: boolean;
  customRules?: NormalizationRule[];
}

export interface NormalizationRule {
  id: string;
  name: string;
  pattern: RegExp | string;
  replacement: string;
  enabled: boolean;
  priority: number;
  description?: string;
}

export declare function normalizeXLabel(label: string, config?: Partial<NormalizationConfig>): XTag;
export declare function normalizeYLabel(label: string, config?: Partial<NormalizationConfig>): YTag;
export declare function familyFromX(xTag: XTag): string;
export declare function familyFromY(yTag: YTag): string;

export const X_LABEL_MAPPING: Record<string, XTag> = {
  "engagement": "ENGAGEMENT",
  "action": "ENGAGEMENT",
  "ouverture": "OUVERTURE",
  "question": "OUVERTURE",
  "reflet": "REFLET",
  "comprends": "REFLET",
  "explication": "EXPLICATION",
  "cloture": "CLOTURE"
};

export const Y_LABEL_MAPPING: Record<string, YTag> = {
  "positif": "CLIENT_POSITIF",
  "merci": "CLIENT_POSITIF",
  "neutre": "CLIENT_NEUTRE",
  "negatif": "CLIENT_NEGATIF",
  "question": "CLIENT_QUESTION",
  "silence": "CLIENT_SILENCE"
};
EOF

# Générer src/types/utils/index.ts
cat> src/types/utils/index.ts <<'EOF'
/**
 * @fileoverview Export centralisé des types utils AlgorithmLab
 */

export * from './normalizers';
EOF

# Générer src/types/index.ts (point d'entrée principal)
cat> src/types/index.ts <<'EOF'
/**
 * @fileoverview Point d'entrée principal des types AlgorithmLab
 */

export * from './core';
export * from './algorithms';
export * from './ui';
export * from './utils';

// Exports groupés pour simplicité d'usage
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

export type {
  UniversalAlgorithm,
  AlgorithmDescriptor,
  UniversalResult,
  BaseCalculator
} from './algorithms';

export { createUniversalAlgorithm } from './algorithms';

export type {
  ValidationMetrics,
  ValidationResult,
  AlgorithmTestConfig
} from './core';

export type {
  BaseValidationProps,
  XValidationProps,
  YValidationProps,
  M2ValidationProps
} from './ui';

export const ALGORITHM_LAB_VERSION = "2.0.0";

export const SUPPORTED_VARIABLES = ["X", "Y", "M1", "M2", "M3"] as const;
EOF

echo"✅ Génération terminée avec succès!"
echo"📁 Nouveaux fichiers créés dans src/types/"
echo"🔍 Vérification de la structure:"
find src/types -name "*.ts"|sort
EOF

# Rendre le script exécutable
chmod +x migration/scripts/generate-new-types.sh

# Exécuter la génération
./migration/scripts/generate-new-types.sh
```

### Étape 2.2 : Validation de la génération

bash

```bash
# Terminal - Vérifier la structure générée
find src/types -name "*.ts"|sort

# ✅ Résultat attendu :
# src/types/algorithms/base.ts
# src/types/algorithms/index.ts
# src/types/algorithms/universal-adapter.ts
# src/types/core/calculations.ts
# src/types/core/index.ts
# src/types/core/validation.ts
# src/types/core/variables.ts
# src/types/index.ts
# src/types/ui/components.ts
# src/types/ui/index.ts
# src/types/ui/validation.ts
# src/types/utils/index.ts
# src/types/utils/normalizers.ts
```

bash

```bash
# Terminal - Test de compilation des nouveaux types (ISOLÉS)
npx tsc --noEmit src/types/**/*.ts

# ✅ Résultat attendu : Aucune erreur
# ❌ Si erreurs : Les corriger avant de continuer
```

bash

```bash
# Terminal - Vérifier les exports principaux
cat src/types/index.ts |grep"export"

# ✅ Résultat attendu : Liste des exports centralisés
```

## 🔄 Phase 3 : Transformation des imports (1h-1h30)

### Étape 3.1 : Création du script de transformation

Créer le script `migration/scripts/transform-imports.sh` :

bash

```bash
#!/bin/bash
# migration/scripts/transform-imports.sh
# Transformation intelligente des imports basée sur l'audit et les règles

set -e

echo"🚀 Transformation intelligente des imports AlgorithmLab"
echo"======================================================="

AUDIT_FILE="migration/audit/old-imports-audit.json"
RULES_FILE="migration/audit/import-transformation-rules.json"
MIGRATION_DIR="migration"
BACKUP_DIR="$MIGRATION_DIR/backups"
TRANSFORM_LOG="$MIGRATION_DIR/transformation.log"

# Vérifications préalables
if[! -f "$AUDIT_FILE"];then
echo"❌ Fichier d'audit non trouvé: $AUDIT_FILE"
exit1
fi

if[! -f "$RULES_FILE"];then
echo"❌ Fichier de règles non trouvé: $RULES_FILE"
exit1
fi

mkdir -p "$BACKUP_DIR"
echo"=== Transformation démarrée le $(date) ===">"$TRANSFORM_LOG"

# Fonction de backup
backup_file(){
localfile="$1"
localbackup_path="$BACKUP_DIR/$(echo"$file"|tr'/''_').backup"
cp"$file""$backup_path"
echo"📁 Backup: $file → $backup_path"|tee -a "$TRANSFORM_LOG"
}

# Validation pré-transformation
echo"🔍 Validation pré-transformation..."
if! npx tsc --noEmit >/dev/null 2>&1;then
echo"⚠️  ATTENTION: Le projet a déjà des erreurs de compilation"|tee -a "$TRANSFORM_LOG"
echo"   Continuez-vous la transformation ? (y/N)"
read -r response
if[[!"$response"=~ ^[Yy]$ ]];then
echo"❌ Transformation annulée"
exit1
fi
else
echo"✅ Compilation initiale OK"|tee -a "$TRANSFORM_LOG"
fi

# Fonction de transformation simple
transform_simple_path(){
localfile="$1"
localold_path="$2"
localnew_path="$3"

echo"🔄 $file: $old_path → $new_path"|tee -a "$TRANSFORM_LOG"

# Échapper les caractères spéciaux
localescaped_old=$(echo "$old_path"|sed's/[[\.*^$()+?{|]/\\&/g')
localescaped_new=$(echo "$new_path"|sed's/[[\.*^$()+?{|]/\\&/g')

# Appliquer la transformation
sed -i.tmp "s|from ['\"]$escaped_old['\"]|from \"$escaped_new\"|g""$file"

# Vérifier le succès
ifgrep -q "$new_path""$file";then
echo"  ✅ Transformation réussie"|tee -a "$TRANSFORM_LOG"
rm -f "$file.tmp"
return0
else
echo"  ❌ Transformation échouée - Rollback"|tee -a "$TRANSFORM_LOG"
mv"$file.tmp""$file"
return1
fi
}

# Transformation des imports multiples (redistribution)
transform_multiple_imports(){
localfile="$1"
localimports_list="$2"
localold_source="$3"

echo"🔄 Redistribution d'imports multiples dans $file"|tee -a "$TRANSFORM_LOG"
echo"  📝 Imports: $imports_list"|tee -a "$TRANSFORM_LOG"
echo"  📝 Source: $old_source"|tee -a "$TRANSFORM_LOG"

# Créer un fichier temporaire pour la reconstruction
localtemp_file=$(mktemp)
localin_import_block=false
localimport_line=""

whileIFS=read -r line;do
# Détecter le début d'un import multilignes de la source concernée
ifecho"$line"|grep -q "import.*{.*from ['\"]$old_source['\"]";then
# Import sur une seule ligne - traiter directement
echo"  📝 Import simple ligne: $line"|tee -a "$TRANSFORM_LOG"

# Extraire les imports nommés
localnamed_imports=$(echo"$line"|sed -n 's/.*import {\([^}]*\)}.*/\1/p'|tr',''\n')

# Créer les nouveaux imports selon les règles
whileIFS=read -r import_name;do
import_name=$(echo"$import_name"|xargs)# trim
if[ -n "$import_name"];then
localnew_dest=$(jq -r ".named_imports_mappings.mappings[\"$import_name\"] // empty""$RULES_FILE")
if[ -n "$new_dest"]&&["$new_dest"!="null"];then
echo"import { $import_name } from \"$new_dest\";">>"$temp_file"
echo"    📍 $import_name → $new_dest"|tee -a "$TRANSFORM_LOG"
else
echo"    ⚠️  Import non mappé: $import_name"|tee -a "$TRANSFORM_LOG"
echo"$line">>"$temp_file"# Garder l'original si pas de mapping
fi
fi
done<<<"$named_imports"

elifecho"$line"|grep -q "import.*{"&&echo"$line"|grep -qv "}.*from";then
# Début d'un import multilignes
in_import_block=true
import_line="$line"

elif["$in_import_block"=true];then
import_line="$import_line$line"

ifecho"$line"|grep -q "}.*from ['\"]$old_source['\"]";then
# Fin de l'import multilignes
in_import_block=false

echo"  📝 Import multilignes: $import_line"|tee -a "$TRANSFORM_LOG"

# Extraire et traiter comme import simple
localnamed_imports=$(echo"$import_line"|sed -n 's/.*import {\([^}]*\)}.*/\1/p'|tr',''\n')

whileIFS=read -r import_name;do
import_name=$(echo"$import_name"|xargs)
if[ -n "$import_name"];then
localnew_dest=$(jq -r ".named_imports_mappings.mappings[\"$import_name\"] // empty""$RULES_FILE")
if[ -n "$new_dest"]&&["$new_dest"!="null"];then
echo"import { $import_name } from \"$new_dest\";">>"$temp_file"
echo"    📍 $import_name → $new_dest"|tee -a "$TRANSFORM_LOG"
else
echo"    ⚠️  Import non mappé: $import_name"|tee -a "$TRANSFORM_LOG"
fi
fi
done<<<"$named_imports"

import_line=""
fi

else
# Ligne normale - copier telle quelle
if["$in_import_block"=false];then
echo"$line">>"$temp_file"
fi
fi
done<"$file"

# Remplacer le fichier original
mv"$temp_file""$file"
echo"  ✅ Redistribution terminée"|tee -a "$TRANSFORM_LOG"

return0
}

# Fonction principale de transformation d'un fichier
transform_file(){
localfile="$1"

echo"📄 Transformation du fichier: $file"|tee -a "$TRANSFORM_LOG"

# Backup du fichier
    backup_file "$file"

# Récupérer les imports de ce fichier depuis l'audit
localfile_imports=$(jq -c ".imports_by_file[\"$file\"].imports[]? // empty""$AUDIT_FILE")

if[ -z "$file_imports"];then
echo"  ℹ️  Aucun import AlgorithmLab trouvé"|tee -a "$TRANSFORM_LOG"
return0
fi

localtransform_count=0
localerror_count=0

# Grouper les imports par source pour optimiser les transformations
declare -A imports_by_source

whileIFS=read -r import_json;do
if[ -n "$import_json"];then
localsource_path=$(echo"$import_json"| jq -r '.source_path')
localimport_type=$(echo"$import_json"| jq -r '.type')

if["$import_type"="named"];then
# Traitement spécial pour les imports nommés (redistribution)
localimported_names=$(echo"$import_json"| jq -r '.imported_names')

if transform_multiple_imports "$file""$imported_names""$source_path";then
transform_count=$((transform_count +1))
else
error_count=$((error_count +1))
fi

else
# Transformation simple pour les autres types
localnew_source=$(jq -r ".source_path_mappings.mappings[\"$source_path\"] // empty""$RULES_FILE")

if[ -n "$new_source"]&&["$new_source"!="null"];then
if transform_simple_path "$file""$source_path""$new_source";then
transform_count=$((transform_count +1))
else
error_count=$((error_count +1))
fi
else
echo"  ⚠️  Aucun mapping trouvé pour: $source_path"|tee -a "$TRANSFORM_LOG"
error_count=$((error_count +1))
fi
fi
fi
done<<<"$file_imports"

echo"  📊 Résumé: $transform_count transformations, $error_count erreurs"|tee -a "$TRANSFORM_LOG"

return$error_count
}

# Nettoyage des imports dupliqués
cleanup_duplicate_imports(){
localfile="$1"

echo"🧹 Nettoyage des imports dupliqués: $file"|tee -a "$TRANSFORM_LOG"

localtemp_file=$(mktemp)

awk'
    /^import.*from/ {
        if (!seen[$0]) {
            seen[$0] = 1
            print
        }
        next
    }
    { print }
    '"$file">"$temp_file"

mv"$temp_file""$file"

echo"  ✅ Nettoyage terminé"|tee -a "$TRANSFORM_LOG"
}

# Validation post-transformation
validate_post_transformation(){
localfile="$1"

echo"🔍 Validation post-transformation: $file"|tee -a "$TRANSFORM_LOG"

if npx tsc --noEmit "$file">/dev/null 2>&1;then
echo"  ✅ Compilation OK"|tee -a "$TRANSFORM_LOG"
return0
else
echo"  ❌ Erreurs de compilation détectées"|tee -a "$TRANSFORM_LOG"
        npx tsc --noEmit "$file"2>&1|head -5 |tee -a "$TRANSFORM_LOG"
return1
fi
}

# Fonction de rollback
rollback_file(){
localfile="$1"
localbackup_path="$BACKUP_DIR/$(echo"$file"|tr'/''_').backup"

if[ -f "$backup_path"];then
cp"$backup_path""$file"
echo"🔄 Rollback effectué: $file"|tee -a "$TRANSFORM_LOG"
return0
else
echo"❌ Impossible de rollback: backup non trouvé pour $file"|tee -a "$TRANSFORM_LOG"
return1
fi
}

# TRANSFORMATION PRINCIPALE
echo"🎯 Début de la transformation principale"|tee -a "$TRANSFORM_LOG"

# Récupérer la liste des fichiers à traiter
files_to_process=$(jq -r '.imports_by_file | keys[]'"$AUDIT_FILE")
total_files=$(echo"$files_to_process"|wc -l)
processed_files=0
successful_files=0
failed_files=0

echo"📋 $total_files fichiers à traiter"|tee -a "$TRANSFORM_LOG"

# Traiter chaque fichier
whileIFS=read -r file;do
if[ -n "$file"];then
processed_files=$((processed_files +1))

echo""
echo"🔄 [$processed_files/$total_files] Traitement: $file"

if transform_file "$file";then
            cleanup_duplicate_imports "$file"

if validate_post_transformation "$file";then
successful_files=$((successful_files +1))
echo"  ✅ Fichier traité avec succès"
else
echo"  ❌ Validation échouée - Rollback du fichier"
                rollback_file "$file"
failed_files=$((failed_files +1))
fi
else
echo"  ❌ Transformation échouée"
failed_files=$((failed_files +1))
fi
fi
done<<<"$files_to_process"

echo""
echo"📊 RÉSUMÉ DE LA TRANSFORMATION"|tee -a "$TRANSFORM_LOG"
echo"============================="|tee -a "$TRANSFORM_LOG"
echo"📁 Fichiers traités: $processed_files"|tee -a "$TRANSFORM_LOG"
echo"✅ Succès: $successful_files"|tee -a "$TRANSFORM_LOG"
echo"❌ Échecs: $failed_files"|tee -a "$TRANSFORM_LOG"

# Validation globale finale
echo""
echo"🎯 Validation globale finale"|tee -a "$TRANSFORM_LOG"

if npx tsc --noEmit;then
echo"✅ Compilation globale réussie"|tee -a "$TRANSFORM_LOG"

echo""
echo"🎉 TRANSFORMATION RÉUSSIE!"
echo"✅ Tous les imports ont été transformés avec succès"
echo"✅ La compilation globale fonctionne"

echo""
echo"📋 Prochaines étapes recommandées:"
echo"   1. Vérifier le fonctionnement de l'application"
echo"   2. Exécuter les tests: npm test"
echo"   3. Supprimer les anciens fichiers: ./migration/scripts/cleanup-old-types.sh"

exit0
else
echo"❌ Erreurs de compilation globale détectées"|tee -a "$TRANSFORM_LOG"
echo"💡 Erreurs détaillées:"|tee -a "$TRANSFORM_LOG"
    npx tsc --noEmit 2>&1|head -10 |tee -a "$TRANSFORM_LOG"

echo""
echo"⚠️  TRANSFORMATION PARTIELLEMENT RÉUSSIE"
echo"✅ Les imports ont été transformés"
echo"❌ Des erreurs de compilation subsistent"

echo""
echo"🔧 Actions recommandées:"
echo"   1. Consulter le log: cat $TRANSFORM_LOG"
echo"   2. Corriger manuellement les erreurs"
echo"   3. Relancer la validation: npx tsc --noEmit"

exit1
fi
EOF

# Rendre le script exécutable
chmod +x migration/scripts/transform-imports.sh
```

### Étape 3.2 : Exécution de la transformation

bash

```bash
# Terminal - Exécuter la transformation des imports
cd /path/to/taggerlpl-nextjs
./migration/scripts/transform-imports.sh

# ✅ Résultat attendu (exemple) :
# 🚀 Transformation intelligente des imports AlgorithmLab
# =======================================================
# 🔍 Validation pré-transformation...
# ✅ Compilation initiale OK
# 🎯 Début de la transformation principale
# 📋 23 fichiers à traiter
#
# 🔄 [1/23] Traitement: src/components/ValidationInterface.tsx
# 📄 Transformation du fichier: src/components/ValidationInterface.tsx
# 📁 Backup: src/components/ValidationInterface.tsx → migration/backups/...
# 🔄 Redistribution d'imports multiples dans src/components/ValidationInterface.tsx
#   📝 Imports: XDetails,YDetails,ValidationMetrics
#   📝 Source: types/ThesisVariables
#     📍 XDetails → @/types/core/variables
#     📍 YDetails → @/types/core/variables
#     📍 ValidationMetrics → @/types/core/validation
# 🧹 Nettoyage des imports dupliqués: src/components/ValidationInterface.tsx
# 🔍 Validation post-transformation: src/components/ValidationInterface.tsx
#   ✅ Compilation OK
#   ✅ Fichier traité avec succès
#
# [... progression pour tous les fichiers ...]
#
# 📊 RÉSUMÉ DE LA TRANSFORMATION
# =============================
# 📁 Fichiers traités: 23
# ✅ Succès: 21
# ❌ Échecs: 2
#
# 🎯 Validation globale finale
# ✅ Compilation globale réussie
#
# 🎉 TRANSFORMATION RÉUSSIE!
# ✅ Tous les imports ont été transformés avec succès
# ✅ La compilation globale fonctionne
```

### Étape 3.3 : Gestion des erreurs potentielles

Si des erreurs surviennent pendant la transformation :

bash

```bash
# Terminal - Analyser les erreurs dans le log
cat migration/transformation.log |grep"❌"

# ✅ Exemples d'erreurs courantes et solutions :

# Erreur: "Import non mappé: SomeType"
# Solution: Ajouter le mapping dans import-transformation-rules.json
echo"Ajouter le mapping manquant:"
echo'  "SomeType": "@/types/core/variables"'

# Erreur: "Compilation échouée"
# Solution: Vérifier les erreurs TypeScript et corriger manuellement
npx tsc --noEmit src/components/ProblematicFile.tsx

# Erreur: "Transformation échouée"
# Solution: Vérifier la syntaxe des imports et les chemins
grep -n "import.*from" src/components/ProblematicFile.tsx
```

bash

```bash
# Terminal - Rollback d'un fichier spécifique si nécessaire
cp migration/backups/src_components_ValidationInterface.tsx.backup src/components/ValidationInterface.tsx

# Vérifier le rollback
grep"import.*from" src/components/ValidationInterface.tsx |head -3

# Ou rollback complet si nécessaire
echo"🔄 Rollback complet disponible avec:"
echo"./migration/scripts/rollback-migration.sh"
```

### Étape 3.4 : Vérification manuelle des transformations

bash

```bash
# Terminal - Vérifier quelques fichiers transformés
echo"🔍 Vérification des transformations..."

# Examiner un fichier transformé
head -20 src/components/ValidationInterface.tsx

# ✅ Résultat attendu :
# import { XDetails, YDetails } from "@/types/core/variables";
# import { ValidationMetrics } from "@/types/core/validation";
# import { BaseValidationProps } from "@/types/ui/components";
# // Plus d'ancien import vers types/ThesisVariables

# Vérifier un autre fichier
head -15 src/hooks/useAlgorithmTesting.ts

# ✅ Résultat attendu :
# import { CalculationResult } from "@/types/core/calculations";
# import { UniversalAlgorithm } from "@/types/algorithms/base";
# // Imports transformés selon les règles
```

bash

```bash
# Terminal - Compter les imports transformés
echo"📊 Statistiques de transformation:"

# Nouveaux imports
new_imports=$(grep -r "from \"@/types/" src --include="*.ts" --include="*.tsx"|wc -l)
echo"✅ Nouveaux imports créés: $new_imports"

# Anciens imports restants (doit être 0)
old_imports=$(grep -r "from.*types/ThesisVariables" src --include="*.ts" --include="*.tsx"|wc -l)
echo"📊 Anciens imports restants: $old_imports"

if["$old_imports" -eq 0];then
echo"✅ Tous les anciens imports ont été transformés"
else
echo"⚠️  Quelques anciens imports subsistent - vérification manuelle requise"
grep -r "from.*types/ThesisVariables" src --include="*.ts" --include="*.tsx"
fi
```

bash

```bash
# Terminal - Tester quelques imports critiques
echo"🧪 Test des imports critiques..."

# Test import variables
node -e "
try {
  const { XDetails, YDetails, M2Details } = require('./src/types/core/variables.ts');
  console.log('✅ Import variables: OK');
} catch (e) {
  console.log('❌ Import variables: ERREUR -', e.message);
}
"

# Test import algorithmes
node -e "
try {
  const { createUniversalAlgorithm } = require('./src/types/algorithms/universal-adapter.ts');
  console.log('✅ Import algorithmes: OK');
} catch (e) {
  console.log('❌ Import algorithmes: ERREUR -', e.message);
}
"

# Test import point d'entrée principal
node -e "
try {
  const types = require('./src/types/index.ts');
  console.log('✅ Import principal: OK - Exports:', Object.keys(types).length);
} catch (e) {
  console.log('❌ Import principal: ERREUR -', e.message);
}
"
```

### Étape 3.5 : Validation intermédiaire et checkpoint

bash

```bash
# Terminal - Checkpoint de validation avant nettoyage
echo"🎯 Checkpoint Phase 3 - Validation intermédiaire"
echo"================================================"

# 1. Test de compilation globale
echo"🔍 1. Test compilation globale..."
if npx tsc --noEmit;then
echo"✅ Compilation: SUCCÈS"
else
echo"❌ Compilation: ÉCHEC - Arrêt pour correction"
echo"🔧 Actions à faire:"
echo"   - Corriger les erreurs TypeScript"
echo"   - Relancer npx tsc --noEmit"
echo"   - Continuer à la Phase 4 une fois corrigé"
exit1
fi

# 2. Vérification des fichiers transformés
echo""
echo"🔍 2. Vérification des transformations..."
transformed_files=$(find migration/backups -name "*.backup"|wc -l)
echo"📁 Fichiers sauvegardés: $transformed_files"

# 3. Test de démarrage rapide (optionnel)
echo""
echo"🔍 3. Test de démarrage application (30s)..."
timeout 30s npm run dev > /dev/null 2>&1&
DEV_PID=$!
sleep10

ifkill -0 $DEV_PID2>/dev/null;then
echo"✅ Démarrage: SUCCÈS (arrêt automatique)"
kill$DEV_PID
else
echo"⚠️  Démarrage: ÉCHEC ou LENT"
echo"   (Normal à ce stade - sera validé en Phase 4)"
fi

# 4. Résumé du checkpoint
echo""
echo"📊 RÉSUMÉ CHECKPOINT PHASE 3:"
echo"=============================="
echo"✅ Transformation des imports: TERMINÉE"
echo"✅ Sauvegarde sécurisée: $transformed_files fichiers"
echo"✅ Compilation TypeScript: OK"
echo"✅ Prêt pour Phase 4: Validation et nettoyage"
echo""
echo"🚀 Continuez avec la Phase 4 pour finaliser la migration"
```

### Étape 3.6 : Préparation pour Phase 4

bash

```bash
# Terminal - Préparer la transition vers Phase 4
echo"🔄 Préparation Phase 4..."

# Créer un résumé pour la Phase 4
cat> migration/phase3-summary.txt <<EOF
=== RÉSUMÉ PHASE 3 - TRANSFORMATION IMPORTS ===
Date: $(date)

FICHIERS TRANSFORMÉS:
$(find migration/backups -name "*.backup"|wc -l) fichiers sauvegardés

STATISTIQUES:
- Nouveaux imports: $(grep -r "from \"@/types/" src --include="*.ts" --include="*.tsx"|wc -l)
- Anciens imports restants: $(grep -r "from.*types/ThesisVariables" src --include="*.ts" --include="*.tsx"|wc -l ||echo"0")

STATUT:
✅ Transformation terminée
✅ Compilation TypeScript OK
✅ Backups sécurisés
✅ Prêt pour Phase 4

PROCHAINES ÉTAPES (Phase 4):
1. Tests fonctionnels complets
2. Suppression progressive anciens fichiers
3. Validation finale
4. Nettoyage et documentation

LOG DÉTAILLÉ: migration/transformation.log
EOF

echo"📄 Résumé Phase 3 créé: migration/phase3-summary.txt"
echo""
echo"✅ PHASE 3 TERMINÉE AVEC SUCCÈS"
echo"🚀 Prêt pour Phase 4: Validation et nettoyage"
```
