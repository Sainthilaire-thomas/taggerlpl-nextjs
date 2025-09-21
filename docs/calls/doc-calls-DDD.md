# Analyse du Système DDD Calls - Documentation Complète

## 1. Description du Système Existant

### Vue d'ensemble de l'Architecture DDD

Le système **Calls** est une implémentation d'architecture **Domain-Driven Design (DDD)** destinée à la gestion des appels téléphoniques dans le contexte d'un centre de contact pour la recherche en linguistique conversationnelle. Il s'intègre dans l'application TaggerLPL pour l'analyse des interactions conflictuelles entre conseillers et clients.

### Métier et Domaine

**Domaine métier** : Analyse conversationnelle d'appels téléphoniques conflictuels dans les centres de contact

**Objectifs principaux** :

- Import et stockage d'appels audio avec transcriptions
- Préparation technique des données pour l'annotation linguistique
- Gestion du cycle de vie des appels (Import → Préparation → Tagging → Analyse)
- Détection et traitement des doublons
- Support des workflows d'annotation linguistique

**Contexte de recherche** : Le système supporte une thèse de doctorat en linguistique appliquée étudiant l'efficacité des stratégies communicationnelles dans la résolution de conflits au téléphone.

## 2. Architecture Technique Actuelle

### Structure en Couches DDD

```
📁 src/components/calls/
├── 🏗️ domain/                    # Couche Domaine (cœur métier)
│   ├── entities/                 # Entités métier
│   │   ├── AudioFile.ts          # Gestion fichiers audio
│   │   ├── Call.ts               # Entité principale d'un appel
│   │   ├── Transcription.ts      # Données de transcription
│   │   └── TranscriptionWord.ts  # Mots individuels
│   ├── services/                 # Services métier
│   │   ├── CallService.ts        # Logique principale des appels
│   │   ├── ValidationService.ts  # Validation des données
│   │   ├── DuplicateService.ts   # Détection de doublons
│   │   ├── StorageService.ts     # Gestion du stockage
│   │   ├── CallFilteringService.ts       # Filtrage avancé
│   │   └── TranscriptionTransformationService.ts  # JSON → DB
│   ├── repositories/             # Interfaces de persistance
│   │   ├── CallRepository.ts     # Interface appels
│   │   ├── StorageRepository.ts  # Interface stockage
│   │   └── RelationsRepository.ts # Interface relations
│   └── workflows/                # Processus métier complexes
│       ├── BulkPreparationWorkflow.ts    # Préparation en lot
│       └── ImportWorkflow.ts             # Import d'appels
├── 🔌 infrastructure/            # Couche Infrastructure
│   ├── ServiceFactory.ts        # Factory des services
│   └── supabase/                # Implémentations Supabase
│       ├── SupabaseCallRepository.ts
│       ├── SupabaseStorageRepository.ts
│       └── SupabaseRelationsRepository.ts
├── 🎯 ui/                        # Couche Interface Utilisateur
│   ├── hooks/                   # Hooks React pour l'UI
│   │   ├── useCallManagement.ts  # Gestion des appels
│   │   ├── useCallImport.ts      # Import d'appels
│   │   ├── useCallPreparation.ts # Préparation pour tagging
│   │   └── actions/              # Actions spécialisées
│   ├── components/              # Composants UI
│   │   ├── ImportForm.tsx        # Formulaire d'import
│   │   ├── DuplicateResolutionDialog.tsx
│   │   └── ImportProgress.tsx
│   └── pages/                   # Pages principales
│       ├── CallImportPage.tsx
│       ├── CallManagementPage.tsx
│       └── CallPreparationPage.tsx
└── 📋 shared/                   # Types et utilitaires partagés
    ├── types/
    ├── exceptions/
    └── config/
```

### Entités Principales

#### 1. **Call** - Entité racine d'agrégat

typescript

```typescript
classCall{
  id:string
  filename?:string
  description?:string
  status:CallStatus=DRAFT|PROCESSING|READY|TAGGING|COMPLETED|ERROR
  origin?:string
  audioFile?:AudioFile// Composition
  transcription?:Transcription// Composition
  createdAt:Date
  updatedAt:Date

// Règles métier
isReadyForTagging():boolean
hasValidAudio():boolean
hasValidTranscription():boolean
canBeUpgraded(newData):UpgradeAnalysis
}
```

#### 2. **AudioFile** - Value Object

typescript

```typescript
classAudioFile{
  path:string
  url?:string
  originalFile?:File
  size?:number
  mimeType?:string
  duration?:number
  uploadedAt:Date

// Validation métier
isValid():boolean
isPlayable():boolean
isSupportedFormat():boolean
getSizeInMB():number
getFormattedDuration():string
}
```

#### 3. **Transcription** et **TranscriptionWord**

typescript

```typescript
classTranscription{
  words:TranscriptionWord[]
  metadata?:TranscriptionMetadata

isValid():boolean
getWordCount():number
getDurationInSeconds():number
getSpeakers():string[]
}

classTranscriptionWord{
  text:string
  startTime:number
  endTime:number
  speaker:string
  turn?:string
  confidence?:number
}
```

### Services Métier Clés

#### 1. **CallService** - Service principal

- Création, mise à jour, suppression d'appels
- Gestion des transitions d'état
- Règles de validation métier
- Coordination avec autres services

#### 2. **DuplicateService** - Détection de doublons

- Stratégies multiples : nom de fichier, contenu, description
- Analyse de possibilité de mise à niveau
- Algorithmes de similarité de transcription

#### 3. **TranscriptionTransformationService** - Transformation technique

- Conversion JSON → table `word` en base
- Validation de structure JSON
- Marquage `preparedfortranscript = true`

#### 4. **CallFilteringService** - Filtrage avancé (NOUVEAU)

- Filtres par statut conflictuel
- Groupement par origine
- Recherche multicritères
- Interface accordéon pour CallPreparationPage

## 3. Incohérences et Problèmes Identifiés

### 🚨 Incohérences Majeures

#### 1. **Confusion dans les critères de filtrage**

**Problème** : CallPreparationPage utilisait `is_tagging_call = true` au lieu du bon critère

typescript

```typescript
// ❌ INCORRECT (ancien code)
const preparableCalls = calls.filter((call) => call.isTaggingCall);

// ✅ CORRECT (corrigé)
const preparableCalls = calls.filter(
  (call) => call.hasValidTranscription() && !call.isReadyForTagging() // = preparedfortranscript: false
);
```

#### 2. **Mélange des responsabilités dans l'UI**

- CallPreparationPage dupliquait la logique de CallManagementPage
- Pas de séparation claire entre "préparation technique" et "sélection pour tagging"

#### 3. **Services incomplets dans l'architecture**

- CallFilteringService ajouté tardivement
- TranscriptionTransformationService pas intégré initialement
- Workflows BulkPreparation peu utilisés

#### 4. **Types conflictuels**

typescript

```typescript
// Problème : Status string vs enum CallStatus
typeConflictStatus = "conflictuel" | "non_conflictuel" | "non_supervisé"; // String
enumCallStatus = DRAFT | PROCESSING | READY; // Enum

// Comparaisons incohérentes dans le code
call.status === "conflictuel"; // String
call.status === CallStatus.READY; // Enum
```

### 🔧 Problèmes Techniques

#### 1. **Factory Pattern incomplet**

- ServiceFactory existe mais pas utilisé partout
- Injection de dépendances manuelle dans certains hooks
- Configuration des services dispersée

#### 2. **Gestion d'erreurs incohérente**

- Exceptions DDD bien définies mais pas utilisées uniformément
- Gestion d'erreurs UI basique dans certains composants

#### 3. **Cache et performance**

- Pas de cache au niveau des services DDD
- Optimisations uniquement dans les hooks UI

## 4. Simplification vers CallManagementPage Unique

### Objectif : Une seule page pour tout gérer

L'idée est de remplacer les 3 pages actuelles par une seule **CallManagementPage** avec des onglets de services :

```
CallManagementPage
├── 📊 Aperçu          # Dashboard global
├── 📝 Transcription   # Actions sur les transcriptions
├── 🎵 Audio          # Actions sur les fichiers audio
├── 🔧 Préparation    # Préparation technique (ex-CallPreparationPage)
├── 🏷️ Flags/Statuts  # Gestion des statuts
└── 🧹 Nettoyage      # Actions de maintenance
```

### Architecture des Hooks Actions

**Pattern proposé** : Hooks d'actions spécialisés qui encapsulent les services DDD

typescript

```typescript
// src/components/calls/ui/hooks/actions/
├── useCallTranscriptionActions.ts    # Actions transcription
├── useCallAudioActions.ts            # Actions audio
├── useCallPreparationActions.ts      # Actions préparation
├── useCallFlags.ts                   # Actions flags/statuts
└── useCallCleanup.ts                 # Actions nettoyage
```

**Exemple d'implémentation** :

typescript

```typescript
// useCallPreparationActions.ts
exportfunctionuseCallPreparationActions({ reload }:{reload:()=>void}){
const{ prepareCall }=useCallPreparation()
const{ markAsPrepared }=useCallManagement()

const prepareForTagging =useCallback(async(calls:Call[])=>{
for(const call of calls){
awaitprepareCall(call.id)// JSON → word + flag DB
}
awaitreload()
},[prepareCall, reload])

const markPrepared =useCallback(async(calls:Call[])=>{
for(const call of calls){
awaitmarkAsPrepared(call.id)
}
awaitreload()
},[markAsPrepared, reload])

return{ prepareForTagging, markPrepared }
}
```

## 5. Modifications Recommandées

### Phase 1 : Suppression de CallPreparationPage

#### 1. **Supprimer les fichiers obsolètes**

bash

```bash
rm src/components/calls/ui/pages/CallPreparationPage.tsx
rm -rf src/components/calls/ui/hooks/useCallPreparation.ts  # Si dupliqué
```

#### 2. **Intégrer la logique dans CallManagementPage**

- Déplacer les filtres avancés de CallPreparationPage
- Intégrer les actions de préparation dans l'onglet "Préparation"
- Conserver l'interface accordéon par origine

### Phase 2 : Consolidation des Services DDD

#### 1. **Refactoring ServiceFactory**

typescript

```typescript
// Centraliser toute la création de services
exportclassCallsServiceFactory{
// Singleton pattern renforcé
// Configuration unique
// Health checks automatiques
// Injection de dépendances complète
}
```

#### 2. **Standardisation des Types**

typescript

```typescript
// Unifier les types de statut
exporttypeCallConflictStatus="conflictuel"|"non_conflictuel"|"non_supervisé"
exportenumCallSystemStatus{DRAFT,PROCESSING,READY,TAGGING,COMPLETED,ERROR}

// Séparer clairement les deux domaines
interfaceCall{
  systemStatus:CallSystemStatus// Workflow technique
  conflictStatus?:CallConflictStatus// Classification métier
}
```

### Phase 3 : Optimisation des Performances

#### 1. **Cache au niveau Services**

typescript

```typescript
exportclassCallService{
private cache =newMap<string,Call>()
private cacheTimeout =30000

asyncgetCallById(id:string):Promise<Call>{
if(this.cache.has(id)&&!this.isCacheExpired(id)){
returnthis.cache.get(id)!
}
// Fetch from repository...
}
}
```

#### 2. **Batch Operations optimisées**

typescript

```typescript
exportclassBulkPreparationWorkflow{
asyncprepareBatch(callIds:string[], callbacks?:BulkCallbacks){
// Traitement en parallèle optimisé
// Progress reporting
// Error handling robuste
// Rollback automatique
}
}
```

### Phase 4 : Interface Unifiée

#### 1. **CallManagementPage améliorée**

typescript

```typescript
exportconstCallManagementPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const { calls, loading, reload } = useCallManagement();

  // Actions spécialisées par onglet
  const transcriptionActions = useCallTranscriptionActions({ reload });
  const preparationActions = useCallPreparationActions({ reload });
  // ... autres actions

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Aperçu" />
        <Tab label="Transcription" icon={<Description />} />
        <Tab label="Audio" icon={<AudioFile />} />
        <Tab label="Préparation" icon={<Build />} />
        {/* ... autres onglets */}
      </Tabs>

      {/* Barre d'actions contextuelle par onglet */}
      <ActionsToolbar
        tab={tab}
        selectedCalls={selectedCalls}
        actions={allActions}
      />

      {/* Tableau unifié avec colonnes adaptatives */}
      <CallTable calls={calls} onSelectionChange={setSelectedCalls} />
    </Box>
  );
};
```

## 6. Avantages de la Simplification

### ✅ **Bénéfices Utilisateur**

- **Interface unique** : Plus simple à comprendre et utiliser
- **Actions cohérentes** : Même UX pour toutes les opérations
- **Contexte préservé** : Pas de navigation entre pages
- **Performance** : Moins de recharges de données

### ✅ **Bénéfices Technique**

- **Code centralisé** : Moins de duplication
- **Maintenance simplifiée** : Un seul point d'entrée
- **Architecture claire** : Services DDD bien séparés de l'UI
- **Testabilité** : Hooks d'actions facilement testables

### ✅ **Bénéfices Métier**

- **Workflow unifié** : Toutes les étapes dans une interface
- **Visibilité globale** : Vue d'ensemble sur tous les appels
- **Actions en lot** : Traitement efficace de gros volumes
- **Traçabilité** : Historique des actions centralisé

## 7. Plan de Migration

### Étape 1 : Préparation (1-2 jours)

1. Audit des fonctionnalités de CallPreparationPage
2. Identification des éléments à conserver
3. Mapping vers les nouveaux hooks d'actions

### Étape 2 : Implémentation (3-5 jours)

1. Création des hooks d'actions spécialisés
2. Extension de CallManagementPage avec les onglets
3. Migration des composants UI réutilisables
4. Tests d'intégration

### Étape 3 : Validation (1-2 jours)

1. Tests fonctionnels complets
2. Vérification des performances
3. Validation UX avec les utilisateurs
4. Documentation mise à jour

### Étape 4 : Nettoyage (1 jour)

1. Suppression de CallPreparationPage
2. Nettoyage des imports obsolètes
3. Mise à jour des routes
4. Déploiement final

## Conclusion

Le système DDD Calls est une **architecture solide** avec des **concepts métier bien définis** , mais qui souffre d'**incohérences dans l'interface utilisateur** et d'une **complexité artificielle** due à la multiplication des pages.

La **simplification vers CallManagementPage unique** permettra de :

- **Préserver la qualité** de l'architecture DDD
- **Simplifier l'expérience utilisateur**
- **Améliorer la maintenabilité** du code
- **Optimiser les performances** globales

Cette approche respecte les principes DDD en gardant le domaine métier intact tout en améliorant significativement la couche présentation.
