# Ce qui est déjà fait

## Architecture & découpage

- Création des dossiers **domain / infrastructure / shared** et déplacement progressif des responsabilités (entités, services, repositories, workflows).
- Alignement avec le **plan cible DDD** (repositories interfaces + services métier + workflows + implémentations Supabase).

## Domaine (entities / services)

- Entité **`Call`** finalisée (immutabilité partielle, getters `getAudioFile()` / `getTranscription()`, règles métier de “readiness”, upgrade…).
- **`CallService`** réécrit (création, transitions de statut, update d’origine, delete, ready-for-tagging) et branché sur `CallRepository`.
- **`ValidationService`** centralise toute la validation (audio, transcription JSON, nom de fichier, règles métier) et devient l’API publique de validation.
- **Contrats partagés** consolidés dans `shared/types/CommonTypes.ts` et `shared/types/CallStatus.ts`.

## Infrastructure Supabase

- **`SupabaseCallRepository`** : implémentations `save`, `update` (2 formes : `update(call)` & `update(id, partial)` si interface élargie), `delete`, `findById`, `findAll`, `findByFilename`, `findByDescriptionPattern`, `findByOrigin`, `findByStatus`, `exists`, `count` ; mapping **Db ⇄ Domain** robuste.
- **`SupabaseStorageRepository`** : implémente **100%** de `StorageRepository` (`uploadFile`, `deleteFile`, `generateSignedUrl`, `fileExists`, `getFileMetadata`, `copyFile`) avec correctifs **Supabase v2** (métadonnées via `item.metadata`, plus d’accès direct à `size`).

## Workflows & câblage

- **`ImportWorkflow`** (v1) : orchestration **Validation → Duplicates → Upload → Create** avec respect strict de `CreateCallData` (File + `audioUrl` signé, transcriptionText).
- **`ServiceFactory`** : injection **Supabase** + services domaine (`CallService`, `ValidationService`, `DuplicateService`, `StorageService`).

## Configuration & legacy bridge

- **Fix Typescript** sur `CallsConfig` (tuple readonly → `as const`, conversion en `number[]` via spread côté consommateur).
- Adaptation du **legacy import** (`handleCallSubmission`) pour **déléguer** à `ImportWorkflow`/`ServiceFactory` sans casser l’UI existante.

# Ce qui reste à faire (priorisé)

## P1 — Finaliser le cœur DDD

1. **`CallRepository` (contrat)**
   - Geler la **signature officielle** (choisir : `update(call)` pur DDD **ou** exposer aussi `update(id, partial)` côté interface).
   - Retirer les `not implemented` éventuels si encore présents.
2. **`DuplicateService`**
   - Aligner **complètement** `upgradeExistingCall(callId, data: CallUpgradeData)` et `checkForDuplicates(criteria)` avec les signatures utilisées par `ImportWorkflow`.
   - Rebrancher la logique “hash contenu / filename / description” qui existe déjà dans le legacy.
3. **`ImportWorkflow` (v2 “à l’épreuve”)**
   - Remplacer les `any` résiduels par les **types exacts** (`DuplicateResult`, `DuplicateAction`, etc.).
   - Ajouter une télémétrie simple (progress callbacks).

## P2 — Préparation & features associées

4. **`PreparationWorkflow`**
   - Implémenter le **parcours standard** (traitement transcription, `markAsPrepared`, messages).
   - Préparer le **bulk** (batches, feedback).
5. **Désendetter l’UI legacy**
   - Finir de **remplacer** les utilitaires (`callApiUtils.tsx`, `signedUrls.tsx`, etc.) par les **services/workflows** ; supprimer les doublons.

## P3 — Tests, perf, documentation

6. **Tests**
   - Unitaires : `CallService`, `ValidationService`, `DuplicateService`, `StorageService`.
   - Intégration : `ImportWorkflow` (cas “no duplicate”, “upgrade”, “create_new”).
   - Infra : `SupabaseCallRepository` (save/map), `SupabaseStorageRepository` (upload/signedUrl/metadata).
7. **Perf & DX**
   - Feature flags (activation progressive), métriques simples (taux d’erreur import, durée upload, ratio doublons).
   - Nettoyage des **chemins d’import** et des alias (cohérence `@/…`).

# Plan d’atterrissage (checklist actionnable)

## Sprint A (stabilisation, 0.5–1 j.)

- [ ] Figer `CallRepository` (signature finale `update` + supprimer `?` temporaires).
- [ ] `SupabaseCallRepository` : supprimer branches mortes, re-run compile.
- [ ] `ImportWorkflow` : typer tous les callbacks/retours (`DuplicateAction`, `DuplicateResult`).

## Sprint B (duplicates & préparation, 1–2 j.)

- [ ] **`DuplicateService`** : brancher la logique multi-stratégies (filename / hash / description) + **Upgrade** (ajout File/transcription).
- [ ] **`PreparationWorkflow`** (standard) : traitement minimal + `markAsPrepared`.

## Sprint C (tests & débranchage legacy, 1–2 j.)

- [ ] Tests unitaires services + intégration `ImportWorkflow`.
- [ ] Remplacer les appels legacy par **`ServiceFactory`** et supprimer utils obsolètes.

# Points d’attention / risques

- **Divergence de signatures** (ex. `update` repo, `DuplicateService`): figer tôt le contrat pour éviter des refactors multiples.
- **Types de `AudioFile`/`Transcription`** : exposer des **getters clairs** (URL signée, path, counts…) pour retirer tout `as any`.
- **Supabase v2 Storage** : s’appuyer **exclusivement** sur `item.metadata` pour taille/MIME/etag (le reste est instable).

# Où trouver quoi (repères rapides)

- **Vision legacy & composants UI** (CallTableList, import, WorkDrive, utils) : _doc-calls-legacy.md_ .
- **Plan DDD détaillé & road-map par phases** : _migration-calls-DDD.md_ .
- **Arborescence réelle du repo** (état courant) : _calls_ddd_tree.txt_ .
