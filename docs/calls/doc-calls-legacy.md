# Module Calls - Documentation Technique Complète

## Vue d'ensemble

Le module `calls` constitue le **cœur du système de gestion des appels** dans l'application TaggerLPL. Il orchestre trois workflows principaux :

1. **📥 Import d'appels** depuis Zoho WorkDrive ou stockage local
2. **🔧 Préparation des appels** pour le tagging avec association audio/transcription
3. **🏷️ Gestion avancée** des appels préparés avec actions en lot et optimisations

## Architecture générale

### Fichiers de base

```
src/app/(protected)/calls/page.tsx     # Page principale avec 3 onglets
src/app/(protected)/layout.tsx         # Layout protégé avec sidebar rétractable
```

### Écosystème de composants

```
src/components/calls/
├── CallTableList/                     # Interface avancée de gestion
│   ├── CallTableList.tsx             # Composant principal optimisé
│   ├── CallTableFilters.tsx          # Filtres de recherche
│   ├── CallTableRow.tsx              # Ligne de tableau avec édition inline
│   ├── MobileCallCard.tsx            # Vue mobile responsive
│   ├── BulkActionsToolbar.tsx        # Actions en lot
│   ├── hooks/
│   │   ├── useOptimizedCallData.tsx  # Cache intelligent 30s
│   │   └── useBulkActions.tsx        # Gestion des sélections multiples
│   ├── types.ts                      # Types TypeScript complets
│   ├── utils.ts                      # Utilitaires de tri/filtrage
│   └── index.ts                      # Exports propres
├── CallPreparation.tsx               # Workflow de préparation
├── CallImporter.tsx                  # Import legacy (compatibility)
├── ComplementActionButtons.tsx       # Boutons d'ajout de contenu
├── DuplicateDialog.tsx              # Interface gestion des doublons
├── TranscriptionUploadModal.tsx     # Modal upload transcriptions
└── AudioUploadModal.tsx             # Modal upload audio (nouveau)
```

### Utilitaires spécialisés

```
src/components/utils/
├── callApiUtils.tsx                  # Cœur logique d'import/validation
├── duplicateManager.ts               # Détection intelligente de doublons
├── removeCallUpload.tsx              # Suppression sécurisée
├── updateCallOrigine.tsx             # Mise à jour d'origine
├── signedUrls.tsx                    # URLs signées Supabase
├── transcriptionProcessor.tsx        # Traitement des recouvrements
└── validateTranscriptionJSON.ts      # Validation stricte JSON
```

### Intégration WorkDrive

```
src/components/SimpleWorkdriveExplorer/
├── index.tsx                         # Composant principal avec modes
├── types.tsx                         # Types ZohoFile et modes
├── components/
│   ├── AuthPrompt.tsx               # Authentification Zoho
│   ├── FileList.tsx                 # Liste avec détection doublons
│   ├── FileSelectionSummary.tsx     # Résumé sélections
│   ├── NavigationControls.tsx       # Navigation dossiers
│   ├── SearchBar.tsx                # Recherche avec debounce
│   ├── SearchResults.tsx            # Résultats de recherche
│   ├── SearchDebug.tsx              # Debug temporaire
│   └── Notifications.tsx            # Snackbars
├── hooks/
│   ├── useWorkdriveFiles.tsx        # Navigation dossiers
│   ├── useWorkdriveSearch.tsx       # Recherche récursive
│   └── useWorkdriveDuplicateCheck.ts # Vérification doublons
└── utils/
    ├── authHelpers.tsx              # Authentification Zoho
    └── fileHelpers.tsx              # Téléchargement/détection types
```

## Fonctionnalités détaillées

### 1. Import intelligent avec détection de doublons

#### Processus d'import (`handleCallSubmission`)

typescript

```typescript
exportconst handleCallSubmission =async({
  audioFile,
  description,
  transcriptionText,
  workdriveFileName,// ✅ Nouveau : nom WorkDrive
  showMessage,
  onCallUploaded,
  onDuplicateFound    // ✅ Callback pour résolution manuelle
}:HandleCallSubmissionOptions):Promise<void>
```

**Étapes d'exécution :**

1. **Validation JSON stricte** des transcriptions avec `validateTranscriptionJSON`
2. **Détection de doublons** multi-critères par `checkForDuplicates`
3. **Résolution des conflits** via dialog utilisateur ou automatique
4. **Upload audio** vers Supabase Storage avec gestion d'erreurs
5. **Insertion en base** avec métadonnées complètes et nom WorkDrive
6. **Messages de succès** adaptatifs selon le contenu importé

#### Système de détection de doublons (`duplicateManager.ts`)

**Stratégies de détection :**

typescript

```typescript
// 1. Recherche par nom de fichier exact
const { data: fileNameMatch } = await supabase
  .from("call")
  .select("*")
  .eq("filename", filename)
  .eq("is_tagging_call", true)
  .single();

// 2. Hash de contenu transcription (mots début/fin + count)
const calculateTranscriptionHash = (transcriptionText: string): string => {
  const parsed = JSON.parse(transcriptionText);
  const firstWord = parsed.words[0]?.text || "";
  const lastWord = parsed.words[parsed.words.length - 1]?.text || "";
  const wordCount = parsed.words.length;
  return `${firstWord}_${lastWord}_${wordCount}`.toLowerCase();
};

// 3. Recherche par description similaire (ILIKE)
const { data: descriptionMatches } = await supabase
  .from("call")
  .ilike("description", `%${description.slice(0, 50)}%`);
```

**Recommandations automatiques :**

- **`block`** : Contenu identique détecté
- **`upgrade`** : Peut ajouter audio ou transcription manquante
- **`create_new`** : Appel existant complet, créer nouveau

#### Interface de résolution (`DuplicateDialog.tsx`)

**Fonctionnalités :**

- **Comparaison visuelle** des états (existant vs nouveau)
- **Recommandations contextuelles** avec descriptions
- **Actions disponibles** selon l'analyse automatique
- **Support thème dark/light** adaptatif

### 2. Gestion avancée avec CallTableList

#### Cache intelligent (`useOptimizedCallData`)

**Architecture multi-niveaux :**

typescript

```typescript
interfaceUseOptimizedCallDataReturn{
// Données optimisées
  filteredAndSortedCalls:Call[];
  uniqueOrigines:string[];

// États
  filters:FilterState;
  sortState:SortState;

// Actions
updateFilters:(filters:FilterState)=>void;
updateSort:(orderBy:keyofCall)=>void;

// Performance
  cacheStats:{ hits:number; misses:number; lastUpdate:Date|null;};
clearCache:()=>void;
}
```

**Optimisations :**

- **Cache principal** : Données filtrées/triées (30s)
- **Cache origines** : Liste des origines uniques (basé contenu)
- **Invalidation intelligente** : Auto-nettoyage si +5 appels ajoutés/supprimés
- **Statistiques** : Monitoring hits/misses en développement

#### Actions en lot (`useBulkActions`)

**Fonctionnalités :**

- **Sélection multiple** avec checkbox et select-all
- **Mise à jour d'origine** en masse avec traitement par batches
- **Suppression en lot** avec confirmations et gestion d'erreurs
- **Feedback temps réel** avec barres de progression

**Traitement optimisé :**

typescript

```typescript
const batches = createBatches(selectedCallIds, 5); // Max 5 simultanés
for (const batch of batches) {
  awaitPromise.all(
    batch.map((callid) => updateCallOrigine(callid, newOrigine))
  );
  awaitdelay(100); // Délai entre batches
}
```

#### Interface responsive

**Desktop :**

- Tableau complet avec tri/filtres avancés
- Édition inline de l'origine avec validation
- **Nouvelle colonne Relations** : Statut des `next_turn_tag`
- Actions en lot avec toolbar dédiée

**Mobile :**

- Cartes expansibles optimisées
- Filtres adaptés à l'écran tactile
- Actions uniformes avec feedback visuel
- Navigation par cartes avec résumé

### 3. Modes spécialisés WorkDrive

#### Types de modes (`WorkdriveExplorerMode`)

typescript

```typescript
exporttypeWorkdriveExplorerMode = "full" | "audio_only" | "transcription_only";

// Utilisation adaptative
const effectiveMode = useMemo(() => {
  if (audioOnly) return "audio_only";
  if (transcriptionOnly) return "transcription_only";
  return mode;
}, [mode, audioOnly, transcriptionOnly]);
```

#### Détection de doublons en temps réel

**Fonctionnalités :**

- **Vérification automatique** des fichiers visibles avec délai
- **Badges visuels** : "Déjà importé", "Nouveau", "Vérification..."
- **Clic sur doublon** : Navigation ou action personnalisée
- **Toggle activation** : Possibilité de désactiver la vérification

typescript

```typescript
// Hook de vérification
const { checkFileForDuplicate, getFileStatus, getDuplicateDetails } =
  useWorkdriveDuplicateCheck();

// Vérification automatique avec délai
useEffect(() => {
  const fileEntries = files.filter((file) => !isFolder(file)).slice(0, 8);
  fileEntries.forEach((file, index) => {
    setTimeout(() => checkFileForDuplicate(file), index * 300);
  });
}, [files, enableDuplicateCheck]);
```

### 4. Modals d'upload spécialisées

#### AudioUploadModal

**Sources supportées :**

- **Disque dur** : Drag & drop + sélection fichier
- **WorkDrive** : Intégration mode `audio_only`
- **Formats** : MP3, WAV, M4A, AAC, OGG (max 100MB)

#### TranscriptionUploadModal

**Sources supportées :**

- **Fichier** : JSON, TXT avec validation
- **WorkDrive** : Mode `transcription_only`
- **Saisie manuelle** : Zone de texte pour coller du contenu

## Optimisations et performance

### 1. Validation stricte des transcriptions

**Fonctionnalités de `validateTranscriptionJSON` :**

typescript

```typescript
interfaceValidationResult{
  isValid:boolean;
  error?:string;
  data?:ValidTranscriptionJSON;
  warnings?:string[];// Avertissements non-bloquants
}
```

**Validations effectuées :**

- **Structure JSON** : Propriété `words` obligatoire et tableau
- **Mots individuels** : `text`, `startTime`, `endTime` obligatoires
- **Marqueurs de fin** : Gestion des `turn: "--"` avec texte vide
- **Timestamps** : Ordre chronologique et cohérence
- **Speakers** : Détection et normalisation

### 2. Traitement des recouvrements (`transcriptionProcessor`)

**Gestion des balises `<Who nb='1'/>` et `<Who nb='2'/>` :**

typescript

```typescript
exportconstprocessOverlappingSegments = (segments: any[]) => {
  // Détection des séquences de recouvrement
  // Fusion des segments avec balises Who
  // Création de segments combinés "spk1 spk2"
  // Nettoyage des balises dans le texte final
};
```

### 3. URLs signées et sécurité

**Génération d'URLs temporaires :**

typescript

```typescript
exportconst generateSignedUrl =async(
  filePath:string,
  expiration:number=1200// 20 minutes par défaut
):Promise<string>=>{
const{ data }=await supabase.storage
.from("Calls")
.createSignedUrl(filePath, expiration);
return data.signedUrl;
};
```

## Types de données et interfaces

### Interface Call principale

typescript

```typescript
interfaceCall{
  callid:string|number;// ✅ Support des deux types
  filename?:string;
  filepath?:string;
  upload?:boolean;
  duree?:string;
  status?:string;
  origine?:string;
  description?:string;
  createdAt?:string;
  updatedAt?:string;
}
```

### Types WorkDrive

typescript

```typescript
interfaceZohoFile{
  id:string;
  type?:string;
  name?:string;
  originalId?:string;// Compatibilité AudioList
  attributes?:{
    name?:string;
    display_attr_name?:string;
    type?:string;
    is_folder?:boolean;
    extn?:string;
    mime_type?:string;
    download_url?:string;
// ... autres attributs
};
}
```

### États et filtres

typescript

```typescript
interfaceFilterState{
  searchTerm:string;
  statusFilter:string;
  audioFilter:string;
  origineFilter:string;
}

interfaceSortState{
  order:"asc"|"desc";
  orderBy:keyofCall;
}
```

## Relations avec la base de données

### Tables principales

**`call` :** Enregistrements d'appels avec métadonnées

- `callid`, `filename`, `filepath`, `description`
- `transcription` (JSONB), `upload`, `is_tagging_call`
- `origine`, `status`, `duree`

**`transcript` :** Table de liaison pour transcription

- `transcriptid`, `callid`

**`word` :** Transcription mot par mot

- `wordid`, `transcriptid`, `text`, `startTime`, `endTime`, `turn`

**`turntagged` :** Analyse sémantique avec tags

- `call_id`, `tag`, `verbatim`, `next_turn_tag`, `next_turn_verbatim`

### Nouvelle fonctionnalité : Suivi des relations

**Colonne Relations** dans CallTableList :

- **✅ XX%** : Relations `next_turn_tag` calculées (vert)
- **⚠️ XX%** : Partiellement calculées (orange)
- **❌ XX%** : Peu de relations (rouge)

typescript

```typescript
interfaceRelationsStatus{
  totalTags:number;
  tagsWithNextTurn:number;
  missingRelations:number;
  completenessPercent:number;
  isCalculated:boolean;
  lastChecked:Date;
}
```

## Workflows utilisateur

### 1. Import standard

1. **Sélection** : Onglet "Import d'appels"
2. **Exploration** : WorkDrive avec détection doublons optionnelle
3. **Sélection** : Audio et/ou transcription
4. **Validation** : Vérification JSON si transcription
5. **Résolution** : Dialog doublons si conflit détecté
6. **Import** : Upload et insertion avec feedback

### 2. Préparation pour tagging

1. **Liste** : Appels transcrits non préparés
2. **Examen** : Visualisation du JSONB transcription
3. **Association** : Ajout fichier audio via modal
4. **Validation** : Préparation pour le tagging

### 3. Gestion avancée

1. **Vue** : Liste complète avec filtres/tri
2. **Sélection** : Multiple via checkbox
3. **Actions** : Mise à jour origine en lot ou suppression
4. **Édition** : Origine inline avec validation temps réel

## Points techniques avancés

### 1. Gestion d'erreurs granulaire

- **Validation** : Messages spécifiques selon le type d'erreur
- **Upload** : Retry automatique et fallback
- **Batch** : Continuation même si échecs partiels
- **UI** : Feedback immédiat avec états visuels

### 2. Performance et évolutivité

- **Cache** : Multi-niveaux avec invalidation intelligente
- **Batch** : Traitement par lots pour éviter surcharge
- **Responsive** : Composants séparés desktop/mobile
- **Lazy loading** : Chargement progressif des relations

### 3. Sécurité et auditabilité

- **URLs signées** : Accès temporaire sécurisé aux fichiers
- **Validation** : Stricte des entrées utilisateur
- **Traçabilité** : Logs complets des modifications
- **Permissions** : Intégration RLS Supabase prête

### 4. Extensibilité

- **Types modulaires** : Interfaces extensibles
- **Hooks réutilisables** : Logique métier externalisée
- **Composants génériques** : Architecture modulaire
- **API uniforme** : Patterns cohérents pour nouvelles features

---

## Conclusion

Le module calls représente un **écosystème complet et sophistiqué** pour la gestion des appels dans TaggerLPL. Il combine :

- **Import intelligent** avec détection de doublons avancée
- **Interface optimisée** avec cache multi-niveaux et actions en lot
- **Intégration WorkDrive** complète avec modes spécialisés
- **Validation stricte** des données avec gestion d'erreurs granulaire
- **Architecture extensible** prête pour nouvelles fonctionnalités

Cette architecture modulaire et performante constitue une base solide pour l'écosystème de tagging et d'analyse conversationnelle de l'application.
