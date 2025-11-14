# 🔧 Guide d'enrichissement des types centralisés TypeScript

## Vue d'ensemble

Ce guide explique comment résoudre les erreurs TypeScript en enrichissant les types centralisés avec des propriétés optionnelles, plutôt que de créer des extensions ou des interfaces dérivées.

## 🎯 Principe de base

**❌ Éviter :**

```typescript
// Extension des types (crée de la duplication)
interface ExtendedTVValidationResult extends TVValidationResult {
  processingTime?: number;
  id?: string;
}
```

**✅ Préférer :**

```typescript
// Enrichissement du type central avec propriétés optionnelles
export interface TVValidationResult {
  // Propriétés existantes (obligatoires)
  verbatim: string;
  predicted: string;

  // ✅ Nouvelles propriétés (optionnelles)
  processingTime?: number;
  id?: string;
}
```

## 📋 Méthodologie pas à pas

### Étape 1 : Identifier l'erreur TypeScript

```bash
# Exemple d'erreur typique
Property 'processingTime' does not exist on type 'TVValidationResult'.
```

### Étape 2 : Localiser le type central

Chercher dans l'architecture des types :

```
src/app/(protected)/analysis/components/AlgorithmLab/types/
├── core/
│   ├── validation.ts      # Types de validation
│   ├── calculations.ts    # Types de calculs
│   ├── variables.ts       # Types de variables
│   └── index.ts
├── algorithms/
│   ├── base.ts           # Types d'algorithmes
│   └── index.ts
├── ui/
│   ├── components.ts     # Types UI
│   └── index.ts
└── index.ts
```

### Étape 3 : Analyser l'erreur et identifier le fichier

| Type d'erreur                         | Fichier probable     | Interface à modifier     |
| ------------------------------------- | -------------------- | ------------------------ |
| `TVValidationResult`manque propriété  | `core/validation.ts` | `TVValidationResultCore` |
| `AlgorithmDescriptor`manque propriété | `algorithms/base.ts` | `AlgorithmDescriptor`    |
| `UniversalResult`manque propriété     | `algorithms/base.ts` | `UniversalResult`        |
| Props de composant UI                 | `ui/components.ts`   | Interface spécifique     |

### Étape 4 : Enrichir l'interface centrale

```typescript
// AVANT - Interface originale
export interface TVValidationResult {
  verbatim: string;
  predicted: string;
  correct: boolean;
}

// APRÈS - Interface enrichie
export interface TVValidationResult {
  // Propriétés existantes (conservées telles quelles)
  verbatim: string;
  predicted: string;
  correct: boolean;

  // ✅ Nouvelles propriétés optionnelles
  processingTime?: number;
  id?: string | number;
  confidence?: number;

  // ✅ Métadonnées enrichies
  metadata?: {
    // Propriétés existantes
    source?: string;

    // Nouvelles propriétés optionnelles
    clientTurn?: string;
    m2?: {
      value?: string | number;
      scale?: string;
    };
  };
}
```

### Étape 5 : Documenter les ajouts

```typescript
export interface TVValidationResult {
  verbatim: string;
  predicted: string;
  correct: boolean;

  // ✅ AJOUTÉ pour M2ValidationInterface (Issue #XXX)
  processingTime?: number;
  id?: string | number;

  // ✅ AJOUTÉ pour XValidationInterface (Issue #YYY)
  confidence?: number;
  evidence?: string[];
}
```

## 🛠️ Exemples concrets par type d'erreur

### Erreur : Propriété manquante sur interface de validation

```typescript
// ❌ Erreur
Property 'confidence' does not exist on type 'TVValidationResult'

// ✅ Solution dans core/validation.ts
export interface TVValidationResultCore {
  // Existant
  verbatim: string;
  predicted: string;
  correct: boolean;

  // ✅ Ajouté
  confidence?: number;
  processingTime?: number;
  id?: string | number;
}
```

### Erreur : Propriété manquante sur descripteur d'algorithme

```typescript
// ❌ Erreur
Property 'metrics' does not exist on type 'AlgorithmDescriptor'

// ✅ Solution dans algorithms/base.ts
export interface AlgorithmDescriptor {
  // Existant
  name: string;
  displayName: string;
  target: VariableTarget;

  // ✅ Ajouté
  desc?: {
    displayName?: string;
    description?: string;
  };
  metrics?: {
    differential?: number;
    avgMs?: number;
    accuracy?: number;
  };
  id?: string;
}
```

### Erreur : Props de composant UI manquantes

```typescript
// ❌ Erreur
Property 'algorithms' does not exist on type 'Props'

// ✅ Solution dans ui/components.ts
export interface ClassifierSelectorProps {
  algorithms: ClassifierSelectorAlgorithm[];
  selected: string;
  onSelectClassifier: (id: string) => void;
  target: "X" | "Y" | "M1" | "M2" | "M3";
}

export interface ClassifierSelectorAlgorithm {
  id: string;
  name: string;
  description: string;
  differential: number;
  time: number;
  accuracy: number;
}
```

## 📁 Fichiers de types centralisés

### `core/validation.ts`

Contient :

- `TVValidationResult`, `TVMetadata`
- `ValidationMetrics`, `ValidationLevel`
- `AlgorithmTestConfig`
- Types d'accord inter-annotateurs

### `algorithms/base.ts`

Contient :

- `AlgorithmDescriptor`, `UniversalResult`
- `UniversalAlgorithm`, `AlgorithmType`
- Utilitaires d'algorithmes

### `core/calculations.ts`

Contient :

- `CalculationResult`, `CalculationInput`
- Types d'inputs spécifiques (`XInput`, `YInput`, `M2Input`)
- Métadonnées de calculateurs

### `ui/components.ts`

Contient :

- Props de composants UI
- `DisplayConfig`, `ConfigFormProps`
- Interfaces de résultats d'affichage

## ✅ Checklist de validation

Avant de committer les modifications :

- [ ] **Rétrocompatibilité** : Toutes les nouvelles propriétés sont optionnelles
- [ ] **Documentation** : Commentaires expliquant l'ajout
- [ ] **Cohérence** : Types cohérents avec l'existant
- [ ] **Tests** : Aucune régression sur les composants existants
- [ ] **Compilation** : `npm run type-check` passe sans erreur

## 🚨 Bonnes pratiques

### ✅ À faire

1. **Propriétés optionnelles uniquement** pour éviter les breaking changes
2. **Documenter la raison** de l'ajout dans les commentaires
3. **Noms explicites** pour les nouvelles propriétés
4. **Types génériques** quand c'est pertinent
5. **Grouper logiquement** les propriétés liées

### ❌ À éviter

1. **Propriétés obligatoires** qui casseraient l'existant
2. **Types `any`** qui affaiblissent la sécurité
3. **Duplication** d'interfaces existantes
4. **Noms ambigus** pour les propriétés
5. **Modifications** des propriétés existantes

## 🔄 Processus de review

1. **Vérifier l'impact** sur les autres composants
2. **Tester la compilation** de tous les composants
3. **Documenter les changements** dans les PR
4. **Informer l'équipe** des nouveaux types disponibles

## 📖 Exemple complet

```typescript
// Avant : Erreur TypeScript
export default function MyComponent() {
  const result: TVValidationResult = {
    verbatim: "test",
    predicted: "LABEL",
    correct: true,
    processingTime: 100, // ❌ Erreur TypeScript
  };
}

// Après : Enrichissement du type central
// Dans core/validation.ts
export interface TVValidationResult {
  verbatim: string;
  predicted: string;
  correct: boolean;

  // ✅ Ajouté pour MyComponent
  processingTime?: number;
}

// Dans le composant : Plus d'erreur !
export default function MyComponent() {
  const result: TVValidationResult = {
    verbatim: "test",
    predicted: "LABEL",
    correct: true,
    processingTime: 100, // ✅ OK !
  };
}
```

## 🎯 Avantages de cette méthode

- **Source unique de vérité** pour tous les types
- **Rétrocompatibilité** garantie
- **Évite la duplication** de code
- **Facilite la maintenance** à long terme
- **Améliore la découvrabilité** des propriétés disponibles

Cette méthode garantit un système de types robuste et évolutif tout en préservant la compatibilité avec l'ensemble de la codebase.
