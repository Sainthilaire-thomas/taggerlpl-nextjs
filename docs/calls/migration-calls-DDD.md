# Plan de Migration - Module Calls vers Architecture Domain-Driven

## 📋 Vue d'ensemble

Ce document détaille la migration du module calls actuel vers une architecture Domain-Driven Design (DDD) modulaire et extensible, permettant l'ajout futur de fonctionnalités comme la transcription automatique, l'analyse automatisée, et différents types de préparation.

### Objectifs de la migration

- ✅ **Maintenabilité** : Code plus lisible et plus facile à modifier
- ✅ **Testabilité** : Services isolés facilement testables
- ✅ **Extensibilité** : Architecture prête pour nouvelles fonctionnalités
- ✅ **Séparation des responsabilités** : UI, logique métier, et infrastructure séparées
- ✅ **Zéro régression** : Migration progressive sans impact utilisateur

## 📊 Architecture Cible

### Structure finale proposée

```
src/components/calls/
├── domain/                           # 🆕 Logique métier pure
│   ├── entities/                     # Objets métier
│   ├── services/                     # Services métier
│   ├── repositories/                 # Interfaces d'accès aux données
│   └── workflows/                    # Orchestration des processus
├── infrastructure/                   # 🆕 Services externes
│   ├── supabase/                     # Implémentations Supabase
│   ├── zoho/                         # Services Zoho WorkDrive
│   └── transcription-ai/             # 🆕 Services IA (futur)
├── ui/                              # 🆕 Interface utilisateur pure
│   ├── pages/                        # Pages/containers
│   ├── components/                   # Composants UI
│   ├── hooks/                        # Hooks UI uniquement
│   └── types/                        # Types UI
└── shared/                          # 🆕 Utilitaires partagés
    ├── types/                        # Types communs
    ├── utils/                        # Utilitaires purs
    └── constants/                    # Constantes
```

## 🚀 Plan de Migration en 4 Phases

---

## Phase 1 : Extraction des Services (2-3 semaines)

### Objectif

Extraire la logique métier des gros fichiers monolithiques sans changer l'UI.

### 📁 Nouveaux fichiers à créer

#### Phase 2 : Tests d'intégration workflows

```typescript
describe("ImportWorkflow", () => {
  let workflow: ImportWorkflow;
  let mockServices: MockServices;

  beforeEach(() => {
    mockServices = createMockServices();
    workflow = new ImportWorkflow(
      mockServices.callService,
      mockServices.transcriptionService,
      mockServices.duplicateService,
      mockServices.storageService
    );
  });

  describe("execute", () => {
    it("should import call successfully without duplicates", async () => {
      mockServices.duplicateService.checkForDuplicates.mockResolvedValue({
        isDuplicate: false,
      });

      const result = await workflow.execute({
        audioFile: createMockAudioFile(),
        description: "Test call",
      });

      expect(result.success).toBe(true);
      expect(mockServices.callService.createCall).toHaveBeenCalled();
    });

    it("should handle duplicate resolution", async () => {
      mockServices.duplicateService.checkForDuplicates.mockResolvedValue({
        isDuplicate: true,
        existingCall: { callid: "existing-123" },
      });

      const result = await workflow.execute(
        {
          audioFile: createMockAudioFile(),
          description: "Test call",
        },
        {
          onDuplicateFound: jest.fn().mockResolvedValue("upgrade"),
        }
      );

      expect(result.success).toBe(true);
      expect(
        mockServices.duplicateService.upgradeExistingCall
      ).toHaveBeenCalled();
    });
  });
});
```

#### Phase 3 : Tests infrastructure

```typescript
describe("SupabaseCallRepository", () => {
  let repository: SupabaseCallRepository;
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    repository = new SupabaseCallRepository(mockSupabase);
  });

  it("should save call to database", async () => {
    const call = new Call("123", "test.mp3", "Test call");
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    });

    await repository.save(call);

    expect(mockSupabase.from).toHaveBeenCalledWith("call");
  });
});
```

#### Phase 4 : Tests E2E nouvelles fonctionnalités

```typescript
describe("Auto Transcription E2E", () => {
  it("should transcribe audio automatically when enabled", async () => {
    // Setup mock provider
    const mockWhisperProvider = {
      transcribe: jest.fn().mockResolvedValue(mockTranscription),
      isAvailable: jest.fn().mockResolvedValue(true),
    };

    // Import with auto transcription
    const result = await importWorkflow.execute({
      audioFile: createMockAudioFile(),
      autoTranscription: true,
    });

    expect(result.transcription).toBeDefined();
    expect(mockWhisperProvider.transcribe).toHaveBeenCalled();
  });
});
```

---

## 🚀 Déploiement et Rollback

### Stratégie de déploiement progressif

#### Feature Flags

```typescript
// shared/config/FeatureFlags.ts
export const FeatureFlags = {
  NEW_ARCHITECTURE: process.env.NEXT_PUBLIC_NEW_ARCHITECTURE === "true",
  AUTO_TRANSCRIPTION: process.env.NEXT_PUBLIC_AUTO_TRANSCRIPTION === "true",
  BULK_PREPARATION: process.env.NEXT_PUBLIC_BULK_PREPARATION === "true",
  AI_ANALYSIS: process.env.NEXT_PUBLIC_AI_ANALYSIS === "true",
} as const;

// Utilisation dans les composants
const ImportPage = () => {
  if (FeatureFlags.NEW_ARCHITECTURE) {
    return <NewImportWorkflow />;
  }
  return <LegacyImportComponent />;
};
```

#### Déploiement par environnement

**1. Développement**

```bash
# Phase 1
NEXT_PUBLIC_NEW_ARCHITECTURE=true
NEXT_PUBLIC_AUTO_TRANSCRIPTION=false
NEXT_PUBLIC_BULK_PREPARATION=false

# Phase 2
NEXT_PUBLIC_NEW_ARCHITECTURE=true
NEXT_PUBLIC_AUTO_TRANSCRIPTION=false
NEXT_PUBLIC_BULK_PREPARATION=true

# Phase 3
NEXT_PUBLIC_NEW_ARCHITECTURE=true
NEXT_PUBLIC_AUTO_TRANSCRIPTION=true
NEXT_PUBLIC_BULK_PREPARATION=true

# Phase 4
NEXT_PUBLIC_NEW_ARCHITECTURE=true
NEXT_PUBLIC_AUTO_TRANSCRIPTION=true
NEXT_PUBLIC_BULK_PREPARATION=true
NEXT_PUBLIC_AI_ANALYSIS=true
```

**2. Staging**

- Test avec feature flags graduels
- Validation par utilisateurs beta
- Tests de performance

**3. Production**

- Activation progressive par pourcentage d'utilisateurs
- Monitoring des métriques clés
- Rollback automatique si erreurs

### Plan de rollback

#### Métriques de surveillance

```typescript
// shared/monitoring/CallsMetrics.ts
export const trackCallsMetrics = () => {
  const metrics = {
    importSuccess: 0,
    importErrors: 0,
    importDuration: [],
    duplicateDetectionRate: 0,
    transcriptionAccuracy: 0,
    userSatisfaction: 0,
  };

  // Surveillance continue
  setInterval(() => {
    if (
      metrics.importErrors / (metrics.importSuccess + metrics.importErrors) >
      0.05
    ) {
      alert("High error rate detected - consider rollback");
    }
  }, 60000);
};
```

#### Procédure de rollback

1. **Rollback immédiat** : Désactiver `NEW_ARCHITECTURE` flag
2. **Rollback partiel** : Désactiver fonctionnalités spécifiques
3. **Rollback base de données** : Scripts de migration inverse (si nécessaire)

---

## 📊 Métriques de Succès

### KPIs techniques

#### Performance

- **Temps d'import** : < 5 secondes (actuel: ~3 secondes)
- **Temps de détection doublons** : < 2 secondes (nouveau)
- **Temps de transcription auto** : < 30 secondes pour 5 min audio (nouveau)
- **Cache hit rate** : > 80% (maintenir)

#### Qualité

- **Taux d'erreur import** : < 1% (maintenir)
- **Précision détection doublons** : > 95% (amélioration)
- **Couverture tests** : > 90% (nouveau code)
- **Temps MTTR** : < 2 heures (amélioration)

#### Utilisabilité

- **Temps formation nouvel utilisateur** : < 30 min (maintenir)
- **Satisfaction utilisateur** : > 4/5 (maintenir)
- **Adoption nouvelles fonctionnalités** : > 60% en 3 mois

### KPIs métier

#### Efficacité

- **Réduction temps préparation** : -30% avec bulk preparation
- **Réduction erreurs manuelles** : -50% avec auto transcription
- **Augmentation débit traitement** : +25% avec workflows optimisés

#### ROI

- **Réduction coûts transcription** : -40% avec auto transcription
- **Réduction temps développement** : -60% pour nouvelles fonctionnalités
- **Réduction bugs production** : -70% avec tests unitaires

---

## 📋 Checklist Globale

### Phase 1 : Services (2-3 semaines)

- [ ] **Semaine 1**
  - [ ] Créer structure `domain/services/`
  - [ ] Extraire `CallService` de `callApiUtils.tsx`
  - [ ] Extraire `TranscriptionService`
  - [ ] Créer interfaces repositories
- [ ] **Semaine 2**
  - [ ] Extraire `DuplicateService`
  - [ ] Extraire `StorageService`
  - [ ] Créer entités métier (`Call`, `Transcription`, `AudioFile`)
  - [ ] Créer implémentations Supabase
- [ ] **Semaine 3**
  - [ ] Tests unitaires tous services (>90% couverture)
  - [ ] Refactoring `callApiUtils.tsx`
  - [ ] Tests E2E (pas de régression)
  - [ ] Documentation services

### Phase 2 : Workflows (1-2 semaines)

- [ ] **Semaine 4**
  - [ ] Créer `ImportWorkflow`
  - [ ] Créer `PreparationWorkflow`
  - [ ] Créer `ServiceFactory`
  - [ ] Remplacer logique `handleCallSubmission`
- [ ] **Semaine 5**
  - [ ] Tests d'intégration workflows
  - [ ] Optimisation performance
  - [ ] Validation UI inchangée

### Phase 3 : Infrastructure (1-2 semaines)

- [ ] **Semaine 6**
  - [ ] Créer structure `infrastructure/`
  - [ ] Implémentations Supabase complètes
  - [ ] Services Zoho WorkDrive
  - [ ] Configuration centralisée
- [ ] **Semaine 7**
  - [ ] Tests infrastructure
  - [ ] Préparation interfaces IA
  - [ ] Feature flags système

### Phase 4 : UI + Nouvelles fonctionnalités (2-3 semaines)

- [ ] **Semaine 8**
  - [ ] Structure UI pure (`ui/`)
  - [ ] Hooks UI séparés
  - [ ] Service transcription automatique
- [ ] **Semaine 9**
  - [ ] Types de préparation multiples
  - [ ] Analyse automatique de base
  - [ ] Composants UI nouvelles fonctionnalités
- [ ] **Semaine 10**
  - [ ] Tests E2E complets
  - [ ] Documentation utilisateur
  - [ ] Préparation déploiement production

### Validation finale

- [ ] **Performance** : Tous les KPIs respectés
- [ ] **Tests** : 95%+ couverture, 0 régression
- [ ] **UX** : Validation utilisateurs beta positive
- [ ] **Documentation** : Complète et à jour
- [ ] **Déploiement** : Plan rollback validé
- [ ] **Formation** : Équipe prête pour maintenance

---

## 🎯 Bénéfices Attendus

### Court terme (3 mois)

- ✅ **Code plus maintenable** : Services isolés, tests unitaires
- ✅ **Moins de bugs** : Logique métier testée indépendamment
- ✅ **Développement plus rapide** : Architecture claire et modulaire

### Moyen terme (6 mois)

- 🚀 **Nouvelles fonctionnalités** : Transcription auto, préparation bulk
- 📊 **Métriques améliorées** : Détection doublons, analyses automatiques
- 👥 **Équipe plus efficace** : Code facile à comprendre et modifier

### Long terme (12 mois)

- 🤖 **Intégration IA** : Ready for AI-powered analysis and insights
- 📈 **Évolutivité** : Architecture prête pour croissance et nouvelles intégrations
- 💰 **ROI** : Réduction coûts de développement et maintenance de 50%+

---

## 📞 Support et Questions

### Contacts équipe

- **Lead Développeur** : Point de contact principal
- **Architecte** : Validation architecture et patterns
- **QA** : Stratégie et exécution des tests
- **Product Owner** : Validation fonctionnalités et UX

### Ressources

- **Documentation technique** : Wiki interne avec exemples
- **Patterns de code** : Guidelines et conventions équipe
- **Outils de développement** : Setup IDE et debugging
- **Environnements de test** : Accès staging et preview

---

_Ce document de migration est un guide vivant qui sera mis à jour tout au long du processus. Chaque phase inclut des points de validation et des critères d'acceptation clairs pour assurer le succès de la migration._ 1.1 Services métier

**`domain/services/CallService.ts`**

```typescript
export class CallService {
  constructor(private repository: CallRepository) {}

  async createCall(data: CreateCallData): Promise<Call> {
    // Logique extraite de callApiUtils.tsx
  }

  async updateCallOrigin(callId: string, origin: string): Promise<void> {
    // Code extrait de updateCallOrigine.tsx
  }

  async deleteCall(callId: string, filepath?: string): Promise<void> {
    // Code extrait de removeCallUpload.tsx
  }
}
```

**`domain/services/TranscriptionService.ts`**

```typescript
export class TranscriptionService {
  async validateTranscription(jsonText: string): Promise<ValidationResult> {
    // Code extrait de validateTranscriptionJSON.ts
  }

  async processTranscription(
    transcription: any
  ): Promise<ProcessedTranscription> {
    // Code extrait de transcriptionProcessor.tsx
  }
}
```

**`domain/services/DuplicateService.ts`**

```typescript
export class DuplicateService {
  constructor(private repository: CallRepository) {}

  async checkForDuplicates(
    criteria: DuplicateCriteria
  ): Promise<DuplicateResult> {
    // Code extrait de duplicateManager.ts
  }

  async upgradeExistingCall(
    callId: string,
    options: UpgradeOptions
  ): Promise<boolean> {
    // Code extrait de duplicateManager.ts
  }
}
```

**`domain/services/StorageService.ts`**

```typescript
export class StorageService {
  async uploadAudio(file: File): Promise<string> {
    // Code extrait de callApiUtils.tsx
  }

  async generateSignedUrl(
    filePath: string,
    expiration?: number
  ): Promise<string> {
    // Code extrait de signedUrls.tsx
  }

  async deleteFile(filePath: string): Promise<void> {
    // Nouvelle fonctionnalité consolidée
  }
}
```

#### 1.2 Repositories (interfaces)

**`domain/repositories/CallRepository.ts`**

```typescript
export interface CallRepository {
  save(call: Call): Promise<void>;
  findById(id: string): Promise<Call | null>;
  findByFilename(filename: string): Promise<Call[]>;
  findDuplicates(criteria: DuplicateCriteria): Promise<Call[]>;
  updateOrigin(callId: string, origin: string): Promise<void>;
  delete(callId: string): Promise<void>;
}
```

#### 1.3 Entités métier

**`domain/entities/Call.ts`**

```typescript
export class Call {
  constructor(
    public id: string,
    public filename?: string,
    public description?: string,
    public status: CallStatus = "draft",
    public origin?: string,
    public audioFile?: AudioFile,
    public transcription?: Transcription
  ) {}

  isReadyForTagging(): boolean {
    return this.hasAudio() && this.hasTranscription();
  }

  hasAudio(): boolean {
    return !!this.audioFile && this.audioFile.isValid();
  }

  hasTranscription(): boolean {
    return !!this.transcription && this.transcription.isValid();
  }

  canBeUpgraded(newData: Partial<CallData>): UpgradeAnalysis {
    // Logique métier pour déterminer les possibilités d'amélioration
  }
}
```

### 🔧 Modifications des fichiers existants

#### 1.1 Adapter `callApiUtils.tsx`

```typescript
// callApiUtils.tsx - VERSION REFACTORISÉE
import { CallService } from "../domain/services/CallService";
import { TranscriptionService } from "../domain/services/TranscriptionService";
// ... autres imports

// Instancier les services (temporaire, sera remplacé en Phase 2)
const callService = new CallService(new SupabaseCallRepository());
const transcriptionService = new TranscriptionService();
const duplicateService = new DuplicateService(new SupabaseCallRepository());
const storageService = new StorageService();

export const handleCallSubmission = async (
  options: HandleCallSubmissionOptions
) => {
  try {
    // 1. Validation via service
    if (options.transcriptionText) {
      const validation = await transcriptionService.validateTranscription(
        options.transcriptionText
      );
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
    }

    // 2. Détection doublons via service
    const duplicateCheck = await duplicateService.checkForDuplicates({
      filename: options.audioFile?.name,
      description: options.description,
      transcriptionText: options.transcriptionText,
    });

    if (duplicateCheck.isDuplicate && options.onDuplicateFound) {
      const resolution = await options.onDuplicateFound(duplicateCheck);
      if (resolution === "cancel") return;

      if (resolution === "upgrade") {
        const success = await duplicateService.upgradeExistingCall(
          duplicateCheck.existingCall.callid,
          {
            addAudio: !!options.audioFile,
            addTranscription: !!options.transcriptionText,
          }
        );
        if (success) {
          options.onCallUploaded?.(duplicateCheck.existingCall.callid);
          return;
        }
      }
    }

    // 3. Upload via service
    let audioUrl = null;
    let filePath = null;
    if (options.audioFile) {
      filePath = await storageService.uploadAudio(options.audioFile);
      audioUrl = await storageService.generateSignedUrl(filePath);
    }

    // 4. Création via service
    const callData = {
      filename: options.audioFile?.name || options.workdriveFileName,
      description: options.description,
      audioFile: options.audioFile ? { path: filePath, url: audioUrl } : null,
      transcription: options.transcriptionText
        ? JSON.parse(options.transcriptionText)
        : null,
    };

    const call = await callService.createCall(callData);
    options.onCallUploaded?.(call.id);
  } catch (error) {
    console.error("Erreur dans handleCallSubmission:", error);
    throw error;
  }
};
```

### ✅ Tests pour Phase 1

#### Tests unitaires des services

```typescript
// __tests__/domain/services/CallService.test.ts
describe("CallService", () => {
  let callService: CallService;
  let mockRepository: jest.Mocked<CallRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      // ... autres mocks
    };
    callService = new CallService(mockRepository);
  });

  test("should create call successfully", async () => {
    const callData = { filename: "test.mp3", description: "Test call" };
    mockRepository.save.mockResolvedValueOnce();

    const result = await callService.createCall(callData);

    expect(result).toBeInstanceOf(Call);
    expect(mockRepository.save).toHaveBeenCalledWith(expect.any(Call));
  });

  test("should update call origin", async () => {
    mockRepository.updateOrigin.mockResolvedValueOnce();

    await callService.updateCallOrigin("call-123", "workdrive");

    expect(mockRepository.updateOrigin).toHaveBeenCalledWith(
      "call-123",
      "workdrive"
    );
  });
});
```

### 📋 Checklist Phase 1

- [ ] Créer tous les services dans `domain/services/`
- [ ] Créer les interfaces repository dans `domain/repositories/`
- [ ] Créer les entités dans `domain/entities/`
- [ ] Créer les implémentations Supabase dans `infrastructure/supabase/`
- [ ] Refactoriser `callApiUtils.tsx` pour utiliser les services
- [ ] Écrire tests unitaires pour tous les services
- [ ] Vérifier que l'UI fonctionne identiquement (tests E2E)
- [ ] Supprimer les anciens fichiers utils (`removeCallUpload.tsx`, `updateCallOrigine.tsx`, etc.)

---

## Phase 2 : Workflows et Orchestration (1-2 semaines)

### Objectif

Créer des workflows clairs pour orchestrer les services et simplifier la logique.

### 📁 Nouveaux fichiers

#### 2.1 Workflows

**`domain/workflows/ImportWorkflow.ts`**

```typescript
export class ImportWorkflow {
  constructor(
    private callService: CallService,
    private transcriptionService: TranscriptionService,
    private duplicateService: DuplicateService,
    private storageService: StorageService
  ) {}

  async execute(
    data: ImportData,
    callbacks?: ImportCallbacks
  ): Promise<ImportResult> {
    try {
      // 1. Validation
      if (data.transcriptionText) {
        const validation =
          await this.transcriptionService.validateTranscription(
            data.transcriptionText
          );
        if (!validation.isValid) {
          throw new ValidationError(validation.error);
        }
      }

      // 2. Détection doublons
      const duplicateCheck = await this.duplicateService.checkForDuplicates({
        filename: data.audioFile?.name,
        description: data.description,
        transcriptionText: data.transcriptionText,
      });

      if (duplicateCheck.isDuplicate) {
        const resolution = await this.handleDuplicateResolution(
          duplicateCheck,
          callbacks
        );
        if (resolution.action === "cancel") {
          return { success: false, reason: "cancelled" };
        }
        if (resolution.action === "upgrade") {
          return await this.handleUpgrade(duplicateCheck, data);
        }
      }

      // 3. Import normal
      return await this.createNewCall(data);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async createNewCall(data: ImportData): Promise<ImportResult> {
    // Upload fichier si nécessaire
    let audioFile = null;
    if (data.audioFile) {
      const filePath = await this.storageService.uploadAudio(data.audioFile);
      const audioUrl = await this.storageService.generateSignedUrl(filePath);
      audioFile = { path: filePath, url: audioUrl };
    }

    // Création de l'appel
    const callData = {
      filename: data.audioFile?.name || data.workdriveFileName,
      description: data.description,
      audioFile,
      transcription: data.transcriptionText
        ? JSON.parse(data.transcriptionText)
        : null,
    };

    const call = await this.callService.createCall(callData);

    return {
      success: true,
      callId: call.id,
      message: this.generateSuccessMessage(data),
    };
  }

  private generateSuccessMessage(data: ImportData): string {
    const parts = [];
    if (data.audioFile) parts.push("audio");
    if (data.transcriptionText) parts.push("transcription");
    return `Import réussi: ${parts.join(" + ")}`;
  }
}
```

**`domain/workflows/PreparationWorkflow.ts`**

```typescript
export class PreparationWorkflow {
  constructor(
    private callService: CallService,
    private transcriptionService: TranscriptionService
  ) {}

  async prepareForTagging(
    call: Call,
    strategy: PreparationStrategy = "standard"
  ): Promise<PreparationResult> {
    switch (strategy) {
      case "standard":
        return this.standardPreparation(call);
      case "bulk":
        return this.bulkPreparation([call]);
      case "ai-analysis": // 🆕 Futur
        return this.aiAnalysisPreparation(call);
      default:
        throw new Error(`Unknown preparation strategy: ${strategy}`);
    }
  }

  private async standardPreparation(call: Call): Promise<PreparationResult> {
    if (!call.hasTranscription()) {
      throw new Error("Call must have transcription for preparation");
    }

    // Traitement de la transcription
    const processedTranscription =
      await this.transcriptionService.processTranscription(call.transcription);

    // Marquer comme préparé
    await this.callService.markAsPrepared(call.id);

    return {
      success: true,
      callId: call.id,
      strategy: "standard",
      wordCount: processedTranscription.wordCount,
    };
  }
}
```

### 🔧 Modifications

#### 2.1 Simplifier `callApiUtils.tsx`

```typescript
// callApiUtils.tsx - VERSION WORKFLOW
import { ImportWorkflow } from "../domain/workflows/ImportWorkflow";
import { createServices } from "../infrastructure/ServiceFactory"; // Nouveau

export const handleCallSubmission = async (
  options: HandleCallSubmissionOptions
) => {
  try {
    const services = createServices(); // Factory pour créer les services
    const workflow = new ImportWorkflow(
      services.callService,
      services.transcriptionService,
      services.duplicateService,
      services.storageService
    );

    const result = await workflow.execute(
      {
        audioFile: options.audioFile,
        description: options.description,
        transcriptionText: options.transcriptionText,
        workdriveFileName: options.workdriveFileName,
      },
      {
        onDuplicateFound: options.onDuplicateFound,
        showMessage: options.showMessage,
      }
    );

    if (result.success) {
      options.onCallUploaded?.(result.callId!);
      options.showMessage(result.message!);
    } else {
      if (result.error) {
        throw new Error(result.error);
      }
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";
    options.showMessage(`Erreur: ${errorMessage}`);
    throw error;
  }
};
```

#### 2.2 Service Factory

**`infrastructure/ServiceFactory.ts`**

```typescript
export const createServices = () => {
  const callRepository = new SupabaseCallRepository();
  const storageRepository = new SupabaseStorageRepository();

  return {
    callService: new CallService(callRepository),
    transcriptionService: new TranscriptionService(),
    duplicateService: new DuplicateService(callRepository),
    storageService: new StorageService(storageRepository),
  };
};
```

### 📋 Checklist Phase 2

- [ ] Créer `ImportWorkflow` et `PreparationWorkflow`
- [ ] Créer `ServiceFactory` pour l'injection de dépendances
- [ ] Remplacer la logique de `handleCallSubmission` par le workflow
- [ ] Tester que les workflows fonctionnent correctement
- [ ] Vérifier la compatibilité avec l'UI existante
- [ ] Écrire tests d'intégration pour les workflows

---

## Phase 3 : Séparation Infrastructure (1-2 semaines)

### Objectif

Séparer complètement l'infrastructure (Supabase, Zoho) du code métier et préparer l'ajout de nouvelles intégrations.

### 📁 Structure infrastructure

**`infrastructure/supabase/SupabaseCallRepository.ts`**

```typescript
export class SupabaseCallRepository implements CallRepository {
  async save(call: Call): Promise<void> {
    const { error } = await supabase.from("call").insert([
      {
        callid: call.id,
        filename: call.filename,
        description: call.description,
        transcription: call.transcription?.toJSON(),
        upload: call.hasAudio(),
        is_tagging_call: true,
      },
    ]);

    if (error) {
      throw new RepositoryError(`Failed to save call: ${error.message}`);
    }
  }

  async findById(id: string): Promise<Call | null> {
    const { data, error } = await supabase
      .from("call")
      .select("*")
      .eq("callid", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new RepositoryError(`Failed to find call: ${error.message}`);
    }

    return this.mapToCall(data);
  }

  private mapToCall(data: any): Call {
    return new Call(
      data.callid,
      data.filename,
      data.description,
      data.status || "draft",
      data.origine,
      data.filepath ? new AudioFile(data.filepath, data.audiourl) : undefined,
      data.transcription
        ? new Transcription(data.transcription.words)
        : undefined
    );
  }
}
```

**`infrastructure/zoho/ZohoWorkdriveService.ts`**

```typescript
export class ZohoWorkdriveService implements FileProviderService {
  constructor(private accessToken: string) {}

  async listFiles(folderId: string): Promise<FileInfo[]> {
    // Code extrait de SimpleWorkdriveExplorer
  }

  async downloadFile(fileId: string): Promise<File> {
    // Code extrait de fileHelpers.tsx
  }

  async searchFiles(query: string, folderId?: string): Promise<FileInfo[]> {
    // Code extrait de useWorkdriveSearch.tsx
  }
}
```

**`infrastructure/transcription-ai/` (préparation futur)**

```typescript
// infrastructure/transcription-ai/TranscriptionProviderInterface.ts
export interface TranscriptionProvider {
  name: string;
  transcribe(audioFile: AudioFile): Promise<Transcription>;
  getCapabilities(): TranscriptionCapabilities;
  isAvailable(): Promise<boolean>;
}

// infrastructure/transcription-ai/WhisperProvider.ts (FUTUR)
export class WhisperProvider implements TranscriptionProvider {
  name = "Whisper API";

  async transcribe(audioFile: AudioFile): Promise<Transcription> {
    // Intégration avec API Whisper
    const response = await fetch("/api/transcription/whisper", {
      method: "POST",
      body: createFormData(audioFile),
    });

    const result = await response.json();
    return new Transcription(result.words);
  }

  async isAvailable(): Promise<boolean> {
    return process.env.NEXT_PUBLIC_WHISPER_API_KEY !== undefined;
  }
}
```

### 🔧 Configuration centralisée

**`shared/config/CallsConfig.ts`**

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
      allowEmptyText: false,
      maxWords: 50000,
    },
    autoTranscription: {
      enabled: false, // Feature flag
      provider: "whisper",
      confidence: 0.8,
      maxDuration: 3600, // 1 hour
    },
  },

  duplicateDetection: {
    enabled: true,
    strategies: ["filename", "contentHash", "description"],
    contentHashDepth: 3, // Nb mots début/fin pour hash
  },

  preparation: {
    defaultStrategy: "standard",
    strategies: {
      standard: { timeout: 30000 },
      bulk: { batchSize: 10, timeout: 60000 },
      aiAnalysis: { enabled: false, timeout: 120000 },
    },
  },
} as const;
```

### 📋 Checklist Phase 3

- [ ] Créer toutes les implémentations dans `infrastructure/`
- [ ] Créer la configuration centralisée
- [ ] Modifier les services pour utiliser les interfaces
- [ ] Tester l'isolation infrastructure/domain
- [ ] Préparer les interfaces pour futures intégrations (IA)
- [ ] Vérifier les performances (pas de régression)

---

## Phase 4 : UI Pure et Nouvelles Fonctionnalités (2-3 semaines)

### Objectif

Séparer complètement l'UI de la logique métier et ajouter les nouvelles fonctionnalités.

### 📁 Structure UI pure

**`ui/pages/CallImportPage.tsx`**

```typescript
export const CallImportPage = () => {
  const { importCall, isImporting } = useCallImport();
  const { showMessage } = useNotifications();

  const handleImport = async (data: ImportFormData) => {
    try {
      const result = await importCall(data);
      showMessage(result.message, "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Import d'appels" />
      <ImportForm
        onSubmit={handleImport}
        loading={isImporting}
        supportedFormats={CallsConfig.storage.allowedFormats}
      />
    </PageContainer>
  );
};
```

**`ui/hooks/useCallImport.ts`**

```typescript
export const useCallImport = () => {
  const [isImporting, setIsImporting] = useState(false);

  const importCall = async (data: ImportFormData): Promise<ImportResult> => {
    setIsImporting(true);
    try {
      const services = createServices();
      const workflow = new ImportWorkflow(
        services.callService,
        services.transcriptionService,
        services.duplicateService,
        services.storageService
      );

      return await workflow.execute(data);
    } finally {
      setIsImporting(false);
    }
  };

  return { importCall, isImporting };
};
```

### 🆕 Nouvelles fonctionnalités

#### 4.1 Transcription automatique

**`domain/services/AutoTranscriptionService.ts`**

```typescript
export class AutoTranscriptionService {
  constructor(private providers: TranscriptionProvider[]) {}

  async transcribeAudio(audioFile: AudioFile): Promise<TranscriptionResult> {
    // Sélectionner le meilleur provider disponible
    const provider = await this.selectBestProvider(audioFile);

    if (!provider) {
      throw new Error("No transcription provider available");
    }

    const result = await provider.transcribe(audioFile);

    return {
      transcription: result,
      provider: provider.name,
      confidence: result.confidence,
      duration: result.duration,
    };
  }

  private async selectBestProvider(
    audioFile: AudioFile
  ): Promise<TranscriptionProvider | null> {
    for (const provider of this.providers) {
      if ((await provider.isAvailable()) && provider.canHandle(audioFile)) {
        return provider;
      }
    }
    return null;
  }
}
```

**`ui/components/AutoTranscriptionToggle.tsx`**

```typescript
export const AutoTranscriptionToggle = ({
  onToggle,
  enabled,
}: AutoTranscriptionToggleProps) => {
  const { isAvailable, providers } = useAutoTranscription();

  if (!isAvailable) {
    return (
      <Alert severity="info">
        Transcription automatique non disponible. Configurez une clé API pour
        l'activer.
      </Alert>
    );
  }

  return (
    <FormControlLabel
      control={
        <Switch
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
        />
      }
      label={
        <Box>
          <Typography>Transcription automatique</Typography>
          <Typography variant="caption" color="textSecondary">
            Providers disponibles: {providers.join(", ")}
          </Typography>
        </Box>
      }
    />
  );
};
```

#### 4.2 Types de préparation multiples

**`ui/components/PreparationStrategySelector.tsx`**

```typescript
export const PreparationStrategySelector = ({
  onStrategyChange,
  selectedStrategy,
}: Props) => {
  const strategies = [
    {
      value: "standard",
      label: "Préparation standard",
      description: "Traitement classique de la transcription",
    },
    {
      value: "bulk",
      label: "Préparation en lot",
      description: "Optimisée pour traiter plusieurs appels",
    },
    {
      value: "ai-analysis",
      label: "Avec pré-analyse IA",
      description: "Analyse préliminaire automatique",
      disabled: !CallsConfig.preparation.strategies.aiAnalysis.enabled,
    },
  ];

  return (
    <FormControl fullWidth>
      <InputLabel>Type de préparation</InputLabel>
      <Select
        value={selectedStrategy}
        onChange={(e) =>
          onStrategyChange(e.target.value as PreparationStrategy)
        }
      >
        {strategies.map((strategy) => (
          <MenuItem
            key={strategy.value}
            value={strategy.value}
            disabled={strategy.disabled}
          >
            <Box>
              <Typography>{strategy.label}</Typography>
              <Typography variant="caption" color="textSecondary">
                {strategy.description}
              </Typography>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
```

#### 4.3 Analyse automatique de base

**`domain/services/CallAnalysisService.ts`**

```typescript
export class CallAnalysisService {
  async analyzeCall(call: Call): Promise<CallAnalysis> {
    if (!call.hasTranscription()) {
      throw new Error("Call must have transcription for analysis");
    }

    const analysis: CallAnalysis = {
      callId: call.id,
      duration: call.transcription!.getDuration(),
      speakers: call.transcription!.getSpeakers(),
      wordCount: call.transcription!.getWordCount(),
      sentimentScore: await this.calculateSentiment(call.transcription!),
      keywords: await this.extractKeywords(call.transcription!),
      qualityIndicators: await this.calculateQuality(call.transcription!),
    };

    return analysis;
  }

  private async calculateSentiment(
    transcription: Transcription
  ): Promise<SentimentScore> {
    // Analyse de sentiment basique (peut être remplacée par IA)
    const words = transcription.getAllWords();
    const positiveWords = this.countWords(words, POSITIVE_KEYWORDS);
    const negativeWords = this.countWords(words, NEGATIVE_KEYWORDS);

    return {
      positive: positiveWords / words.length,
      negative: negativeWords / words.length,
      neutral: 1 - (positiveWords + negativeWords) / words.length,
    };
  }
}
```

### 📋 Checklist Phase 4

- [ ] Créer la structure UI pure dans `ui/`
- [ ] Implémenter les hooks UI séparés de la logique métier
- [ ] Ajouter le service de transcription automatique
- [ ] Créer les différents types de préparation
- [ ] Implémenter l'analyse de base des appels
- [ ] Ajouter les composants UI pour les nouvelles fonctionnalités
- [ ] Tester toutes les nouvelles fonctionnalités
- [ ] Mettre à jour la documentation

---

## 🧪 Stratégie de Tests

### Tests par phase

#### Phase 1 : Tests unitaires services

```typescript
// Exemple de structure de test
describe("CallService", () => {
  describe("createCall", () => {
    it("should create call with audio and transcription", async () => {
      // Test complet
    });

    it("should handle transcription-only calls", async () => {
      // Test edge case
    });

    it("should validate required fields", async () => {
      // Test validation
    });
  });
});
```
