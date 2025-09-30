# Cycle de vie d’un appel — vue d’ensemble & composants

Ce document décrit **les états** , **les transitions** , et **les composants** qui orchestrent le cycle de vie d’un appel depuis l’ingestion (audio / transcription) jusqu’au **tagging** .

## 1) Modèle d’état

L’état global affiché dans l’UI est `overallStage` (enum `TaggingWorkflowStage`) calculé à partir de deux axes :

- **Contenus** (`contentStage`) : présence d’**audio** et/ou de **transcription JSONB**
  - `EMPTY` → ni audio ni transcription
  - `AUDIO_ONLY` → audio disponible, pas de transcription
  - `TRANSCRIPTION_ONLY` → transcription disponible, pas d’audio
  - `COMPLETE` → audio **et** transcription disponibles
- **Préparation / Tagging** (`workflowStage`) : drapeaux de workflow dans la table `call`
  - `NOT_PREPARED` → transcription présente mais **pas encore dépliée** en table `word`
  - `PREPARED` → JSON déplié en `word` (flag `preparedForTranscript = true`)
  - `SELECTED` → sélectionné pour tagging (`isTaggingCall = true`)
  - `TAGGED` → tagging finalisé (`isTagged = true`)

> `overallStage = max(contentStage, workflowStage)` selon l’ordre métier défini dans `CallExtended`.

### Drapeaux (table `call`)

- `preparedfortranscript` (bool) → **true** si le JSON a été transformé en **mots** (table `word`) et l’appel est **prêt** pour TaggerLPL.
- `is_tagging_call` (bool) → sélectionné pour tagging.
- `isTagged` (dérivé / calculé) → vrai si la table `turntagged` contient des données pour l’appel.

## 2) Règles d’éligibilité (capabilities)

Implémentées dans `CallExtended` :

- `canPrepare()` : transcription valide **ET** pas encore préparé **ET** pas sélectionné **ET** pas taggé.
- `canSelect()` : transcription valide **ET** préparé **ET** non sélectionné **ET** non taggé.
- `canTag()` : transcription valide **ET** préparé **ET** sélectionné **ET** non taggé.
- `canUnselect()` : sélectionné **ET** non taggé.

## 3) Transitions & qui les déclenche

| Transition                        | Condition d’entrée    | Action (qui écrit)                                                         | Effet DB                                                                           | Nouvel état                                             |
| --------------------------------- | --------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Ingestion audio**               | fichier audio importé | `SupabaseCallRepository.updateCall()`(ou upload flow)                      | colonnes audio (path, size, duration…)                                             | `AUDIO_ONLY`si pas de transcription                     |
| **ASR → JSONB**                   | audio présent         | `TranscriptionIntegrationService.saveTranscriptionJson()`                  | `call.transcription = { words[], … }`                                              | `COMPLETE`(et**ne touche pas** `preparedForTranscript`) |
| **Préparer**(JSON → table `word`) | `canPrepare()`        | `useCallPreparationActions.prepare()`→`CallLifecycleService.prepareCall()` | insert table `word` **puis** `preparedfortranscript = true`                        | `PREPARED`                                              |
| **Sélectionner**                  | `canSelect()`         | `useCallFlags.select()`→`CallLifecycleService.selectCall()`                | `is_tagging_call = true`                                                           | `SELECTED`                                              |
| **Tagger**(édition)               | `canTag()`            | outil de tagging (TranscriptLPL)                                           | écritures `turntagged`; éventuellement `isTagged = true`(via service/commit final) | `TAGGED`                                                |
| **Désélectionner**                | `canUnselect()`       | `useCallFlags.unselect()`→`CallLifecycleService.unselectCall()`            | `is_tagging_call = false`                                                          | retour `PREPARED`                                       |

> **Important** : Toute **réécriture de la transcription JSONB** (nouveau run ASR) doit **laisser** `preparedfortranscript = false` par défaut (l’appel redevient “à préparer”). La **seule** élévation vers “prêt” se fait via **“Préparer”** .

## 4) Composants & responsabilités

### Domaine

- **`CallExtended`** (entité)
  - Expose `getLifecycleStatus()` (regroupe `hasAudio`, `hasTranscription`, flags DB, stages, `can*`, `nextAction`).
  - Implémente les règles `canPrepare / canSelect / canTag / canUnselect`.
  - Calcule `contentStage`, `workflowStage`, `overallStage`.
  - Factory `fromDatabaseWithWorkflow(dbData, isTagged)` : construit une instance à partir de la ligne `call` et d’un booléen `isTagged`.
- **`CallLifecycleService`** (service métier)
  - `getCallWithWorkflow(callId)` : charge depuis repo + calcule `isTagged` via `turntagged`.
  - `prepareCall(call)` : **transforme** `transcription` JSON → table `word` via `transformationService`, puis (à l’endroit approprié) marque `preparedfortranscript = true`.
  - `selectCall` / `unselectCall` : gèrent `is_tagging_call`.
  - `progressCall(callId)` : “action suivante” automatique si possible.
  - `getLifecycleStats`, `getCallsByStage` : agrégations.

### Infrastructure

- **`SupabaseCallRepository`**
  - `findById`, `findAll`, `update` / `updateCall`, `saveTranscriptionJson`…
  - ⚠️ **Ne doit pas** activer `preparedfortranscript` lors de `saveTranscriptionJson`.
  - Sert d’interface unique vers la table `call` et tables reliées.

### Services de contenu

- **`TranscriptionIntegrationService`**
  - Orchestration ASR + diarisation + alignement → **écrit** le JSONB (colonne `transcription`).
  - **Ne modifie pas** `preparedfortranscript` (reste à `false` tant que la préparation JSON→`word` n’est pas faite).
  - Peut, éventuellement, remettre explicitement `preparedfortranscript=false` après mise à jour de `transcription`.
- **Transformation JSON→`word`**
  - Implémentée côté `transformationService` (utilisé par `CallLifecycleService.prepareCall`).
  - Seule étape légitime pour **basculer** `preparedfortranscript=true` après succès.

### UI

- **`CallLifecycleColumn`**
  - Affiche l’état (`overallStage`) et les indicateurs (audio, transcription, préparé, sélectionné, taggé).
  - Propose une **action primaire** contextuelle selon `can*`.
  - Délègue `onAction('prepare'|'select'|'unselect'|'tag')` aux hooks.
- **`useCallPreparationActions`**
  - Implémente la commande utilisateur **Préparer** .
  - En cas de succès, **met `preparedfortranscript = true`** via repository / service.
- **`useCallFlags`**
  - Implémente **Select / Unselect** (toggle `is_tagging_call`).
  - Éventuellement gère l’état “tagged” ou c’est fait lors de la sauvegarde des tags.

## 5) Séquences (texte)

### A. Transcrire (ASR)

1. UI lance transcription → `TranscriptionIntegrationService`
2. ASR + (option) diarisation → `transcription` JSONB
3. Repo enregistre `call.transcription` (**ne touche pas** le flag)
4. `overallStage` devient `COMPLETE` ou `NOT_PREPARED` selon le calcul.

### B. Préparer (JSON→`word`)

1. UI clique **Préparer** → `useCallPreparationActions.prepare()`
2. `CallLifecycleService.prepareCall(call)`
3. `transformationService.transformJsonToWords(call.id, transcription)`
4. Insert en table `word`
5. **Update** `preparedfortranscript = true`
6. `overallStage` = `PREPARED`

### C. Sélectionner / Tagger

1. **Sélectionner** → `is_tagging_call = true` → `SELECTED`
2. Ouvrir tagging (TranscriptLPL) → écritures `turntagged`
3. Sauvegarde finale → `isTagged = true` → `TAGGED`

## 6) Invariants & pièges

- **Invariant #1** : `saveTranscriptionJson` **n’active jamais** `preparedfortranscript`.
- **Invariant #2** : `preparedfortranscript` est **strictement** géré par l’étape **Préparer** .
- **Invariant #3** : Toute **nouvelle** transcription (écriture JSONB) invalide la préparation — laisser `preparedfortranscript=false` jusqu’à une nouvelle préparation.
- **Invariant #4** : `isTagged` découle des données `turntagged` (ou est mis à jour au commit final des tags).

## 7) Points d’extension

- Ajouter un petit **journal d’audit** des flips de flags (qui/quand/pourquoi).
- Exposer des **actions idempotentes** côté service :
  - `markUnpreparedForTranscript(callId)` après écriture d’une nouvelle transcription.
  - `markPreparedForTranscript(callId)` à la fin de la préparation.
- Définir un **test E2E** qui valide la chaîne COMPLETE → NOT_PREPARED → PREPARED → SELECTED → TAGGED.

## 8) Checklist de conformité (à passer dans le code)

- [ ] `TranscriptionIntegrationService` n’écrit **pas** `preparedfortranscript=true`.
- [ ] `useCallPreparationActions.prepare()` écrit `preparedfortranscript=true` **après** la création des `word`.
- [ ] `useCallFlags.select()`/`unselect()` togglent uniquement `is_tagging_call`.
- [ ] `CallExtended.getLifecycleStatus()` reflète bien les règles `can*` et la hiérarchie `overallStage`.
- [ ] `CallLifecycleService` centralise les appels repo pour les transitions (préparer, sélectionner, désélectionner).
- [ ] Les requêtes de “réécriture transcription” (ASR) laissent le flag **à false** .
