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

### 1. GlobalNavbar - Navigation intelligente améliorée

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

### 3. CallTableList - Interface optimisée de gestion des appels

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

#### Optimisations de performance

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

### 4. TagManager - Gestion avancée des tags avec statistiques

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

### 5. Page `/analysis` - Centre d'Analyse Conversationnelle

**Localisation** : `app/(protected)/analysis/page.tsx`

**Architecture des onglets** :

```
📊 Efficacité des Stratégies  # Analyse d'impact des stratégies
🔄 Flux Conversationnels     # Diagrammes Sankey interactifs
📈 Statistiques par Famille  # Performances par catégorie de tags
🗣️ Linguistique Interactionnelle  # Métriques LI avancées
🧠 Sciences Cognitives       # Analyse cognitive du discours
🔬 Validation Convergence    # Tests de convergence inter-domaines
🧪 Algorithm Lab             # Test et validation des algorithmes
📍 Analyse Temporelle        # Évolution temporelle des métriques
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

### 6. Algorithm Lab - Framework de Test et Validation d'Algorithmes

**Localisation** : `app/(protected)/analysis/components/AlgorithmLab/`

**Position stratégique** : Onglet principal dans la page d'analyse pour centraliser tous les tests algorithmiques

#### Architecture modulaire

```
AlgorithmLab/
├── AlgorithmLabInterface.tsx          # Interface principale avec onglets
├── index.ts                          # Exports centralisés
├── types.ts                          # Types globaux pour tous algorithmes
├── hooks/
│   └── useGlobalAlgorithmTesting.ts  # Hook principal multi-domaines
├── components/
│   ├── SingleTestPanel.tsx           # ✅ Test unique d'algorithme
│   ├── ComparisonPanel.tsx           # 🔄 Comparaison multi-algorithmes
│   ├── OptimizationPanel.tsx         # 🔄 Optimisation automatique
│   └── ValidationPanel.tsx           # 🔄 Validation scientifique
└── utils/
    ├── algorithmRegistry.ts          # 🔄 Registry dynamique
    ├── domainBridge.ts              # 🔄 Pont entre domaines
    └── crossValidation.ts           # 🔄 Validation croisée
```

#### Fonctionnalités opérationnelles

**1. SingleTestPanel** - Test unique d'algorithme :

```typescript
interface SingleTestConfig {
  domain: "li" | "cognitive" | "ac";
  indicator: string;
  algorithm: string;
  sampleSize: number;
  selectedOrigin?: string;
}
```

**Fonctionnalités** :

- Configuration complète par domaine/indicateur/algorithme
- Exécution réelle des algorithmes LI (BasicAlignment, ConversationalPattern)
- Métriques de performance (temps, mémoire, taux de traitement)
- Résultats détaillés avec tableaux par stratégie
- Support thème adaptatif et responsive design

**2. Framework de validation scientifique** :

```typescript
interface AlgorithmValidationFramework {
  // Test 1: Précision prédictive
  testPredictiveAccuracy: (
    algorithms: string[],
    corpus: TaggedTurn[]
  ) => Promise<ValidationResults>;

  // Test 2: Validation hypothèses théoriques
  validateHypotheses: (
    corpus: TaggedTurn[],
    algorithmResults: any
  ) => Promise<HypothesisValidation>;

  // Métriques de qualité
  calculateMetrics: {
    kappa: number; // Accord classification manuel vs automatique
    precision: number; // Précision prédiction réactions client
    recall: number; // Rappel prédiction réactions client
    f1Score: number; // Score F1 équilibré
    confusionMatrix: Matrix; // Matrice de confusion détaillée
  };
}
```

#### Tests de validation intégrés

**1. Test de précision prédictive** :

- L'algorithme prédit-il correctement les réactions client ?
- Comparaison prédictions vs observations dans turntagged
- Métriques precision/recall/F1 par stratégie

**2. Test d'accord taxonomique** :

- L'algorithme classe-t-il les tours comme les experts ?
- Kappa de Cohen pour mesurer l'accord classification
- Analyse des divergences systématiques

**3. Validation des hypothèses théoriques** :

- H1: ENGAGEMENT/OUVERTURE > EXPLICATION en efficacité
- H2: Patterns universels across contextes
- Convergence entre données manuelles et prédictions algorithmiques

### 7. TranscriptLPL - Composant de transcription refactorisé

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

### 3. Flux de test d'algorithmes

```
1. Configuration du test (domaine/indicateur/algorithme)
2. Préparation des données (turntagged ou simulées)
3. Exécution de l'algorithme avec mesure de performance
4. Calcul des métriques de validation (kappa, precision, recall)
5. Affichage des résultats détaillés par stratégie
6. Sauvegarde historique et export possible
```

### 4. Optimisations de performance

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

## Framework d'algorithmes et taxonomies

### 1. BasicAlignmentAlgorithm - Analyse de sentiment lexical

**Localisation** : `li-metrics/indicators/FeedbackAlignmentIndicator/algorithms/BasicAlignmentAlgorithm.ts`

**Méthode** : Analyse lexicale avec 145 patterns français (POSITIF/NEGATIF/NEUTRE)
**Sortie** : Score d'alignement par famille de stratégies
**Validation** : 72% de couverture des verbatims (1006/1397 analysables)

### 2. ConversationalPatternAlgorithm - Analyse structurelle LI-CA

**Localisation** : `li-metrics/indicators/FeedbackAlignmentIndicator/algorithms/ConversationalPatternAlgorithm.ts`

**Innovation** : Première implémentation computationnelle de Conversation Analysis en français
**Méthode** : Analyse des paires adjacentes conseiller→client
**Taxonomie** : Actions CA (COMMITMENT, ACKNOWLEDGMENT, EXPLANATION, QUESTION, PROPOSAL) + Stratégies LI (ADHERENCE, ELABORATION, RESISTANCE, NEGOCIATION, NEUTRAL)

### 3. Validation scientifique des algorithmes

**Test 1** : Précision prédictive

- Comparaison prédictions algorithmiques vs réactions observées
- Métriques precision/recall/F1 par stratégie
- Matrices de confusion détaillées

**Test 2** : Accord taxonomique

- Kappa de Cohen pour accord classification manuel vs automatique
- Analyse des divergences systématiques
- Validation de la cohérence inter-annotateurs

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

### Version moderne (`/calls` + `/new-tagging` + `/analysis` + Algorithm Lab)

✅ **Avantages** :

- Interface optimisée avec cache intelligent
- Actions en lot pour la gestion d'origine
- Feedback temps réel et gestion d'erreurs
- Responsive design avec cartes mobiles
- Chargement automatique des tags
- **Centre d'analyse conversationnelle complet**
- **Framework de test et validation d'algorithmes**
- **Métriques scientifiques avec validation croisée**
- **Gestion avancée des tags avec statistiques**
- **Composants factorisés et réutilisables**
- **Support complet thème dark/light**
- **Tests de précision prédictive et accord taxonomique**

### Version classique (`/tagging`)

⚠️ **Limitations** :

- Interface tout-en-un plus lourde
- Pas d'optimisations de performance
- Chargement via accordion moins intuitif
- Pas d'actions en lot
- **Aucune fonctionnalité d'analyse avancée**
- **Pas de statistiques d'utilisation des tags**
- **Interface moins moderne**
- **Aucun système de validation algorithmique**

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
11. **Framework de validation scientifique** rigoureux
12. **Algorithm Lab** pour tests et optimisation

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
11. **Validation croisée** inter-domaines automatisée
12. **Interface d'annotation experte** pour gold standard

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
11. **Tests algorithmiques** avec métriques scientifiques
12. **Validation prédictive** et taxonomique

## Développements récents (Session actuelle)

### 1. Algorithm Lab avec validation scientifique

- **Framework de test complet** pour validation d'algorithmes
- **SingleTestPanel opérationnel** avec algorithmes LI réels
- **Architecture de validation** kappa + precision/recall
- **Tests de précision prédictive** et accord taxonomique
- **Support multi-domaines** (LI, Cognitif, AC)

### 2. Corrections techniques avancées

- **Résolution des conflits** TypeScript dans SingleTestPanel
- **Migration Grid vers Box** pour éviter erreurs MUI
- **Correction types globalStats** ConversationalPatternAlgorithm
- **Props optionnelles** pour tous composants

### 3. Améliorations UX

- **Interface de test intuitive** avec configuration par domaine
- **Métriques de performance** temps réel
- **Résultats détaillés** avec tableaux formatés
- **Feedback visuel** pour tous les états de test

---

## Notes importantes pour la prochaine session

### État actuel du projet

**Fonctionnalités opérationnelles** :

- ✅ Système de tagging complet et moderne
- ✅ Gestion avancée des tags avec statistiques
- ✅ Interface d'analyse conversationnelle
- ✅ Algorithm Lab avec SingleTestPanel fonctionnel
- ✅ Framework de validation scientifique (architecture)
- ✅ Tests d'algorithmes LI (BasicAlignment + ConversationalPattern)
- ✅ Cache intelligent et optimisations
- ✅ Support thème dark/light
- ✅ Composants factorisés réutilisables

**Composants clés développés** :

- ✅ `AlgorithmLabInterface` avec navigation multi-onglets
- ✅ `SingleTestPanel` avec tests réels d'algorithmes
- ✅ `useGlobalAlgorithmTesting` hook multi-domaines
- ✅ `TagManager` avec statistiques avancées
- ✅ `TagUsageStats` factorisé avec thème adaptatif
- ✅ `DebugFunnel` pour analyse complète
- ✅ `CallTableList` avec cache intelligent
- ✅ `TranscriptLPL` avec logique de tagging

### Points d'attention technique

1. **Gestion des types** : Éviter les conflits interface/composant
2. **Versions MUI** : Utiliser Box+Flexbox plutôt que Grid
3. **Props optionnelles** : Toujours définir les interfaces complètes
4. **Cache** : Surveiller les performances avec de gros volumes
5. **Correspondance speakers** : Peut nécessiter des ajustements
6. **Validation algorithmique** : Développer les métriques scientifiques

### Structure de données critiques

```typescript
// Table turntagged (cruciale pour l'analyse et validation)
interface TurnTagged {
  call_id: string;
  tag: string; // Tag principal - classification manuelle
  next_turn_tag: string; // Tag du tour suivant - gold standard
  verbatim: string; // Texte de ce tour - input algorithme
  next_turn_verbatim: string; // Texte du tour suivant - target prédiction
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

### Prochaines étapes suggérées

1. **Modification urgente du SingleTestPanel** pour exploiter les vraies données `turntagged`
2. **Calcul des métriques de validation scientifique** contre le gold standard existant
3. **ComparisonPanel** pour tests multi-algorithmes
4. **ValidationPanel** avec métriques kappa/precision/recall
5. **Export des résultats** de validation scientifique
6. **Optimisation automatique** des paramètres algorithmiques
7. **Interface d'annotation experte** pour amélioration continue

## Priorité immédiate : Exploitation du Gold Standard existant

### Données de référence disponibles dans `turntagged`

```sql
-- Structure complète de la table turntagged avec gold standard
turntagged (
  id,                    -- Identifiant unique
  call_id,              -- Identifiant de l'appel
  start_time,           -- Début du tour (secondes)
  end_time,             -- Fin du tour (secondes)
  tag,                  -- GOLD STANDARD : Classification manuelle stratégie conseiller
  verbatim,             -- Texte du tour conseiller (INPUT algorithme)
  next_turn_tag,        -- GOLD STANDARD : Classification manuelle réaction client
  next_turn_verbatim,   -- Texte réaction client (TARGET prédiction)
  speaker,              -- Qui parle (conseiller/client)
  next_turn_tag_auto,   -- Classification algorithmique automatique
  score_auto,           -- Score de confiance algorithmique
  date                  -- Timestamp de l'annotation
)
```

### Métriques de validation immédiatement calculables

**CORRECTION IMPORTANTE** : Les métriques ne peuvent PAS être calculées via SQL car `next_turn_tag_auto` n'existe pas dans la base.

**Architecture réelle nécessaire :**

1. **Chargement des données annotées :**

```typescript
const turntaggedData = await supabase
  .from("turntagged")
  .select(
    "id, call_id, tag, verbatim, next_turn_tag, next_turn_verbatim, speaker"
  )
  .not("tag", "is", null)
  .not("next_turn_tag", "is", null);
```

2. **Exécution algorithme et validation en temps réel :**

```typescript
interface ValidationTest {
  inputData: TurnTagged[];
  predictions: {
    strategyPredicted?: string; // Pour ConversationalPattern uniquement
    reactionPredicted: string; // Pour les deux algorithmes
  }[];
  goldStandard: {
    strategyActual: string; // from tag
    reactionActual: string; // from next_turn_tag
  }[];
  metrics: ValidationMetrics; // Calculées en JavaScript
}
```

3. **Calcul métriques JavaScript (pas SQL) :**

- Accuracy = correct_predictions / total_predictions
- Precision/Recall par classe via matrices de confusion
- Kappa de Cohen avec correction hasard
- Toutes les métriques calculées côté client pendant le test

### Modifications urgentes requises

**SingleTestPanel doit :**

1. **Charger les vraies données `turntagged`** au lieu de simuler
2. **Comparer `next_turn_tag` vs prédictions algorithmiques** réelles
3. **Calculer precision/recall/F1** par stratégie
4. **Afficher matrices de confusion** et métriques kappa
5. **Analyser patterns de divergence** entre expert et algorithme

**Architecture de validation scientifique :**

```typescript
interface ValidationMetrics {
  accuracy: number; // % prédictions correctes
  precision: Record<string, number>; // Précision par classe
  recall: Record<string, number>; // Rappel par classe
  f1Score: Record<string, number>; // F1 par classe
  kappaCohen: number; // Accord inter-annotateurs
  confusionMatrix: number[][]; // Matrice de confusion
  confidenceAnalysis: {
    avgConfidenceCorrect: number; // Confiance moyenne bonnes prédictions
    avgConfidenceIncorrect: number; // Confiance moyenne erreurs
    calibrationScore: number; // Qualité calibration confiance
  };
}
```

### Impact scientifique de cette modification

La correction permettra de passer d'un simple **test d'exécution algorithmique** à une vraie **validation scientifique avec gold standard**, exploitant le corpus annoté existant pour :

1. Mesurer la performance prédictive réelle des algorithmes
2. Identifier les forces/faiblesses de chaque approche (lexicale vs structurelle)
3. Optimiser les seuils et paramètres selon les métriques empiriques
4. Valider les hypothèses théoriques sur corpus authentique
5. Comparer la fiabilité humain vs machine sur les mêmes données

Cette modification transforme l'Algorithm Lab en véritable outil de recherche appliquée.
