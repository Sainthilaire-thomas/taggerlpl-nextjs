# Documentation Architecture DDD - Module Calls

## Vue d'ensemble

Le module Calls de l'application TaggerLPL implémente une architecture **Domain Driven Design (DDD)** complète pour la gestion des appels téléphoniques. Cette architecture sépare clairement les préoccupations métier de l'infrastructure technique, offrant une maintenabilité et une évolutivité optimales.

## Structure Architecturale

```
src/components/calls/
├── domain/                    # Couche métier (logique pure)
│   ├── entities/             # Entités métier
│   ├── services/             # Services métier
│   ├── repositories/         # Interfaces des dépôts
│   └── workflows/            # Workflows complexes
├── infrastructure/           # Couche technique
│   ├── supabase/            # Implémentations Supabase
│   └── ServiceFactory.ts    # Factory d'injection
├── shared/                   # Types et utilitaires partagés
│   ├── types/               # Types TypeScript
│   ├── exceptions/          # Exceptions métier
│   └── config/              # Configuration
└── ui/                       # Interface utilisateur
    ├── components/          # Composants React
    ├── hooks/               # Hooks métier
    └── pages/               # Pages de l'application
```

## Couche Domaine (Domain Layer)

### 1. Entités Métier

#### Call - Entité principale

```typescript
export class Call {
  constructor(
    public readonly id: string,
    public readonly filename?: string,
    public readonly description?: string,
    public readonly status: CallStatus = CallStatus.DRAFT,
    public readonly origin?: string,
    private audioFile?: AudioFile,
    private transcription?: Transcription,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  // Règles métier
  isReadyForTagging(): boolean {
    return this.hasValidAudio() && this.hasValidTranscription();
  }

  hasValidAudio(): boolean {
    return !!this.audioFile && this.audioFile.isValid();
  }

  hasValidTranscription(): boolean {
    return !!this.transcription;
  }

  canBeUpgraded(newData: Partial<CallUpgradeData>): UpgradeAnalysis {
    // Logique de mise à niveau des appels
  }

  // Méthodes immutables
  withAudio(audioFile: AudioFile): Call {
    /* ... */
  }
  withTranscription(transcription: Transcription): Call {
    /* ... */
  }
  withOrigin(origin: string): Call {
    /* ... */
  }
  withStatus(status: CallStatus): Call {
    /* ... */
  }
}
```

#### CallExtended - Extension avec cycle de vie

```typescript
export class CallExtended extends Call {
  constructor(
    // Paramètres de Call +
    public readonly preparedForTranscript: boolean = false,
    public readonly isTaggingCall: boolean = false,
    public readonly isTagged: boolean = false,
    private readonly transcriptionJson?: any
  ) {
    super(/* paramètres Call */);
  }

  // Cycle de vie du tagging
  canPrepare(): boolean {
    return (
      this.hasValidTranscription() &&
      !this.preparedForTranscript &&
      !this.isTaggingCall &&
      !this.isTagged
    );
  }

  canSelect(): boolean {
    return (
      this.hasValidTranscription() &&
      this.preparedForTranscript &&
      !this.isTaggingCall &&
      !this.isTagged
    );
  }

  canTag(): boolean {
    return (
      this.hasValidTranscription() &&
      this.preparedForTranscript &&
      this.isTaggingCall &&
      !this.isTagged
    );
  }

  getLifecycleStatus(): CallLifecycleStatus {
    // Calcul de l'état complet du cycle de vie
  }
}
```

#### AudioFile - Gestion des fichiers audio

```typescript
export class AudioFile {
  private static readonly SUPPORTED_FORMATS = [
    "mp3",
    "wav",
    "m4a",
    "aac",
    "ogg",
  ];
  private static readonly MAX_SIZE_MB = 100;

  constructor(
    public readonly path: string,
    public readonly url?: string,
    public readonly originalFile?: File,
    public readonly size?: number,
    public readonly mimeType?: string,
    public readonly duration?: number,
    public readonly uploadedAt: Date = new Date()
  ) {
    this.validateAudioFile();
  }

  isValid(): boolean {
    // Validation complète du fichier
  }

  isPlayable(): boolean {
    return this.isValid() && !!this.url && this.url.length > 0;
  }

  isSupportedFormat(): boolean {
    // Vérification du format
  }

  getSizeInMB(): number {
    // Calcul de la taille en MB
  }

  getFormattedDuration(): string {
    // Format mm:ss
  }
}
```

#### Transcription & TranscriptionWord

```typescript
export class Transcription {
  constructor(
    public readonly words: TranscriptionWord[],
    public readonly metadata?: TranscriptionMetadata
  ) {}

  isValid(): boolean {
    return this.words.length > 0 && this.words.every((word) => word.isValid());
  }

  getWordCount(): number {
    /* ... */
  }
  getDurationInSeconds(): number {
    /* ... */
  }
  getSpeakers(): string[] {
    /* ... */
  }
}

export class TranscriptionWord {
  constructor(
    public readonly text: string,
    public readonly startTime: number,
    public readonly endTime: number,
    public readonly speaker: string,
    public readonly turn?: string,
    public readonly confidence?: number
  ) {
    this.validateWord();
  }

  isValid(): boolean {
    /* ... */
  }
  getDuration(): number {
    /* ... */
  }
  overlapsWith(other: TranscriptionWord): boolean {
    /* ... */
  }
}
```

### 2. Services Métier

#### CallService - Service principal

```typescript
export class CallService {
  constructor(
    private callRepository: CallRepository,
    private validationService: ValidationService
  ) {}

  async createCall(data: CreateCallData): Promise<Call> {
    // Validation des données
    const validationResult = this.validationService.validateCallData(data);
    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors);
    }

    // Création des entités
    // Sauvegarde
    // Retour du Call créé
  }

  async updateCallOrigin(callId: string, origin: string): Promise<void> {
    /* ... */
  }
  async updateCallStatus(callId: string, status: CallStatus): Promise<void> {
    /* ... */
  }
  async deleteCall(callId: string): Promise<void> {
    /* ... */
  }
  async markAsPrepared(callId: string): Promise<void> {
    /* ... */
  }
}
```

#### CallLifecycleService - Gestion du cycle de vie

```typescript
export class CallLifecycleService {
  constructor(
    private callRepository: CallRepository,
    private transformationService?: any
  ) {}

  async progressCall(callId: string): Promise<LifecycleActionResult> {
    const call = await this.getCallWithWorkflow(callId);
    const lifecycle = call.getLifecycleStatus();

    if (lifecycle.canPrepare) {
      return await this.prepareCall(call);
    } else if (lifecycle.canSelect) {
      return await this.selectCall(call);
    }
    // ...
  }

  async prepareCall(call: CallExtended): Promise<LifecycleActionResult> {
    // Transformation JSON → words dans la table word
  }

  async selectCall(call: CallExtended): Promise<LifecycleActionResult> {
    // Sélection pour le tagging (is_tagging_call = true)
  }

  async getLifecycleStats(callIds: string[]): Promise<LifecycleStats> {
    // Statistiques par étape du cycle de vie
  }
}
```

#### CallFilteringService - Filtrage avancé

```typescript
export class CallFilteringService {
  filterPreparableCalls(calls: Call[]): Call[] {
    return calls.filter((call) => {
      const hasValidTranscription = call.hasValidTranscription();
      const notReadyForTagging = !call.isReadyForTagging();
      return hasValidTranscription && notReadyForTagging;
    });
  }

  filterByCriteria(calls: Call[], criteria: FilterCriteria): Call[] {
    // Filtrage multi-critères intelligent
  }

  groupByOrigin(calls: Call[]): GroupedCalls {
    /* ... */
  }
  getOriginStats(calls: Call[]): OriginStats[] {
    /* ... */
  }
}
```

#### DuplicateService - Détection de doublons

```typescript
export class DuplicateService {
  async checkForDuplicates(
    criteria: DuplicateCriteria
  ): Promise<DuplicateResult> {
    // Stratégie 1: Nom de fichier exact
    if (criteria.filename) {
      const filenameDuplicate = await this.checkFilenameMatch(
        criteria.filename
      );
      if (filenameDuplicate) {
        return {
          isDuplicate: true,
          existingCall: filenameDuplicate,
          matchType: "filename",
          confidence: 1.0,
          analysis: filenameDuplicate.canBeUpgraded(/* ... */),
        };
      }
    }

    // Stratégie 2: Hash de contenu
    // Stratégie 3: Description similaire
  }

  async upgradeExistingCall(
    callId: string,
    upgradeData: CallUpgradeData
  ): Promise<boolean> {
    // Mise à niveau d'un appel existant
  }
}
```

### 3. Repositories (Interfaces)

```typescript
export interface CallRepository {
  save(call: Call): Promise<void>;
  update(call: Call): Promise<void>;
  delete(callId: string): Promise<void>;
  findById(id: string): Promise<Call | null>;
  findAll(offset?: number, limit?: number): Promise<Call[]>;
  findByFilename(filename: string): Promise<Call[]>;
  findByOrigin(origin: string): Promise<Call[]>;
  findByStatus(status: CallStatus): Promise<Call[]>;
  count(): Promise<number>;
  exists(id: string): Promise<boolean>;
}

export interface StorageRepository {
  uploadFile(file: File, path?: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
  generateSignedUrl(path: string, expiration?: number): Promise<string>;
  fileExists(path: string): Promise<boolean>;
  getFileMetadata(path: string): Promise<FileMetadata | null>;
}
```

### 4. Workflows Complexes

#### ImportWorkflow - Workflow d'import

```typescript
export class ImportWorkflow {
  constructor(
    private callService: CallService,
    private validationService: ValidationService,
    private duplicateService: DuplicateService,
    private storageService: StorageService
  ) {}

  async execute(
    data: ImportData,
    callbacks?: Callbacks
  ): Promise<ImportResult> {
    // 1. Validation via l'API publique
    // 2. Détection de doublons
    // 3. Upload éventuel
    // 4. Création du Call via CallService
  }
}
```

#### BulkPreparationWorkflow - Préparation en lot

```typescript
export class BulkPreparationWorkflow {
  async prepareBatch(
    callIds: string[],
    callbacks?: BulkCallbacks
  ): Promise<BulkPreparationResult> {
    // Division en lots
    // Traitement par lots avec gestion d'erreur
    // Callbacks de progression
  }

  async prepareSingle(
    callId: string,
    strategy: PreparationStrategy
  ): Promise<PrepareResult> {
    // Préparation individuelle avec stratégies multiples
  }
}
```

## Couche Infrastructure

### 1. Implémentations Supabase

#### SupabaseCallRepository

```typescript
export class SupabaseCallRepository implements CallRepository {
  constructor(private sb = supabaseClient) {}

  async save(call: Call): Promise<void> {
    const payload = this.mapToDatabase(call);
    const { error } = await this.sb.from("call").insert([payload]);
    if (error)
      throw new RepositoryError(`Failed to save call: ${error.message}`);
  }

  async findByIdWithWorkflow(id: string): Promise<CallExtended | null> {
    // Version enrichie avec informations de workflow
  }

  async findManyWithWorkflowOptimized(ids: string[]): Promise<CallExtended[]> {
    // Version optimisée utilisant une vue SQL
  }

  private mapToCall(row: DbCall): CallExtended {
    // Mapping DB → Entité avec gestion d'erreur
  }
}
```

### 2. Factory d'Injection de Dépendances

```typescript
export class CallsServiceFactory {
  private static instance: CallsServiceFactory;

  private constructor() {
    // Initialisation des repositories
    this.callRepository = new SupabaseCallRepository();
    this.storageRepository = new SupabaseStorageRepository();

    // Initialisation des services avec injection
    this.validationService = new ValidationService();
    this.callService = new CallService(
      this.callRepository,
      this.validationService
    );
    this.duplicateService = new DuplicateService(this.callRepository);
    // ...
  }

  public static getInstance(): CallsServiceFactory {
    if (!CallsServiceFactory.instance) {
      CallsServiceFactory.instance = new CallsServiceFactory();
    }
    return CallsServiceFactory.instance;
  }

  createCallPreparationService() {
    // Service composé pour CallPreparationPage
  }
}

export const createServices = () => {
  const factory = CallsServiceFactory.getInstance();
  return {
    callService: factory.getCallService(),
    duplicateService: factory.getDuplicateService(),
    // ... autres services
    factory: factory,
  };
};
```

## Couche UI

### 1. Hooks Métier

#### useUnifiedCallManagement - Hook principal

```typescript
export const useUnifiedCallManagement = () => {
  const [calls, setCalls] = useState<CallExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CallManagementFilters>({
    /* ... */
  });

  const services = useMemo(() => createServices(), []);
  const lifecycleService = useMemo(
    () => new CallLifecycleService(/* ... */),
    []
  );

  const loadCalls = useCallback(async () => {
    try {
      const ids = await services.callRepository.getAllCallIds();
      const enrichedCalls =
        await services.callRepository.findManyWithWorkflowOptimized(ids);
      setCalls(enrichedCalls);
    } catch (error) {
      setError(error.message);
    }
  }, [services]);

  const workflowActions = useMemo(
    () => ({
      prepare: async (call: CallExtended) => {
        const result = await lifecycleService.prepareCall(call);
        if (result.success) await loadCalls();
        return result;
      },
      // ... autres actions
    }),
    [lifecycleService, loadCalls]
  );

  return {
    calls,
    filteredCalls,
    stats,
    loading,
    error,
    loadCalls,
    workflowActions,
    lifecycleService,
    // ... autres exports
  };
};
```

### 2. Composants Spécialisés

#### CallLifecycleColumn - Colonne cycle de vie

```typescript
export const CallLifecycleColumn: React.FC<CallLifecycleColumnProps> = ({
  call,
  onAction,
  isLoading = false,
}) => {
  const lifecycle = call.getLifecycleStatus();
  const stageConfig = STAGE_CONFIG[lifecycle.overallStage];

  const getPrimaryAction = () => {
    if (lifecycle.canPrepare) {
      return {
        key: "prepare",
        label: "Préparer",
        icon: <Build />,
        tooltip: "Transformer le JSON en mots pour le tagging",
      };
    }
    // ... autres actions
  };

  return (
    <Box>
      {/* Indicateurs de contenu */}
      {/* Chip d'état principal */}
      {/* Bouton d'action contextuel */}
    </Box>
  );
};
```

### 3. Pages Complètes

#### CallManagementPage - Interface unifiée

```typescript
export const CallManagementPage: React.FC = () => {
  const {
    calls,
    filteredCalls,
    callsByOrigin,
    stats,
    loading,
    error,
    selectedCalls,
    toggleSelection,
    selectAll,
    clearSelection,
    updateFilters,
    resetFilters,
    workflowActions,
  } = useUnifiedCallManagement();

  const handleLifecycleAction = useCallback(
    async (action: string, call: CallExtended) => {
      switch (action) {
        case "prepare":
          await workflowActions.prepare(call);
          break;
        case "select":
          await workflowActions.select(call);
          break;
        // ...
      }
    },
    [workflowActions]
  );

  return (
    <Box>
      {/* Statistiques */}
      {/* Filtres */}
      {/* Onglets de services */}
      {/* Table avec cycle de vie */}
    </Box>
  );
};
```

## Types et Configuration

### Types Métier

```typescript
export enum CallStatus {
  DRAFT = "draft",
  PROCESSING = "processing",
  READY = "ready",
  TAGGING = "tagging",
  COMPLETED = "completed",
  ERROR = "error",
}

export enum TaggingWorkflowStage {
  EMPTY = "empty",
  AUDIO_ONLY = "audio_only",
  TRANSCRIPTION_ONLY = "transcription_only",
  COMPLETE = "complete",
  NOT_PREPARED = "not_prepared",
  PREPARED = "prepared",
  SELECTED = "selected",
  TAGGED = "tagged",
}

export interface CallLifecycleStatus {
  hasAudio: boolean;
  hasTranscription: boolean;
  preparedForTranscript: boolean;
  isTaggingCall: boolean;
  isTagged: boolean;
  contentStage: TaggingWorkflowStage;
  workflowStage: TaggingWorkflowStage;
  overallStage: TaggingWorkflowStage;
  canPrepare: boolean;
  canSelect: boolean;
  canTag: boolean;
  nextAction?: string;
  description: string;
}
```

### Configuration

```typescript
export const CallsConfig = {
  storage: {
    bucket: "Calls",
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedFormats: ["mp3", "wav", "m4a", "aac", "ogg"],
    signedUrlExpiration: 1200, // 20 minutes
  },
  transcription: {
    validation: {
      strictMode: true,
      maxWords: 50000,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    },
    processing: {
      timeoutMs: 30000,
      retryAttempts: 3,
      batchSize: 100,
    },
  },
  performance: {
    cacheTimeout: 30000, // 30 secondes
    batchSize: 10,
    maxConcurrentOperations: 5,
  },
};
```

## Exceptions et Gestion d'Erreur

```typescript
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DomainError {
  constructor(public readonly errors: string[]) {
    super(`Validation failed: ${errors.join(", ")}`);
  }
}

export class BusinessRuleError extends DomainError {
  constructor(message: string, public readonly rule?: string) {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, identifier: string) {
    super(`${entity} with identifier '${identifier}' not found`);
  }
}
```

## Optimisations et Performance

### 1. Cache Intelligent

- **TTL** : 30 secondes configurable
- **Invalidation** : Automatique lors des mutations
- **Stratégies** : Cache par clé, batch loading, pagination

### 2. Chargement Paresseux

- **Accordéons** : Chargement à l'ouverture
- **Pagination** : Infinie avec virtualisation
- **Skeleton UI** : Feedback pendant chargement

### 3. Optimisations SQL

- **Vues** : `call_with_tagging_status` pour éviter les JOINs multiples
- **Index** : Sur callid, origine, status, timestamps
- **Batch queries** : Regroupement des requêtes

### 4. Gestion Mémoire

- **Immutabilité** : Toutes les entités sont immutables
- **Factory Methods** : Création contrôlée des instances
- **Cleanup** : Nettoyage automatique des références

## Points Forts de l'Architecture

### 1. **Séparation des Responsabilités**

- Domain : Logique métier pure, indépendante de la technologie
- Infrastructure : Implémentations techniques (Supabase, API)
- UI : Interface utilisateur avec hooks métier

### 2. **Testabilité**

- Services injectés via Factory
- Interfaces mockables
- Logique métier isolée

### 3. **Évolutivité**

- Nouvelles implémentations faciles (PostgreSQL, MongoDB)
- Services composables
- Workflows extensibles

### 4. **Maintenabilité**

- Code auto-documenté
- Types stricts
- Exceptions explicites

### 5. **Performance**

- Cache intelligent multi-niveau
- Optimisations SQL
- Chargement paresseux

## Utilisation Pratique

### Import Simple

```typescript
import { createServices } from "@/components/calls/domain";

const services = createServices();
const call = await services.callService.createCall({
  audioFile: file,
  transcriptionText: jsonString,
  origin: "upload",
});
```

### Workflow Complexe

```typescript
import { useUnifiedCallManagement } from "@/components/calls/ui/hooks";

const { calls, workflowActions, lifecycleService } = useUnifiedCallManagement();

// Action sur le cycle de vie
await workflowActions.prepare(call);
await workflowActions.select(call);

// Statistiques
const stats = await lifecycleService.getLifecycleStats(callIds);
```

### Interface UI

```typescript
import { CallManagementPage } from "@/components/calls/ui/pages";

// Page complète avec toutes les fonctionnalités
<CallManagementPage />;
```

Cette architecture DDD offre une base solide pour la gestion des appels, avec une séparation claire des responsabilités, une testabilité optimale, et des performances élevées même avec des volumes importants (682+ appels testés).
