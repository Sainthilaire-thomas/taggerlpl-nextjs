# 📞 Spécifications du Workflow des Appels - Page /calls

## 🎯 Vue d'ensemble

La page `/calls` gère l'importation, la préparation et l'analyse des appels conversationnels via 3 onglets séquentiels.

## 📊 Structure de données

### Table `call` (champs clés)

```sql
call {
  callid          -- ID unique de l'appel
  transcription   -- JSONB contenant la transcription brute
  filepath        -- Chemin vers l'audio dans bucket "Calls"
  upload          -- BOOLÉEN: Audio uploadé dans le bucket
  preparedfortranscript -- BOOLÉEN: Prêt pour le tagging (table word peuplée)
  audiourl        -- URL signée temporaire pour l'audio
  filename        -- Nom du fichier audio original
  description     -- Description de l'appel
  is_tagging_call -- BOOLÉEN: Marque comme appel de tagging
}
```

### États possibles d'un appel

#### Relation `preparedfortranscript` ↔ Tables `transcript`/`word`

**`preparedfortranscript = false`** → **PAS de données dans `transcript`/`word`**

- Seul le JSONB `call.transcription` existe
- Tables `transcript` et `word` vides pour cet appel

**`preparedfortranscript = true`** → **Données présentes dans `transcript`/`word`**

- JSONB `call.transcription` transformé en tours de parole
- Table `transcript` : 1 ligne avec `transcriptid`
- Table `word` : N lignes avec les mots/tours de parole

#### États détaillés

1. **Transcription importée** :
   - `transcription` ≠ null, `upload` = false, `preparedfortranscript` = false
   - ❌ Aucune donnée dans `transcript`/`word`
2. **Audio seul** :
   - `upload` = true, `transcription` = null, `preparedfortranscript` = false
   - ❌ Aucune donnée dans `transcript`/`word`
3. **Complet non préparé** :
   - `transcription` ≠ null, `upload` = true, `preparedfortranscript` = false
   - ❌ Aucune donnée dans `transcript`/`word`
4. **Préparé pour tagging** :
   - `preparedfortranscript` = true (avec ou sans audio)
   - ✅ Données dans `transcript`/`word` (transformation JSONB effectuée)

## 🔄 Workflow en 3 phases

### 📥 Phase 1 : Import (Onglet 1)

**Objectif** : Importer les fichiers depuis Zoho WorkDrive dans Supabase

**Sources** :

- Audio seul (MP3, WAV, etc.)
- Transcription seule (JSON)
- Audio + Transcription

**Actions** :

- `SimpleWorkdriveExplorer` → Sélection fichiers
- `handleCallSubmission()` → Sauvegarde en base
- Stockage audio dans bucket "Calls" (si présent)
- Stockage transcription en JSONB (si présente)
- **⚠️ PROBLÈME ACTUEL** : Le code crée aussi `transcript`/`word` (à corriger)
- **✅ COMPORTEMENT SOUHAITÉ** : AUCUNE création dans tables `transcript`/`word`

**Résultat** :

```sql
INSERT INTO call {
  transcription: JSONB_ou_NULL,
  upload: true_si_audio_false_sinon,
  preparedfortranscript: false,
  is_tagging_call: true
}
```

### 🔧 Phase 2 : Préparation (Onglet 2)

**Objectif** : Sélectionner les appels à analyser et transformer JSONB → table `word`

**Critères d'affichage** :

```sql
WHERE is_tagging_call = true
AND preparedfortranscript = false
```

**Interface** :

- Liste des appels avec bouton "VOIR JSONB" (lecture transcription)
- Bouton "PRÉPARER POUR LE TAGGING"
- **NOUVEAU** : Association audio optionnelle si manquante

**Actions de préparation** :

1. **Si audio manquant** : Proposer upload optionnel (pas obligatoire)
2. **Si transcription présente** : Parser JSONB → Peupler tables `transcript` + `word`
3. **Marquer comme préparé** : `preparedfortranscript = true`

**Résultat** :

- Tables `transcript` et `word` peuplées
- Appel disponible pour tagging

### 🏷️ Phase 3 : Tagging (Onglet 3)

**Objectif** : Analyser et tagger les appels préparés

**Critères d'affichage** :

```sql
WHERE is_tagging_call = true
AND preparedfortranscript = true
```

**Interface** :

- Table avec actions : Lire, Éditer origine, Supprimer
- Lecteur audio (si disponible)
- Interface de tagging via `TranscriptLPL`

## ⚠️ **PROBLÈMES ACTUELS IDENTIFIÉS**

### 1. Incohérence dans `handleCallSubmission`

**Code actuel** ❌ :

```typescript
// Import WorkDrive fait DÉJÀ transcript + word
if (parsedTranscription) {
  await insertTranscriptionWords(transcriptId, parsedTranscription, supabase);
}
// Mais marque preparedfortranscript = false
```

**Code souhaité** ✅ :

```typescript
// Import WorkDrive ne fait QUE stocker le JSONB
// Pas de création transcript/word
preparedfortranscript: false;
```

### 2. Filtrage incorrect dans l'onglet Préparation

**Code actuel** ❌ :

```sql
-- Dans CallListUnprepared
SELECT * FROM call WHERE preparedfortranscript = false
-- Manque le filtre is_tagging_call = true
```

**Code souhaité** ✅ :

```sql
SELECT * FROM call
WHERE is_tagging_call = true
-- Puis filtrage UI selon le besoin
```

### 3. Gestion audio obligatoire en préparation

**Comportement actuel** ❌ :

- `AudioUploadModal` demande obligatoirement un fichier
- Bloque la préparation si pas d'audio

**Comportement souhaité** ✅ :

- Audio optionnel avec bouton "Continuer sans audio"
- Possibilité de tagger sans audio

### 1. **Logique de filtrage des onglets**

#### Onglet 2 - Préparation (ACTUEL ❌)

```sql
-- Problème : Se base sur 'upload' au lieu de 'preparedfortranscript'
WHERE upload = false OR preparedfortranscript = false
```

#### Onglet 2 - Préparation (CORRIGÉ ✅)

```sql
WHERE is_tagging_call = true
AND preparedfortranscript = false
```

#### Onglet 3 - Liste des appels (CORRIGÉ ✅)

```sql
WHERE is_tagging_call = true
AND preparedfortranscript = true
```

## 🔧 **SPÉCIFICATIONS TECHNIQUES DÉTAILLÉES**

### **Import WorkDrive avec gestion des doublons**

#### Logique de détection des doublons :

```typescript
// Vérification avant import
const existingCall = await supabase
  .from("call")
  .select("*")
  .eq("filename", audioFile.name)
  .eq("is_tagging_call", true)
  .single();

if (existingCall) {
  // Analyser ce qui peut être amélioré
  const canUpgrade = {
    addAudio: !existingCall.upload && audioFile,
    addTranscription: !existingCall.transcription && transcriptionText,
  };

  if (canUpgrade.addAudio || canUpgrade.addTranscription) {
    // Proposer mise à jour
  } else {
    // Bloquer ou créer doublon
  }
}
```

#### Dialog de mise à jour proposé :

```
┌─────────────────────────────────────────┐
│ 🔄 Appel existant détecté               │
├─────────────────────────────────────────┤
│ Un appel avec ce nom existe déjà :      │
│ "sonear_YvesRocher_0200.json"          │
│                                         │
│ État actuel : 📝 Transcription seule    │
│ Nouvel import : 🎵📝 Audio + Transcript.│
│                                         │
│ [Ajouter l'audio manquant]             │
│ [Créer un nouvel appel]                 │
│ [Annuler]                               │
└─────────────────────────────────────────┘
```

### **Validation JSON stricte**

#### Structure JSON requise :

```typescript
interface ValidTranscriptionJSON {
  words: Array<{
    text: string; // Obligatoire
    startTime: number; // Obligatoire
    endTime: number; // Obligatoire
    speaker?: string; // Optionnel
    turn?: string; // Optionnel (alias de speaker)
    type?: string; // Optionnel
  }>;
}

// Fonction de validation
const validateTranscriptionJSON = (
  jsonString: string
): {
  isValid: boolean;
  error?: string;
  data?: ValidTranscriptionJSON;
} => {
  try {
    const parsed = JSON.parse(jsonString);

    if (!parsed.words || !Array.isArray(parsed.words)) {
      return {
        isValid: false,
        error: "Propriété 'words' manquante ou invalide",
      };
    }

    if (parsed.words.length === 0) {
      return { isValid: false, error: "Le tableau 'words' est vide" };
    }

    for (let i = 0; i < parsed.words.length; i++) {
      const word = parsed.words[i];

      if (!word.text || typeof word.text !== "string") {
        return {
          isValid: false,
          error: `Mot ${i}: propriété 'text' manquante`,
        };
      }

      if (
        typeof word.startTime !== "number" ||
        typeof word.endTime !== "number"
      ) {
        return { isValid: false, error: `Mot ${i}: timestamps invalides` };
      }

      if (word.startTime >= word.endTime) {
        return { isValid: false, error: `Mot ${i}: startTime >= endTime` };
      }
    }

    return { isValid: true, data: parsed };
  } catch (error) {
    return { isValid: false, error: "JSON invalide" };
  }
};
```

### **Actions de suppression Menu déroulant**

#### Composant BulkActionsToolbar étendu :

```typescript
// Dans CallTableList - Actions de suppression
const [deleteMenuAnchor, setDeleteMenuAnchor] = useState<null | HTMLElement>(
  null
);
const [selectedAction, setSelectedAction] = useState<
  "audio" | "analysis" | "complete" | null
>(null);

const handleDeleteMenuClick = (event: React.MouseEvent<HTMLElement>) => {
  setDeleteMenuAnchor(event.currentTarget);
};

const handleDeleteAction = async (
  action: "audio" | "analysis" | "complete"
) => {
  switch (action) {
    case "audio":
      // Supprimer fichier bucket + mettre upload = false
      await removeAudioOnly(selectedCallIds);
      break;
    case "analysis":
      // Supprimer transcript + word + preparedfortranscript = false
      await removeAnalysisData(selectedCallIds);
      break;
    case "complete":
      // Supprimer appel complet
      await removeCallsCompletely(selectedCallIds);
      break;
  }
};
```

### **Filtres avancés onglet Préparation**

#### Interface de filtrage :

```typescript
interface PreparationFilters {
  state: "all" | "to_prepare" | "prepared";
  content: "all" | "complete" | "audio_only" | "transcript_only" | "empty";
  status: "all" | "non_supervisé" | "conflictuel" | "non_conflictuel";
  dateRange?: { start: Date; end: Date };
  hasWords: "all" | "yes" | "no"; // Pour détecter les problèmes de synchro
}

// Logique de filtrage
const filterCalls = (calls: Call[], filters: PreparationFilters) => {
  return calls.filter((call) => {
    // Filtre par état
    if (filters.state === "to_prepare" && call.preparedfortranscript)
      return false;
    if (filters.state === "prepared" && !call.preparedfortranscript)
      return false;

    // Filtre par contenu
    const hasAudio = call.upload && call.filepath;
    const hasTranscription = call.transcription?.words?.length > 0;

    switch (filters.content) {
      case "complete":
        return hasAudio && hasTranscription;
      case "audio_only":
        return hasAudio && !hasTranscription;
      case "transcript_only":
        return !hasAudio && hasTranscription;
      case "empty":
        return !hasAudio && !hasTranscription;
      default:
        return true;
    }
  });
};
```

### 3. **Actions de suppression**

#### Bouton poubelle actuel ❌

- Fonction : `removeCallUpload()`
- Action : Supprime audio du bucket + vide table `word`
- Garde l'appel avec `upload = false`

#### Options de suppression proposées ✅

**Option A : Suppression partielle**

- "Supprimer audio" → Supprime fichier bucket, garde transcription/words
- "Supprimer complètement" → Supprime appel + audio + transcript + words

**Option B : Suppression intelligente**

- Si `upload = true` → "Supprimer audio seulement" vs "Supprimer tout"
- Si `upload = false` → "Supprimer appel" (tout supprimer)

**Option C : Menu contextuel**

```
🗑️ ▼ Supprimer
├── 🎵 Audio seulement
├── 📝 Données d'analyse (words)
└── ❌ Appel complet
```

### 4. **Indicateurs visuels**

#### État des appels dans les listes

- 🎵 **Audio** : Icône présence audio
- 📝 **Transcription** : Icône présence transcription
- ✅ **Préparé** : Badge statut préparation
- 🏷️ **Taggé** : Nombre de tags appliqués

#### Messages d'état

- "Audio + Transcription"
- "Transcription seule"
- "Audio seul"
- "Prêt pour tagging"

## 🎨 Interface utilisateur détaillée

### Onglet 1 - Import WorkDrive

- **Titre** : "📥 Import depuis Zoho WorkDrive"
- **Sous-titre** : "Importez vos fichiers audio et transcriptions"
- **Interface** : `SimpleWorkdriveExplorer` (inchangé)

### Onglet 2 - Préparation (VUE UNIFIÉE)

- **Titre** : "🔧 Préparation et gestion des appels"
- **Sous-titre** : "Gérez tous vos appels importés et préparez-les pour l'analyse"

#### Filtres d'affichage :

```
[État: Tous ▼] [Contenu: Tous ▼] [Statut: Tous ▼] [🔍 Recherche dans transcription]
```

**Filtre État** :

- Tous les appels
- À préparer (`preparedfortranscript = false`)
- Déjà préparés (`preparedfortranscript = true`)

**Filtre Contenu** :

- Tous
- Audio + Transcription (`upload = true AND transcription ≠ null`)
- Audio seul (`upload = true AND transcription = null`)
- Transcription seule (`upload = false AND transcription ≠ null`)

**Filtre Statut** :

- Tous
- Non supervisé
- Conflictuel
- Non conflictuel

#### Indicateurs visuels par appel :

```
┌─ État ─┬─ Statut ─┬─ Fichier ─┬─ Description ─┬─ Actions ─┐
│🎵📝 Audio+│ ⚫ Non  │ file.mp3 │ Description  │ [Voir]   │
│Transcript.│supervisé│          │              │ [Prép.]  │
├───────────┼─────────┼──────────┼──────────────┼──────────┤
│📝 Transcript│ 🔴 Conf.│ file.json│ Import Work..│ [Voir]   │
│seule      │         │          │              │ [Prép.]  │
├───────────┼─────────┼──────────┼──────────────┼──────────┤
│✅ Prêt pour│ 🟢 Non  │ file.mp3 │ Appel préparé│ [Liste]  │
│tagging    │Conf.    │          │              │          │
└───────────┴─────────┴──────────┴──────────────┴──────────┘
```

**Légende des états** :

- 🎵📝 = Audio + Transcription (prêt à préparer)
- 📝 = Transcription seule (prêt à préparer)
- 🎵 = Audio seul (nécessite transcription)
- ✅ = Déjà préparé (lecture seule)
- ❌ = Vide (aucun contenu)

**Actions disponibles** :

- **[Voir JSONB]** : Affiche la transcription (si présente)
- **[Préparer]** : Lance la préparation (si possible)
- **[→ Liste]** : Redirige vers l'onglet 3 (si déjà préparé)

### Onglet 3 - Tagging

- **Titre** : "🏷️ Appels prêts pour le tagging"
- **Sous-titre** : "Analysez et taguez vos appels préparés"
- **Interface** : `CallTableList` actuelle (inchangée)
- **Filtrage** : `WHERE is_tagging_call = true AND preparedfortranscript = true`

## ⚡ Actions techniques

### 1. Corriger les requêtes de filtrage

### 2. Modifier `prepareCallForTagging()` pour audio optionnel

### 3. Réviser les actions de suppression

### 4. Améliorer les indicateurs visuels

### 5. Ajouter des messages d'état clairs

## ✅ **RÉPONSES VALIDÉES**

### 1. **Workflow de l'import** 🔄

**✅ VALIDÉ** : L'import WorkDrive ne crée PAS les tables `transcript`/`word`

- Import stocke seulement JSONB dans `call.transcription`
- Préparation crée `transcript`/`word` à partir du JSONB
- `preparedfortranscript = false` à l'import

### 2. **Gestion des doublons** 🔍

**✅ VALIDÉ** : Amélioration intelligente des imports existants

- Vérifier si appel existe déjà (par filename/description)
- Si nouvel import apporte plus de contenu → Proposer mise à jour
- Exemple : Audio existant + nouvelle transcription → "Voulez-vous ajouter la transcription ?"

### 3. **Actions de suppression dans l'onglet 3** 🗑️

**✅ VALIDÉ** : Option A - Suppression progressive

```
🗑️ ▼ Supprimer
├── 🎵 Retirer l'audio (garde transcription + words)
├── 📝 Retirer les données d'analyse (words)
└── ❌ Supprimer l'appel complet
```

### 4. **États des appels existants** 📊

**✅ VALIDÉ** : Tous les états visibles dans l'onglet 2 avec filtres

- Onglet 2 affiche TOUS les appels de tagging (`is_tagging_call = true`)
- Filtres par état : Tous/À préparer/Déjà préparés
- Pas de filtrage par défaut = vue complète

### 5. **Audio optionnel dans TranscriptLPL** 🎵

**✅ VALIDÉ** : TranscriptLPL fonctionne sans audio

- `TranscriptAudioPlayer` affiche "Aucun audio disponible" si `audioSrc` vide
- Tagging possible avec transcription seule

### 6. **Performance avec gros volumes** ⚡

**✅ VALIDÉ** : 100 appels actuellement, milliers futurs

- Pas de pagination immédiate nécessaire
- Prévoir pagination pour évolution future
- Filtres avancés suffisants pour l'instant

### 7. **Validation import JSON** ✅

**✅ VALIDÉ** : Validation structure JSON obligatoire

- Vérifier présence de `words` array
- Valider structure de chaque word : `{text, startTime, endTime, speaker/turn}`
- Rejeter les JSON invalides avec message explicite

### 8. **Workflow utilisateur prioritaire** 🎯

**✅ VALIDÉ** : Mix des cas A et B

- **Cas A** : Import transcription seule → Préparation → Tagging sans audio
- **Cas B** : Import audio + transcription → Préparation → Tagging avec audio
- Interface doit être optimisée pour les deux workflows

## 📋 **PLAN D'IMPLÉMENTATION PRIORITAIRE**

### 🚨 **Phase 1 - Corrections critiques** (Immédiat)

#### 1.1 Corriger l'import WorkDrive

```typescript
// Dans handleCallSubmission - SUPPRESSION de la création transcript/word
export const handleCallSubmission = async ({
  audioFile,
  description,
  transcriptionText,
  showMessage,
  onCallUploaded,
}) => {
  // ... upload audio si présent

  // Validation JSON si transcription
  let parsedTranscription = null;
  if (transcriptionText) {
    const validation = validateTranscriptionJSON(transcriptionText);
    if (!validation.isValid) {
      throw new Error(`Transcription invalide: ${validation.error}`);
    }
    parsedTranscription = validation.data;
  }

  // Gestion des doublons
  const existingCall = await checkForDuplicates(audioFile?.name, description);
  if (existingCall) {
    return handleDuplicateDialog(existingCall, audioFile, parsedTranscription);
  }

  // Insert call SANS créer transcript/word
  const { data: callData } = await supabase.from("call").insert([
    {
      audiourl: audioUrl,
      filename: audioFile?.name,
      filepath: filePath,
      description,
      transcription: parsedTranscription, // JSONB seulement
      upload: !!audioFile,
      is_tagging_call: true,
      preparedfortranscript: false, // ✅ Pas préparé
    },
  ]);

  // ❌ SUPPRIMÉ : Pas de création transcript/word ici
};
```

#### 1.2 Corriger le filtrage onglet Préparation

```typescript
// Dans CallListUnprepared - AJOUT du filtre manquant
const fetchTaggingCalls = async () => {
  const { data, error } = await supabase
    .from("call")
    .select("*")
    .eq("is_tagging_call", true); // ✅ AJOUT de ce filtre
  // Pas de filtre sur preparedfortranscript = afficher TOUS
};
```

### 🔧 **Phase 2 - Améliorations UX** (Priorité haute)

#### 2.1 Audio optionnel en préparation

```typescript
// Modifier AudioUploadModal pour accepter skip
<AudioUploadModal
  open={isAudioModalOpen}
  onClose={() => setIsAudioModalOpen(false)}
  onUpload={handleAudioUpload}
  allowSkip={true}
  skipLabel="Continuer sans audio"
  title="Association audio (optionnel)"
/>
```

#### 2.2 Vue unifiée avec filtres onglet Préparation

- Filtres État/Contenu/Statut comme spécifié
- Indicateurs visuels par type d'appel
- Actions contextuelles

### 🎨 **Phase 3 - Suppressions avancées** (Priorité moyenne)

#### 3.1 Menu suppression onglet 3

```typescript
// Dans CallTableList - Remplacer bouton simple par menu
<IconButton onClick={handleDeleteMenuClick}>
  <DeleteIcon />
</IconButton>
<Menu anchorEl={deleteMenuAnchor} open={Boolean(deleteMenuAnchor)}>
  <MenuItem onClick={() => handleDeleteAction('audio')}>
    🎵 Retirer l'audio
  </MenuItem>
  <MenuItem onClick={() => handleDeleteAction('analysis')}>
    📝 Retirer les données d'analyse
  </MenuItem>
  <MenuItem onClick={() => handleDeleteAction('complete')}>
    ❌ Supprimer l'appel complet
  </MenuItem>
</Menu>
```

### 🚀 **Phase 4 - Optimisations futures** (Priorité basse)

#### 4.1 Pagination préparatoire

- Implémentation pagination pour évolution vers milliers d'appels
- Filtres par date de création/modification
- Recherche textuelle dans descriptions

#### 4.2 Monitoring et logs

- Suivi des actions de suppression
- Logs des imports/préparations
- Métriques d'utilisation

## 🛠️ **FICHIERS À MODIFIER**

### Phase 1 - Fichiers critiques :

- `callApiUtils.ts` : Corriger handleCallSubmission
- `CallListUnprepared.tsx` : Corriger filtrage
- Nouveaux fichiers : `validateTranscriptionJSON.ts`, `duplicateManager.ts`

### Phase 2 - Fichiers UX :

- `AudioUploadModal.tsx` : Ajouter option skip
- `CallListUnprepared.tsx` : Vue unifiée avec filtres
- `CallPreparation.tsx` : Adapter aux nouveaux workflows

### Phase 3 - Fichiers suppression :

- `CallTableList.tsx` : Menu suppression avancé
- `removeCallUpload.ts` : Fonctions suppression granulaire
- Nouveaux : `bulkDeleteActions.ts`

## 🧪 **TESTS PRIORITAIRES**

1. **Import WorkDrive** : Vérifier qu'aucun transcript/word n'est créé
2. **Gestion doublons** : Tester détection et propositions d'amélioration
3. **Préparation** : Tester workflow avec/sans audio
4. **Filtrage** : Vérifier que tous les appels apparaissent dans onglet 2
5. **Suppression** : Tester les 3 types de suppression
6. **Validation JSON** : Tester rejet des JSON invalides
