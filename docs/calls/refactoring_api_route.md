# Plan de refactoring DDD - Module Calls (CORRIGÉ)

## Problème architectural identifié

**Services externes (OpenAI/AssemblyAI) initialisés côté client** → Risques de sécurité + erreurs d'initialisation

## Principe DDD : Modification infrastructure SEULEMENT

En respectant l'architecture DDD, seule la **couche infrastructure** doit changer. La couche UI et Domain restent intactes.

## 1. Modifications UNIQUEMENT dans infrastructure/

```
src/components/calls/
├── domain/ (✅ INCHANGÉ)
├── ui/ (✅ INCHANGÉ - vos hooks et composants existants)
└── infrastructure/ (🔄 SEULE COUCHE À MODIFIER)
    ├── supabase/ (✅ conservé)
    ├── api/ (🆕 nouveaux clients API)
    └── external/ (❌ supprimé - OpenAI/AssemblyAI côté serveur)
```

## 2. Fichiers à SUPPRIMER (côté client)

### ❌ Services externes dangereux

```
infrastructure/diarization/AssemblyAIDiarizationProvider.ts
infrastructure/transcription/OpenAITranscriptionService.ts
infrastructure/transcription/OpenAIWhisperProvider.ts
infrastructure/ServiceFactory.ts (partie externe)
```

### ❌ Hooks qui appellent services externes

```
ui/hooks/useCallTranscriptionActions.ts
ui/hooks/useCallStatistics.ts (version complète)
```

## 3. Fichiers à CRÉER

### 🆕 API Routes serveur (pages/api/)

**Nouvelles routes pour transcription/diarisation :**

```
pages/api/calls/transcribe.ts
pages/api/calls/diarize.ts
pages/api/calls/prepare-batch.ts
pages/api/calls/stats.ts
```

**Routes existantes (classifiers) - À PRÉSERVER :**

```
pages/api/openai/classifier.ts (ou similaire)
pages/api/analysis/classify.ts (ou similaire)
```

**Note :** Séparer les routes transcription des classifiers pour maintenir la logique métier distincte.

### 🆕 Services API côté client (infrastructure/api/)

```
infrastructure/api/TranscriptionApiService.ts
infrastructure/api/DiarizationApiService.ts
infrastructure/api/CallsApiService.ts
infrastructure/api/BaseApiService.ts
```

### 🆕 Workflows métier (domain/workflows/)

```
domain/workflows/CallPreparationWorkflow.ts
domain/workflows/TranscriptionWorkflow.ts
domain/workflows/ValidationWorkflow.ts
```

### 🆕 UI restructuré (ui/)

```
ui/components/CallImportCard.tsx
ui/components/CallPreparationPanel.tsx
ui/components/TranscriptionStatus.tsx
ui/hooks/useCallPreparation.ts
ui/hooks/useCallImport.ts
ui/hooks/useBasicCallStatistics.ts (safe)
ui/pages/CallImportPage.tsx
ui/pages/CallManagementPage.tsx
ui/pages/CallPreparationPage.tsx
```

## 4. Fichiers à MODIFIER

### 🔄 Configuration

- **lib/config/callsConfig.ts** → Séparer config client/serveur
- **.env.local** → Garder seulement variables publiques côté client

### 🔄 Pages existantes

- **app/(protected)/calls/page.tsx** → Utiliser nouveaux hooks API
- **components/calls/CallImporter.tsx** → Migrer vers ui/components/
- **components/calls/CallPreparation.tsx** → Migrer vers ui/components/

### 🔄 Hooks existants

- **useCallStatistics.ts** → Version safe uniquement (déjà fait)
- **useBulkActions.tsx** → Adapter aux nouveaux services API

## 5. Détail des modifications par fichier

### A. Pages API à créer

#### `pages/api/calls/transcribe.ts` (nouvelle route dédiée)

```typescript
import { NextApiRequest, NextApiResponse } from "next";
import { OpenAIWhisperProvider } from "@/components/calls/infrastructure/asr/OpenAIWhisperProvider";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Service de transcription côté serveur
  const whisperProvider = new OpenAIWhisperProvider(process.env.OPENAI_API_KEY);

  const { audioUrl, options } = req.body;

  try {
    const result = await whisperProvider.transcribeAudio(audioUrl, options);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

#### `pages/api/calls/diarize.ts` (nouvelle route dédiée)

```typescript
import { AssemblyAIDiarizationProvider } from "@/components/calls/infrastructure/diarization/AssemblyAIDiarizationProvider";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const diarizationProvider = new AssemblyAIDiarizationProvider(
    process.env.ASSEMBLYAI_API_KEY
  );

  // Logique de diarisation côté serveur
}
```

**Note importante :** Ces nouvelles routes sont distinctes de vos routes classifiers existantes.

### B. Services API côté client

#### `infrastructure/api/TranscriptionApiService.ts`

```typescript
export class TranscriptionApiService {
  async transcribeCall(callId: string) {
    const response = await fetch("/api/calls/transcribe", {
      method: "POST",
      body: JSON.stringify({ callId }),
    });
    return response.json();
  }

  async getTranscriptionStatus(jobId: string) {
    // Polling du statut
  }
}
```

### C. Hooks révisés avec séparation des responsabilités

#### `ui/hooks/useCallTranscription.ts` (pour transcription)

```typescript
export const useCallTranscription = () => {
  const [isTranscribing, setIsTranscribing] = useState(false);

  const transcribeCall = async (callId: string) => {
    // Appel à la nouvelle route /api/calls/transcribe
    const result = await fetch("/api/calls/transcribe", {
      method: "POST",
      body: JSON.stringify({ callId }),
    });
    return result.json();
  };

  return { transcribeCall, isTranscribing };
};
```

#### `ui/hooks/useCallAnalysis.ts` (pour classifiers - NOUVEAU)

```typescript
export const useCallAnalysis = () => {
  const classifyTurn = async (verbatim: string) => {
    // Utilise vos routes classifiers existantes
    const result = await fetch("/api/openai/classifier", {
      method: "POST",
      body: JSON.stringify({ verbatim }),
    });
    return result.json();
  };

  return { classifyTurn };
};
```

**Note :** Cette approche sépare clairement :

- **Transcription** : Transformation audio → texte (nouvelles routes)
- **Classification** : Analyse sémantique du texte (routes existantes)

## 6. Variables d'environnement à restructurer

### `.env.local` (client - publiques seulement)

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# PAS de clés API externes
```

### `.env.local` (serveur - privées)

```bash
OPENAI_API_KEY=sk-...
ASSEMBLYAI_API_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 5. Ordre de refactoring respectant le DDD

### Phase 1 - API Routes serveur (0.5 jour)

1. Créer `pages/api/calls/transcribe.ts` (OpenAI côté serveur)
2. Créer `pages/api/calls/diarize.ts` (AssemblyAI côté serveur)
3. Tester les routes avec Postman/curl

### Phase 2 - Clients API (0.5 jour)

1. Créer `infrastructure/api/TranscriptionApiClient.ts`
2. Créer `infrastructure/api/DiarizationApiClient.ts`
3. Créer `infrastructure/api/BaseApiClient.ts`

### Phase 3 - Modification ServiceFactory (0.5 jour)

1. **Remplacer** dans `ServiceFactory.ts` :

   ```typescript
   // Ancienne instanciation directe
   this.diarizationProvider = new AssemblyAIDiarizationProvider(...)

   // Nouvelle instanciation via API
   this.diarizationProvider = new DiarizationApiClient(...)
   ```

2. **Supprimer** les imports des anciens providers
3. **Tester** - vos hooks UI continuent de fonctionner !

### Phase 4 - Cleanup (0.5 jour)

1. Supprimer `infrastructure/asr/OpenAIWhisperProvider.ts` (version client)
2. Supprimer `infrastructure/diarization/AssemblyAIDiarizationProvider.ts` (version client)
3. Tests de régression

## Résumé architectural

**AVANT** : UI → ServiceFactory → Provider direct (côté client) ❌

**APRÈS** : UI → ServiceFactory → ApiClient → API Route → Provider (côté serveur) ✅

**Total estimé : 2 jours maximum**

La couche UI reste 100% intacte car les interfaces des services restent identiques.
