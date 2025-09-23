# 🎙️ Roadmap Transcription & Diarisation Automatique - TaggerLPL

## État Actualisé - Septembre 2025

---

## 📋 État Actuel de l'Implémentation

### ✅ **COMPLET** - Ce qui est entièrement fonctionnel

#### 1. **Architecture DDD Complète et Opérationnelle**

- ✅ **Entités Domain** : `Call`, `CallExtended`, `AudioFile`, `Transcription`, `TranscriptionWord`
  - `CallExtended` avec cycle de vie workflow intégré
  - Support complet des flags `preparedfortranscript`, `is_tagging_call`, `isTagged`
  - Factory methods pour création depuis base de données
- ✅ **Services Métier Complets** :
  - `CallService`, `CallLifecycleService`, `ValidationService`
  - `TranscriptionTransformationService` (JSON → table word)
  - `CallFilteringService` (filtrage avancé)
  - `DuplicateService`, `StorageService`
- ✅ **Repositories Supabase** :
  - `SupabaseCallRepository` avec méthodes workflow enrichies
  - `SupabaseStorageRepository` avec gestion URLs signées
  - `SupabaseRelationsRepository` pour statistiques next_turn
- ✅ **ServiceFactory** :
  - Factory pattern avec injection de dépendances
  - Service composé `callPreparationService`
  - Configuration et health checks

#### 2. **Base de Données & Stockage Opérationnels**

```sql
-- Tables existantes et optimisées
✅ call (callid, filename, filepath, transcription, preparedfortranscript, is_tagging_call)
✅ transcript (callid, transcriptid)
✅ word (transcriptid, word, startTime, endTime, speaker, turn)
✅ lpltag (label, family, originespeaker, color, icon)
✅ turntagged (call_id, start_time, end_time, tag, verbatim, speaker, next_turn_tag)

-- Vues optimisées créées
✅ call_with_tagging_status (jointure call + turntagged pour performances)
✅ call_relations_stats (statistiques next_turn pré-calculées)
```

#### 3. **UI & Workflow Avancés**

- ✅ **CallManagementPage** : Interface complète avec onglets multiples
- ✅ **TranscriptLPL** : Lecteur synchronisé avec tagging interactif
- ✅ **TagManager** : Gestion avancée des tags avec statistiques
- ✅ **Analysis** : Centre d'analyse conversationnelle
- ✅ **Hooks Optimisés** : `useUnifiedCallManagement`, `useCallTranscriptionActions`
- ✅ **Cache Intelligent** : Système multi-niveaux avec invalidation
- ✅ **Actions en Lot** : Sélection multiple, traitement par batch

#### 4. **Services de Transformation Fonctionnels**

- ✅ **TranscriptionTransformationService** :
  - Validation complète de la structure JSON
  - Transformation JSON → entités `TranscriptionWord`
  - Insertion par batch dans table `word` via `transcript`
  - Gestion des erreurs et rollback
  - Statistiques de transformation
- ✅ **CallLifecycleService** :
  - Gestion du cycle de vie complet des appels
  - Actions : prepare, select, unselect, tag
  - Validation des règles métier
  - Statistiques par étape du workflow

---

## 🚧 **EN COURS** - Ce qui est partiellement implémenté

### Phase 1 : Infrastructure ASR & Diarisation (70% complété)

#### A. Provider OpenAI Whisper (✅ Structure, ⚠️ Intégration)

```typescript
// ✅ IMPLÉMENTÉ : src/components/calls/infrastructure/asr/OpenAIWhisperProvider.ts
export class OpenAIWhisperProvider {
  constructor(private apiKey: string, private baseUrl: string) {}

  async transcribeAudio(
    fileUrl: string,
    options: OpenAIWhisperOptions = {}
  ): Promise<any> {
    // ✅ Téléchargement audio depuis URL signée
    // ✅ Appel API OpenAI /v1/audio/transcriptions
    // ✅ Format "verbose_json" pour timestamps
    // ✅ Gestion d'erreurs robuste
  }
}

// ⚠️ MANQUE : Configuration environnement et tests
// - Variables ENV : OPENAI_API_KEY, OPENAI_BASE_URL
// - Tests d'intégration avec différents formats audio
// - Gestion des quotas et rate limiting
```

#### B. Provider Diarisation Externe (✅ Interface, ⚠️ Implémentation)

```typescript
// ✅ IMPLÉMENTÉ : src/components/calls/infrastructure/diarization/ExternalDiarizationProvider.ts
export interface IDiarizationProvider {
  inferSpeakers(
    fileUrl: string,
    options?: ExternalDiarizationOptions
  ): Promise<DiarizationSegment[]>;
}

export class ExternalDiarizationProvider implements IDiarizationProvider {
  // ⚠️ ACTUEL : Mock implementation avec segments simulés
  // 🔄 TODO : Intégration réelle avec AssemblyAI/Pyannote
}

// Options à évaluer :
// 1. AssemblyAI (API simple, 0.07$/min) - RECOMMANDÉ
// 2. Pyannote.audio (gratuit mais complexe à déployer)
// 3. Deepgram (0.15$/min, très précis)
```

#### C. Service ASR Intégré (✅ Base, ⚠️ Finalisation)

```typescript
// ✅ IMPLÉMENTÉ : src/components/calls/domain/services/TranscriptionASRService.ts
export class TranscriptionASRService {
  // ✅ normalize() : OpenAI JSON → format TaggerLPL
  // ✅ assignTurns() : Application diarisation → mots
  // ✅ validateAll() : Validation cohérence
  // ✅ insertTag(), splitAt(), mergeRange() : Édition
  // ⚠️ EN COURS : Optimisation algorithmes alignement temporel
  // ⚠️ TODO : Gestion des cas limites (chevauchements, silences)
}
```

### Phase 2 : Workflow ASR Complet (✅ Architecture, ⚠️ Tests)

```typescript
// ✅ IMPLÉMENTÉ : src/components/calls/domain/workflows/TranscriptionASRWorkflow.ts
export class TranscriptionASRWorkflow {
  // ✅ transcribe() : Audio → JSON normalisé → sauvegarde
  // ✅ diarize() : Audio → segments → assignation speakers
  // ✅ validateAndSave() : Validation finale + persistence
  // ⚠️ EN COURS : Tests end-to-end avec vrais providers
  // ⚠️ TODO : Gestion des erreurs réseau et timeouts
}
```

---

## ❌ **À IMPLÉMENTER** - Ce qui reste à faire

### Sprint 1 : Finalisation Infrastructure (1-2 semaines)

#### 1. **Configuration & Déploiement Provider OpenAI**

- [ ] Variables d'environnement (`OPENAI_API_KEY`)
- [ ] Tests avec différents formats audio (mp3, wav, m4a)
- [ ] Gestion quotas et rate limiting
- [ ] Monitoring coûts (~0.006$/minute)

#### 2. **Choix & Intégration Provider Diarisation**

**Option recommandée : AssemblyAI**

```typescript
// À créer : AssemblyAIDiarizationProvider.ts
export class AssemblyAIDiarizationProvider implements IDiarizationProvider {
  async inferSpeakers(audioUrl: string): Promise<DiarizationSegment[]> {
    // 1. Upload vers AssemblyAI
    // 2. Lancer transcription + diarisation
    // 3. Polling résultats
    // 4. Extraction segments speakers
  }
}
```

- [ ] Intégration API AssemblyAI
- [ ] Configuration variables ENV
- [ ] Tests qualité diarisation
- [ ] Calcul coûts (~0.07$/minute)

### Sprint 2 : Interface Utilisateur Automatique (1-2 semaines)

#### 1. **Intégration UI CallManagementPage**

```typescript
// À modifier : src/components/calls/ui/hooks/actions/useCallTranscriptionActions.ts
export function useCallTranscriptionActions({ reload }: Props) {
  const { asrWorkflow } = createServices();

  const autoTranscribe = useCallback(
    async (calls: Call[]) => {
      for (const call of calls) {
        // ✅ Service disponible, ❌ intégration UI manquante
        const result = await asrWorkflow.transcribe(call.id);
        // TODO: Feedback utilisateur, gestion erreurs
      }
      await reload();
    },
    [asrWorkflow, reload]
  );

  const separateSpeakers = useCallback(
    async (calls: Call[]) => {
      for (const call of calls) {
        // ❌ À implémenter
        const result = await asrWorkflow.diarize(call.id);
      }
      await reload();
    },
    [asrWorkflow, reload]
  );

  // ❌ validateTranscriptions déjà implémenté côté service
}
```

#### 2. **Composants de Progression**

```typescript
// À créer : src/components/calls/ui/components/TranscriptionProgress.tsx
export const TranscriptionProgress: React.FC<{
  callId: string;
  stage: "transcribing" | "diarizing" | "validating" | "complete";
  progress: number;
}> = ({ callId, stage, progress }) => {
  // ❌ Interface de progression temps réel
  // ❌ Estimation temps restant
  // ❌ Gestion annulation/retry
};
```

#### 3. **Boutons d'Action CallManagementPage**

```typescript
// À modifier : src/components/calls/ui/sections/CMActionsBar.tsx
case "transcription":
  return (
    <Box display="flex" gap={1} flexWrap="wrap">
      {/* ❌ Intégration réelle avec services */}
      <Button onClick={() => transcription.autoTranscribe(selectedCalls)}>
        🎙️ Transcrire Auto ({selectedCount})
      </Button>

      <Button onClick={() => transcription.separateSpeakers(selectedCalls)}>
        👥 Séparer Locuteurs
      </Button>

      {/* ✅ Validation déjà implémentée */}
      <Button onClick={() => transcription.validateTranscriptions(selectedCalls)}>
        ✅ Valider & Corriger
      </Button>
    </Box>
  );
```

### Sprint 3 : Optimisations & Production (1 semaine)

#### 1. **Performance & Parallélisation**

- [ ] Traitement par lots optimisé (5 appels max en parallèle)
- [ ] Queue system pour gros volumes
- [ ] Cache résultats ASR/Diarisation
- [ ] Compression JSON transcriptions

#### 2. **Monitoring & Observabilité**

- [ ] Logs structurés pour chaque étape
- [ ] Métriques performance (temps, coûts, précision)
- [ ] Alertes erreurs providers externes
- [ ] Dashboard monitoring temps réel

#### 3. **Gestion d'Erreurs Robuste**

- [ ] Retry automatique avec backoff exponential
- [ ] Fallback sur échec provider (OpenAI → local Whisper?)
- [ ] Notification utilisateur erreurs persistantes
- [ ] Recovery automatique après panne

---

## 🎯 Métriques de Performance Cibles

### Fonctionnel

- ✅ **Vitesse transformation** : < 500ms (JSON → table word)
- ⚠️ **Vitesse transcription** : < 0.3x temps réel (objectif, non testé)
- ❌ **Précision Whisper** : > 95% WER (à mesurer)
- ❌ **Précision diarisation** : > 85% SER (à mesurer)

### Économique

- ❌ **Coût par appel** : < 0.10€ (transcription + diarisation)
- ❌ **Coût OpenAI** : ~0.006$/minute (à valider)
- ❌ **Coût diarisation** : ~0.07$/minute AssemblyAI

### Technique

- ✅ **Disponibilité services** : 99% (Supabase + infrastructure)
- ❌ **Uptime providers** : 99% (OpenAI + AssemblyAI)
- ✅ **Temps réponse API** : < 200ms (services internes)

---

## 📊 Comparatif Providers de Diarisation

| Provider       | Coût       | Qualité    | Facilité   | Recommandation   | État           |
| -------------- | ---------- | ---------- | ---------- | ---------------- | -------------- |
| AssemblyAI     | ~0.07$/min | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ✅**Recommandé** | ❌ À intégrer  |
| Pyannote.audio | Gratuit    | ⭐⭐⭐⭐⭐ | ⭐⭐       | Budget serré     | ❌ Non évalué  |
| Deepgram       | ~0.15$/min | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | Si budget élevé  | ❌ Non évalué  |
| Mockée         | Gratuit    | ⭐         | ⭐⭐⭐⭐⭐ | Dev uniquement   | ✅ Implémentée |

---

## 🚀 Plan d'Implémentation Recommandé

### Phase 1 : Providers Externes (2-3 semaines)

**Priorité : HAUTE**

1. **Semaine 1** : Configuration OpenAI Whisper
   - Variables d'environnement production
   - Tests formats audio (mp3, wav, m4a, aac)
   - Validation qualité transcription français
   - Monitoring coûts et quotas
2. **Semaine 2** : Intégration AssemblyAI
   - Configuration compte + API key
   - Implémentation `AssemblyAIDiarizationProvider`
   - Tests qualité diarisation 2-5 speakers
   - Validation alignement temporal avec Whisper
3. **Semaine 3** : Tests End-to-End
   - Workflow complet Audio → Transcription → Diarisation
   - Validation avec corpus test (10-20 appels)
   - Optimisation alignement temporel
   - Correction des cas limites

### Phase 2 : Interface Utilisateur (1-2 semaines)

**Priorité : MOYENNE**

1. **Intégration boutons UI** (3-4 jours)
   - Modification `useCallTranscriptionActions`
   - Ajout boutons `CMActionsBar`
   - Intégration workflow ASR réels
   - Tests utilisateur basiques
2. **Composants de progression** (3-4 jours)
   - Interface `TranscriptionProgress`
   - WebSocket temps réel (optionnel)
   - Notifications toast success/error
   - Gestion annulation utilisateur

### Phase 3 : Production & Monitoring (1 semaine)

**Priorité : FAIBLE**

1. **Optimisations performance** (2-3 jours)
   - Parallélisation contrôlée
   - Cache intelligent résultats
   - Compression stockage
2. **Monitoring production** (2-3 jours)
   - Logs structurés JSON
   - Métriques Prometheus/DataDog
   - Alertes PagerDuty/Slack
   - Dashboard Grafana

---

## ⚠️ Points d'Attention Critiques

### 1. **Gestion des Coûts**

```typescript
// Configuration recommandée OpenAI
const WHISPER_CONFIG = {
  model: "whisper-1",
  response_format: "verbose_json",
  language: "fr", // Optimisation français
  temperature: 0.0, // Déterministe
};

// Estimation: 1000 appels x 5min = ~30$ OpenAI + ~350$ AssemblyAI = 380$/mois
// CRITIQUE : Prévoir budget et monitoring coûts temps réel
```

### 2. **Alignement Temporel**

```typescript
// ATTENTION : Synchronisation critique entre ASR et diarisation
const alignmentTolerance = 0.1; // 100ms de tolérance

// Problème fréquent : décalage entre timestamps Whisper et AssemblyAI
// Solution implémentée dans TranscriptionASRService.assignTurns()
```

### 3. **Formats Audio Supportés**

```typescript
// Whisper supporte : mp3, mp4, wav, flac, m4a, webm
// Votre BDD contient : wav principalement
// ⚠️ Conversion automatique nécessaire si autres formats
```

### 4. **Rate Limiting & Quotas**

- **OpenAI** : 500 requêtes/minute, 200,000 tokens/minute
- **AssemblyAI** : Quotas selon abonnement
- **Solution** : Queue avec backoff, retry automatique

---

## 🔗 Intégration avec l'Existant

### Architecture DDD Conservée ✅

1. **Domain Services** → `TranscriptionASRService` s'intègre naturellement
2. **Infrastructure** → Nouveaux providers avec interfaces claires
3. **UI Hooks** → Extension de `useCallTranscriptionActions` existant
4. **Database** → Aucune modification structurelle requise
5. **CallLifecycleService** → Nouveau statut "auto-transcribed"

### Workflow Utilisateur Enrichi ✅

```
Import Audio → [NOUVEAU] Auto-Transcription → [NOUVEAU] Auto-Diarisation
             → [EXISTANT] Validation → [EXISTANT] Préparation
             → [EXISTANT] Tagging → [EXISTANT] Analyse
```

### Points d'Extension Futurs 🚀

1. **IA Generative** : Résumé automatique des appels
2. **Analyse Sentiment** : Classification émotionnelle automatique
3. **Détection Topics** : Catégorisation automatique par sujet
4. **Quality Assurance** : Scoring automatique qualité interaction
5. **Real-time** : Transcription live pendant l'appel

---

## 📈 ROI Estimé

### Gains Quantifiés

- **Temps transcription** : 30min manuel → 2min automatique = **93% réduction**
- **Coût transcripteur** : 25€/h → 0.10€/appel automatique = **99% réduction**
- **Délai traitement** : 24-48h → 5min = **99.9% réduction**
- **Qualité diarisation** : Variable manuelle → 85%+ automatique

### Investissement Technique

- **Développement** : ~3 semaines développeur senior
- **Coûts opérationnels** : ~400€/mois pour 1000 appels
- **Infrastructure** : Marginal (Supabase, Vercel existants)

### Break-even : **2-3 mois** pour corpus > 500 appels/mois

Cette roadmap actualisée montre que **70% de l'infrastructure est déjà implémentée** et que seule l'intégration des providers externes réels reste critique pour un système complet de transcription et diarisation automatique ! 🚀
