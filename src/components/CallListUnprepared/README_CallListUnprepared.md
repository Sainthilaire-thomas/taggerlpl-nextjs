# 🗑️ Spécifications - Suppression d'appels dans CallListUnprepared

## Vue d'ensemble

Remplacer le bouton "VOIR JSONB" redondant par un bouton "SUPPRIMER" avec confirmation pour nettoyer complètement un appel du système, en s'appuyant sur la fonction existante `removeCallUpload` mais en ajoutant la suppression complète de l'appel.

## Architecture existante analysée

### Fonction `removeCallUpload` existante

- **Emplacement** : `utils/removeCallUpload.ts`
- **Fonction** : Supprime audio + transcriptions mais **conserve l'appel**
- **Actions** :
  1. Supprime le fichier audio du bucket "Calls"
  2. Supprime les entrées `word` liées aux transcriptions
  3. Supprime les entrées `transcript`
  4. **Remet à zéro** les champs de l'appel (audiourl: null, filepath: null, upload: false, preparedfortranscript: false)

### Relations identifiées

- **`call`** (1) → **`transcript`** (n) via `callid`
- **`transcript`** (1) → **`word`** (n) via `transcriptid`
- **Storage** : Bucket "Calls" contient les fichiers audio via `filepath`

## Fonctionnalités requises

### 1. Interface utilisateur

#### Bouton de suppression

- **Emplacement** : Remplacer "VOIR JSONB" dans la colonne "Préparation Technique"
- **Style** : `Button` variant="outlined" color="error"
- **Icône** : `DeleteIcon` de Material-UI
- **Texte** : "SUPPRIMER"
- **État** : Toujours visible (pas de condition)

#### Dialog de confirmation

- **Titre** : "Confirmer la suppression définitive"
- **Message principal** : "Êtes-vous sûr de vouloir supprimer définitivement l'appel **{callid}** ?"
- **Détails dynamiques** :
  - Si `upload = true` : "⚠️ Le fichier audio sera définitivement supprimé du stockage"
  - Si `preparedfortranscript = true` : "⚠️ Toutes les données de transcription seront définitivement supprimées"
  - "⚠️ L'appel sera complètement retiré du système"
  - "❌ Cette action est irréversible"
- **Boutons** :
  - "Annuler" (variant="outlined")
  - "Supprimer définitivement" (variant="contained" color="error")

### 2. Logique de suppression

#### Étapes de suppression (dans l'ordre)

**Nouvelle fonction `deleteCallCompletely`** (extension de `removeCallUpload`) :

1. **Validation des prérequis**
   - Vérifier l'existence de l'appel dans la table `call`
   - Identifier les ressources liées (audio, transcription)
2. **Suppression via `removeCallUpload`** (réutilisation de l'existant)
   - Supprime automatiquement :
     - Fichier audio du bucket "Calls" (si `filepath` existe)
     - Entrées `word` liées aux transcriptions (via `transcriptid`)
     - Entrées `transcript` (où `callid = {callid}`)
     - Remet à zéro les champs de l'appel
3. **Suppression finale de l'appel** (nouvelle étape)
   - Supprimer définitivement l'entrée dans `call` où `callid = {callid}`
   - **Différence clé** : `removeCallUpload` conserve l'appel, nous le supprimons complètement
4. **Mise à jour de l'interface**
   - Retirer l'appel de l'état local `callsByOrigin`
   - Mettre à jour le contexte `TaggingDataContext` si nécessaire
   - Afficher un message de succès

### 3. Gestion d'erreurs

#### Erreurs non-bloquantes (gérées par `removeCallUpload`)

- Fichier audio introuvable dans le storage → Continuer
- Aucune transcription préparée → Continuer

#### Erreurs bloquantes

- Échec de `removeCallUpload` → Arrêter et afficher erreur
- Échec de suppression finale de l'appel → Arrêter et afficher erreur

### 4. Messages utilisateur

#### Messages de succès (basés sur l'état initial de l'appel)

```typescript
const generateSuccessMessage = (call: Call): string => {
  const parts = [];
  if (call.upload && call.filepath) parts.push("fichier audio");
  if (call.preparedfortranscript) parts.push("données de transcription");

  if (parts.length === 0) {
    return `Appel ${call.callid} supprimé avec succès`;
  }

  return `Appel ${call.callid} et ${parts.join(" + ")} supprimés avec succès`;
};
```

#### Messages d'erreur

- **Générale** : "Erreur lors de la suppression de l'appel : {message}"
- **removeCallUpload** : "Erreur lors de la suppression des ressources : {message}"
- **Appel final** : "Ressources supprimées mais erreur lors de la suppression de l'appel : {message}"

## Structure de code requise

### 1. Fonction principale dans `CallListUnprepared`

```typescript
const handleDeleteCall = async (call: Call): Promise<void> => {
  // 1. Ouvrir dialog de confirmation
  // 2. Si confirmé, appeler deleteCallCompletely
  // 3. Mettre à jour l'interface locale (callsByOrigin)
  // 4. Rafraîchir TaggingDataContext si nécessaire
  // 5. Afficher message de succès/erreur
};
```

### 2. Nouvelle fonction de suppression complète

```typescript
// Créer dans utils/deleteCallCompletely.ts
export const deleteCallCompletely = async (
  callId: string
): Promise<{
  success: boolean;
  message: string;
  deletedResources: {
    audio: boolean;
    transcription: boolean;
    wordsCount: number;
  };
}> => {
  // 1. Récupérer les infos de l'appel
  // 2. Appeler removeCallUpload(callId, filepath)
  // 3. Supprimer définitivement l'appel de la table call
  // 4. Retourner le résumé des actions
};
```

### 3. Dialog de confirmation

```typescript
interface DeleteConfirmationDialogProps {
  open: boolean;
  call: Call | null;
  onClose: () => void;
  onConfirm: (call: Call) => Promise<void>;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps>;
```

### 4. Intégration avec l'écosystème existant

#### Mise à jour du contexte TaggingDataContext

- Si l'appel supprimé était sélectionné (`selectedTaggingCall`), le désélectionner
- Appeler `refreshTaggingCalls()` pour mettre à jour la liste des appels prêts

#### Mise à jour de CallListUnprepared

- Retirer l'appel de `callsByOrigin[origin]`
- Recalculer les statistiques globales automatiquement

## Sécurité et validation

### Vérifications avant suppression

- L'appel existe dans la base de données
- L'utilisateur a les permissions de suppression
- L'appel n'est pas en cours d'utilisation (optionnel)

### Prévention des suppressions accidentelles

- Double confirmation pour les appels avec audio ET transcription
- Affichage clair des conséquences
- Pas de suppression en masse (une par une seulement)

## Impact sur les performances

### Optimisations

- Suppression en transaction pour éviter les états incohérents
- Suppression asynchrone du fichier audio (non-bloquante)
- Mise à jour optimiste de l'interface (retirer immédiatement de la vue)

### Monitoring

- Log des suppressions pour audit
- Comptage des ressources supprimées
- Temps d'exécution de la suppression

## Scope actuel et évolutions futures

### 🎯 Scope de cette implémentation

**Tables traitées** :

- ✅ `call` - Suppression complète de l'appel
- ✅ `transcript` - Suppression des entrées liées (via `removeCallUpload`)
- ✅ `word` - Suppression des mots de transcription (via `removeCallUpload`)
- ✅ **Storage "Calls"** - Suppression des fichiers audio (via `removeCallUpload`)

**Tables NON traitées** (volontairement conservées) :

- ⏳ `turntagged` - **Données conservées pour les statistiques**
- ⏳ `postit` - **Données conservées** (intérêt limité sans l'appel chargé)

### 🔮 Évolutions futures à prévoir

#### 1. Gestion multi-taggeurs (prochaine version)

- **Objectif** : Permettre à plusieurs personnes de tagger le même appel
- **Impact** : Dissociation entre :
  - **Données nécessaires pour tagger** (transcription, audio) → À supprimer
  - **Données taggées** (`turntagged`) → À conserver avec `taggeur_id`
- **Champs à ajouter** : `taggeur_id/nom` dans `turntagged` pour traçabilité
- **Statut** : À traiter ultérieurement

#### 2. Gestion avancée de `turntagged`

- **Options futures** :
  - Suppression avec confirmation séparée
  - Conservation par défaut (statistiques globales)
  - Archivage au lieu de suppression
- **Statut** : À définir selon les besoins métier

#### 3. Gestion de `postit`

- **Analyse** : Données liées à l'appel mais sans intérêt si appel supprimé
- **Options futures** :
  - Suppression automatique
  - Archivage avec référence à l'appel supprimé
  - Migration vers une table d'historique
- **Statut** : À traiter ultérieurement

#### 4. Extension à `CallTableList`

- **Objectif** : Ajouter la même fonctionnalité de suppression dans l'onglet "Liste des appels" (`/calls`)
- **Complexité** : Plus élevée (appels préparés actifs)
- **Prérequis** : Validation avec les utilisateurs actifs
- **Statut** : À implémenter après validation de `CallListUnprepared`

### 🛡️ Sécurité et permissions

#### RLS (Row Level Security)

- **Statut** : ✅ **Supposées correctes** (autres suppressions fonctionnent)
- **Validation** : Tests à effectuer sur toutes les tables concernées
- **Backup** : Logs d'audit recommandés pour toute suppression

### 📋 Roadmap suggérée

#### Phase 1 (Actuelle) : Suppression de base

- [x] Spécifications complètes
- [ ] Implémentation `deleteCallCompletely.ts`
- [ ] Dialog de confirmation
- [ ] Intégration `CallListUnprepared`
- [ ] Tests et validation

#### Phase 2 (Future) : Gestion avancée

- [ ] Analyse impact `turntagged` (conservation vs suppression)
- [ ] Gestion `postit` (suppression/archivage)
- [ ] Extension à `CallTableList`

#### Phase 3 (Long terme) : Multi-taggeurs

- [ ] Refactoring architecture tagging
- [ ] Ajout champs traçabilité
- [ ] Gestion des conflits de tagging

## Implémentation prête

Avec les éléments analysés, l'implémentation peut commencer :

### Fichiers à créer/modifier

1. **`utils/deleteCallCompletely.ts`** - Nouvelle fonction (extension de removeCallUpload)
2. **`components/DeleteConfirmationDialog.tsx`** - Nouveau dialog de confirmation
3. **`CallListUnprepared.tsx`** - Intégrer le bouton et la logique

### Dépendances identifiées

- ✅ `removeCallUpload` existe et fonctionne
- ✅ Structure des tables `call`, `transcript`, `word` connue
- ✅ Bucket Supabase "Calls" pour les fichiers audio
- ✅ Types TypeScript disponibles dans `TaggingDataContext`
- ✅ RLS présumées fonctionnelles

## Prochaines étapes

1. ✅ Créer `utils/deleteCallCompletely.ts`
2. ✅ Créer le dialog de confirmation
3. ✅ Intégrer dans `CallListUnprepared.tsx`
4. ✅ Tester tous les cas de figure

L'implémentation est maintenant prête à être développée avec toutes les informations nécessaires ! 🚀
