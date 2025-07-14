# Documentation TaggerLPL - Application Next.js (Version Complète)

## Vue d'ensemble

TaggerLPL est une application Next.js dédiée au tagging et à l'analyse d'appels. L'application utilise une architecture moderne avec React Server Components et Client Components, optimisée pour la performance avec des systèmes de cache intelligents et des actions en lot.

## Architecture technique

### Technologies utilisées

- **Framework** : Next.js 14+ (App Router)
- **UI** : Material-UI (MUI) + Tailwind CSS
- **Base de données** : Supabase
- **CRM** : Intégration Zoho
- **État global** : React Context API
- **Langue** : Interface en français

### Hiérarchie des Providers

```typescript
SupabaseProvider (session auth)
├── ThemeModeProvider (UI themes)
│   ├── ZohoProvider (CRM integration)
│   │   └── TaggingDataProvider (business logic)
│   │       ├── GlobalNavbar (navigation)
│   │       └── Pages
```

## Structure des fichiers principaux

### 1. Page d'accueil (`app/page.tsx`)

```typescript
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/tagging");
  return null;
}
```

**Analyse** : Point d'entrée avec redirection automatique vers `/tagging`.

### 2. Layout racine (`app/layout.tsx`)

```typescript
"use client";

import { ReactNode } from "react";
// ... imports des providers et composants

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="fr">
      <body>
        <AppRouterCacheProvider>
          <SupabaseProvider>
            <ThemeModeProvider>
              <GlobalNavbar />
              <CssBaseline />
              <ZohoProvider>
                <TaggingDataProvider>{children}</TaggingDataProvider>
              </ZohoProvider>
            </ThemeModeProvider>
          </SupabaseProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
```

## Composants principaux

### 1. 🚀 GlobalNavbar - Navigation intelligente améliorée

**Localisation** : `@/components/layout/GlobalNavbar`

**Fonctionnalités clés** :

- **Navigation adaptative** : Comportement différent selon le type de page
- **Auto-hide intelligent** : Se masque lors du défilement vers le bas
- **Zone de détection** : Zone invisible de 20px en haut pour réafficher la navbar
- **Hauteur fixe** : 48px constant pour éviter les décalages

**Pages protégées** (avec auto-hide) :

- `/dashboard`, `/calls`, `/tagging`, `/new-tagging`, `/tags/admin`, `/analysis`

### 2. TaggingDataProvider - Gestion d'état globale

**Localisation** : `@/context/TaggingDataContext`

**Modèles de données** :

```typescript
interface Tag {
  id?: number;
  label: string;
  color?: string;
  description?: string;
  family?: string;
  callCount?: number;
  turnCount?: number;
}

interface TaggingCall {
  callid: string;
  is_tagging_call: boolean;
  preparedfortranscript: boolean;
  audiourl: string;
  filename?: string;
  filepath?: string;
  upload?: boolean;
}

interface Word {
  id: number;
  transcriptid: string;
  word: string;
  text: string; // Alias de word
  startTime: number;
  endTime: number;
  speaker: string;
  turn: string;
  index?: number;
}

interface TaggedTurn {
  id: number;
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  verbatim: string;
  next_turn_verbatim: string;
  next_turn_tag?: string;
  speaker: string;
  color: string;
}
```

### 3. 🚀 CallTableList - Interface optimisée de gestion des appels

**Localisation** : `@/components/calls/CallTableList`

**Architecture du répertoire** :

```
CallTableList/
├── hooks/
│   ├── useOptimizedCallData.ts    # Cache intelligent
│   └── useBulkActions.ts          # Actions en lot
├── CallTableList.tsx              # Composant principal
├── CallTableFilters.tsx           # Filtres de recherche
├── CallTableRow.tsx               # Ligne optimisée
├── MobileCallCard.tsx             # Vue mobile
├── BulkActionsToolbar.tsx         # Actions en lot
├── types.ts                       # Types TypeScript
├── utils.ts                       # Utilitaires
└── index.ts                       # Exports
```

#### 🚀 Optimisations de performance

**1. Cache intelligent avec `useOptimizedCallData`** :

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

**2. Actions en lot avec `useBulkActions`** :

```typescript
const {
  selectedCalls,
  selectedCount,
  isBulkProcessing,
  actions: { selectCall, selectAll, processBulkAction },
} = useBulkActions();
```

### 4. 🏷️ TagManager - Gestion avancée des tags avec statistiques

**Localisation** : `@/components/tags/TagManager`

**Architecture modulaire** :

```
TagManager/
├── TagManager.tsx          # Composant principal
├── TagUsageStats.tsx       # Composant de statistiques factorisé
├── types.ts               # Types TypeScript
└── utils.ts               # Fonctions utilitaires
```

#### Nouvelles fonctionnalités avancées

**1. Système de statistiques d'utilisation** :

```typescript
interface TagUsageData {
  totalUsage: number;
  asTag: number;
  asNextTurnTag: number;
  examples: {
    verbatim: string;
    next_turn_verbatim: string;
    call_id: string;
    speaker: string;
    context: "tag" | "next_turn_tag";
  }[];
  speakers: string[];
  callsCount: number;
  avgDuration: number;
}
```

**2. Interface moderne avec boutons d'action** :

- **Bouton Info (📊)** : Affiche les statistiques d'utilisation
- **Bouton Edit (✏️)** : Édition avec statistiques automatiques
- **Bouton Delete (🗑️)** : Suppression avec gestion des références

**3. Composant TagUsageStats factorisé** :

```typescript
// Composant réutilisable avec support thème dark/light
interface TagUsageStatsProps {
  tagStatsDisplay: TagStatsDisplay;
  onClose?: () => void;
}

const TagUsageStats: React.FC<TagUsageStatsProps> = ({
  tagStatsDisplay,
  onClose,
}) => {
  const theme = useTheme();

  // Adaptation automatique au thème
  const getAdaptiveStyles = () => ({
    mainContainer: {
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.background.paper, 0.8)
          : alpha(theme.palette.grey[50], 0.9),
      // ... autres styles adaptatifs
    },
  });
};
```

**4. Fonctionnalités avancées** :

- **Fusion intelligente** : Détection automatique des doublons
- **Réassignation** : Transfert des références vers un autre tag
- **Nettoyage** : Suppression propre des références orphelines
- **Suggestions** : Recommandations de tags de remplacement
- **Statistiques complètes** : Métriques d'utilisation détaillées

#### Interface utilisateur moderne

**1. Grille responsive par famille** :

```typescript
// Layout adaptatif
const renderTagGrid = (tags: LPLTag[], title: string) => (
  <Box sx={{ marginBottom: 2 }}>
    <Typography variant="subtitle1">{title}</Typography>
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns:
          title === "CLIENT"
            ? "repeat(3, 1fr)"
            : "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "8px",
      }}
    >
      {tags.map((tag) => (
        <Box
          key={tag.id}
          sx={
            {
              /* styles des tags */
            }
          }
        >
          {tag.label}
          {/* Boutons d'action superposés */}
        </Box>
      ))}
    </Box>
  </Box>
);
```

**2. Thème adaptatif complet** :

- **Mode sombre** : Arrière-plans semi-transparents, couleurs adaptées
- **Mode clair** : Contrastes élevés, couleurs vives
- **Transitions fluides** : Animations cohérentes
- **Responsive design** : Adaptation mobile/desktop

### 5. 📊 Page `/analysis` - Centre d'Analyse Conversationnelle

**Localisation** : `app/(protected)/analysis/page.tsx`

**Architecture des onglets** :

```
📊 Efficacité des Stratégies  # Analyse d'impact des stratégies
🔄 Flux Conversationnels     # Diagrammes Sankey interactifs
📈 Statistiques par Famille  # Performances par catégorie de tags
📋 Rapports Détaillés        # Génération de rapports PDF
```

#### Composants d'analyse intégrés

**1. DebugFunnel** - Analyse complète des tags :

```typescript
interface DebugFunnelProps {
  selectedOrigin?: string | null;
}

export default function DebugFunnel({ selectedOrigin }: DebugFunnelProps) {
  // Analyse tous les tags de turntagged
  // Correspondance avec lpltag
  // Statistiques par famille
  // Détection des tags manquants
}
```

**2. ImprovedGlobalMetrics** - Métriques globales :

```typescript
// Métriques globales du système
interface GlobalMetrics {
  totalTurntagged: number;
  totalUsage: number;
  totalTags: number;
  tagsInLpltag: number;
  tagsNotInLpltag: number;
  totalFamilies: number;
}
```

#### Gestion des erreurs Material-UI

**Problème Grid résolu** :

```typescript
// ❌ Ancienne version (erreur TypeScript)
<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={2}>
    <Card>...</Card>
  </Grid>
</Grid>

// ✅ Solution avec Box (recommandée)
<Box sx={{
  display: "flex",
  flexWrap: "wrap",
  gap: 2,
  mb: 3
}}>
  <Box sx={{ flex: "1 1 200px" }}>
    <Card>...</Card>
  </Box>
</Box>
```

### 6. TranscriptLPL - Composant de transcription refactorisé

**Localisation** : `@/components/TranscriptLPL`

**Architecture modulaire** :

```
TranscriptLPL/
├── index.tsx                  # Composant principal
├── types.ts                   # Types partagés
├── TranscriptHeader.tsx       # En-tête
├── TranscriptAudioPlayer.tsx  # Lecteur audio
├── TranscriptControls.tsx     # Contrôles
├── TranscriptText.tsx         # Affichage du texte
├── TagSidePanel.tsx          # Panneau latéral
├── hooks/
│   ├── useTaggingLogic.ts    # Logique de tagging
│   └── useTranscriptAudio.ts # Gestion audio
└── README.md                 # Documentation
```

**Fonctionnalités clés** :

- **Synchronisation audio-texte** en temps réel
- **Affichage automatique** des tags existants
- **Sélection de texte** pour nouveau tagging
- **Panneau latéral** rétractable (350px)
- **Calcul automatique** des relations `next_turn_tag`

## Flux de données et optimisations

### 1. Flux de tagging complet

```
1. Sélection de texte (onMouseUp)
2. Validation des index et timestamps
3. Ouverture du TagSidePanel
4. Sélection d'un tag
5. Calcul du next_turn_verbatim
6. Sauvegarde avec vérification de doublons
7. Mise à jour optimiste de l'état local
8. Affichage automatique du tag
```

### 2. Flux de gestion des tags

```
1. Affichage des tags par famille
2. Clic sur bouton Info → Chargement des statistiques
3. Analyse des références dans turntagged
4. Calcul des métriques d'utilisation
5. Affichage des exemples de verbatims
6. Actions possibles : édition, suppression, fusion
```

### 3. Optimisations de performance

**Cache intelligent** :

```typescript
// Cache des données avec invalidation automatique
const filteredAndSortedCalls = useMemo(() => {
  if (isCacheValid && cacheRef.current) {
    statsRef.current.hits++;
    return cacheRef.current.data;
  }

  const filtered = filterCalls(taggingCalls, ...);
  const sorted = filtered.sort(getComparator(...));

  cacheRef.current = {
    lastUpdate: Date.now(),
    data: sorted,
    filters: { ...filters },
    sort: { ...sortState },
  };

  return sorted;
}, [taggingCalls, filters, sortState, isCacheValid]);
```

**Mémoïsation stratégique** :

- Composants `React.memo()` pour éviter les re-renders
- Handlers `useCallback` pour la stabilité
- Calculs coûteux avec `useMemo`
- **Composants factorisés** pour la réutilisabilité

## Base de données Supabase

### Tables principales

```sql
-- Appels
call (callid, filename, filepath, upload, duree, status, origine, description)

-- Transcription
transcript (callid, transcriptid)
word (transcriptid, word, startTime, endTime, speaker, turn)

-- Tags
lpltag (label, color, description, family, originespeaker, icon)
turntagged (call_id, start_time, end_time, tag, verbatim, next_turn_verbatim, speaker, next_turn_tag)

-- Audit
tag_modifications (action, old_tag, new_tag, modified_at, modified_by, previous_data)
```

### Relations cruciales

**Correspondance tags-usage** :

```sql
-- Requête pour les statistiques d'utilisation
SELECT
  id, call_id, verbatim, next_turn_verbatim, speaker,
  start_time, end_time, tag, next_turn_tag
FROM turntagged
WHERE tag = 'label_du_tag' OR next_turn_tag = 'label_du_tag'
ORDER BY call_id
LIMIT 100;
```

### Sécurité

- **Row Level Security** (RLS) sur toutes les tables
- **URLs signées** pour fichiers audio (20 min par défaut)
- **Authentification** obligatoire via `ProtectedRoute`

## Gestion des erreurs et bonnes pratiques

### 1. Gestion des conflits TypeScript

**Conflits de noms** :

```typescript
// ❌ Problème : Conflit interface/composant
interface TagUsageStats { ... }
import TagUsageStats from "./TagUsageStats";

// ✅ Solution : Renommer l'interface
interface TagUsageData { ... }
import TagUsageStats from "./TagUsageStats";
```

**Props optionnelles** :

```typescript
// ✅ Composant avec props optionnelles
interface ComponentProps {
  selectedOrigin?: string | null;
  onClose?: () => void;
}

const Component: React.FC<ComponentProps> = ({ selectedOrigin, onClose }) => {
  // Gestion des props optionnelles
  useEffect(() => {
    if (selectedOrigin) {
      // Logique spécifique
    }
  }, [selectedOrigin]);
};
```

### 2. Gestion des versions Material-UI

**Problème Grid** :

```typescript
// ❌ Problème avec Grid item
<Grid item xs={12} sm={6} md={2}>

// ✅ Solution 1 : Grid2
import { Grid2 as Grid } from "@mui/material";

// ✅ Solution 2 : Box + Flexbox (recommandée)
<Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
  <Box sx={{ flex: "1 1 200px" }}>
    <Card>...</Card>
  </Box>
</Box>
```

### 3. Factorisation et réutilisabilité

**Composants factorisés** :

```typescript
// Structure recommandée
ComponentName/
├── index.ts                    # Export principal
├── ComponentName.tsx           # Composant principal
├── SubComponent.tsx            # Sous-composants
├── hooks/
│   └── useComponentLogic.ts    # Logique métier
├── types.ts                    # Types TypeScript
└── utils.ts                    # Utilitaires
```

## Différences entre les versions

### Version moderne (`/calls` + `/new-tagging` + `/analysis`)

✅ **Avantages** :

- Interface optimisée avec cache intelligent
- Actions en lot pour la gestion d'origine
- Feedback temps réel et gestion d'erreurs
- Responsive design avec cartes mobiles
- Chargement automatique des tags
- **Centre d'analyse conversationnelle complet**
- **Génération de rapports PDF**
- **Visualisations interactives**
- **Gestion avancée des tags avec statistiques**
- **Composants factorisés et réutilisables**
- **Support complet thème dark/light**

### Version classique (`/tagging`)

⚠️ **Limitations** :

- Interface tout-en-un plus lourde
- Pas d'optimisations de performance
- Chargement via accordion moins intuitif
- Pas d'actions en lot
- **Aucune fonctionnalité d'analyse avancée**
- **Pas de statistiques d'utilisation des tags**
- **Interface moins moderne**

## Recommandations techniques

### Points forts à maintenir

1. **Cache intelligent** pour les performances
2. **Système d'audit** très professionnel
3. **Architecture modulaire** facilite la maintenance
4. **Types TypeScript** complets et cohérents
5. **Correspondance des speakers** robuste
6. **Système next_turn_verbatim** intelligent
7. **Centre d'analyse** complet avec visualisations
8. **Interface responsive** moderne
9. **Composants factorisés** réutilisables
10. **Support thème adaptatif** complet

### Améliorations suggérées

1. **Tests unitaires** pour les hooks complexes
2. **Error boundaries** explicites
3. **Monitoring** des performances en production
4. **Documentation JSDoc** pour les fonctions complexes
5. **Extensibilité** du système d'actions en lot
6. **API d'export** pour les rapports d'analyse
7. **Filtres temporels** pour l'analyse des tendances
8. **Système de cache** pour les statistiques de tags
9. **Notifications** en temps réel pour les modifications
10. **Tests d'intégration** pour les flux critiques

### Bonnes pratiques implémentées

1. **Cache multi-niveaux** avec statistiques
2. **Validation robuste** des données utilisateur
3. **Feedback immédiat** avec états visuels
4. **Gestion d'erreurs** granulaire
5. **Interface responsive** moderne
6. **Séparation des préoccupations** entre tagging et analyse
7. **Système de navigation** intelligent
8. **Factorisation** des composants complexes
9. **Gestion des conflits** TypeScript
10. **Adaptation thématique** automatique

## Développements récents (Session actuelle)

### 1. TagManager avec statistiques d'utilisation

- **Nouveau composant TagUsageStats** factorisé
- **Interface moderne** avec boutons d'action
- **Statistiques complètes** d'utilisation des tags
- **Exemples de verbatims** pour chaque tag
- **Gestion des références** lors de la suppression
- **Support thème dark/light** complet

### 2. Corrections techniques

- **Résolution des conflits** TypeScript (TagUsageStats)
- **Correction des erreurs** Material-UI Grid
- **Props optionnelles** pour les composants
- **Gestion des versions** MUI compatibles

### 3. Améliorations UX

- **Feedback visuel** pour les actions
- **Chargement progressif** des statistiques
- **Interface responsive** optimisée
- **Transitions fluides** entre les états

---

## Notes importantes pour la prochaine session

### 📋 État actuel du projet

**Fonctionnalités opérationnelles** :

- ✅ Système de tagging complet et moderne
- ✅ Gestion avancée des tags avec statistiques
- ✅ Interface d'analyse conversationnelle
- ✅ Cache intelligent et optimisations
- ✅ Support thème dark/light
- ✅ Composants factorisés réutilisables

**Composants clés développés** :

- ✅ `TagManager` avec statistiques avancées
- ✅ `TagUsageStats` factorisé avec thème adaptatif
- ✅ `DebugFunnel` pour analyse complète
- ✅ `CallTableList` avec cache intelligent
- ✅ `TranscriptLPL` avec logique de tagging

### 🔧 Points d'attention technique

1. **Gestion des types** : Éviter les conflits interface/composant
2. **Versions MUI** : Utiliser Box+Flexbox plutôt que Grid
3. **Props optionnelles** : Toujours définir les interfaces complètes
4. **Cache** : Surveiller les performances avec de gros volumes
5. **Correspondance speakers** : Peut nécessiter des ajustements

### 📊 Structure de données critiques

```typescript
// Table turntagged (cruciale pour l'analyse)
interface TurnTagged {
  call_id: string;
  tag: string; // Tag principal
  next_turn_tag: string; // Tag du tour suivant
  verbatim: string; // Texte de ce tour
  next_turn_verbatim: string; // Texte du tour suivant
  speaker: string; // Qui parle
  start_time: number;
  end_time: number;
}

// Table lpltag (référentiel des tags)
interface LPLTag {
  id: number;
  label: string; // Nom du tag
  family: string; // Famille (ENGAGEMENT, REFLET, etc.)
  originespeaker: string; // conseiller/client
  color: string; // Couleur d'affichage
  icon: string; // Icône optionnelle
  description: string; // Description
}
```

### 🎯 Prochaines étapes suggérées

1. **Tests unitaires** pour les hooks complexes
2. **Monitoring** des performances en production
3. **Documentation** des API internes
4. **Filtres temporels** pour l'analyse
5. **Export** des rapports d'analyse
6. **Notifications** temps réel
7. **Intégration** avec d'autres systèmes

Cette application est un **système de tagging conversationnel très sophistiqué** avec **centre d'analyse avancé** et **gestion intelligente des tags** . L'architecture modulaire et les optimisations de performance en font une solution robuste et évolutive.
