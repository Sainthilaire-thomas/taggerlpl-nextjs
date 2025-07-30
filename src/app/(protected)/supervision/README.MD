# Module Supervision - Architecture Refactorisée

## Vue d'ensemble

Le module Supervision a été refactorisé pour améliorer la maintenabilité, la réutilisabilité et la lisibilité du code. La structure modulaire sépare clairement les responsabilités et facilite les tests unitaires.

## Structure des dossiers

```
supervision/
├── page.tsx                    # Composant principal (150 lignes vs 550 lignes)
├── types/
│   └── index.ts               # Interfaces TypeScript centralisées
├── components/
│   ├── SupervisionStats.tsx   # Statistiques visuelles
│   ├── SupervisionFilters.tsx # Filtres et recherche
│   ├── SupervisionTable.tsx   # Tableau des données
│   ├── TaggingModal.tsx       # Modal d'édition
│   └── index.ts               # Exports des composants
├── hooks/
│   ├── useSupervisionData.ts  # Gestion des données
│   ├── useSupervisionFilters.ts # Logique de filtrage
│   └── index.ts               # Exports des hooks
├── utils/
│   ├── dataHelpers.ts         # Utilitaires pour les données
│   ├── formatters.ts          # Formatage (temps, texte)
│   └── index.ts               # Exports des utilitaires
└── README.md                  # Cette documentation
```

## Interfaces TypeScript

### Types principaux

```typescript
// SupervisionTurnTagged - Données enrichies d'un élément taggé
interface SupervisionTurnTagged {
  id: number;
  call_id: string;
  tag: string;
  verbatim: string;
  next_turn_verbatim: string;
  speaker: string;
  start_time: number;
  end_time: number;
  color: string;
  family: string;
  filename?: string;
  hasTranscript: boolean;
  hasAudio: boolean;
  audioUrl?: string;
  duration?: number;
}

// SupervisionMetrics - Métriques de supervision
interface SupervisionMetrics {
  total: number;
  uniqueTags: number;
  withAudio: number;
  withTranscript: number;
  modifiable: number;
  needsProcessing: number;
}

// SupervisionFilters - État des filtres
interface SupervisionFilters {
  selectedTag: string;
  selectedFamily: string;
  selectedSpeaker: string;
  searchText: string;
  hasAudio: boolean | null;
  hasTranscript: boolean | null;
}

// TagGroupStats - Statistiques par tag
interface TagGroupStats {
  label: string;
  count: number;
  color: string;
  family: string;
}
```

## Composants principaux

### 1. SupervisionStats

**Fichier** : `components/SupervisionStats.tsx`

**Responsabilité** : Affichage des métriques de supervision

```typescript
interface SupervisionStatsProps {
  stats: SupervisionMetrics;
  filteredCount: number;
}
```

**Fonctionnalités** :

- Cartes de statistiques responsive
- Calcul automatique des métriques
- Couleurs adaptatives selon le type de stat
- Affichage formaté des nombres

### 2. SupervisionFiltersComponent

**Fichier** : `components/SupervisionFilters.tsx`

**Responsabilité** : Interface de filtrage complète

```typescript
interface SupervisionFiltersProps {
  filters: SupervisionFilters;
  updateFilters: (updates: Partial<SupervisionFilters>) => void;
  resetFilters: () => void;
  tagStats: TagGroupStats[];
  uniqueFamilies: string[];
  uniqueSpeakers: string[];
  onPageReset: () => void;
}
```

**Fonctionnalités** :

- Recherche textuelle avec icône
- Filtres par tag avec compteurs (Badge)
- Filtres par famille et speaker
- Filtres par disponibilité audio/transcription
- Bouton de filtre rapide "Modifiables"
- Réinitialisation complète des filtres

### 3. SupervisionTable

**Fichier** : `components/SupervisionTable.tsx`

**Responsabilité** : Affichage tabulaire des données

```typescript
interface SupervisionTableProps {
  data: SupervisionTurnTagged[];
  onRowClick: (row: SupervisionTurnTagged) => void;
}
```

**Fonctionnalités** :

- Tableau optimisé avec hover effects
- Chips colorés pour les tags
- Indicateurs visuels (audio, transcription)
- Actions contextuelles (édition, visualisation)
- Formatage intelligent du texte (troncature)
- Tooltips informatifs

### 4. TaggingModal

**Fichier** : `components/TaggingModal.tsx`

**Responsabilité** : Interface d'édition de tagging

```typescript
interface TaggingModalProps {
  open: boolean;
  onClose: () => void;
  selectedRow: SupervisionTurnTagged | null;
  audioUrl: string;
}
```

**Fonctionnalités** :

- Modal fullscreen (90vh) avec TranscriptLPL
- Informations contextuelles (tag actuel, position)
- Intégration avec le système de tagging
- Fermeture avec actualisation automatique

## Hooks personnalisés

### useSupervisionData

**Fichier** : `hooks/useSupervisionData.ts`

**Responsabilité** : Gestion complète des données de supervision

```typescript
interface SupervisionDataHook {
  supervisionData: SupervisionTurnTagged[];
  tagStats: TagGroupStats[];
  stats: SupervisionMetrics;
  loading: boolean;
  error: string | null;
  loadSupervisionData: () => Promise<void>;
}
```

**Fonctionnalités** :

- Chargement paginé des turntagged (1000 par page)
- Sécurité avec limite à 5000 éléments
- Enrichissement avec données call/transcript
- Calcul automatique des statistiques
- Gestion robuste des erreurs et du loading
- Requêtes parallèles optimisées

### useSupervisionFilters

**Fichier** : `hooks/useSupervisionFilters.ts`

**Responsabilité** : Logique complète de filtrage

```typescript
interface SupervisionFiltersHook {
  filters: SupervisionFilters;
  filteredData: SupervisionTurnTagged[];
  updateFilters: (updates: Partial<SupervisionFilters>) => void;
  resetFilters: () => void;
  uniqueFamilies: string[];
  uniqueSpeakers: string[];
}
```

**Fonctionnalités** :

- État des filtres centralisé
- Filtrage optimisé avec useMemo
- Listes uniques pour les sélecteurs
- Fonctions de mise à jour partielle
- Reset complet des filtres

## Utilitaires

### formatters.ts

**Fichier** : `utils/formatters.ts`

```typescript
// Formatage des timestamps en MM:SS
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

// Troncature intelligente du texte
export const truncateText = (text: string, maxLength: number = 100): string => {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};
```

### dataHelpers.ts

**Fichier** : `utils/dataHelpers.ts`

```typescript
// Calcul des métriques globales
export const calculateStats = (
  data: SupervisionTurnTagged[]
): SupervisionMetrics => {
  // Calculs optimisés avec filtrages
};

// Statistiques par tag avec tri
export const calculateTagStats = (
  data: SupervisionTurnTagged[]
): TagGroupStats[] => {
  // Groupement et tri par nombre d'occurrences
};

// Enrichissement des données turntagged
export const enrichTurntaggedData = (
  turntaggedData: any[],
  callsMap: Map<string, any>,
  transcriptsSet: Set<string>
): SupervisionTurnTagged[] => {
  // Enrichissement avec données call/transcript
};
```

## Flux de données

### 1. Chargement initial

```
useSupervisionData()
├── loadAllTurntagged() - Pagination automatique
├── Requêtes parallèles call/transcript
├── enrichTurntaggedData() - Enrichissement
├── calculateStats() - Métriques
└── calculateTagStats() - Stats par tag
```

### 2. Filtrage en temps réel

```
useSupervisionFilters()
├── updateFilters() - Mise à jour partielle
├── useMemo() - Filtrage optimisé
├── Filtres multiples simultanés
└── Listes uniques pour sélecteurs
```

### 3. Interaction utilisateur

```
SupervisionTable row click
├── handleRowClick() - Validation audio/transcript
├── generateSignedUrl() - URL audio sécurisée
├── selectTaggingCall() - Préparation context
├── fetchTaggingTranscription() - Chargement données
└── TaggingModal - Interface d'édition
```

## Optimisations de performance

### 1. Hooks optimisés

- **useMemo** pour filtrage coûteux
- **useCallback** pour stabilité des handlers
- **useState** avec états initiaux optimisés

### 2. Requêtes intelligentes

- **Pagination automatique** (1000 éléments/page)
- **Requêtes parallèles** pour call/transcript
- **Limite de sécurité** à 5000 éléments
- **Maps et Sets** pour correspondances rapides

### 3. Rendu optimisé

- **Composants React.memo** pour éviter re-renders
- **Pagination** des données affichées (50/page)
- **Troncature** du texte pour performance
- **Tooltips** conditionnels

## Avantages de la refactorisation

### 1. Maintenabilité ✅

- **Code modulaire** et organisé
- **Responsabilités** clairement séparées
- **Fonctions réutilisables** entre composants
- **Types TypeScript** complets et cohérents

### 2. Performance ✅

- **Hooks optimisés** avec useMemo/useCallback
- **Chargement paginé** des données
- **Calculs mis en cache** avec invalidation
- **Requêtes parallèles** pour réduire la latence

### 3. Testabilité ✅

- **Hooks isolés** testables unitairement
- **Composants** avec props bien définies
- **Logique métier** séparée de l'UI
- **Utilitaires** purs sans effets de bord

### 4. Réutilisabilité ✅

- **Composants indépendants** réutilisables
- **Hooks personnalisés** exportables
- **Utilitaires génériques** pour autres modules
- **Interfaces TypeScript** partagées

## Migration depuis l'ancien code

### Changements principaux

1. **Composant principal** : 550 → 150 lignes (-73%)
2. **Logique de données** : Déplacée dans `useSupervisionData`
3. **Filtres** : Externalisés dans `useSupervisionFilters`
4. **UI** : Séparée en 4 composants spécialisés
5. **Types** : Centralisés et consolidés

### Compatibilité

- ✅ **API identique** du point de vue utilisateur
- ✅ **Performances améliorées** avec optimisations
- ✅ **Fonctionnalités conservées** intégralement
- ✅ **Nouvelles fonctionnalités** ajoutées (badges, tooltips)

## Utilisation

### Import du composant principal

```typescript
import SupervisionPage from "./supervision/page";
```

### Utilisation des hooks dans d'autres composants

```typescript
import { useSupervisionData, useSupervisionFilters } from "./supervision/hooks";
import { formatTime, truncateText } from "./supervision/utils";
```

### Réutilisation des composants

```typescript
import {
  SupervisionStats,
  SupervisionFiltersComponent,
  SupervisionTable,
  TaggingModal,
} from "./supervision/components";
```

## Extensibilité

### Ajout de nouveaux filtres

1. **Étendre** `SupervisionFilters` interface
2. **Ajouter** la logique dans `useSupervisionFilters`
3. **Mettre à jour** `SupervisionFiltersComponent`
4. **Tester** le filtrage

### Nouvelles métriques

1. **Modifier** `SupervisionMetrics` interface
2. **Ajouter** le calcul dans `calculateStats()`
3. **Mettre à jour** `SupervisionStats` composant
4. **Vérifier** l'affichage

### Nouveaux composants

1. **Créer** dans `components/`
2. **Ajouter** à `components/index.ts`
3. **Importer** dans `page.tsx`
4. **Documenter** l'usage

## Tests recommandés

### Hooks

```typescript
// useSupervisionData
- ✅ Chargement des données
- ✅ Gestion des erreurs
- ✅ Calculs de métriques
- ✅ Pagination automatique

// useSupervisionFilters
- ✅ Filtrage par texte
- ✅ Filtres multiples
- ✅ Reset des filtres
- ✅ Listes uniques
```

### Composants

```typescript
// SupervisionStats
- ✅ Affichage des métriques
- ✅ Formatage des nombres
- ✅ Couleurs adaptatives

// SupervisionFilters
- ✅ Interactions utilisateur
- ✅ Mise à jour des filtres
- ✅ Validation des entrées

// SupervisionTable
- ✅ Rendu des données
- ✅ Actions sur les lignes
- ✅ Indicateurs visuels
```

### Utilitaires

```typescript
// formatters
- ✅ formatTime() - Formatage correct
- ✅ truncateText() - Troncature intelligente

// dataHelpers
- ✅ calculateStats() - Calculs exacts
- ✅ enrichTurntaggedData() - Enrichissement complet
```

## Bonnes pratiques implémentées

### 1. Architecture

- **Séparation des préoccupations** (UI/Logic/Data)
- **Composants fonctionnels** avec hooks
- **Types TypeScript** stricts et complets
- **Exports centralisés** avec index.ts

### 2. Performance

- **Mémoïsation** des calculs coûteux
- **Pagination** des données lourdes
- **Requêtes optimisées** avec parallélisme
- **Rendu conditionnel** intelligent

### 3. Maintenance

- **Code modulaire** et documenté
- **Noms explicites** et cohérents
- **Gestion d'erreurs** robuste
- **Logging** détaillé pour debug

### 4. Expérience utilisateur

- **Feedback visuel** instantané
- **Tooltips** informatifs
- **Filtres intuitifs** avec compteurs
- **Loading states** appropriés

Cette architecture modulaire offre une base solide et évolutive pour le module Supervision, intégrée parfaitement dans l'écosystème TaggerLPL.
