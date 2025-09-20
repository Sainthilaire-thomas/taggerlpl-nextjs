# Documentation CallListUnprepared - Modules et Fonctionnalités

## 🎯 Finalité du composant

### Objectif principal

`CallListUnprepared` est le **centre de préparation technique des appels** pour le système de tagging conversationnel. Il permet aux utilisateurs de transformer des appels bruts (audio + transcription) en appels prêts pour l'annotation linguistique.

### Contexte métier

Dans le cadre d'une recherche en analyse conversationnelle, ce composant constitue l'étape cruciale entre :

- **L'import d'appels bruts** (fichiers audio + transcriptions automatiques)
- **Le tagging linguistique** (annotation fine des stratégies conversationnelles)

### Workflow utilisateur complet

```
📞 Appels importés → 🔧 CallListUnprepared → ✅ Préparation → 🏷️ Tagging → 📊 Analyse
```

1. **Visualisation** : Consulter les appels disponibles groupés par origine
2. **Complément** : Ajouter audio/transcription manquants si nécessaire
3. **Organisation** : Éditer les origines en lot pour un classement cohérent
4. **Préparation** : Valider techniquement un appel pour le rendre "taggable"
5. **Nettoyage** : Supprimer les appels non pertinents ou défectueux

### Valeur ajoutée

- **Efficacité** : Traitement en lot des origines (jusqu'à 612 appels simultanément)
- **Qualité** : Validation technique avant tagging (vérification transcription)
- **Traçabilité** : Suivi du statut de chaque appel dans le pipeline
- **Flexibilité** : Support de tous types de contenu (audio seul, transcription seule, complet)

## Vue d'ensemble technique

`CallListUnprepared` est un système complet de gestion d'appels non préparés pour le tagging, organisé en architecture modulaire avec optimisations de performance et interface utilisateur moderne.

### Indicateurs de performance métier

**Métriques de préparation** :

- **Taux de préparation** : % d'appels prêts pour le tagging
- **Complétude du contenu** : Répartition audio/transcription/complet
- **Origine normalisée** : % d'appels avec origine définie
- **Statut de supervision** : Répartition conflictuel/non-conflictuel/non supervisé

**Objectifs qualité** :

- ✅ **100% des appels préparés** doivent avoir une transcription valide
- ✅ **Classification par origine** pour faciliter l'analyse comparative
- ✅ **Métadonnées complètes** (durée, statut, description) pour le contexte
- ✅ **Traçabilité** de chaque étape de préparation

### Cas d'usage principaux

#### 1. **Préparation de corpus de recherche**

_Scénario_ : Un chercheur veut analyser 200 appels conflictuels de centres d'appels

- Importer les appels par lot
- Normaliser les origines (Assurance, Télécom, Transport, Services publics)
- Valider la qualité des transcriptions
- Préparer techniquement pour l'annotation

#### 2. **Complément de données manquantes**

_Scénario_ : Des appels n'ont que l'audio ou que la transcription

- Identifier les appels incomplets via les filtres
- Uploader les fichiers audio manquants
- Importer les transcriptions JSON manquantes
- Valider la synchronisation audio-texte

#### 3. **Nettoyage et organisation**

_Scénario_ : Base de données avec origines incohérentes

- Sélectionner des lots d'appels (jusqu'à 612 simultanément)
- Éditer l'origine en lot ("Support Client" → "Support")
- Supprimer les appels non pertinents
- Standardiser les métadonnées

#### 4. **Validation qualité pré-tagging**

_Scénario_ : S'assurer que les appels sont prêts pour l'annotation

- Filtrer par statut "À préparer"
- Vérifier la présence des transcriptions
- Lancer la préparation technique
- Transférer vers l'interface de tagging

## 🏗️ Architecture générale

### Structure des répertoires

```
CallListUnprepared/
├── components/                    # Composants UI
│   ├── AdvancedFilters.tsx       # Filtres avancés
│   ├── BulkOriginEditBar.tsx     # Barre d'édition en lot
│   ├── CallContentDialog.tsx     # Dialog de contenu d'appel
│   ├── CallTableRow.tsx          # Ligne de tableau optimisée
│   ├── CallsAccordion.tsx        # Accordéon groupé par origine
│   ├── EmptyStateMessage.tsx     # Message d'état vide
│   ├── GlobalStatsCard.tsx       # Carte de statistiques
│   └── OriginEditableCell.tsx    # Cellule d'édition d'origine
├── hooks/                        # Logique métier
│   ├── useCallActions.ts         # Actions sur les appels
│   ├── useCallFilters.ts         # Système de filtrage
│   ├── useCallsData.ts           # Gestion des données
│   ├── useComplementActions.ts   # Actions complémentaires
│   ├── useOriginEdit.ts          # Édition d'origine (legacy)
│   ├── useOriginEditOptimized.ts # Édition optimisée
│   └── usePerformanceDebug.ts    # Debug performance
├── CallListUnprepared.tsx        # Composant principal
├── PerformanceTest.tsx           # Tests de performance
├── constants.ts                  # Constantes
├── types.ts                      # Types TypeScript
├── utils.ts                      # Utilitaires
├── index.ts                      # Exports publics
└── README_*.md                   # Documentation spécialisée
```

## 🚀 Composant principal

### CallListUnprepared.tsx

**Rôle** : Orchestrateur principal qui combine tous les hooks et composants

**Props** :

```typescript
interface CallListUnpreparedProps {
  onPrepareCall: (params: {
    call: Call;
    showMessage: (message: string) => void;
  }) => Promise<void>;
  showMessage: (message: string) => void;
}
```

**Fonctionnalités clés** :

- Gestion centralisée de l'état des appels
- Coordination des actions utilisateur
- Optimisations de performance avec cache intelligent
- Interface responsive avec composants conditionnels

## 🔧 Hooks métier

### 1. useCallsData

**Objectif** : Gestion complète des données d'appels avec Supabase

**Fonctionnalités** :

- Chargement initial des appels de tagging
- Mise à jour optimiste de l'état local
- Gestion des erreurs avec retry automatique
- Support des opérations CRUD

```typescript
const {
  callsByOrigin, // Appels groupés par origine
  isLoading, // État de chargement
  error, // Gestion d'erreurs
  updateCall, // Mise à jour d'un appel
  removeCall, // Suppression d'un appel
  refetch, // Rechargement manuel
} = useCallsData(showMessage);
```

### 2. useCallFilters

**Objectif** : Système de filtrage multi-critères avec cache intelligent

**Critères de filtrage** :

- **État** : Tous, À préparer, Déjà préparés
- **Contenu** : Tous, Audio+Transcription, Audio seul, Transcription seule, Vide
- **Statut** : Tous, Non supervisé, Conflictuel, Non conflictuel
- **Mot-clé** : Recherche dans les transcriptions

```typescript
const {
  filters, // État actuel des filtres
  filteredCallsByOrigin, // Résultats filtrés
  globalStats, // Statistiques globales
  updateFilter, // Mise à jour d'un filtre
  resetFilters, // Reset complet
} = useCallFilters(callsByOrigin);
```

### 3. useOriginEditOptimized

**Objectif** : Gestion optimisée de l'édition d'origine en lot

**Optimisations** :

- Cache intelligent des origines disponibles
- Handlers stables avec `useCallback`
- État dérivé mémoïsé
- Support de l'option "vide" (aucune origine)

```typescript
const {
  selectedCalls, // Set des appels sélectionnés
  availableOrigins, // Origines disponibles
  handleSelectCall, // Sélection d'un appel
  handleSelectAll, // Sélection globale
  handleStartBulkEdit, // Démarrage édition lot
  handleSaveBulkEdit, // Sauvegarde en lot
  // ... autres actions
} = useOriginEditOptimized(allCalls, updateCall, showMessage);
```

### 4. useCallActions

**Objectif** : Actions principales sur les appels individuels

**Actions supportées** :

- Préparation technique d'un appel
- Suppression avec confirmation
- Visualisation du contenu
- Changement de statut

```typescript
const {
  handlePrepareCall, // Préparation pour tagging
  handleDeleteClick, // Initiation suppression
  handleDeleteConfirm, // Confirmation suppression
  handleViewContent, // Ouverture dialog contenu
  selectedCall, // Appel sélectionné
  isDeleting, // État suppression
} = useCallActions({
  onPrepareCall,
  showMessage,
  updateCall,
  removeCall,
});
```

### 5. useComplementActions

**Objectif** : Actions complémentaires (ajout audio/transcription)

**Fonctionnalités** :

- Upload de fichiers audio
- Import de transcriptions JSON
- Validation et conversion des formats
- Mise à jour automatique de l'état

## 🎨 Composants UI

### 1. GlobalStatsCard

**Rôle** : Affichage des statistiques globales avec filtres cliquables

**Métriques affichées** :

- Total des appels
- Répartition à préparer/préparés
- Types de contenu (complet, audio seul, etc.)
- Statuts de supervision

### 2. AdvancedFilters

**Rôle** : Interface de filtrage avancé

**Contrôles** :

- Sélecteurs dropdown pour état/contenu/statut
- Champ de recherche par mot-clé
- Reset automatique des filtres

### 3. BulkOriginEditBar

**Rôle** : Barre d'édition en lot avec support option vide

**Fonctionnalités** :

- Sélection/désélection globale
- Autocomplete avec origines existantes
- Support de l'option "Aucune origine"
- Indicateurs visuels de l'action en cours

### 4. CallsAccordion

**Rôle** : Affichage groupé par origine avec optimisations

**Optimisations** :

- Composants mémoïsés avec `React.memo`
- Calculs de statuts mis en cache
- Re-renders minimisés par comparaison fine

### 5. CallTableRow

**Rôle** : Ligne de tableau optimisée sans édition individuelle

**Colonnes** :

- Origine (avec checkbox de sélection)
- ID de l'appel
- Actions de complément
- État du contenu
- Statut visuel
- Métadonnées (fichier, description, durée)
- Actions de préparation/suppression

### 6. OriginEditableCell

**Rôle** : Cellule ultra-simplifiée pour l'origine

**Simplifications** :

- Suppression du crayon d'édition individuelle
- Focus sur la sélection en lot
- Affichage compact avec tooltip

## 📊 Types et interfaces

### Types principaux

```typescript
interface Call {
  callid: string;
  origine?: string | null;
  filename?: string | null;
  description?: string | null;
  status?: "conflictuel" | "non_conflictuel" | "non_supervisé" | null;
  duree?: number | null;
  transcription?: Transcription | null;
  audiourl?: string | null;
  filepath?: string | null;
  upload?: boolean | null;
  preparedfortranscript?: boolean | null;
  is_tagging_call?: boolean | null;
}

interface CallsByOrigin {
  [origin: string]: Call[];
}

interface PreparationFilters {
  state: "all" | "to_prepare" | "prepared";
  content: "all" | "complete" | "audio_only" | "transcript_only" | "empty";
  status: "all" | "conflictuel" | "non_conflictuel" | "non_supervisé";
  keyword: string;
}
```

## ⚡ Optimisations de performance

### Problème initial

- Lenteur extrême (2000+ ms) lors de la sélection avec checkboxes
- Re-renders en cascade non contrôlés
- Recalculs inutiles des données dérivées

### Solutions implémentées

#### 1. React.memo avec comparaisons personnalisées

```typescript
const OriginEditableCell = React.memo(
  ({ call, isSelected, onSelect }) => {
    // Logique du composant
  },
  (prevProps, nextProps) => {
    // Comparaison fine pour éviter re-renders inutiles
    return (
      prevProps.call.callid === nextProps.call.callid &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.call.origine === nextProps.call.origine
    );
  }
);
```

#### 2. Cache intelligent avec useMemo

```typescript
const availableOrigins = useMemo(() => {
  console.time("availableOrigins-computation");
  const origins = Array.from(
    new Set(allCalls.map((call) => call.origine).filter(Boolean))
  );
  console.timeEnd("availableOrigins-computation");
  return origins;
}, [allCalls]);
```

#### 3. Handlers stables avec useCallback

```typescript
const handleSelectCall = useCallback((callId: string, selected: boolean) => {
  console.time(`select-optimized-${callId}`);
  setSelectedCalls((prev) => {
    const newSelection = new Set(prev);
    if (selected) {
      newSelection.add(callId);
    } else {
      newSelection.delete(callId);
    }
    return newSelection;
  });

  requestAnimationFrame(() => {
    console.timeEnd(`select-optimized-${callId}`);
  });
}, []);
```

### Résultats

- **Amélioration** : 50x plus rapide (de 2000ms à 10-50ms)
- **Re-renders** : Réduction drastique des re-calculs inutiles
- **UX** : Interface réactive et fluide

## 🛠️ Utilitaires

### utils.ts

**Fonctions principales** :

- `filterCalls()` : Filtrage multi-critères
- `getCallStats()` : Calcul des statistiques
- `getCallActions()` : Détermination des actions possibles
- `groupCallsByOrigin()` : Groupement par origine
- `normalizeOrigin()` : Normalisation des origines nulles/vides

### constants.ts

**Constantes** :

- `FILTER_OPTIONS` : Options de filtrage
- `STATUS_COLORS` : Couleurs des statuts
- `DEFAULT_FILTERS` : Filtres par défaut

## 🔄 Flux de données

### 1. Chargement initial

```
useCallsData → Supabase → callsByOrigin
     ↓
useCallFilters → filteredCallsByOrigin + globalStats
     ↓
CallsAccordion → CallTableRow → OriginEditableCell
```

### 2. Sélection d'appels

```
OriginEditableCell.onChange → useOriginEditOptimized.handleSelectCall
     ↓
selectedCalls (Set) → BulkOriginEditBar (affichage compteur)
```

### 3. Édition en lot

```
BulkOriginEditBar.onSave → useOriginEditOptimized.handleSaveBulkEdit
     ↓
Batch updates → useCallsData.updateCall → Supabase
     ↓
État local mis à jour → Re-render optimisé
```

## 🧪 Tests et debug

### PerformanceTest.tsx

Composant isolé pour tester les performances des checkboxes sans la complexité du code métier.

### usePerformanceDebug.ts

Hook de monitoring des performances avec seuils configurables et métriques détaillées.

### Logs de debug

Système complet de `console.time/timeEnd` pour tracer les opérations critiques :

- Sélections d'appels
- Calculs de données dérivées
- Re-renders des composants

## 📝 Bonnes pratiques implémentées

### 1. Architecture modulaire

- Séparation claire entre logique métier (hooks) et présentation (composants)
- Composition plutôt qu'héritage
- Single Responsibility Principle

### 2. Performance

- Mémorisation stratégique avec useMemo/useCallback
- Comparaisons personnalisées pour React.memo
- Cache intelligent avec invalidation

### 3. Gestion d'état

- État local simple (Set`<string>` pour les sélections)
- Mise à jour optimiste
- Synchronisation avec base de données

### 4. TypeScript

- Types stricts avec gestion des null/undefined
- Interfaces cohérentes
- Validation à l'exécution

### 5. UX/UI

- Feedback immédiat des actions
- États de chargement appropriés
- Messages d'erreur informatifs
- Interface responsive

## 🔮 Évolutions futures

### Fonctionnalités prévues

1. **Système de suppression avancé** avec options granulaires
2. **Extension à CallTableList** (onglet "Liste des appels")
3. **Gestion multi-taggeurs** avec traçabilité
4. **Archivage intelligent** des données supprimées

### Améliorations techniques

1. **Tests unitaires** pour les hooks complexes
2. **Error boundaries** explicites
3. **Monitoring** des performances en production
4. **API d'export** pour les rapports

Cette architecture modulaire et optimisée fait de `CallListUnprepared` un composant robuste, performant et évolutif pour la gestion d'appels non préparés dans l'application de tagging.
