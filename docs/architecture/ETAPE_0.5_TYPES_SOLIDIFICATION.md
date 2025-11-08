# 📋 ÉTAPE 0.5: Solidification des Types TypeScript

**Durée estimée:** 1h30  
**Priorité:** HAUTE (à faire AVANT la migration)  
**Objectif:** Créer une source de vérité unique pour tous les types du projet

---

## 🎯 Pourquoi cette étape est critique

### Problèmes actuels
1. ❌ Pas de types auto-générés depuis Supabase
2. ❌ Types dispersés dans ~15 fichiers différents
3. ❌ Risque de doublons/incohérences
4. ❌ Difficile de maintenir la cohérence avec la DB

### Bénéfices
1. ✅ Source unique de vérité (database.types.ts)
2. ✅ Auto-complétion IDE parfaite
3. ✅ Détection erreurs à la compilation
4. ✅ Migration facilitée (imports centralisés)
5. ✅ Cohérence garantie DB ↔ Types

---

## 📁 Structure cible des types

```
src/
├── types/
│   ├── database.types.ts          # 🆕 Généré depuis Supabase
│   ├── index.ts                   # 🆕 Barrel export principal
│   │
│   ├── entities/                  # 🆕 Types métier dérivés
│   │   ├── call.ts               # Types Call enrichis
│   │   ├── transcription.ts      # Types Transcription
│   │   ├── tag.ts                # Types Tag/LPLTag
│   │   ├── turn.ts               # Types TurnTagged
│   │   └── index.ts
│   │
│   ├── ui/                        # 🆕 Types UI/composants
│   │   ├── tables.ts             # Types DataGrid, tables
│   │   ├── filters.ts            # Types filtres
│   │   ├── forms.ts              # Types formulaires
│   │   └── index.ts
│   │
│   ├── algorithm-lab/             # 🆕 Types AlgorithmLab
│   │   ├── algorithms.ts         # Types algorithmes
│   │   ├── results.ts            # Types résultats
│   │   ├── metrics.ts            # Types métriques
│   │   └── index.ts
│   │
│   └── common.ts                  # Types utilitaires généraux
│
└── lib/
    ├── supabase/
    │   ├── client.ts              # Client Supabase
    │   └── database.types.ts      # 🔗 Symlink ou copie
    └── config/
```

---

## 🔧 Étape 0.5.1: Générer types Supabase (20min)

### Installer CLI Supabase
```bash
npm install -g supabase

# OU utiliser npx
npx supabase --version
```

### Générer database.types.ts
```bash
# Option 1: Depuis projet Supabase local
npx supabase gen types typescript --local > src/types/database.types.ts

# Option 2: Depuis projet Supabase cloud (recommandé)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts

# Option 3: Depuis connexion directe
npx supabase gen types typescript --db-url "postgresql://..." > src/types/database.types.ts
```

### Script automatisé
Créer `scripts/generate-types.ts`:

```typescript
#!/usr/bin/env node
/**
 * Script de génération des types depuis Supabase
 * Usage: npm run generate:types
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';

const PROJECT_ID = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
const OUTPUT_PATH = path.join(__dirname, '../src/types/database.types.ts');

console.log('🔄 Génération des types depuis Supabase...');

try {
  const types = execSync(
    `npx supabase gen types typescript --project-id ${PROJECT_ID}`,
    { encoding: 'utf-8' }
  );

  // Ajouter header personnalisé
  const header = `/**
 * Database types auto-generated from Supabase
 * DO NOT EDIT MANUALLY - Regenerate with: npm run generate:types
 * 
 * Generated on: ${new Date().toISOString()}
 */

`;

  writeFileSync(OUTPUT_PATH, header + types);
  console.log('✅ Types générés avec succès:', OUTPUT_PATH);
} catch (error) {
  console.error('❌ Erreur lors de la génération:', error.message);
  process.exit(1);
}
```

### Ajouter script npm
Dans `package.json`:
```json
{
  "scripts": {
    "generate:types": "ts-node scripts/generate-types.ts",
    "postinstall": "npm run generate:types"
  }
}
```

**Tâches:**
- [ ] Installer Supabase CLI
- [ ] Récupérer PROJECT_ID depuis dashboard Supabase
- [ ] Créer script `scripts/generate-types.ts`
- [ ] Générer `src/types/database.types.ts`
- [ ] Vérifier que les types sont corrects
- [ ] Ajouter au .gitignore ou commiter (selon stratégie)

---

## 🔧 Étape 0.5.2: Créer types entités métier (30min)

### Créer types dérivés enrichis

**src/types/entities/call.ts:**
```typescript
import { Database } from '../database.types';

// Type de base depuis Supabase
export type CallRow = Database['public']['Tables']['call']['Row'];
export type CallInsert = Database['public']['Tables']['call']['Insert'];
export type CallUpdate = Database['public']['Tables']['call']['Update'];

// Type enrichi pour l'UI
export interface Call extends CallRow {
  // Champs calculés
  duration?: number;
  transcriptStatus?: 'none' | 'pending' | 'completed';
  tagCount?: number;
  
  // Relations
  transcript?: Transcript;
  tags?: TurnTagged[];
}

// Type pour filtres
export interface CallFilters {
  origine?: string | null;
  status?: string[];
  dateRange?: { start: Date; end: Date };
  hasTranscript?: boolean;
  isTagged?: boolean;
}

// Type pour actions en lot
export interface BulkCallAction {
  action: 'update_origine' | 'mark_prepared' | 'delete';
  callIds: string[];
  data?: Partial<CallUpdate>;
}
```

**src/types/entities/tag.ts:**
```typescript
import { Database } from '../database.types';

export type LPLTagRow = Database['public']['Tables']['lpltag']['Row'];
export type LPLTagInsert = Database['public']['Tables']['lpltag']['Insert'];

// Type enrichi avec statistiques
export interface Tag extends LPLTagRow {
  // Statistiques d'utilisation
  usageCount?: number;
  callCount?: number;
  avgDuration?: number;
  
  // Exemples
  examples?: TagExample[];
}

export interface TagExample {
  verbatim: string;
  next_turn_verbatim: string;
  call_id: string;
  speaker: string;
  context: 'tag' | 'next_turn_tag';
}

// Type pour famille de tags
export type TagFamily = 
  | 'ENGAGEMENT'
  | 'OUVERTURE'
  | 'REFLET'
  | 'EXPLICATION'
  | 'CLIENT_POSITIF'
  | 'CLIENT_NEGATIF'
  | 'CLIENT_NEUTRE';

export interface TagsByFamily {
  [family: string]: Tag[];
}
```

**src/types/entities/turn.ts:**
```typescript
import { Database } from '../database.types';

export type TurnTaggedRow = Database['public']['Tables']['turntagged']['Row'];
export type TurnTaggedInsert = Database['public']['Tables']['turntagged']['Insert'];

// Type enrichi avec relations
export interface TurnTagged extends TurnTaggedRow {
  // Métadonnées du tag
  tagInfo?: {
    label: string;
    family: TagFamily;
    color: string;
  };
  
  // Contexte
  previousTurn?: TurnTagged;
  nextTurn?: TurnTagged;
  
  // Métriques
  duration?: number;
}

// Type pour l'analyse
export interface TurnPair {
  advisorTurn: TurnTagged;
  clientTurn: TurnTagged;
  strategy: TagFamily;
  reaction: 'POS' | 'NEU' | 'NEG';
}
```

**Tâches:**
- [ ] Créer `src/types/entities/call.ts`
- [ ] Créer `src/types/entities/tag.ts`
- [ ] Créer `src/types/entities/turn.ts`
- [ ] Créer `src/types/entities/transcription.ts`
- [ ] Créer `src/types/entities/index.ts` (barrel)

---

## 🔧 Étape 0.5.3: Créer types UI (20min)

**src/types/ui/tables.ts:**
```typescript
import { Call, Tag, TurnTagged } from '../entities';

// Types pour DataGrid/Tables
export interface TableColumn<T = any> {
  field: keyof T;
  headerName: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  renderCell?: (row: T) => React.ReactNode;
}

export interface TableSort<T = any> {
  field: keyof T;
  direction: 'asc' | 'desc';
}

export interface TablePagination {
  page: number;
  pageSize: number;
  total: number;
}

// Types spécifiques par table
export type CallTableRow = Call & {
  selected?: boolean;
  actions?: CallAction[];
};

export type TagTableRow = Tag & {
  isEditing?: boolean;
  hasChanges?: boolean;
};
```

**src/types/ui/filters.ts:**
```typescript
export interface FilterOperator {
  type: 'equals' | 'contains' | 'startsWith' | 'in' | 'between';
  value: any;
}

export interface FilterDefinition<T = any> {
  field: keyof T;
  operator: FilterOperator;
  label?: string;
}

export interface ActiveFilters<T = any> {
  [field: string]: FilterDefinition<T>;
}
```

**Tâches:**
- [ ] Créer `src/types/ui/tables.ts`
- [ ] Créer `src/types/ui/filters.ts`
- [ ] Créer `src/types/ui/forms.ts`
- [ ] Créer `src/types/ui/index.ts`

---

## 🔧 Étape 0.5.4: Créer types AlgorithmLab (20min)

**src/types/algorithm-lab/algorithms.ts:**
```typescript
// Types de base pour algorithmes
export interface BaseAlgorithm {
  id: string;
  name: string;
  version: string;
  type: 'classifier' | 'calculator';
  category: 'conseiller' | 'client' | 'M1' | 'M2' | 'M3';
}

export interface ClassifierResult {
  predictedTag: string;
  confidence: number;
  alternatives?: Array<{
    tag: string;
    confidence: number;
  }>;
}

export interface CalculatorResult {
  value: number;
  metadata?: Record<string, any>;
}

// Types pour versions
export interface AlgorithmVersion {
  version: string;
  algorithm: BaseAlgorithm;
  createdAt: Date;
  config: Record<string, any>;
  performance?: PerformanceMetrics;
}

export interface PerformanceMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  confusionMatrix?: number[][];
}
```

**Tâches:**
- [ ] Créer `src/types/algorithm-lab/algorithms.ts`
- [ ] Créer `src/types/algorithm-lab/results.ts`
- [ ] Créer `src/types/algorithm-lab/metrics.ts`
- [ ] Créer `src/types/algorithm-lab/index.ts`

---

## 🔧 Étape 0.5.5: Créer barrel exports (10min)

**src/types/index.ts:**
```typescript
/**
 * Central export point for all types
 * Import with: import { Call, Tag, ... } from '@/types'
 */

// Database types
export * from './database.types';

// Entity types
export * from './entities';

// UI types
export * from './ui';

// Algorithm Lab types
export * from './algorithm-lab';

// Common utilities
export * from './common';
```

**Tâches:**
- [ ] Créer `src/types/index.ts`
- [ ] Créer `src/types/entities/index.ts`
- [ ] Créer `src/types/ui/index.ts`
- [ ] Créer `src/types/algorithm-lab/index.ts`

---

## 🔧 Étape 0.5.6: Configurer tsconfig paths (10min)

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/types": ["./src/types"],
      "@/types/*": ["./src/types/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  }
}
```

**Tâches:**
- [ ] Mettre à jour `tsconfig.json`
- [ ] Vérifier que VS Code reconnaît les paths
- [ ] Tester l'auto-complétion

---

## ✅ Validation Étape 0.5

### Checklist finale
- [ ] `database.types.ts` généré et à jour
- [ ] Types entités créés (call, tag, turn, transcription)
- [ ] Types UI créés (tables, filters, forms)
- [ ] Types AlgorithmLab créés
- [ ] Barrel exports en place
- [ ] tsconfig paths configurés
- [ ] Compilation TypeScript sans erreurs
- [ ] Auto-complétion IDE fonctionne
- [ ] Documentation types à jour

### Commandes de test
```bash
# Vérifier compilation
npm run type-check

# Vérifier imports
npm run build

# Tester auto-complétion
# Ouvrir n'importe quel fichier et taper: import { Call } from '@/types'
```

---

## 📝 Commit

```bash
git add src/types/
git add tsconfig.json
git add package.json
git commit -m "feat(types): solidify TypeScript types system

- Generate database.types.ts from Supabase
- Create entity types (call, tag, turn, transcription)
- Create UI types (tables, filters, forms)
- Create AlgorithmLab types
- Setup barrel exports
- Configure tsconfig paths for @/types

This provides a single source of truth for all types before architecture migration."

git push origin refactor/architecture-phases
```

---

## 🎯 Impact sur la migration

### Avant cette étape
```typescript
// ❌ Imports dispersés, incohérents
import { Call } from '../../components/calls/types';
import { Tag } from '../../../components/tags/TagManager/types';
import type { TurnTagged } from '@/components/TranscriptLPL/types';
```

### Après cette étape
```typescript
// ✅ Import unique, cohérent, facile à migrer
import { Call, Tag, TurnTagged } from '@/types';
```

**Cette centralisation rendra les étapes 2-5 beaucoup plus simples !**

---

**Estimation:** 1h30  
**Risque:** Faible  
**Impact:** Très positif pour toute la migration
