# 📋 Plan de Mise à Niveau : CallManagementPage → CallTableList Legacy

## 🎯 Objectif

Intégrer toutes les fonctionnalités avancées de `CallTableList` legacy dans la nouvelle architecture DDD `CallManagementPage` pour obtenir une interface complète et moderne.

## 📊 Fonctionnalités manquantes à récupérer

### 🚀 1. Cache Intelligent Multi-niveaux

**🔍 Fonctionnalité Legacy :**

```typescript
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
  cacheTimeout: 30000, // 30 secondes
});
```

**⚡ Avantages :**

- Cache hit : ~0.1ms pour 1000+ appels
- Cache miss : ~10-50ms selon complexité
- Auto-nettoyage si +5 appels ajoutés/supprimés
- Statistiques de performance (hits/misses)

**🔧 Intégration DDD :**

```typescript
// src/components/calls/ui/hooks/useOptimizedCallManagement.ts
export const useOptimizedCallManagement = () => {
  const services = useMemo(() => createServices(), []);

  // Intégrer le cache du legacy avec les services DDD
  const { filteredAndSortedCalls, cacheStats, clearCache } =
    useOptimizedCallData({
      taggingCalls: calls, // depuis CallService
      cacheTimeout: 30000,
    });

  return {
    // Services DDD + optimisations legacy
    ...services,
    filteredAndSortedCalls,
    cacheStats,
    clearCache,
  };
};
```

### 📱 2. Interface Mobile avec Cartes Expandables

**🔍 Fonctionnalité Legacy :**

- Cartes condensées avec expansion
- Sélection multiple tactile
- Actions contextuelles optimisées

**📋 Structure de carte mobile legacy :**

```
┌───────────────────────────────────┐
│ ☑️ 🔊 Nom du fichier            ⌄  │
│    🕐 Durée | 🔊 Statut             │
│ 🏷️ Origine: workdrive               │
│ ─────────────────────────────────── │  ← Expansion
│ 📝 Description: ...                 │
│ 🔧 Infos techniques: ID, chemin     │
│ [🎵 Charger]              [🗑️]     │
└───────────────────────────────────┘
```

**🔧 Intégration DDD :**

```typescript
// src/components/calls/ui/components/MobileCallCard.tsx
import { MobileCallCard } from "../legacy/CallTableList";

const CallManagementMobile = () => {
  return (
    <Box>
      {calls.map((call) => (
        <MobileCallCard
          key={call.id}
          call={call}
          onCallClick={handleCallAction}
          onDeleteClick={deleteCall}
          // Intégrer avec actions DDD
        />
      ))}
    </Box>
  );
};
```

### ⚡ 3. Actions en Lot Optimisées

**🔍 Fonctionnalité Legacy :**

```typescript
const {
  selectedCalls,
  selectedCount,
  isBulkProcessing,
  actions: { selectCall, selectAll, processBulkAction },
} = useBulkActions();
```

**🎛️ Interface actions en lot :**

```
┌──────────────────────────────────────────────────────────┐
│ 3 appels sélectionnés | [Nouvelle origine ⌄] [📋] [❌] [🗑️] │
└──────────────────────────────────────────────────────────┘
```

**🔧 Intégration DDD :**

```typescript
// src/components/calls/ui/hooks/useBulkCallActions.ts
export const useBulkCallActions = () => {
  const services = createServices();
  const legacyBulk = useBulkActions();

  const processBulkOriginUpdate = async (origine: string) => {
    const callIds = Array.from(legacyBulk.selectedCalls);

    // Utiliser BulkPreparationWorkflow du DDD
    const workflow = new BulkPreparationWorkflow(
      services.callService,
      services.validationService
    );

    return workflow.prepareBatch(callIds, {
      onProgress: (progress) => setProgress(progress),
    });
  };

  return {
    ...legacyBulk,
    processBulkOriginUpdate,
  };
};
```

### 🔍 4. Filtrage et Tri Avancés

**🔍 Fonctionnalité Legacy :**

- Recherche textuelle (nom, description, ID)
- Filtres par statut (tous, non supervisé, en cours, etc.)
- Filtres par audio (avec/sans audio)
- Filtres par origine (toutes + liste dynamique)
- Tri multi-colonnes cliquable

**🔧 Intégration DDD :**

```typescript
// src/components/calls/ui/components/AdvancedCallFilters.tsx
interface CallFiltersProps {
  calls: Call[];
  onFiltersChange: (filtered: Call[]) => void;
}

export const AdvancedCallFilters = ({
  calls,
  onFiltersChange,
}: CallFiltersProps) => {
  const { filters, updateFilters } = useOptimizedCallData({
    taggingCalls: calls,
    cacheTimeout: 30000,
  });

  return (
    <CallTableFilters
      filters={filters}
      onFiltersChange={(newFilters) => {
        updateFilters(newFilters);
        // Synchroniser avec le state DDD
      }}
      uniqueOrigines={uniqueOrigines}
      resultCount={filteredCalls.length}
    />
  );
};
```

### ✏️ 5. Édition Inline de l'Origine

**🔍 Fonctionnalité Legacy :**

- Clic sur 📝 pour éditer
- Validation Enter / Annulation Escape
- Feedback temps réel

**🔧 Intégration DDD :**

```typescript
// Utiliser updateCallOrigin du CallService
const handleSaveOrigine = async (callId: string, newOrigin: string) => {
  try {
    await services.callService.updateCallOrigin(callId, newOrigin);
    // Rafraîchir la liste avec loadCalls()
    await loadCalls();
  } catch (error) {
    showError(`Erreur: ${error.message}`);
  }
};
```

### 🔗 6. Statut des Relations next_turn_tag

**🔍 Fonctionnalité Legacy :**

```typescript
// ✅ NOUVELLE COLONNE: Relations
<TableCell align="center">
  <Tooltip title="Statut des relations next_turn_tag calculées">
    <span>Relations</span>
  </Tooltip>
</TableCell>
```

**🎯 Types de statut :**

- ✅ **Complet** (vert) : 100% des tags ont next_turn_tag
- ⚠️ **Partiel** (orange) : 50-99% des tags ont next_turn_tag
- ❌ **Incomplet** (rouge) : <50% des tags ont next_turn_tag

**🔧 Intégration DDD :**

```typescript
// Ajouter à CallRepository
interface CallRepository {
  // ... méthodes existantes
  getRelationsStatus(callId: string): Promise<RelationsStatus>;
}

interface RelationsStatus {
  totalTags: number;
  tagsWithNextTurn: number;
  completenessPercent: number;
  isCalculated: boolean;
  missingRelations: number;
  lastChecked: Date;
}
```

---

## 🏗️ Plan d'implémentation étape par étape

### 📋 Phase 1 : Hooks d'optimisation (1-2 jours)

1. **Créer useOptimizedCallManagement.ts**
   - Intégrer le cache legacy avec les services DDD
   - Maintenir la compatibilité avec les Call entities
2. **Créer useBulkCallActions.ts**
   - Fusionner useBulkActions legacy avec BulkPreparationWorkflow
   - Ajouter feedback temps réel
3. **Tests de performance**
   - Vérifier que le cache fonctionne avec les entités DDD
   - Mesurer les gains de performance

### 📋 Phase 2 : Interface mobile (1 jour)

1. **Adapter MobileCallCard pour les entités DDD**
   - Convertir Call legacy → Call entity
   - Intégrer avec CallService pour les actions
2. **Responsive design**
   - Breakpoint detection
   - Navigation tactile optimisée

### 📋 Phase 3 : Filtres avancés (1 jour)

1. **Intégrer CallTableFilters**
   - Adapter les types de données
   - Maintenir la performance du cache
2. **Tri multi-colonnes**
   - TableSortLabel pour toutes les colonnes
   - Persistance de l'état de tri

### 📋 Phase 4 : Actions en lot (1-2 jours)

1. **BulkActionsToolbar**
   - Sélection multiple avec checkboxes
   - Actions : origine, suppression, statut
2. **Traitement par batches**
   - Éviter la surcharge serveur
   - Feedback progressif utilisateur

### 📋 Phase 5 : Fonctionnalités avancées (2 jours)

1. **Édition inline**
   - TextField avec validation
   - Intégration CallService.updateCallOrigin()
2. **Statut relations next_turn_tag**
   - Nouvelle colonne dans le tableau
   - Cache des statuts pour performance
3. **Tests d'intégration**
   - Tous les workflows complets
   - Performance avec gros volumes

---

## 🔧 Adaptations techniques spécifiques

### 🏗️ Architecture hybride recommandée

```typescript
// CallManagementPage mise à niveau
const CallManagementPageUpgraded = () => {
  // Services DDD
  const services = createServices();

  // Optimisations legacy intégrées
  const { calls, filteredAndSortedCalls, cacheStats, loading } =
    useOptimizedCallManagement();

  // Actions en lot hybrides
  const bulkActions = useBulkCallActions();

  // Interface adaptative
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box>
      {/* Filtres avancés */}
      <AdvancedCallFilters
        calls={calls}
        onFiltersChange={handleFiltersChange}
      />

      {/* Actions en lot */}
      <BulkActionsToolbar {...bulkActions} />

      {/* Interface adaptative */}
      {isMobile ? (
        <MobileCallManagement calls={filteredAndSortedCalls} />
      ) : (
        <DesktopCallTable calls={filteredAndSortedCalls} />
      )}

      {/* Debug cache en dev */}
      {process.env.NODE_ENV === "development" && (
        <CacheDebugPanel stats={cacheStats} />
      )}
    </Box>
  );
};
```

### 🎯 Maintien de la compatibilité DDD

```typescript
// Adapter les types legacy vers DDD
const adaptLegacyCall = (dddCall: Call): LegacyCall => ({
  callid: dddCall.id,
  filename: dddCall.filename,
  filepath: dddCall.getAudioFile()?.path,
  upload: dddCall.hasValidAudio(),
  duree: dddCall.getAudioFile()?.getFormattedDuration(),
  status: dddCall.status,
  origine: dddCall.origin,
  description: dddCall.description,
});

const adaptToDDD = (legacyCall: LegacyCall): Call => {
  // Reconstruction via les factories DDD
  return new Call(
    legacyCall.callid,
    legacyCall.filename,
    legacyCall.description,
    legacyCall.status as CallStatus,
    legacyCall.origine
  );
};
```

---

## 📊 Métriques de réussite

### ⚡ Performance

- **Cache hit rate > 90%** pour les opérations répétitives
- **Temps de filtrage < 50ms** pour 1000+ appels
- **Actions en lot : 5 appels/batch** avec délais optimisés

### 🎨 UX/UI

- **Interface mobile fluide** avec cartes expandables
- **Feedback temps réel** pour toutes les actions
- **Sélection multiple intuitive** avec compteurs

### 🔧 Maintenabilité

- **Architecture DDD préservée** avec adaptateurs legacy
- **Hooks réutilisables** dans d'autres composants
- **Tests unitaires** pour les hooks complexes

---

## 🚀 Conclusion

Cette mise à niveau permettra d'obtenir **le meilleur des deux mondes** :

- **Architecture DDD moderne** avec services métier séparés
- **Fonctionnalités complètes** de l'interface legacy optimisée
- **Performance cache** pour les gros volumes
- **Interface responsive** desktop + mobile

Le résultat sera une `CallManagementPage` complète, moderne et performante, intégrant toutes les fonctionnalités avancées perdues lors de la migration vers l'architecture DDD.
