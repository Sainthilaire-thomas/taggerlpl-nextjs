# Documentation TranscriptLPL

Ce répertoire contient les composants et hooks nécessaires pour le système de transcription et de tagging audio. Le composant `TranscriptLPL` a été refactorisé en plusieurs sous-composants pour améliorer la maintenance et la lisibilité du code.

## Structure des fichiers

```
TranscriptLPL/
  ├── index.tsx                  # Composant principal qui assemble tous les autres
  ├── types.ts                   # Types et interfaces partagés
  ├── TranscriptHeader.tsx       # Affichage du nom du fichier
  ├── TranscriptAudioPlayer.tsx  # Lecteur audio
  ├── TranscriptControls.tsx     # Contrôles (taille de police, ouverture panneau)
  ├── TranscriptText.tsx         # Affichage et interaction avec le texte transcrit
  ├── TagSidePanel.tsx           # Panneau latéral pour gérer les tags
  ├── hooks/
  │   ├── useTaggingLogic.ts     # Logique liée à la gestion des tags
  │   └── useTranscriptAudio.ts  # Logique liée à l'audio et au suivi des mots
  └── README.md                  # Ce fichier de documentation
```

## Description des composants

### `index.tsx`

Composant principal qui :

- Coordonne les différents sous-composants
- Gère les appels d'API et l'état global
- S'occupe de l'agencement général de l'interface

### `types.ts`

Contient toutes les interfaces et types partagés entre les composants :

- `TranscriptWord` : Représente un mot dans la transcription
- `TaggedTurn` : Représente un tour de parole tagué
- `LPLTag` : Représente un tag avec ses métadonnées
- Interfaces pour les props de chaque composant
- La constante `DRAWER_WIDTH` qui définit la largeur du panneau latéral (30%)

### `TranscriptHeader.tsx`

Composant simple qui affiche le nom du fichier en cours d'édition.

### `TranscriptAudioPlayer.tsx`

Gère l'affichage et la fonctionnalité du lecteur audio :

- Utilise la référence au lecteur fournie par le contexte
- Affiche un message si aucun audio n'est disponible
- Contient un bouton d'ajout de note (fonctionnalité future)

### `TranscriptControls.tsx`

Contrôles pour l'interaction avec la transcription :

- Boutons pour augmenter/diminuer la taille de police
- Bouton pour ouvrir/fermer le panneau latéral des tags

### `TranscriptText.tsx`

Affiche le texte transcrit avec toutes les fonctionnalités interactives :

- Groupement des mots par tour de parole
- Affichage des tags attribués
- Mise en évidence du mot en cours de lecture
- Gestion de la sélection de texte pour tagging
- Navigation dans l'audio en cliquant sur les mots

### `TagSidePanel.tsx`

Panneau latéral pour la gestion des tags :

- Affichage du texte sélectionné en mode création
- Affichage des détails du tag en mode édition
- Intégration du composant TagSelector existant
- Onglets pour basculer entre les tags et les informations
- Bouton pour supprimer un tag existant

## Hooks personnalisés

### `useTaggingLogic.ts`

Contient toute la logique métier liée aux tags :

- Création, modification et suppression de tags
- Gestion de la sélection de texte
- Interaction avec la base de données (Supabase)
- États liés aux modes de tagging (création/édition)

### `useTranscriptAudio.ts`

Contient la logique liée à l'audio et au suivi des mots :

- Formatage des timestamps
- Gestion de la taille de police
- Suivi du mot actuellement lu
- Styles conditionnels des mots (actif, taggé, etc.)
- Regroupement des mots par tour de parole

## Utilisation

Pour utiliser le composant, il suffit de l'importer et de fournir les props requises :

```tsx
import TranscriptLPL from "@/components/TranscriptLPL";

function MyComponent() {
  return <TranscriptLPL callId="123" audioSrc="url-to-audio.mp3" />;
}
```

Le composant s'occupera de :

1. Charger la transcription pour l'appel spécifié
2. Charger les tags existants
3. Configurer le lecteur audio
4. Afficher l'interface interactive

## Dépendances externes

Le composant dépend de :

- `TagSelector.tsx` - Composant existant pour la sélection des tags
- `useTaggingData` - Hook de contexte fournissant l'accès aux données
- `@mui/material` - Bibliothèque UI pour les composants d'interface
- `supabase` - Client pour l'interaction avec la base de données

## Personnalisation

Pour modifier la largeur du panneau latéral, changez la constante `DRAWER_WIDTH` dans `types.ts`.
