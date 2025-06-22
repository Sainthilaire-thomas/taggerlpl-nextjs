# Documentation TaggerLPL - Application Next.js (Version 2.0)

## Vue d'ensemble

TaggerLPL est une application Next.js dédiée au tagging et à l'analyse d'appels. L'application utilise une architecture moderne avec React Server Components et Client Components, intégrant un système complet de gestion de fichiers Zoho WorkDrive et un pipeline intelligent de préparation d'appels.

## Structure des fichiers principaux

### 1. Page d'accueil (`page.tsx`)

```typescript
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/tagging");
  return null;
}
```

**Analyse :**

- **Rôle** : Point d'entrée de l'application (route `/`)
- **Comportement** : Redirection automatique vers `/tagging`
- **Type** : Server Component (par défaut)
- **Stratégie** : L'application redirige directement vers la fonctionnalité principale

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

**Architecture Hiérarchisée des Providers :**

1. `AppRouterCacheProvider` (Material-UI)
2. `SupabaseProvider` (Base de données)
3. `ThemeModeProvider` (Gestion des thèmes)
4. `ZohoProvider` (Intégration Zoho WorkDrive)
5. `TaggingDataProvider` (Données de tagging)

---

## Architecture Technique

### Technologies Utilisées

- **Framework** : Next.js 14+ (App Router)
- **UI** : Material-UI (MUI) + Tailwind CSS
- **Base de données** : Supabase avec Row Level Security
- **Intégration CRM** : Zoho WorkDrive via OAuth
- **État global** : React Context API
- **Stockage** : URLs signées Supabase Storage
- **Langue** : Interface en français

### Flux de Navigation Étendu

```
/ (page d'accueil) → redirect → /tagging (ancienne interface)
                              ↓
                         /new-tagging (nouvelle interface)
```

---

## Composants Principaux

### 1. GlobalNavbar - Navigation Intelligente

**Localisation** : `@/components/layout/GlobalNavbar`

**Fonctionnalités clés :**

- **Navigation adaptative** : Comportement différent selon le type de page
- **Auto-hide intelligent** : Se masque lors du défilement, réapparaît au survol
- **Zone de détection** : Zone invisible de 20px en haut pour réaffichage
- **Hauteur fixe** : 48px constant pour éviter les décalages

**Pages protégées** (avec auto-hide) :

- `/dashboard`, `/calls`, `/tagging`, `/new-tagging`, `/tags/admin`, `/analysis`

### 2. TaggingDataProvider - Hub Central de Données

**Localisation** : `@/context/TaggingDataContext`

**Modèles de données principaux :**

```typescript
interface TaggingCall {
  callid: string;
  is_tagging_call: boolean;
  preparedfortranscript: boolean;
  audiourl: string;
  filename?: string;
  description?: string;
  filepath?: string;
  upload?: boolean;
}

interface Word {
  id: number;
  transcriptid: string;
  word: string;
  text: string; // Alias de word pour compatibilité
  startTime: number;
  endTime: number;
  speaker: string;
  turn: string; // Tour de parole
  index?: number; // Position dans la transcription
}

interface TaggedTurn {
  id: number;
  call_id: string;
  start_time: number;
  end_time: number;
  tag: string;
  verbatim: string;
  next_turn_verbatim: string;
  color: string; // Récupérée depuis lpltag
}

interface Tag {
  id?: number;
  label: string;
  color?: string;
  description?: string;
  family?: string; // ENGAGEMENT, REFLET, EXPLICATION, etc.
  callCount?: number;
  turnCount?: number;
}
```

**Fonctionnalités principales :**

- **Gestion des appels** : Liste, sélection, filtrage des appels de tagging
- **Transcription intelligente** : Mapping automatique word ↔ text ↔ turn
- **Lecture audio synchronisée** : Contrôle avec saut à timestamp précis
- **Tagging granulaire** : Ajout, suppression, modification avec audit trail
- **Gestion des couleurs** : Association automatique tags ↔ couleurs

**Hooks exposés essentiels :**

- `fetchTaggingTranscription(callId)` : Charge transcription avec mapping
- `selectTaggingCall(call)` : Sélectionne appel + charge données associées
- `playAudioAtTimestamp(timestamp)` : Synchronisation audio-texte
- `addTag(newTag)` : Ajout avec enrichissement couleur automatique
- `fetchTaggedTurns(callId)` : Récupération avec couleurs depuis lpltag

### 3. ZohoProvider - Gestion Simplifiée des Tokens

**Localisation** : `@/context/ZohoContext`

**Architecture simplifiée :**

```typescript
interface ZohoContextType {
  zohoRefreshToken: string | null;
  updateZohoRefreshToken: (token: string) => Promise<void>;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}
```

**Caractéristiques :**

- **Stockage localStorage** : Pas d'intégration Supabase Auth (contrairement à la doc v1)
- **Gestion tokens OAuth** : Access token + refresh token Zoho
- **Simplicité** : Focus sur WorkDrive, pas de complexité additionnelle

---

## Gestion des Fichiers Zoho WorkDrive

### SimpleWorkdriveExplorer - Système d'Exploration Moderne

**Localisation** : `@/components/SimpleWorkdriveExplorer`

**Fonctionnalités avancées :**

#### **Navigation Hiérarchique**

```typescript
interface FolderInfo {
  id: string;
  name: string;
}

// Navigation avec historique complet
const {
  files,
  currentFolder,
  folderHistory,
  folderPath,
  handleFolderClick,
  handleBack,
  handleHome,
  handleBreadcrumbNavigation,
} = useWorkdriveFiles(rootFolderId);
```

#### **Authentification OAuth Complète**

```typescript
// Flow d'authentification sécurisé
1. handleZohoAuth() → Redirection OAuth Zoho
2. Retour avec token dans URL (?token=...)
3. parseZohoToken() → Extraction et validation
4. setAccessToken() → Stockage dans contexte
5. cleanAuthTokenFromUrl() → Nettoyage URL
```

#### **Sélection Duale Intelligente**

- **Fichier audio** : Requis (mp3, wav, m4a, etc.)
- **Fichier transcription** : Optionnel (json, txt, docx, etc.)
- **Validation types** : `isAudioFile()` et `isTranscriptionFile()`
- **Interface visuelle** : Chips de désélection + statut temps réel

#### **Téléchargement et Conversion**

```typescript
// Pipeline de téléchargement sécurisé
const handleImportFiles = async () => {
  // 1. Téléchargement fichier audio via proxy
  const audioFile = await downloadFile(selectedAudioFile, accessToken);

  // 2. Téléchargement transcription (optionnel)
  let transcriptionText = "";
  if (selectedTranscriptionFile) {
    transcriptionText = await downloadTranscription(
      selectedTranscriptionFile,
      accessToken
    );
  }

  // 3. Callback avec File objects prêts
  onFilesSelect(audioFile, transcriptionText);
};
```

#### **Types et Interfaces Zoho**

```typescript
interface ZohoFile {
  id: string;
  originalId?: string; // Compatibilité avec AudioList
  attributes?: {
    name?: string;
    extn?: string;
    mime_type?: string;
    is_folder?: boolean;
    storage_info?: {
      size_in_bytes?: number;
    };
  };
}

interface SimpleWorkdriveExplorerProps {
  onFilesSelect: (audioFile: File, transcriptionText?: string) => void;
  rootFolderId?: string;
}
```

**Sécurité et Performance :**

- **Proxy Netlify** : `/api/zoho/download` pour éviter CORS
- **Validation MIME** : Contrôle strict des types de fichiers
- **Gestion d'erreurs** : Try/catch avec messages utilisateur
- **États de loading** : LinearProgress pendant navigation/téléchargement

---

## Système de Préparation d'Appels

### CallListUnprepared - Interface de Préparation

**Localisation** : `@/components/calls/CallListUnprepared`

**Pipeline de préparation :**

```
Appel transcrit (preparedfortranscript: false)
  ↓
Filtrage + Regroupement par origine
  ↓
Association fichier audio (upload manuel)
  ↓
Préparation pour tagging (preparedfortranscript: true)
  ↓
Disponible dans interface de tagging
```

#### **Fonctionnalités de Filtrage Avancées**

```typescript
// Filtres multiples combinés
const [filterStatus, setFilterStatus] = useState<string>("all");
const [filterKeyword, setFilterKeyword] = useState<string>("");

// Statuts d'appels supportés
type CallStatus = "conflictuel" | "non_conflictuel" | "non_supervisé";

// Filtrage par mot-clé dans transcription
const matchesKeyword = call.transcription?.words.some((word) =>
  word.text.toLowerCase().includes(keyword.toLowerCase())
);
```

#### **Regroupement par Origine avec Statistiques**

```typescript
interface CallsByOrigin {
  [origin: string]: Call[];
}

interface StatusCount {
  conflictuel: number;
  nonSupervisé: number;
  nonConflictuel: number;
}

// Affichage : "Origine (12 appels - 8 non supervisés, 2 conflictuels, 2 non conflictuels)"
```

#### **Association Audio via AudioUploadModal**

```typescript
const handlePrepareCallClick = async (call: Call) => {
  setCallBeingPrepared(call);
  setIsAudioModalOpen(true);
};

const handleAudioUpload = async (audioFile: File) => {
  // 1. Upload vers Supabase Storage
  const filePath = await uploadAudio(audioFile);

  // 2. Génération URL signée
  const audioUrl = await generateSignedUrl(filePath);

  // 3. Mise à jour DB
  await supabase
    .from("call")
    .update({
      audiourl: audioUrl,
      filepath: filePath,
      upload: true,
    })
    .eq("callid", callBeingPrepared.callid);

  // 4. Préparation pour tagging
  await onPrepareCall({ call: callBeingPrepared, showMessage });
};
```

#### **Interface de Transcription Avancée**

```typescript
// Affichage chronologique avec alternance de fond
const renderTranscription = (transcription?: Transcription) => {
  return transcription.words.map((word, index) => (
    <Box
      key={index}
      sx={{
        backgroundColor: index % 2 === 0 ? "#232222" : "#4d4d4d",
        borderRadius: "4px",
      }}
    >
      <Typography variant="body2">
        <strong>{word.turn}</strong>: [{word.startTime.toFixed(2)} -{" "}
        {word.endTime.toFixed(2)}] {word.text}
      </Typography>
    </Box>
  ));
};
```

---

## Interface de Tagging

### 1. NewTaggingPage - Interface Moderne

**Localisation** : `/new-tagging/page.tsx`

**Évolutions par rapport à l'ancienne version :**

#### **Sélection par Dropdown**

```typescript
// Interface épurée avec sélection simple
const [selectedCallId, setSelectedCallId] = useState<string>("");
const [isLoading, setIsLoading] = useState(false);

// Chargement intelligent avec gestion d'erreurs
const handleCallSelection = async (callId: string) => {
  const call = taggingCalls.find((c) => c.callid === callId);
  if (!call) return;

  try {
    let audioUrl = call.audiourl;

    // Génération URL signée si nécessaire
    if (call.filepath && !audioUrl) {
      audioUrl = await generateSignedUrl(call.filepath);
    }

    // Sélection avec données enrichies
    selectTaggingCall({
      ...call,
      audiourl: audioUrl || "",
      is_tagging_call: true,
      preparedfortranscript: false,
    });

    // Chargement transcription
    await fetchTaggingTranscription(callId);
  } catch (error) {
    console.error("Erreur chargement appel:", error);
    // Fallback gracieux
    selectTaggingCall({
      ...call,
      audiourl: "",
      is_tagging_call: true,
      preparedfortranscript: false,
    });
  }
};
```

#### **Switch Interface**

```typescript
// Possibilité de retour à l'ancienne interface
<Button
  variant="outlined"
  onClick={() => router.push("/tagging")}
  startIcon={<SwapIcon />}
>
  Ancienne Interface
</Button>
```

### 2. TranscriptLPL - Composant Principal Enrichi

**Architecture modulaire confirmée :**

```typescript
interface TranscriptLPLProps {
  callId: string;
  audioSrc?: string | null;
}

// Composants intégrés
- TranscriptHeader : Affichage nom fichier
- TranscriptAudioPlayer : Lecteur avec synchronisation
- TranscriptControls : Taille police + toggle panneau
- TranscriptText : Transcription interactive avec tags
- TagSidePanel : Gestion tags (largeur fixe 350px)
```

#### **useTaggingLogic - Logique Métier Complète**

```typescript
export function useTaggingLogic(callId: string) {
  // États principaux
  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedWords, setSelectedWords] = useState<
    { startTime: number; endTime: number }[]
  >([]);
  const [tagMode, setTagMode] = useState<"create" | "edit">("create");
  const [selectedTaggedTurn, setSelectedTaggedTurn] =
    useState<TaggedTurn | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Logique de sauvegarde avec calcul next_turn_verbatim
  const handleSaveTag = useCallback(
    async (tag: LPLTag) => {
      const { label } = tag;
      const startTime = selectedWords[0]?.startTime;
      const endTime = selectedWords[0]?.endTime;

      // Identification du tour de parole actuel
      const currentTurn = taggingTranscription.find(
        (word) =>
          word.startTime >= startTime && word.endTime <= endTime && word.turn
      )?.turn;

      // Calcul du prochain tour de parole
      const firstNextTurnWord = taggingTranscription.find(
        (word) => word.turn !== currentTurn && word.startTime >= endTime
      );

      let nextTurnVerbatim = null;
      if (firstNextTurnWord) {
        const nextTurn = firstNextTurnWord.turn;
        const nextTurnWords = [];
        let foundNextTurn = false;

        for (const word of taggingTranscription) {
          if (
            !foundNextTurn &&
            word.turn !== currentTurn &&
            word.startTime >= endTime
          ) {
            foundNextTurn = true;
          }
          if (foundNextTurn && word.turn === nextTurn) {
            nextTurnWords.push(word);
          }
          if (foundNextTurn && word.turn !== nextTurn) {
            break;
          }
        }

        nextTurnVerbatim = nextTurnWords.map((word) => word.text).join(" ");
      }

      // Construction du nouveau tag
      const newTag = {
        call_id: callId,
        start_time: startTime,
        end_time: endTime,
        tag: label,
        verbatim: selectedText,
        next_turn_verbatim: nextTurnVerbatim || undefined,
        speaker: currentTurn,
      };

      await addTag(newTag);
    },
    [
      /* deps */
    ]
  );

  // Sélection de texte avec calcul timestamps
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const range = selection.getRangeAt(0);
    const startContainer = range.startContainer.parentElement;
    const endContainer = range.endContainer.parentElement;

    if (startContainer && endContainer) {
      const startWordIndex = parseInt(startContainer.dataset.index || "-1", 10);
      const endWordIndex = parseInt(endContainer.dataset.index || "-1", 10);

      if (
        !isNaN(startWordIndex) &&
        !isNaN(endWordIndex) &&
        startWordIndex >= 0 &&
        endWordIndex >= startWordIndex
      ) {
        const startTime = taggingTranscription[startWordIndex].startTime;
        const endTime = taggingTranscription[endWordIndex].endTime;

        setSelectedText(selectedText);
        setSelectedWords([{ startTime, endTime }]);
        setTagMode("create");
        setDrawerOpen(true);
      }
    }
  };

  return {
    selectedText,
    selectedWords,
    tagMode,
    selectedTaggedTurn,
    drawerOpen,
    handleRemoveTag,
    handleSaveTag,
    handleEditComplete,
    handleTagClick,
    onSelectTag,
    handleMouseUp,
    handleToggleDrawer,
    handleTabChange,
    // ... setters
  };
}
```

#### **useTranscriptAudio - Synchronisation Audio-Texte**

```typescript
export function useTranscriptAudio() {
  const { playerRef, updateCurrentWord, taggingTranscription, taggedTurns } =
    useTaggingData();
  const [fontSize, setFontSize] = useState<number>(12); // 12-30px
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);

  // Synchronisation temps réel
  const updateHighlight = useCallback(
    (currentTime: number) => {
      const index = taggingTranscription.findIndex(
        (word) => currentTime >= word.startTime && currentTime < word.endTime
      );

      if (index !== -1 && index !== currentWordIndex) {
        setCurrentWordIndex(index);
        updateCurrentWord({
          ...taggingTranscription[index],
          timestamp: taggingTranscription[index].endTime,
        });
      }
    },
    [taggingTranscription, currentWordIndex, updateCurrentWord]
  );

  // Styles dynamiques avec colorisation tags
  const getWordStyle = useCallback(
    (index: number) => {
      const tag = taggedTurns.find(
        (t) =>
          taggingTranscription[index].startTime >= t.start_time &&
          taggingTranscription[index].endTime <= t.end_time
      );

      const isActiveWord = index === currentWordIndex;

      return {
        fontWeight: isActiveWord ? "bold" : "normal",
        color: isActiveWord
          ? "white"
          : tag
          ? "#fdfbfb"
          : theme.palette.text.primary,
        backgroundColor: isActiveWord ? "#0c6f65" : "transparent",
        fontSize: `${fontSize}px`,
        lineHeight: "1.5",
        padding: "0 2px",
      };
    },
    [currentWordIndex, fontSize, taggedTurns, taggingTranscription]
  );

  // Groupement par tours de parole
  const groupedTurns = (() => {
    const groups: TranscriptWord[][] = [];
    let currentGroup: TranscriptWord[] = [];

    taggingTranscription.forEach((word, index) => {
      if (currentGroup.length === 0 || currentGroup[0].turn === word.turn) {
        currentGroup.push(word);
      } else {
        groups.push(currentGroup);
        currentGroup = [word];
      }

      if (index === taggingTranscription.length - 1) {
        groups.push(currentGroup);
      }
    });

    return groups;
  })();

  return {
    fontSize,
    setFontSize,
    currentWordIndex,
    formatTime,
    handleWordClick,
    updateHighlight,
    getWordStyle,
    groupedTurns,
  };
}
```

### 3. TagSidePanel - Panneau Latéral Optimisé

**Fonctionnalités enrichies :**

```typescript
interface TagSidePanelProps {
  drawerOpen: boolean;
  handleToggleDrawer: () => void;
  tagMode: "create" | "edit";
  selectedTaggedTurn: TaggedTurn | null;
  selectedText: string;
  onSelectTag: (tag: LPLTag) => void;
  onRemoveTag: () => void;
  callId: string;
  taggedTurns: TaggedTurn[];
  filename: string;
}

// Système d'onglets
const [tabValue, setTabValue] = useState(0);

// Onglet 1: Tags - Interface de sélection
// Onglet 2: Info - Métadonnées appel + aide
```

**Mode Création vs Édition :**

```typescript
// Mode "create" - Affichage texte sélectionné
{
  tagMode === "create" && selectedText && (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Texte sélectionné:
      </Typography>
      <Paper
        variant="outlined"
        sx={{ p: 1, mt: 0.5, backgroundColor: theme.palette.grey[800] }}
      >
        <Typography variant="body2">{selectedText}</Typography>
      </Paper>
    </Box>
  );
}

// Mode "edit" - Affichage tag existant + bouton suppression
{
  tagMode === "edit" && selectedTaggedTurn && (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Tag actuel: <strong>{selectedTaggedTurn.tag}</strong>
      </Typography>
      <Paper
        variant="outlined"
        sx={{ p: 1, mt: 0.5, backgroundColor: theme.palette.grey[800] }}
      >
        <Typography variant="body2">{selectedTaggedTurn.verbatim}</Typography>
      </Paper>
      <Button
        variant="outlined"
        color="error"
        fullWidth
        sx={{ mt: 2 }}
        onClick={onRemoveTag}
      >
        Supprimer ce tag
      </Button>
    </Box>
  );
}
```

### 4. TagSelector - Interface de Sélection Améliorée

**Organisation par familles métier :**

```typescript
interface GroupedTags {
  ENGAGEMENT: Tag[]; // Techniques d'engagement client
  REFLET: Tag[]; // Techniques de reflet/écoute
  EXPLICATION: Tag[]; // Explications techniques/produits
  OUVERTURE: Tag[]; // Techniques d'ouverture commerciale
  CLIENT: Tag[]; // Réactions/états du client
  OTHERS: Tag[]; // Divers/non catégorisés
}

// Layout responsive optimisé
// Ligne 1: ENGAGEMENT | REFLET (50/50)
// Ligne 2: EXPLICATION | OUVERTURE (50/50)
// Ligne 3: CLIENT (3 colonnes)
// Ligne 4: AUTRES (auto-fit, min 150px)
```

---

## Gestion des Types et Compatibilité TypeScript

### Stratégies de Résolution des Conflits

#### **1. Problème ZohoFile.originalId**

```typescript
// ❌ Problème : Conflit string vs string | undefined
interface ZohoFileAudioList {
  originalId: string; // Requis dans AudioList
}

interface ZohoFileExplorer {
  originalId?: string; // Optionnel dans SimpleWorkdriveExplorer
}

// ✅ Solution : Interface unifiée
interface ZohoFile {
  id: string;
  originalId?: string; // Toujours optionnel
  name: string;
  attributes?: {
    name?: string;
    extn?: string;
    mime_type?: string;
    is_folder?: boolean;
  };
}

// Validation dans les fonctions
const handleFileSelect = (file: ZohoFile, type: string): void => {
  const fileId = file.originalId;
  if (!fileId) {
    throw new Error("ID de fichier manquant");
  }
  // ... traitement
};
```

#### **2. Problème Material-UI Grid**

```typescript
// ❌ Problème : Grid vs Grid2 incompatibilité
import { Grid } from "@mui/material"; // Ancien Grid avec prop "item"

// ✅ Solution 1 : Utiliser Grid2
import Grid2 as Grid from "@mui/material/Unstable_Grid2";
<Grid xs={12} sm={6} md={4}>...</Grid>

// ✅ Solution 2 : Remplacer par Box + Flexbox
<Box sx={{
  display: 'flex',
  flexWrap: 'wrap',
  gap: 2,
  '& > *': {
    flex: '1 1 300px',
    minWidth: '300px',
    maxWidth: '400px'
  }
}}>
  {items.map(item => <Card key={item.id}>...</Card>)}
</Box>
```

#### **3. Problème null vs undefined**

```typescript
// ❌ Problème : Incohérence null/undefined
interface NewTag {
  next_turn_verbatim: string | undefined; // Interface attend undefined
}

const newTag = {
  next_turn_verbatim: nextTurnVerbatim || null, // Code fournit null
};

// ✅ Solution : Conversion explicite
const newTag = {
  next_turn_verbatim: nextTurnVerbatim || undefined, // Utiliser undefined
};
```

#### **4. Callbacks Async vs Sync**

```typescript
// ❌ Problème : Callback attend void, fonction retourne Promise<void>
interface AudioListProps {
  onFileSelect: (file: ZohoFile, type: string) => void; // Sync
}

const handleFileSelect = async (
  file: ZohoFile,
  type: string
): Promise<void> => {
  // Logique async
};

// ✅ Solution : Wrapper sync avec async interne
const handleFileSelect = (file: ZohoFile, type: string): void => {
  const processFile = async () => {
    try {
      // Logique async ici
      const response = await fetch(/* ... */);
      // ...
    } catch (error) {
      showMessage(`Erreur: ${error.message}`);
    }
  };

  processFile(); // Exécution non-bloquante
};
```

#### **5. Wrappers pour Types Incompatibles**

```typescript
// ❌ Problème : Types ComplexA incompatible avec ComplexB
onPrepareCall={prepareCallForTagging} // Type mismatch

// ✅ Solution : Wrapper avec cast contrôlé
onPrepareCall={(params) => {
  try {
    return prepareCallForTagging(params as any);
  } catch (error) {
    console.error("Erreur préparation appel:", error);
    showMessage("Erreur lors de la préparation");
    return Promise.resolve();
  }
}}
```

---

## Système de Sécurité et URLs Signées

### Génération d'URLs Temporaires Sécurisées

**Localisation** : `@/components/utils/signedUrls`

```typescript
/**
 * Génère une URL signée temporaire pour un fichier audio
 * @param filePath Chemin du fichier dans le bucket Supabase
 * @param expiration Durée de validité en secondes (défaut: 20 minutes)
 * @returns URL signée temporaire
 */
export async function generateSignedUrl(
  filePath: string,
  expiration: number = 1200
): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from("Calls") // Bucket Supabase dédié
      .createSignedUrl(filePath, expiration);

    if (error) {
      console.error("Erreur génération URL signée:", error);
      throw new Error(`Impossible de générer l'URL signée: ${error.message}`);
    }

    if (!data?.signedUrl) {
      throw new Error("URL signée non générée");
    }

    console.log(
      `URL signée générée (expire dans ${expiration}s):`,
      data.signedUrl
    );
    return data.signedUrl;
  } catch (error) {
    console.error("Erreur inattendue génération URL:", error);
    throw error;
  }
}
```

**Avantages sécurité :**

- **Accès temporaire** : URLs expirent automatiquement (20 minutes par défaut)
- **Pas d'exposition directe** : Fichiers bucket protégés par RLS
- **Authentification requise** : Génération nécessite session Supabase valide
- **Audit automatique** : Logs Supabase pour traçabilité accès

**Utilisation dans l'application :**

```typescript
// Dans NewTaggingPage - Chargement sécurisé
const handleCallSelection = async (callId: string) => {
  const call = taggingCalls.find((c) => c.callid === callId);

  if (call?.filepath && !call.audiourl) {
    // Génération URL signée à la demande
    const secureAudioUrl = await generateSignedUrl(call.filepath);

    selectTaggingCall({
      ...call,
      audiourl: secureAudioUrl, // URL temporaire sécurisée
    });
  }
};

// Dans CallListUnprepared - Association audio
const handleAudioUpload = async (audioFile: File) => {
  // 1. Upload sécurisé vers Supabase Storage
  const filePath = await uploadAudio(audioFile);

  // 2. Génération URL signée immédiate
  const secureAudioUrl = await generateSignedUrl(filePath);

  // 3. Stockage metadata + URL temporaire
  await supabase
    .from("call")
    .update({
      audiourl: secureAudioUrl, // URL temporaire
      filepath: filePath, // Chemin permanent pour régénération
      upload: true,
    })
    .eq("callid", callBeingPrepared.callid);
};
```

---

## Optimisations Performance et Bonnes Pratiques

### Patterns de Performance Appliqués

#### **1. Composants Mémorisés**

```typescript
// TagSelector avec React.memo pour éviter re-renders
export const TagSelector = React.memo<TagSelectorProps>(
  ({ onSelectTag, tooltipState, onRemoveTag }) => {
    // Composant lourd avec grilles de tags
    return <Box>{/* Interface de sélection complexe */}</Box>;
  }
);

// Comparaison personnalisée si nécessaire
export const TagSelector = React.memo(
  TagSelectorComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.tooltipState?.mode === nextProps.tooltipState?.mode &&
      prevProps.tooltipState?.tag?.id === nextProps.tooltipState?.tag?.id
    );
  }
);
```

#### **2. Hooks Optimisés**

```typescript
// useTaggingLogic avec useCallback pour stabilité
export function useTaggingLogic(callId: string) {
  const handleSaveTag = useCallback(
    async (tag: LPLTag) => {
      // Logique de sauvegarde...
    },
    [addTag, callId, selectedWords, selectedText, taggingTranscription]
  );

  const onSelectTag = useCallback(
    (tag: LPLTag) => {
      if (tagMode === "create") {
        handleSaveTag(tag);
      } else if (tagMode === "edit") {
        handleEditComplete(tag);
      }
    },
    [tagMode, handleSaveTag, handleEditComplete]
  );

  // Stabilité des références pour éviter re-renders enfants
  return useMemo(
    () => ({
      selectedText,
      selectedWords,
      tagMode,
      selectedTaggedTurn,
      drawerOpen,
      tabValue,
      handleRemoveTag,
      handleSaveTag,
      handleEditComplete,
      handleTagClick,
      onSelectTag,
      handleMouseUp,
      handleToggleDrawer,
      handleTabChange,
    }),
    [
      /* deps calculées */
    ]
  );
}
```

#### **3. Lazy Loading et Code Splitting**

```typescript
// TaggerLPL avec chargement différé
import dynamic from "next/dynamic";

const TaggerLPL = dynamic(() => import("@/components/TaggerLPL"), {
  loading: () => (
    <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>
        Chargement de l'interface de tagging...
      </Typography>
    </Box>
  ),
  ssr: false, // Composant lourd, pas de SSR
});

// SimpleWorkdriveExplorer avec lazy loading conditionnel
const SimpleWorkdriveExplorer = dynamic(
  () => import("@/components/SimpleWorkdriveExplorer"),
  {
    loading: () => <LinearProgress />,
    ssr: false,
  }
);
```

#### **4. Optimisation des Requêtes Supabase**

```typescript
// TaggingDataProvider avec requêtes optimisées
const fetchTaggedTurns = useCallback(
  async (callId: string): Promise<void> => {
    // Single query avec jointure pour éviter N+1
    const { data: enrichedTurns, error } = await supabase
      .from("turntagged")
      .select(
        `
      *,
      lpltag!inner(label, color)
    `
      )
      .eq("call_id", callId);

    if (error) {
      console.error("Erreur fetch tags:", error);
      return;
    }

    // Transformation directe sans requête séparée
    const processedTurns =
      enrichedTurns?.map((turn) => ({
        ...turn,
        color: turn.lpltag.color,
        tag: turn.lpltag.label,
      })) || [];

    setTaggedTurns(processedTurns);
  },
  [supabase]
);

// Cache des tags pour éviter re-fetch
const [tagsCache, setTagsCache] = useState<Map<string, Tag>>(new Map());

const fetchTagsWithCache = useCallback(async () => {
  if (tagsCache.size > 0) {
    return Array.from(tagsCache.values());
  }

  const { data, error } = await supabase.from("lpltag").select("*");
  if (!error && data) {
    const newCache = new Map(data.map((tag) => [tag.label, tag]));
    setTagsCache(newCache);
    return data;
  }
  return [];
}, [tagsCache, supabase]);
```

### Gestion d'Erreurs Centralisée

#### **Error Boundaries Personnalisés**

```typescript
// ErrorBoundary pour composants critiques
class TaggingErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Erreur composant tagging:", error, errorInfo);

    // Log vers service externe (Sentry, LogRocket, etc.)
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "exception", {
        description: error.toString(),
        fatal: false,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          <AlertTitle>Erreur de l'interface de tagging</AlertTitle>
          Une erreur inattendue s'est produite.
          <Button onClick={() => window.location.reload()} sx={{ ml: 2 }}>
            Recharger la page
          </Button>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Utilisation dans les composants critiques
export default function TaggingPage() {
  return (
    <TaggingErrorBoundary>
      <TranscriptLPL callId={selectedCall.callid} />
    </TaggingErrorBoundary>
  );
}
```

#### **Patterns de Gestion d'Erreurs Async**

```typescript
// Hook personnalisé pour gestion d'erreurs cohérente
function useAsyncError() {
  const [error, setError] = useState<string | null>(null);

  const executeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    errorMessage: string = "Une erreur s'est produite"
  ): Promise<T | null> => {
    try {
      setError(null);
      return await asyncFn();
    } catch (err) {
      const message = err instanceof Error ? err.message : errorMessage;
      setError(message);
      console.error(errorMessage, err);
      return null;
    }
  }, []);

  return { error, setError, executeAsync };
}

// Utilisation dans les composants
function SimpleWorkdriveExplorer() {
  const { error, setError, executeAsync } = useAsyncError();

  const handleImportFiles = async () => {
    const result = await executeAsync(async () => {
      const audioFile = await downloadFile(selectedAudioFile, accessToken);
      let transcriptionText = "";

      if (selectedTranscriptionFile) {
        transcriptionText = await downloadTranscription(selectedTranscriptionFile, accessToken);
      }

      onFilesSelect(audioFile, transcriptionText);
      return { success: true };
    }, "Erreur lors de l'importation des fichiers");

    if (result?.success) {
      setSuccessMessage("Fichiers importés avec succès");
    }
  };

  return (
    <>
      {/* Interface normale */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </>
  );
}
```

---

## Architecture des Interfaces - Ancien vs Nouveau

### Comparaison des Versions

#### **Interface Ancienne (/tagging)**

```typescript
// TaggerLPL - Interface complète avec drawer latéral
export default function TaggerLPL() {
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Contenu principal */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {selectedTaggingCall ? (
          <TranscriptLPL
            callId={selectedTaggingCall.callid}
            audioSrc={selectedTaggingCall.audiourl}
          />
        ) : (
          <CallSelector />
        )}
      </Box>

      {/* Drawer latéral 35% largeur */}
      <Drawer
        variant="permanent"
        sx={{
          width: '35%',
          '& .MuiDrawer-paper': {
            width: '35%',
            position: 'relative'
          }
        }}
      >
        <CallUploaderTaggerLPL />
      </Drawer>
    </Box>
  );
}

// Fonctionnalités intégrées
- Chargement d'appels via accordéons multiples
- Interface de gestion administrative des tags
- Import Zoho WorkDrive (ancien + nouveau)
- Préparation manuelle d'appels transcrits
- Vue d'ensemble avec statistiques
```

#### **Interface Nouvelle (/new-tagging)**

```typescript
// NewTaggingPage - Interface épurée focus tagging
export default function NewTaggingPage() {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Sélection par dropdown simple */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Sélection d'un appel pour tagging
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Choisir un appel</InputLabel>
          <Select
            value={selectedCallId}
            onChange={(e) => handleCallSelection(e.target.value)}
            disabled={isLoading}
          >
            {taggingCalls.map(call => (
              <MenuItem key={call.callid} value={call.callid}>
                {call.filename || call.description || `Appel ${call.callid.substring(0, 8)}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Switch vers ancienne interface */}
        <Button
          variant="outlined"
          onClick={() => router.push('/tagging')}
          startIcon={<SettingsIcon />}
        >
          Interface Complète (Gestion + Import)
        </Button>
      </Paper>

      {/* Interface de tagging pure */}
      {selectedTaggingCall && (
        <TranscriptLPL
          callId={selectedTaggingCall.callid}
          audioSrc={selectedTaggingCall.audiourl}
        />
      )}
    </Container>
  );
}

// Avantages nouvelle interface
- Focus pur sur le tagging (pas de distractions)
- Chargement plus rapide (moins de composants)
- UX simplifiée pour utilisateurs finaux
- Responsive mobile-friendly
```

### Stratégie de Migration

```typescript
// Choix d'interface selon profil utilisateur
function getDefaultInterface(userRole: string): string {
  switch (userRole) {
    case "admin":
    case "coach":
      return "/tagging"; // Interface complète
    case "conseiller":
    case "user":
      return "/new-tagging"; // Interface épurée
    default:
      return "/new-tagging";
  }
}

// Redirection intelligente depuis page d'accueil
export default function Home() {
  const { user } = useSupabase();
  const defaultRoute = getDefaultInterface(user?.role || "user");

  redirect(defaultRoute);
  return null;
}
```

---

## Workflow Complet et États

### Pipeline Principal : Fichier → Tagging → Coaching

```
1. IMPORT FICHIER
   ├── Zoho WorkDrive (SimpleWorkdriveExplorer)
   │   ├── Authentification OAuth
   │   ├── Navigation + Sélection
   │   └── Téléchargement sécurisé
   └── Upload Manuel (CallUploaderTaggerLPL)
       ├── Fichier local
       └── Transcription manuelle

2. PRÉPARATION APPEL
   ├── CallListUnprepared
   │   ├── Filtrage par statut + mot-clé
   │   ├── Association audio
   │   └── Validation preparedfortranscript: true
   └── Génération URL signée

3. INTERFACE TAGGING
   ├── Ancienne (/tagging)
   │   ├── TaggerLPL avec drawer 35%
   │   └── Gestion administrative complète
   └── Nouvelle (/new-tagging)
       ├── NewTaggingPage épurée
       └── Focus pur tagging

4. TRANSCRIPTION + TAGGING
   ├── TranscriptLPL
   │   ├── Synchronisation audio-texte
   │   ├── Sélection segments (mouseup)
   │   ├── Application tags via TagSidePanel
   │   └── Calcul automatique next_turn_verbatim
   └── TagSelector
       ├── Organisation par familles métier
       ├── Colorisation automatique
       └── Mode create/edit

5. PERSISTANCE + AUDIT
   ├── Supabase avec RLS
   │   ├── turntagged (segments taggés)
   │   ├── lpltag (définitions tags)
   │   └── call (métadonnées appels)
   └── URLs signées temporaires (20min)
```

### États de Progression des Appels

```typescript
// call.status
type CallStatus =
  | "non_supervisé"     // État initial
  | "conflictuel"       // Appel problématique identifié
  | "non_conflictuel"   // Appel normal validé
  | "en_cours"          // En cours d'évaluation
  | "évalué"            // Tagging terminé
  | "coaching_planifié" // Plan d'entraînement créé
  | "terminé";          // Workflow complet

// call.preparedfortranscript
false → true  // Via CallListUnprepared

// call.is_tagging_call
false → true  // Via préparation tagging

// call.upload
false → true  // Via association fichier audio
```

---

## Base de Données et Relations

### Tables Principales Utilisées

#### **Table `call` - Hub Central**

```sql
-- Colonnes critiques pour TaggerLPL
callid UUID PRIMARY KEY,
filename TEXT,
description TEXT,
status VARCHAR(20) DEFAULT 'non_supervisé',
transcription JSONB,           -- Structure complète avec timestamps
audiourl TEXT,                 -- URL signée temporaire
filepath TEXT,                 -- Chemin permanent Supabase Storage
upload BOOLEAN DEFAULT false, -- Fichier audio associé
is_tagging_call BOOLEAN DEFAULT false,
preparedfortranscript BOOLEAN DEFAULT false,
duree NUMERIC,                -- Calculée par trigger automatique
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
```

#### **Table `transcript` - Liaison Appel→Transcription**

```sql
transcriptid UUID PRIMARY KEY,
callid UUID REFERENCES call(callid) ON DELETE CASCADE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
```

#### **Table `word` - Granularité Mot-par-Mot**

```sql
wordid BIGSERIAL PRIMARY KEY,
transcriptid UUID REFERENCES transcript(transcriptid) ON DELETE CASCADE,
word TEXT NOT NULL,           -- Texte du mot
text TEXT,                    -- Alias pour compatibilité
startTime NUMERIC NOT NULL,   -- Début en secondes
endTime NUMERIC NOT NULL,     -- Fin en secondes
speaker TEXT,                 -- Interlocuteur
turn TEXT,                    -- Tour de parole
index INTEGER                 -- Position dans transcription
```

#### **Table `turntagged` - Segments Taggés**

```sql
id BIGSERIAL PRIMARY KEY,
call_id UUID REFERENCES call(callid) ON DELETE CASCADE,
start_time NUMERIC NOT NULL,
end_time NUMERIC NOT NULL,
tag TEXT REFERENCES lpltag(label) ON UPDATE CASCADE,
verbatim TEXT NOT NULL,       -- Texte sélectionné exact
next_turn_verbatim TEXT,      -- Contexte tour suivant
speaker TEXT,                 -- Tour de parole associé
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
```

#### **Table `lpltag` - Définitions Tags**

```sql
id SERIAL PRIMARY KEY,
label TEXT NOT NULL UNIQUE,   -- Clé métier
family TEXT,                  -- ENGAGEMENT, REFLET, etc.
color TEXT NOT NULL,          -- Couleur interface
description TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
```

### Relations Cross-Schémas Critiques

```sql
-- Analyse IA des segments taggés (schéma linguistic)
linguistic.verbatims_metadata.turn_id → public.turntagged.id (CASCADE DELETE)
linguistic.verbatims_models_results.turn_id → public.turntagged.id (CASCADE DELETE)

-- Évaluations collaboratives (schéma whiteboard)
whiteboard.participant_evaluations.call_id → public.call.callid (NO ACTION)
whiteboard.participant_evaluations.word_start_id → public.word.wordid (NO ACTION)

-- Audit sessions utilisateurs (schéma auth)
public.user_sessions_backup.user_id → auth.users.id (NO ACTION)
```

---

## Monitoring et Observabilité

### Logs et Debug

#### **Logs Structurés par Composant**

```typescript
// Pattern de logging cohérent
const logger = {
  component: "SimpleWorkdriveExplorer",

  info: (message: string, data?: any) => {
    console.log(`[${logger.component}] 📄 ${message}`, data);
  },

  success: (message: string, data?: any) => {
    console.log(`[${logger.component}] ✅ ${message}`, data);
  },

  error: (message: string, error?: any) => {
    console.error(`[${logger.component}] ❌ ${message}`, error);
  },

  performance: (operation: string, startTime: number) => {
    const duration = performance.now() - startTime;
    console.log(
      `[${logger.component}] ⚡ ${operation}: ${duration.toFixed(2)}ms`
    );
  },
};

// Utilisation dans les composants
const handleImportFiles = async () => {
  const startTime = performance.now();
  logger.info("Début importation fichiers", {
    selectedAudioFile,
    selectedTranscriptionFile,
  });

  try {
    const audioFile = await downloadFile(selectedAudioFile, accessToken);
    logger.success("Fichier audio téléchargé", {
      name: audioFile.name,
      size: audioFile.size,
    });

    onFilesSelect(audioFile, transcriptionText);
    logger.performance("Import complet", startTime);
  } catch (error) {
    logger.error("Erreur importation", error);
  }
};
```

#### **Métriques Performance Temps Réel**

```typescript
// Hook de monitoring performance
function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = useState({
    renders: 0,
    lastRenderTime: 0,
    avgRenderTime: 0,
  });

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;
      setMetrics((prev) => ({
        renders: prev.renders + 1,
        lastRenderTime: renderTime,
        avgRenderTime:
          (prev.avgRenderTime * prev.renders + renderTime) / (prev.renders + 1),
      }));

      if (renderTime > 16.67) {
        // > 60fps
        console.warn(
          `[${componentName}] 🐌 Render lent: ${renderTime.toFixed(2)}ms`
        );
      }
    };
  });

  return metrics;
}

// Utilisation dans TranscriptLPL
export default function TranscriptLPL({
  callId,
  audioSrc,
}: TranscriptLPLProps) {
  const metrics = usePerformanceMonitor("TranscriptLPL");

  // Affichage conditionnel des métriques en dev
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[TranscriptLPL] 📊 Renders: ${
          metrics.renders
        }, Avg: ${metrics.avgRenderTime.toFixed(2)}ms`
      );
    }
  }, [metrics]);

  // ... reste du composant
}
```

---

## Sécurité et Conformité

### Row Level Security (RLS) Supabase

```sql
-- Politique RLS sur table call
CREATE POLICY "Users can only access their company calls" ON call
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_app_meta_data->>'company_id' = call.company_id
  )
);

-- Politique RLS sur turntagged
CREATE POLICY "Users can only tag their company calls" ON turntagged
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM call
    WHERE call.callid = turntagged.call_id
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'company_id' = call.company_id
    )
  )
);
```

### Chiffrement Données Sensibles

```typescript
// Utilisation pgsodium pour données sensibles
const encryptSensitiveData = async (data: string): Promise<string> => {
  const { data: encrypted, error } = await supabase.rpc("encrypt_data", {
    data_to_encrypt: data,
  });

  if (error) throw error;
  return encrypted;
};

// Stockage transcription chiffrée
const saveTranscription = async (callId: string, transcription: any) => {
  const transcriptionText = JSON.stringify(transcription);
  const encryptedTranscription = await encryptSensitiveData(transcriptionText);

  await supabase
    .from("call")
    .update({
      transcription_encrypted: encryptedTranscription,
    })
    .eq("callid", callId);
};
```

### Audit Trail Complet

```typescript
// Fonction d'audit pour actions critiques
const auditAction = async (
  action: string,
  entityType: "call" | "tag" | "transcription",
  entityId: string,
  details?: any
) => {
  await supabase.from("audit_log").insert({
    user_id: (await supabase.auth.getUser()).data.user?.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: details || {},
    ip_address: await fetch("https://api.ipify.org").then((r) => r.text()),
    user_agent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  });
};

// Utilisation dans useTaggingLogic
const handleSaveTag = useCallback(
  async (tag: LPLTag) => {
    // ... logique de sauvegarde

    // Audit trail
    await auditAction("tag_created", "tag", newTag.id, {
      tag_label: tag.label,
      call_id: callId,
      verbatim_length: selectedText.length,
      start_time: startTime,
      end_time: endTime,
    });
  },
  [
    /* deps */
  ]
);
```

---

## Troubleshooting et FAQ

### Problèmes Fréquents et Solutions

#### **1. "Supabase client not available yet"**

```typescript
// ❌ Problème : Hook appelé avant initialisation Supabase
useEffect(() => {
  fetchData(); // supabase peut être null
}, []);

// ✅ Solution : Vérification défensive
useEffect(() => {
  if (!supabase) {
    console.warn("Supabase client not available yet");
    return;
  }
  fetchData();
}, [supabase]);
```

#### **2. "Cannot read property 'current' of null"**

```typescript
// ❌ Problème : playerRef utilisé avant montage
const playAudio = () => {
  playerRef.current.play(); // Erreur si ref null
};

// ✅ Solution : Vérification defensive
const playAudio = () => {
  if (playerRef.current) {
    playerRef.current.play();
  } else {
    console.warn("Audio player not ready");
  }
};
```

#### **3. "Network request failed" lors téléchargement Zoho**

```typescript
// ❌ Problème : CORS ou token expiré
const response = await fetch(directZohoUrl);

// ✅ Solution : Proxy Netlify + gestion expiration
const downloadFile = async (file: ZohoFile, token: string) => {
  try {
    const proxyUrl = `/api/zoho/download?fileId=${file.id}`;
    const response = await fetch(proxyUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      // Token expiré, demander re-authentification
      handleZohoAuth();
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Erreur téléchargement:", error);
    throw new Error(
      "Impossible de télécharger le fichier. Vérifiez votre connexion."
    );
  }
};
```

#### **4. Performance dégradée avec grandes transcriptions**

```typescript
// ❌ Problème : Re-calcul groupedTurns à chaque render
const groupedTurns = taggingTranscription.reduce(/* calcul lourd */);

// ✅ Solution : Mémoisation avec useMemo
const groupedTurns = useMemo(() => {
  if (!taggingTranscription.length) return [];

  // Calcul groupement par turns une seule fois
  const groups: TranscriptWord[][] = [];
  let currentGroup: TranscriptWord[] = [];

  taggingTranscription.forEach((word, index) => {
    if (currentGroup.length === 0 || currentGroup[0].turn === word.turn) {
      currentGroup.push(word);
    } else {
      groups.push(currentGroup);
      currentGroup = [word];
    }

    if (index === taggingTranscription.length - 1) {
      groups.push(currentGroup);
    }
  });

  return groups;
}, [taggingTranscription]); // Recalcul uniquement si transcription change
```

#### **5. URLs signées expirées**

```typescript
// ❌ Problème : URL signée expirée après 20 minutes
audioElement.src = expiredSignedUrl; // Erreur 403

// ✅ Solution : Régénération automatique
const playAudioAtTimestamp = async (timestamp: number) => {
  if (!playerRef.current) return;

  try {
    playerRef.current.currentTime = timestamp;
    await playerRef.current.play();
  } catch (error) {
    if (error.name === "NotAllowedError" || error.message.includes("403")) {
      console.log("URL expirée, régénération...");

      // Régénération URL signée
      if (selectedTaggingCall?.filepath) {
        const newSignedUrl = await generateSignedUrl(
          selectedTaggingCall.filepath
        );
        setAudioSrc(newSignedUrl);

        // Retry avec nouvelle URL
        setTimeout(() => {
          if (playerRef.current) {
            playerRef.current.currentTime = timestamp;
            playerRef.current.play();
          }
        }, 500);
      }
    }
  }
};
```

---

## Roadmap et Évolutions Futures

### Améliorations Prévues

#### **1. Interface Mobile-First**

- Adaptation complète pour tablettes/smartphones
- Gestures tactiles pour navigation audio
- Mode hors-ligne avec synchronisation différée

#### **2. IA et Machine Learning**

- Auto-suggestion tags basée sur contenu transcription
- Détection automatique passages critiques
- Scoring qualité temps réel pendant écoute

#### **3. Collaboration Temps Réel**

- Co-tagging simultané multiple utilisateurs
- Commentaires et annotations partagées
- Sessions de formation collaboratives

#### **4. Analytics Avancées**

- Dashboard KPIs tagging par équipe
- Heatmaps de qualité par critères
- Tendances évolution qualité temporelle

### Architecture Technique Future

#### **Microservices Candidats**

```
Service Core: TaggingDataProvider + TranscriptLPL
Service Files: SimpleWorkdriveExplorer + Storage
Service Analytics: TagStats + Reporting
Service AI: Auto-tagging + Suggestions
Service Collab: Real-time + Comments
```

#### **Technologies Envisagées**

- **Redis** : Cache temps réel + sessions collaboratives
- **WebSockets** : Synchronisation multi-utilisateurs
- **PWA** : Installation + mode hors-ligne
- **WebAssembly** : Traitement audio côté client
- **GraphQL** : API unifiée cross-services

---

## Conclusion

Cette documentation mise à jour reflète l'état actuel de TaggerLPL avec ses **évolutions majeures** :

### **Nouveautés Intégrées** ✅

- **SimpleWorkdriveExplorer** : Système complet d'exploration Zoho
- **CallListUnprepared** : Interface de préparation d'appels avancée
- **Dual Interface** : Version épurée (/new-tagging) + complète (/tagging)
- **URLs Signées** : Sécurisation fichiers avec expiration automatique
- **Gestion d'erreurs** : Patterns TypeScript robustes et recovery automatique

### **Améliorations Techniques** 🚀

- **Performance optimisée** : Mémoisation, lazy loading, requêtes intelligentes
- **Types renforcés** : Compatibilité Material-UI, gestion null/undefined
- **Sécurité enterprise** : RLS, chiffrement, audit trail complet
- **Monitoring intégré** : Logs structurés, métriques temps réel

### **Architecture Mature** 🏗️

- **Modulaire** : Composants réutilisables et testables
- **Scalable** : Préparé pour microservices et collaboration temps réel
- **Maintenable** : Documentation complète avec troubleshooting
- **Évolutif** : Roadmap claire vers IA et analytics avancées

  **TaggerLPL est désormais une plateforme d'évaluation qualité de nouvelle génération** , combinant simplicité d'usage pour les utilisateurs finaux et sophistication technique pour les administrateurs. Cette documentation constitue la référence complète pour le développement, la maintenance et l'évolution de la solution.

---

## Annexes

### A. Commandes de Développement

```bash
# Installation et démarrage
npm install
npm run dev

# Build et déploiement
npm run build
npm run start

# Tests et qualité code
npm run test
npm run lint
npm run type-check

# Base de données
npx supabase start
npx supabase db reset
npx supabase gen types typescript --project-id [PROJECT_ID] > src/types/supabase.ts
```

### B. Variables d'Environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]

# Zoho WorkDrive
ZOHO_CLIENT_ID=[CLIENT_ID]
ZOHO_CLIENT_SECRET=[CLIENT_SECRET]
ZOHO_REDIRECT_URI=http://localhost:3000/api/zoho/callback

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### C. Structure des Dossiers

```
src/
├── app/                          # App Router Pages
│   ├── page.tsx                 # Page d'accueil (redirect)
│   ├── layout.tsx               # Layout global avec providers
│   ├── tagging/                 # Interface complète
│   │   ├── page.tsx            # ProtectedRoute + TaggerLPL
│   │   └── layout.tsx          # Wrapper simple
│   └── new-tagging/            # Interface épurée
│       └── page.tsx            # NewTaggingPage moderne
├── components/
│   ├── layout/
│   │   └── GlobalNavbar.tsx    # Navigation intelligente
│   ├── TranscriptLPL/          # Composants de transcription
│   │   ├── index.tsx           # Composant principal
│   │   ├── components/         # Sous-composants modulaires
│   │   ├── hooks/              # useTaggingLogic, useTranscriptAudio
│   │   └── types.ts           # Interfaces spécifiques
│   ├── SimpleWorkdriveExplorer/ # Exploration Zoho WorkDrive
│   │   ├── index.tsx           # Composant principal
│   │   ├── components/         # Sous-composants
│   │   ├── hooks/              # useWorkdriveFiles
│   │   ├── utils/              # Helpers auth + files
│   │   └── types.ts           # Interfaces Zoho
│   ├── calls/
│   │   ├── CallList.tsx        # Liste appels préparés
│   │   └── CallListUnprepared.tsx # Préparation appels
│   ├── TagSelector.tsx         # Interface sélection tags
│   ├── TagStats.tsx           # Statistiques et analytics
│   └── CallUploaderTaggerLPL.tsx # Upload et gestion complète
├── context/
│   ├── TaggingDataContext.tsx  # Hub central données
│   ├── SupabaseContext.tsx    # Session et client DB
│   ├── ZohoContext.tsx        # Tokens OAuth Zoho
│   └── ThemeModeProvider.tsx  # Gestion thèmes UI
├── lib/
│   ├── supabaseClient.ts      # Configuration Supabase
│   └── utils/                 # Utilitaires globaux
├── types/
│   ├── index.ts               # Types communs
│   ├── supabase.ts           # Types générés Supabase
│   └── zoho.ts               # Types spécifiques Zoho
└── styles/
    └── globals.css           # Styles globaux + Tailwind
```

### D. Ressources Externes

#### **Documentation Technique**

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase JavaScript SDK](https://supabase.com/docs/reference/javascript)
- [Material-UI Components](https://mui.com/material-ui/getting-started/)
- [Zoho WorkDrive API](https://www.zoho.com/workdrive/help/api/)

#### **Outils de Développement**

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Zoho Developer Console](https://api-console.zoho.com/)
- [Vercel Dashboard](https://vercel.com/dashboard) (déploiement)
- [GitHub Repository](https://github.com/%5BUSERNAME%5D/taggerlpl-nextjs)

#### **Support et Communauté**

- Documentation officielle TaggerLPL
- Canal Slack équipe développement
- Issues GitHub pour bugs et features
- Wiki interne pour procédures métier

---

**Fin de la Documentation TaggerLPL v2.0**

_Dernière mise à jour : Juin 2025_

_Auteur : Équipe Développement TaggerLPL_

_Version : 2.0.0_
