# Documentation TaggerLPL - Application Next.js

## Vue d'ensemble

TaggerLPL est une application Next.js dédiée au tagging et à l'analyse d'appels. L'application utilise une architecture moderne avec React Server Components et Client Components.

## Structure des fichiers principaux

### 1. Page d'accueil (`page.tsx`)

```typescript
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/tagging");

  // Ce code ne sera jamais exécuté en raison de la redirection
  return null;
}
```

**Analyse :**

- **Rôle** : Point d'entrée de l'application (route `/`)
- **Comportement** : Redirection automatique vers `/tagging`
- **Type** : Server Component (par défaut)
- **Pourquoi cette approche ?** : L'application n'a pas besoin d'une vraie page d'accueil, elle redirige directement vers la fonctionnalité principale de tagging

### 2. Layout racine (`layout.tsx`)

```typescript
"use client";

import { ReactNode } from "react";
// ... imports des providers et composants

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  // Structure HTML avec providers imbriqués
}
```

**Analyse :**

- **Rôle** : Template global pour toutes les pages
- **Type** : Client Component (directive `"use client"`)
- **Architecture** : Utilise le pattern Provider pour la gestion d'état globale

#### Hiérarchie des Providers :

1. `AppRouterCacheProvider` (Material-UI)
2. `SupabaseProvider` (Base de données)
3. `ThemeModeProvider` (Gestion des thèmes)
4. `ZohoProvider` (Intégration Zoho)
5. `TaggingDataProvider` (Données de tagging)

### 3. Styles globaux (`globals.css`)

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

/* Thème sombre automatique */
@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

**Analyse :**

- **Framework CSS** : Tailwind CSS
- **Thème** : Support automatique du mode sombre
- **Variables CSS** : Couleurs personnalisées pour background/foreground

### 4. Métadonnées (`metadata.ts`)

```typescript
export const metadata = {
  title: "TaggerLPL - Application de tagging",
  description: "Application de tagging pour l'analyse d'appels",
};
```

## Architecture technique

### Technologies utilisées

- **Framework** : Next.js 14+ (App Router)
- **UI** : Material-UI (MUI) + Tailwind CSS
- **Base de données** : Supabase
- **CRM** : Intégration Zoho
- **État global** : React Context API
- **Langue** : Interface en français

### Flux de navigation

```
/ (page d'accueil) → redirect → /tagging (fonctionnalité principale)
```

---

## Composants principaux

### 1. GlobalNavbar - Navigation intelligente

**Localisation** : `@/components/layout/GlobalNavbar`

**Fonctionnalités clés :**

- **Navigation adaptative** : Comportement différent selon le type de page (publique vs protégée)
- **Auto-hide intelligent** : Se masque lors du défilement vers le bas, réapparaît au survol ou défilement vers le haut
- **Zone de détection** : Zone invisible de 20px en haut pour réafficher la navbar au survol
- **Hauteur fixe** : 48px constant pour éviter les décalages de layout

**Pages protégées** (avec auto-hide) :

- `/dashboard`, `/calls`, `/tagging`, `/new-tagging`, `/tags/admin`, `/analysis`

**Pages publiques** (navbar statique) :

- Toutes les autres pages

**Composants intégrés :**

- `AuthStatus` : Gestion de l'authentification
- `ThemeToggle` : Basculement mode clair/sombre
- Liens de navigation contextuels

### 2. TaggingDataProvider - Gestion d'état globale

**Localisation** : `@/context/TaggingDataContext`

**Modèles de données :**

```typescript
interface Tag {
  id?: number;
  label: string; // ✅ Correspond à votre DB lpltag.label
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
  text: string; // ✅ Alias de word
  startTime: number;
  endTime: number;
  speaker: string;
  turn: string; // ✅ Propriété pour le groupement
  index?: number; // ✅ Index dans la transcription
}

interface TaggedTurn {
  id: number;
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  verbatim: string;
  next_turn_verbatim: string;
  next_turn_tag?: string; // ✅ Tag du tour suivant
  speaker: string;
  color: string;
}

interface NewTag {
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  verbatim: string;
  next_turn_verbatim?: string;
  speaker: string;
  next_turn_tag?: string;
}
```

**Fonctionnalités principales :**

- **Gestion des appels** : Liste, sélection, filtrage des appels de tagging
- **Transcription** : Récupération et synchronisation des mots avec timestamps
- **Lecture audio** : Contrôle du lecteur audio avec saut à timestamp
- **Tagging** : Ajout, suppression, gestion des tags sur les segments
- **Post-its** : Gestion des annotations textuelles

**Hooks exposés :**

- `fetchTaggingTranscription(callId)` : Charge la transcription d'un appel
- `selectTaggingCall(call)` : Sélectionne un appel et charge ses données (✅ **CORRIGÉ** : charge maintenant automatiquement les tags)
- `playAudioAtTimestamp(timestamp)` : Lance la lecture à un moment précis
- `addTag(newTag)` : Ajoute un nouveau tag
- `deleteTurnTag(id)` : Supprime un tag
- `fetchTaggedTurns(callId)` : ✅ **NOUVEAU** : Récupère les tags d'un appel

**✅ CORRECTION IMPORTANTE - selectTaggingCall :**

```typescript
const selectTaggingCall = useCallback(
  (call: TaggingCall): void => {
    setSelectedTaggingCall(call);

    if (call?.callid) {
      // ✅ Charger TOUTES les données nécessaires en parallèle
      Promise.all([
        fetchTaggingTranscription(call.callid),
        fetchTaggedTurns(call.callid), // ✅ AJOUT CRUCIAL
        fetchTaggingPostits(call.callid),
      ]);

      setAudioSrc(call.audiourl);
    }
  },
  [fetchTaggingTranscription, fetchTaggedTurns, fetchTaggingPostits]
);
```

### 3. NewTaggingPage - Interface moderne de tagging

**Localisation** : `/new-tagging/page.tsx`

**Architecture :**

- **Sélection d'appel** : Dropdown avec liste des appels disponibles
- **Gestion des URLs signées** : Génération d'URLs temporaires pour les fichiers audio
- **Chargement progressif** : États de loading pour une meilleure UX
- **Fallback intelligent** : Gestion des appels avec/sans audio
- **Switch de version** : Possibilité de revenir à l'ancienne interface

**Flux de traitement :**

1. Chargement de la liste des appels depuis `TaggingDataProvider`
2. Sélection d'un appel via dropdown
3. Vérification de la présence d'audio (`upload` et `filepath`)
4. Génération d'URL signée si nécessaire
5. ✅ **Chargement automatique des tags existants**
6. Chargement de la transcription
7. Rendu du composant `TranscriptLPL`

**Gestion des différents cas :**

- **Appel avec audio** : URL signée + transcription + tags
- **Appel sans audio** : Transcription + tags uniquement
- **Erreur de chargement** : Fallback gracieux

### 4. Contexts supplémentaires

#### SupabaseProvider

- **Rôle** : Gestion de la connexion et session Supabase
- **Fonctionnalités** : Auth state, client Supabase global

#### ThemeModeProvider

- **Rôle** : Gestion du thème clair/sombre
- **Défaut** : Mode sombre
- **Composant** : `ThemeToggle` pour basculer

#### ZohoProvider

- **Rôle** : Gestion des tokens d'API Zoho
- **Fonctionnalités** : Refresh token, access token

---

## Structure des pages

### Page `/tagging` (ancienne version)

```
/tagging
├── layout.tsx (wrapper simple)
├── page.tsx (ProtectedRoute + ClientTaggerPage)
└── ClientTaggerPage.tsx (TaggerLPL dynamique)
```

### Page `/new-tagging` (nouvelle version)

- Interface épurée avec dropdown
- Meilleure gestion des états de chargement
- ✅ **Chargement automatique des tags au changement d'appel**
- Switch vers ancienne version possible

---

## Composants de transcription et tagging

### 1. TranscriptLPL - Composant principal de transcription

**Localisation** : `@/components/TranscriptLPL`

**Architecture modulaire :**

- **TranscriptHeader** : Affichage du nom de fichier
- **TranscriptAudioPlayer** : Lecteur audio intégré
- **TranscriptControls** : Contrôles de taille de police et toggle du panneau
- **TranscriptText** : ✅ **CORRIGÉ** : Affichage de la transcription avec tags existants
- **TagSidePanel** : Panneau latéral pour gestion des tags

**Fonctionnalités clés :**

- **Synchronisation audio-texte** : Les mots se surlignent en temps réel
- **Sélection de texte** : Sélection de segments pour tagging
- **Navigation temporelle** : Clic sur mot = saut à timestamp
- **Panneau latéral rétractable** : 350px de largeur fixe
- **Responsivité** : Adaptation dynamique avec transition CSS
- ✅ **Affichage des tags existants** : Les tags s'affichent automatiquement au chargement

#### Hooks personnalisés intégrés :

**useTaggingLogic** - Gestion des interactions de tagging

- Modes "create" et "edit" pour les tags
- Sélection de texte avec calcul des timestamps
- CRUD complet sur les tags (ajout, modification, suppression)
- Gestion du verbatim et du "next turn"
- Logique de speakers/turns de parole
- ✅ **Gestion robuste des index** : Validation des sélections de texte

**useTranscriptAudio** - Gestion audio et affichage

- Synchronisation temps réel audio/transcription
- Styles dynamiques des mots (surbrillance, couleurs des tags)
- ✅ **Groupement par tours de parole corrigé** : Logique de groupement optimisée
- Contrôles de taille de police (12-30px)

**✅ CORRECTION IMPORTANTE - useTranscriptAudio.groupedTurns :**

```typescript
// ✅ Calculer les groupes de tours de parole - VERSION CORRIGÉE
const groupedTurns = useMemo(() => {
  if (!taggingTranscription || taggingTranscription.length === 0) {
    return [];
  }

  const groups: TranscriptWord[][] = [];
  let currentGroup: TranscriptWord[] = [];
  let currentSpeaker: string | null = null;

  for (let i = 0; i < taggingTranscription.length; i++) {
    const word = taggingTranscription[i];
    const speaker = word.turn || word.speaker || "Inconnu";

    // Si nouveau speaker ou premier mot
    if (speaker !== currentSpeaker) {
      // Sauvegarder le groupe précédent s'il existe
      if (currentGroup.length > 0) {
        groups.push([...currentGroup]);
      }
      // Commencer un nouveau groupe
      currentGroup = [word];
      currentSpeaker = speaker;
    } else {
      // Même speaker, ajouter au groupe actuel
      currentGroup.push(word);
    }
  }

  // Ajouter le dernier groupe s'il existe
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}, [taggingTranscription]);
```

### 2. TranscriptText - Affichage des tags existants

**✅ PROBLÈME RÉSOLU** : Les tags existants ne s'affichaient pas au chargement

**Problème identifié** : La logique de correspondance entre les tags et les tours de parole était trop restrictive.

**Solution implémentée** :

```typescript
// ✅ Fonction pour trouver les tags qui intersectent avec un tour de parole - VERSION FINALE
const findTagsForTurn = (turn: any[]) => {
  if (!turn || turn.length === 0) return [];

  const turnStartTime = turn[0].startTime;
  const turnEndTime = turn[turn.length - 1].endTime;
  const turnSpeaker = turn[0].turn || turn[0].speaker;

  return taggedTurns.filter((tag) => {
    // Vérifier qu'il y a une intersection temporelle
    const hasTimeOverlap =
      tag.start_time < turnEndTime && tag.end_time > turnStartTime;

    // ✅ Logique de correspondance des speakers améliorée
    const speakerMatches =
      tag.speaker === turnSpeaker ||
      tag.speaker === turn[0].turn ||
      tag.speaker === turn[0].speaker ||
      // Mappings spéciaux pour votre système
      (turnSpeaker === "conseiller_F11" &&
        (tag.speaker === "gare" || tag.speaker === "conseiller")) ||
      (turnSpeaker === "gare" && tag.speaker === "conseiller_F11") ||
      (turnSpeaker === "appelant" && tag.speaker.includes("spk")) ||
      (tag.speaker === "appelant" && turnSpeaker.includes("spk"));

    return speakerMatches && hasTimeOverlap;
  });
};
```

**Mappings de speakers gérés** :

- `conseiller_F11` ↔ `gare`
- `appelant` ↔ `spk*` (spk2 spk1, spk1 spk2, etc.)
- Correspondances directes par nom

### 3. TaggerLPL - Interface complète de gestion

**Localisation** : `@/components/TaggerLPL`

**Vue d'ensemble :**
Interface principale avec drawer latéral (35% de largeur) combinant :

- Chargement d'appels (`CallUploaderTaggerLPL`)
- Visualisation de transcription (`TranscriptLPL`)
- Gestion avancée des tags

**Modes d'affichage :**

1. **Mode Tagging** : Transcription + tagging d'un appel
2. **Mode Gestion des Tags** : Administration complète des tags

#### Fonctionnalités de gestion des tags :

**Structure hiérarchique :**

```typescript
interface FamilyNode {
  family: string; // "agent", "client", "divers"
  icon: string; // Priorité d'affichage
  children: Tag[]; // Tags de cette famille
}

interface Tag {
  label: string; // Nom du tag
  color: string; // Couleur d'affichage
  callCount: number; // Nombre d'appels utilisant ce tag
  turnCount: number; // Nombre de segments taggés
  family: string; // Famille d'appartenance
}
```

**Opérations avancées :**

- **Fusion de tags** : Unification de tags similaires
- **Renommage** : Mise à jour globale dans toute la DB
- **Historique** : Traçabilité des modifications avec restauration
- **Statistiques** : Compteurs d'usage par tag/famille

**Système d'historique :**

- Table `tag_modifications` pour audit trail
- Sauvegarde des états avant/après modification
- Fonction de restauration point-in-time

### 4. Système d'authentification

**ProtectedRoute** - Garde d'authentification

```typescript
// Vérifie la session Supabase
// Redirige vers /login si non authentifié
// État de chargement avec spinner
```

**AuthStatus** - Composant d'état utilisateur

- Affichage avatar/email utilisateur
- Menu dropdown avec déconnexion
- Intégration avec `SupabaseContext`
- Gestion des erreurs de session

### 5. Architecture des données

**Modèles principaux :**

```typescript
// Mot de transcription avec timing
interface TranscriptWord {
  text: string;
  startTime: number;
  endTime: number;
  turn: string; // Speaker/interlocuteur
}

// Segment taggé
interface TaggedTurn {
  id: string;
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  verbatim: string; // Texte sélectionné
  next_turn_verbatim: string; // ✅ Contexte suivant (tour de parole qui suit)
  speaker: string;
  color: string;
}

// Définition de tag
interface LPLTag {
  label: string;
  description: string;
  family: string; // "agent", "client", "divers"
  color: string;
}
```

**Tables Supabase :**

- `call` : Métadonnées des appels
- `transcript` : Lien callid → transcriptid
- `word` : Mots individuels avec timestamps
- `turntagged` : Segments taggés
- `lpltag` : Définitions des tags
- `tag_modifications` : Historique des changements

---

## ✅ FLUX DE TAGGING COMPLET (Mis à jour)

### 1. 🖱️ Sélection de texte à la souris

**Déclencheur** : `onMouseUp` sur `TranscriptText`

### 2. 🔍 Traitement dans `useTaggingLogic.handleMouseUp`

1. **Récupération de la sélection**
   ```typescript
   const selection = window.getSelection();
   const selectedText = selection.toString().trim();
   ```
2. **Identification des mots sélectionnés**
   ```typescript
   const startWordIndex = parseInt(startContainer.dataset.index);
   const endWordIndex = parseInt(endContainer.dataset.index);
   ```
3. ✅ **Validation robuste des index**
   ```typescript
   if (
     isNaN(startWordIndex) ||
     isNaN(endWordIndex) ||
     startWordIndex < 0 ||
     endWordIndex < 0 ||
     startWordIndex >= taggingTranscription.length ||
     endWordIndex >= taggingTranscription.length ||
     startWordIndex > endWordIndex
   ) {
     console.warn("Index invalides");
     return;
   }
   ```
4. **Calcul des timestamps**
   ```typescript
   const startTime = taggingTranscription[startWordIndex].startTime;
   const endTime = taggingTranscription[endWordIndex].endTime;
   ```

### 3. 🎯 Ouverture du panneau de sélection

Le `TagSidePanel` s'ouvre avec :

- Mode "create"
- Texte sélectionné affiché
- Timestamps calculés
- Interface `TagSelector`

### 4. 🏷️ Sélection d'un tag

Clic sur un tag → `onSelectTag` → `handleSaveTag`

### 5. 💾 Sauvegarde intelligente

1. **Identification du speaker**
2. ✅ **Calcul du next_turn_verbatim** (contexte suivant)
3. **Construction de l'objet tag**
4. **Vérification des doublons**
5. **Insertion ou mise à jour en base**
6. ✅ **Mise à jour optimiste de l'état local**

### 6. 🎨 Affichage automatique

✅ Le tag apparaît immédiatement avec sa couleur grâce à la correspondance corrigée dans `findTagsForTurn`.

---

## Optimisations techniques

**Performance :**

- Composants `memo()` pour éviter re-renders
- Hooks `useCallback` pour stabilité des fonctions
- ✅ **useMemo** pour groupedTurns évite recalculs inutiles
- Lazy loading avec `dynamic()` pour TaggerLPL

**UX/UI :**

- Transitions CSS fluides (0.3s ease)
- États de loading explicites
- ✅ **Gestion d'erreurs gracieuse** avec fallbacks
- Responsive design avec Material-UI

**Types TypeScript :**

- Interfaces complètes pour tous les modèles
- Props typées pour tous les composants
- Constantes partagées (DRAWER_WIDTH = 350px)

---

## Différences entre versions

### Ancienne version (/tagging)

- Interface tout-en-un avec drawer latéral
- Chargement d'appels via accordion
- Gestion complète des tags intégrée
- Mode administrateur pour fusion/renommage

### Nouvelle version (/new-tagging)

- Interface épurée avec dropdown
- Focus sur l'expérience de tagging
- ✅ **Chargement automatique des tags**
- Pas de gestion administrative
- Switch vers ancienne version possible

---

## TagSelector - Interface de sélection des tags

**Localisation** : `@/components/TagSelector`

**Architecture des familles :**

```typescript
interface GroupedTags {
  ENGAGEMENT: Tag[]; // Techniques d'engagement client
  REFLET: Tag[]; // Techniques de reflet/écoute
  EXPLICATION: Tag[]; // Explications techniques/produits
  OUVERTURE: Tag[]; // Techniques d'ouverture commercial
  CLIENT: Tag[]; // Réactions/états du client
  OTHERS: Tag[]; // Divers/non catégorisés
}
```

**Layout responsive :**

- **Ligne 1** : ENGAGEMENT | REFLET (50/50)
- **Ligne 2** : EXPLICATION | OUVERTURE (50/50)
- **Ligne 3** : CLIENT (3 colonnes)
- **Ligne 4** : AUTRES (auto-fit, min 150px)

---

## Système de sécurité des fichiers

**Fonction `generateSignedUrl` :**

```typescript
generateSignedUrl(filePath: string, expiration?: number): Promise<string>
```

**Fonctionnement :**

- **Bucket Supabase** : `"Calls"` pour stockage des fichiers audio
- **URLs temporaires** : Validité par défaut 20 minutes (1200s)
- **Sécurité** : Accès contrôlé sans exposition directe des fichiers

---

## ✅ PROBLÈMES RÉSOLUS DANS CETTE SESSION

### 1. Tags existants ne s'affichaient pas au chargement

**Cause** : `fetchTaggedTurns` n'était pas appelé dans `selectTaggingCall`

**Solution** : Ajout de l'appel dans le contexte :

```typescript
const selectTaggingCall = useCallback(
  (call: TaggingCall): void => {
    setSelectedTaggingCall(call);
    if (call?.callid) {
      Promise.all([
        fetchTaggingTranscription(call.callid),
        fetchTaggedTurns(call.callid), // ✅ AJOUT CRUCIAL
        fetchTaggingPostits(call.callid),
      ]);
      setAudioSrc(call.audiourl);
    }
  },
  [fetchTaggingTranscription, fetchTaggedTurns, fetchTaggingPostits]
);
```

### 2. Correspondance des speakers trop stricte

**Cause** : Les tags en base avaient des speakers différents de ceux de la transcription

**Solution** : Logique de mapping dans `findTagsForTurn` :

```typescript
const speakerMatches =
  tag.speaker === turnSpeaker ||
  // Mappings spéciaux pour votre système
  (turnSpeaker === "conseiller_F11" && tag.speaker === "gare") ||
  (turnSpeaker === "appelant" && tag.speaker.includes("spk"));
```

### 3. Logique de groupement des tours de parole

**Cause** : Logique `forEach` avec condition complexe créait des groupes mal formés

**Solution** : Boucle `for` plus claire avec gestion explicite du dernier groupe

### 4. Gestion des index invalides

**Cause** : Sélections de texte pouvaient générer des index hors limites

**Solution** : Validation robuste dans `handleMouseUp`

---

## Architecture finale - Vue d'ensemble

### Flux de données principal

```
SupabaseProvider (session auth)
├── ThemeModeProvider (UI themes)
│   ├── ZohoProvider (CRM integration)
│   │   └── TaggingDataProvider (business logic)
│   │       ├── GlobalNavbar (navigation)
│   │       └── Pages
│   │           ├── /tagging (TaggerLPL - interface complète)
│   │           └── /new-tagging (NewTaggingPage - interface épurée)
│   │               └── TranscriptLPL (transcription + tagging)
│   │                   ├── TranscriptText (affichage + tags existants ✅)
│   │                   ├── TagSidePanel (gestion tags)
│   │                   └── TagSelector (sélection tags)
```

### Base de données Supabase

**Tables principales :**

- `call` → `transcript` → `word` (chaîne de transcription)
- `turntagged` ← `lpltag` (relation tags/segments)
- `tag_modifications` (audit trail)

**Sécurité :**

- Row Level Security (RLS) sur toutes les tables
- URLs signées pour fichiers audio
- Authentification obligatoire via `ProtectedRoute`

---

## Recommandations techniques

### Points forts à maintenir

1. **Hooks personnalisés** excellents pour réutilisabilité
2. **Système d'audit** très professionnel
3. **Architecture modulaire** facilite maintenance
4. **Types TypeScript** complets
5. ✅ **Système de next_turn_verbatim** très intelligent pour l'analyse

### Améliorations suggérées

1. **Tests unitaires** pour hooks complexes
2. **Error boundaries** explicites
3. **Documentation JSDoc** pour fonctions complexes
4. **Optimisation** continue des re-renders

---

## Notes pour Claude futur

Cette application est un **système de tagging conversationnel très sophistiqué** avec :

- ✅ **Affichage temps réel** des tags existants
- ✅ **Correspondance robuste** entre speakers
- ✅ **Système de contexte** (next_turn_verbatim) pour analyse conversationnelle
- ✅ **Interface intuitive** pour annotation rapide
- ✅ **Architecture modulaire** bien organisée

**Points d'attention pour maintenance future :**

- La correspondance des speakers peut nécessiter des ajustements selon les données
- Le système `next_turn_verbatim` est crucial pour l'analyse métier
- Les performances sont optimisées mais surveiller les re-renders sur gros volumes
