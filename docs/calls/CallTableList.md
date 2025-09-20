# Documentation CallTableList - Composants et Fonctionnalités

## Vue d'ensemble

`CallTableList` est un composant React avancé pour la gestion et l'affichage des appels dans l'application TaggerLPL. Il offre une interface moderne, optimisée et responsive avec des fonctionnalités avancées de tri, filtrage, sélection en lot et cache intelligent.

## Architecture modulaire

```
CallTableList/
├── hooks/
│   ├── useOptimizedCallData.tsx    # Cache intelligent et optimisations
│   └── useBulkActions.tsx          # Gestion des actions en lot
├── CallTableList.tsx               # Composant principal
├── CallTableFilters.tsx            # Filtres de recherche et tri
├── CallTableRow.tsx                # Ligne de tableau optimisée
├── MobileCallCard.tsx              # Vue mobile en cartes
├── BulkActionsToolbar.tsx          # Barre d'outils actions en lot
├── types.ts                        # Définitions TypeScript
├── utils.ts                        # Fonctions utilitaires
└── index.ts                        # Exports du module
```

## 🎯 Fonctionnalités principales

### ✅ Interface adaptative desktop/mobile

- **Desktop** : Tableau complet avec colonnes triables
- **Mobile** : Cartes condensées avec expansion
- **Responsive design** automatique

### ✅ Système de cache intelligent

- **Cache multi-niveaux** pour les performances
- **Invalidation automatique** basée sur l'âge et le contenu
- **Statistiques de performance** (hits/misses)
- **Auto-nettoyage** en cas de changements majeurs

### ✅ Actions en lot avancées

- **Sélection multiple** avec checkboxes
- **Modification d'origine en lot** via dropdown
- **Suppression en lot** avec confirmation
- **Traitement par batches** pour éviter la surcharge

### ✅ Filtrage et tri puissants

- **Recherche textuelle** (nom, description, ID)
- **Filtres par statut** (tous, non supervisé, en cours, etc.)
- **Filtres par audio** (avec/sans audio)
- **Filtres par origine** (toutes, workdrive, upload, etc.)
- **Tri multi-colonnes** cliquable

### ✅ Édition inline

- **Modification d'origine** directe dans le tableau
- **Validation temps réel**
- **Annulation possible** (Escape)
- **Confirmation automatique** (Enter)

### ✅ Gestion des relations next_turn_tag

- **Colonne Relations** dédiée
- **Calcul automatique** du pourcentage de complétude
- **Indicateurs visuels** (✅ complet, ⚠️ partiel, ❌ incomplet)
- **Tooltips informatifs** avec détails

---

## 📋 Composants détaillés

## 1. CallTableList.tsx (Composant principal)

### Props principales

```typescript
interface CallTableListProps {
  showMessage: (message: string) => void;
}
```

### Fonctionnalités clés

- **Gestion d'état complète** avec hooks optimisés
- **Interface adaptative** desktop/mobile automatique
- **Cache intelligent** pour les performances
- **Actions en lot** avec feedback utilisateur
- **Gestion des erreurs** robuste

### Hooks utilisés

```typescript
// Hook pour cache et optimisations
const {
  filteredAndSortedCalls,
  uniqueOrigines,
  filters,
  sortState,
  updateFilters,
  updateSort,
  cacheStats,
  clearCache,
} = useOptimizedCallData({
  taggingCalls,
  cacheTimeout: 30000,
});

// Hook pour actions en lot
const {
  selectedCalls,
  selectedCount,
  isBulkProcessing,
  setIsBulkProcessing,
  actions: bulkActions,
} = useBulkActions();
```

---

## 2. CallTableFilters.tsx (Filtres)

### Interface

```typescript
interface CallTableFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  uniqueOrigines: string[];
  resultCount: number;
  isMobile?: boolean;
}
```

### Fonctionnalités

- **Recherche textuelle** avec icône
- **Filtres par statut** (tous, non supervisé, en cours, évalué, etc.)
- **Filtres par audio** (tous, avec audio, sans audio)
- **Filtres par origine** (toutes + liste dynamique)
- **Compteur de résultats** temps réel
- **Layout adaptatif** mobile/desktop

### États gérés

```typescript
interface FilterState {
  searchTerm: string; // Terme de recherche
  statusFilter: string; // Filtre de statut
  audioFilter: string; // Filtre audio
  origineFilter: string; // Filtre origine
}
```

---

## 3. CallTableRow.tsx (Ligne de tableau)

### Props

```typescript
interface CallTableRowProps {
  call: Call;
  index: number;
  editingOrigine: string | null;
  onStartEditOrigine: (callid: string | number) => void;
  onSaveOrigine: (callid: string | number, origine: string) => void;
  onCancelEditOrigine: () => void;
  onCallClick: (call: Call) => void;
  onDeleteClick: (call: Call) => void;
  isSelected?: boolean;
  onSelectionChange?: (callid: string | number, isSelected: boolean) => void;
  disabled?: boolean;
  relationsStatusChip?: React.ReactNode;
  relationsTooltip?: string;
}
```

### Colonnes affichées

1. **Checkbox** de sélection
2. **Nom du fichier** avec icône audio
3. **Audio** (bouton play si disponible)
4. **Durée** (chip coloré)
5. **Statut** (chip avec couleur selon état)
6. **Relations** (nouveau : chip avec pourcentage next_turn_tag)
7. **Origine** (édition inline possible)
8. **Description** (tronquée avec ellipsis)
9. **Actions** (charger, supprimer)

### Optimisations

- **Composant mémoïsé** (`React.memo`)
- **Handlers optimisés** (`useCallback`)
- **Formatage mémoïsé** des données
- **Styles conditionnels** pour sélection

---

## 4. MobileCallCard.tsx (Vue mobile)

### Props

```typescript
interface MobileCallCardProps {
  call: Call;
  isExpanded: boolean;
  onToggleExpansion: (callid: string | number) => void;
  onCallClick: (call: Call) => void;
  onDeleteClick: (call: Call) => void;
  isSelected?: boolean;
  onSelectionChange?: (callid: string | number, isSelected: boolean) => void;
  disabled?: boolean;
}
```

### Structure de la carte

```
┌─────────────────────────────────────┐
│ ☑️ 🔊 Nom du fichier            ⌄  │
│    🕐 Durée | 📊 Statut             │
│ 🏷️ Origine: workdrive               │
│ ──────────────────────────────────── │  ← Expansion
│ 📝 Description: ...                 │
│ 🔧 Infos techniques: ID, chemin     │
│ [🎵 Charger]              [🗑️]     │
└─────────────────────────────────────┘
```

### Fonctionnalités

- **Expansion/réduction** avec animation
- **Sélection multiple** via checkbox
- **Clic global** pour charger (si audio)
- **Actions contextuelles** (charger, supprimer)
- **Informations techniques** en expansion

---

## 5. BulkActionsToolbar.tsx (Actions en lot)

### Props

```typescript
interface BulkActionsToolbarProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkOrigineChange: (origine: string) => void;
  bulkOrigineValue: string;
  uniqueOrigines: string[];
  isBulkProcessing: boolean;
}
```

### Interface

```
┌─────────────────────────────────────────────────────────────┐
│ 3 appels sélectionnés | [Nouvelle origine ⌄] [📋] [❌] [🗑️] │
└─────────────────────────────────────────────────────────────┘
```

### Actions disponibles

- **Dropdown d'origine** : Changer l'origine en lot
- **Sélectionner tout** : Sélectionne tous les appels visibles
- **Tout désélectionner** : Vide la sélection
- **Supprimer la sélection** : Suppression en lot avec confirmation

### États

- **Visible uniquement** si des appels sont sélectionnés
- **Désactivé** pendant le traitement en lot
- **Feedback visuel** avec LinearProgress

---

## 6. Hooks d'optimisation

### useOptimizedCallData.tsx

**Objectif** : Cache intelligent multi-niveaux pour optimiser les performances

```typescript
const {
  filteredAndSortedCalls, // Données filtrées et triées
  uniqueOrigines, // Liste unique des origines
  filters, // État actuel des filtres
  sortState, // État actuel du tri
  updateFilters, // Mise à jour des filtres
  updateSort, // Mise à jour du tri
  cacheStats, // Statistiques du cache
  clearCache, // Vider le cache manuellement
} = useOptimizedCallData({
  taggingCalls,
  cacheTimeout: 30000, // 30 secondes
});
```

**Fonctionnalités** :

- **Cache principal** : Données filtrées/triées (30s par défaut)
- **Cache séparé** : Origines uniques (basé sur contenu)
- **Invalidation intelligente** : Âge + cohérence des paramètres
- **Auto-nettoyage** : Si +5 appels ajoutés/supprimés
- **Statistiques** : Hits/misses pour monitoring

**Performance** :

- ✅ Cache hit : ~0.1ms pour 1000+ appels
- ⚠️ Cache miss : ~10-50ms selon complexité
- 🧹 Auto-nettoyage intelligent

### useBulkActions.tsx

**Objectif** : Gestion centralisée des actions en lot

```typescript
const {
  selectedCalls, // Set<string> des IDs sélectionnés
  selectedCount, // Nombre d'appels sélectionnés
  isBulkProcessing, // État de traitement en cours
  setIsBulkProcessing, // Setter pour l'état de traitement
  actions: {
    selectCall, // Sélectionner un appel
    deselectCall, // Désélectionner un appel
    toggleCall, // Basculer la sélection
    selectAll, // Sélectionner tous
    clearSelection, // Vider la sélection
    processBulkAction, // Traiter une action en lot
  },
} = useBulkActions();
```

---

## 📊 Types de données

### Interface Call principale

```typescript
interface Call {
  callid: string | number; // ID unique (flexible)
  filename?: string; // Nom du fichier
  filepath?: string; // Chemin de stockage
  upload?: boolean; // Audio uploadé ?
  duree?: string; // Durée formatée (mm:ss)
  status?: string; // Statut de l'appel
  origine?: string; // Source (workdrive, upload, etc.)
  description?: string; // Description libre
  createdAt?: string; // Date de création
  updatedAt?: string; // Date de modification
}
```

### États de filtrage et tri

```typescript
interface FilterState {
  searchTerm: string; // Terme de recherche
  statusFilter: string; // Filtre de statut
  audioFilter: string; // Filtre audio
  origineFilter: string; // Filtre origine
}

interface SortState {
  order: "asc" | "desc"; // Direction du tri
  orderBy: keyof Call; // Colonne de tri
}
```

### Cache et pagination

```typescript
interface CallListCache {
  lastUpdate: number; // Timestamp de dernière MAJ
  data: Call[]; // Données en cache
  filters: FilterState; // Filtres appliqués
  sort: SortState; // Tri appliqué
}

interface PaginationState {
  page: number; // Page actuelle (0-based)
  rowsPerPage: number; // Nombre d'éléments par page
}
```

---

## 🚀 Fonctionnalités avancées

### 1. Édition inline de l'origine

**Déclenchement** : Clic sur l'icône ✏️ dans la colonne Origine

**Interface** :

```
┌─────────────────────────────────┐
│ [workdrive        ] [✓] [✗]    │
└─────────────────────────────────┘
```

**Contrôles** :

- **Enter** : Sauvegarder
- **Escape** : Annuler
- **Clic ✓** : Sauvegarder
- **Clic ✗** : Annuler

### 2. Système de relations next_turn_tag

**Affichage** : Nouvelle colonne "Relations" avec chips colorés

**Types de statut** :

- ✅ **Complet** (vert) : 100% des tags ont next_turn_tag
- ⚠️ **Partiel** (orange) : 50-99% des tags ont next_turn_tag
- ❌ **Incomplet** (rouge) : <50% des tags ont next_turn_tag
- 🔄 **Vérification...** : Chargement en cours
- ❓ **Inconnu** : Erreur ou pas de données

**Tooltip informatif** :

```
Relations: 15/20 (75.0%)
5 relations manquantes
Dernière vérification: 14:32:15
```

### 3. Actions en lot optimisées

**Traitement par batches** :

- Modifications d'origine : **5 appels/batch**
- Suppressions : **3 appels/batch**
- Délais entre batches : **100-200ms**

**Feedback utilisateur** :

- Toolbar seulement si sélection active
- LinearProgress pendant traitement
- Messages de succès/erreur détaillés
- Compteur temps réel des appels traités

### 4. Cache intelligent multi-niveaux

**Niveau 1 - Cache principal** :

- Durée de vie : 30 secondes
- Contenu : Données filtrées et triées
- Invalidation : Âge + changement de paramètres

**Niveau 2 - Cache origines** :

- Durée de vie : Basé sur le contenu
- Contenu : Liste unique des origines
- Invalidation : Changement des origines d'appels

**Statistiques de performance** :

```typescript
{
  hits: 142,                 // Nombre de cache hits
  misses: 8,                 // Nombre de cache misses
  hitRate: "94.7%",          // Taux de réussite
  lastUpdate: Date           // Dernière mise à jour
}
```

---

## 🎨 Interface et UX

### Adaptabilité responsive

**Breakpoint mobile** : `theme.breakpoints.down("md")` (< 900px)

**Desktop** :

- Tableau complet avec toutes les colonnes
- Tri cliquable sur en-têtes
- Édition inline
- Actions hover

**Mobile** :

- Cartes expansibles
- Informations essentielles visibles
- Informations techniques en expansion
- Actions tactiles optimisées

### Design système

**Couleurs de statut** :

- `success` : Appels terminés, relations complètes
- `warning` : Appels en cours, relations partielles
- `error` : Appels en erreur, relations incomplètes
- `info` : Appels en traitement
- `default` : États neutres

**Feedback visuel** :

- Sélection : Fond bleu clair + bordure
- Hover : Légère surbrillance
- Disabled : Opacité réduite (0.6)
- Processing : LinearProgress + texte explicatif

---

## 🔧 Optimisations techniques

### 1. Mémorisation stratégique

**Composants mémoïsés** :

```typescript
const CallTableRow = memo(({ call, ... }) => { ... });
const MobileCallCard = memo(({ call, ... }) => { ... });
const BulkActionsToolbar = memo(({ selectedCount, ... }) => { ... });
```

**Handlers optimisés** :

```typescript
const handleCallClick = useCallback(async (call: Call) => { ... }, [deps]);
const handleFiltersChange = useCallback((filters) => { ... }, [deps]);
```

**Calculs coûteux** :

```typescript
const filteredAndSortedCalls = useMemo(() => { ... }, [deps]);
const uniqueOrigines = useMemo(() => { ... }, [taggingCalls]);
```

### 2. Gestion d'état optimisée

**États locaux minimaux** :

- Filtres et tri via hooks dédiés
- Sélection en lot via hook dédié
- UI temporaire (modals, édition) en état local

**Invalidation intelligente** :

- Cache basé sur l'âge ET le contenu
- Nettoyage automatique sur changements majeurs
- Statistiques pour monitoring des performances

### 3. Traitement asynchrone

**Actions en lot** :

- Traitement par batches pour éviter surcharge
- Délais entre batches pour éviter rate limiting
- Feedback temps réel pour l'utilisateur
- Gestion d'erreurs granulaire

---

## 📝 Messages utilisateur

### Types de messages

**Succès** :

- "3 appel(s) mis à jour avec l'origine: workdrive"
- "Appel chargé avec succès."
- "Origine mise à jour avec succès: upload"

**Erreurs** :

- "Erreur lors de la mise à jour en lot: [détail]"
- "Chemin du fichier audio manquant."
- "Erreur lors de la récupération du fichier audio."

**Information** :

- "Appel sans audio chargé."
- "Traitement en cours... (3 appel(s))"

---

## 🧪 Extensibilité

### Ajout de nouvelles colonnes

1. **Étendre l'interface Call** dans `types.ts`
2. **Ajouter la colonne** dans `CallTableRow.tsx`
3. **Mettre à jour le tri** dans `utils.ts` si nécessaire
4. **Adapter la vue mobile** dans `MobileCallCard.tsx`

### Nouveaux types de filtres

1. **Étendre FilterState** dans `types.ts`
2. **Ajouter le contrôle** dans `CallTableFilters.tsx`
3. **Mettre à jour la logique** dans `utils.ts > filterCalls`
4. **Adapter le cache** si impact sur les clés

### Nouvelles actions en lot

1. **Ajouter l'action** dans `BulkActionsToolbar.tsx`
2. **Implémenter le handler** dans `CallTableList.tsx`
3. **Étendre le hook** `useBulkActions.tsx` si nécessaire
4. **Ajouter les utilitaires** dans `utils.ts`

---

## 📋 Checklist développeur

### Avant modification

- [ ] Comprendre l'impact sur le cache
- [ ] Vérifier la compatibilité mobile/desktop
- [ ] Identifier les dépendances des hooks
- [ ] Prévoir la gestion d'erreurs

### Après modification

- [ ] Tester sur mobile et desktop
- [ ] Vérifier les performances avec gros volumes
- [ ] Valider les actions en lot
- [ ] Contrôler les messages utilisateur
- [ ] Vérifier l'invalidation du cache

### Tests recommandés

- [ ] Filtrage avec différentes combinaisons
- [ ] Tri sur toutes les colonnes
- [ ] Sélection en lot (quelques appels, tous, aucun)
- [ ] Édition inline avec validation/annulation
- [ ] Actions en lot avec gestion d'erreurs
- [ ] Performance avec 100+ appels

---

Cette documentation couvre l'ensemble des fonctionnalités et composants de CallTableList. Le système est conçu pour être performant, extensible et user-friendly, avec une architecture modulaire facilitant la maintenance et l'évolution.
