# 1) Objectif & périmètre

- **But** : permettre depuis la liste d’appels de **lancer une transcription auto** sur un ou plusieurs appels (ayant audio), **éditer** le JSON transcrit (texte & tours de parole), puis **valider** la transcription pour rejoindre le **workflow existant** de taggage (`turntagged`).
- **Hors périmètre** : pas de table `word` persistée (projection temporaire seulement lors du taggage, comme aujourd’hui). On conserve `calls` (audio + `transcription` JSON) et `turntagged`.
- **UI cible** : la liste d’appels **CallManagementPage** (mise à niveau pour reprendre les patterns de `CallTableList`) + un **éditeur de transcription** (dialog/page).

---

# 2) Données & états

## 2.1 `calls.transcription` (JSON “maison”)

Format cible (déjà en usage) :

<pre class="overflow-visible!" data-start="1485" data-end="1717"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>type</span><span></span><span>TranscriptWord</span><span> = {
  </span><span>text</span><span>: </span><span>string</span><span>;
  </span><span>turn</span><span>: </span><span>string</span><span>;      </span><span>// "turn1", "turn2", ...</span><span>
  </span><span>type</span><span>: </span><span>string</span><span>;      </span><span>// libre</span><span>
  </span><span>startTime</span><span>: </span><span>number</span><span>; </span><span>// s</span><span>
  </span><span>endTime</span><span>: </span><span>number</span><span>;   </span><span>// s</span><span>
};

</span><span>type</span><span></span><span>TranscriptJSON</span><span> = { </span><span>words</span><span>: </span><span>TranscriptWord</span><span>[] };
</span></span></code></div></div></pre>

> Les **tours** sont **dans le JSON** (via `turn`), pas en base. La diarisation du provider est mappée en `turn1/turn2/...`.

## 2.2 États “qualité transcription” (champ `calls.transcription_status`)

À ajouter (enum string) :

- `NONE` (par défaut)
- `PROCESSING` (job en cours)
- `READY` (ASR terminée, à relire)
- `APPROVED` (éditée/confirmée, prête pour taggage)

> Ces états guident l’UI (boutons actifs/inactifs, filtres). Ils s’intègrent aux filtres/tri déjà présents dans la liste.

---

# 3) Parcours utilisateur (UX) — bout en bout

1. **Depuis la liste** (CallManagementPage) l’utilisateur **sélectionne** des appels → **Action “Transcrire automatiquement”** (batchable, comme les autres actions en lot).
2. Le système crée des **jobs** et passe les appels ciblés en `PROCESSING`. Un worker (Edge Function / serveur) exécute l’ASR et **écrit `calls.transcription`** (JSON) + passe en `READY`.
3. L’utilisateur **ouvre l’éditeur** sur un appel `READY` : lecture audio, **édition des mots** , **fusion/split** , **changement de turn** (ex: sélectionner des mots → `turn2`).
4. L’utilisateur **enregistre** (persisté dans `calls.transcription`), peut **revenir plus tard** .
5. Quand c’est ok, il **confirme** → `APPROVED`.
6. **Taggage** (interface existante) : si besoin, le système **projette le JSON en table temporaire `word`** , opère les taggings, puis **alimente `turntagged`** et détruit la projection (comportement actuel).
7. La **colonne “Relations”** de la liste continue d’exprimer la complétude `next_turn_tag` depuis `turntagged` (✅/⚠️/❌ + tooltip).

---

# 4) Couches DDD — où va quoi

## 4.1 Domain (ports & entités)

- **Entities** (déjà là) : `Call`, `Transcription`, `TranscriptionWord`. On réutilise.
- **Ports** (nouveaux) :
  - `TranscriptionService` (ASR agnostique) : `transcribeAudioUrl(audioUrl, opts): Promise<ASRWord[]>`
  - (facultatif plus tard) `DiarizationService` si tu veux une diarisation distincte du provider
- **Repository** : `CallRepository` → ajouter `updateTranscriptionJson(callId, json)` + `updateTranscriptionStatus(callId, status)` si absent.

> Barrels domain : n’exporter les types qu’en `export type { ... }` (séparation valeurs/types comme tu l’as fait).

## 4.2 Application (use-cases)

- **`AutoTranscribeCall`** (orchestrateur unitaire) : charge le `Call`, appelle `TranscriptionService`, **mappe les speakers → turns** , écrit `transcription JSON`, met `status=READY`.
- **`StartAutoTranscriptionBatch`** : découpe en lots, crée les **jobs** (table `call_processing_jobs`) et met `PROCESSING`.
- **`ApproveTranscription`** : passe `status=APPROVED`. (aucune écriture dans `turntagged` ici).
- **(existant)** workflow de **taggage** consommera ensuite `transcription JSON` (projection `word` temporaire) pour alimenter `turntagged`.

## 4.3 Infrastructure (adapters)

- **ASR Adapter** (ex: Whisper/Deepgram/Google) → impl. de `TranscriptionService` qui retourne **`ASRWord[]`** (avec `speaker` si dispo).
- **SupabaseCallRepository** : méthodes `updateTranscriptionJson`, `updateTranscriptionStatus`, `getById`, etc. (dans `infrastructure/supabase`).
- **Jobs** : Edge Function / worker qui dépile `call_processing_jobs` et appelle `AutoTranscribeCall`.

## 4.4 UI (pages, composants, hooks)

- **CallManagementPage** (liste) : ajouter boutons **“Transcrire auto”** , **“Éditer”** , **“Confirmer”** ; garder filtres/tri/lot/relations hérités de `CallTableList`.
- **TranscriptionEditor** (dialog/page) : lecture audio + édition des `words`, changement de `turn`, sauvegarde.
- **Hooks** :
  - `useAutoTranscription()` : lance le batch (appelle `StartAutoTranscriptionBatch`).
  - `useTranscriptionEditor(callId)` : charge/sauve `transcription` et expose des opérations locales (split/merge/changer turn).

---

# 5) Surfaces à créer / modifier (chemins exacts)

## Domain

- `src/components/calls/domain/services/TranscriptionService.ts`
  <pre class="overflow-visible!" data-start="5900" data-end="6217"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>type</span><span></span><span>TranscribeOptions</span><span> = { languageHint?: </span><span>string</span><span>; diarization?: </span><span>boolean</span><span> };
  </span><span>export</span><span></span><span>type</span><span></span><span>ASRWord</span><span> = { </span><span>text</span><span>: </span><span>string</span><span>; </span><span>start</span><span>: </span><span>number</span><span>; </span><span>end</span><span>: </span><span>number</span><span>; speaker?: </span><span>string</span><span> };
  </span><span>export</span><span></span><span>interface</span><span></span><span>TranscriptionService</span><span> {
    </span><span>transcribeAudioUrl</span><span>(</span><span>audioUrl</span><span>: </span><span>string</span><span>, opts?: </span><span>TranscribeOptions</span><span>): </span><span>Promise</span><span><</span><span>ASRWord</span><span>[]>;
  }
  </span></span></code></div></div></pre>
- `src/components/calls/domain/repositories/CallRepository.ts`
  <pre class="overflow-visible!" data-start="6285" data-end="6482"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>updateTranscriptionJson</span><span>(</span><span>callId</span><span>: </span><span>string</span><span>, </span><span>transcription</span><span>: </span><span>any</span><span>): </span><span>Promise</span><span><</span><span>void</span><span>>;
  </span><span>updateTranscriptionStatus</span><span>(</span><span>callId</span><span>: </span><span>string</span><span>, </span><span>status</span><span>: </span><span>"NONE"</span><span>|</span><span>"PROCESSING"</span><span>|</span><span>"READY"</span><span>|</span><span>"APPROVED"</span><span>): </span><span>Promise</span><span><</span><span>void</span><span>>;
  </span></span></code></div></div></pre>

> Ajouter les **exports type-only** dans `domain/services/index.ts` et `domain/repositories/index.ts`.

## Application

- `src/components/calls/application/usecases/AutoTranscribeCall.ts`
  - Entrées : `callId`, options
  - Effets : `calls.transcription = JSON` + `status=READY`
- `src/components/calls/application/usecases/StartAutoTranscriptionBatch.ts`
  - Entrées : `callIds[]`
  - Effets : écrit des **jobs** + met `PROCESSING`
- `src/components/calls/application/usecases/ApproveTranscription.ts`
  - Effets : `status=APPROVED`

## Infrastructure

- `src/components/calls/infrastructure/asr/<Provider>TranscriptionService.ts` (impl `TranscriptionService`)
- `src/components/calls/infrastructure/supabase/SupabaseCallRepository.ts`
  - Impl des deux méthodes d’update ci-dessus.
- `supabase/functions/call-processing-worker/index.ts` (ou équivalent)
  - Lit `call_processing_jobs`, appelle `AutoTranscribeCall`.

## UI

- **Liste** : `src/components/calls/ui/pages/CallManagementPage.tsx`
  - Ajouter boutons : **Transcrire auto** , **Éditer** , **Confirmer** (états selon `transcription_status`)
  - Réutiliser logique tri/filtre/lot/relations du legacy (`CallTableList`) déjà documentée.
- **Éditeur** : `src/components/calls/ui/transcription/TranscriptionEditor.tsx`
  - Props : `callId`, `audioUrl`, `transcription`
  - Actions : `onSave(JSON)`, `onApprove()`
- **Hooks** :
  - `src/components/calls/ui/hooks/useAutoTranscription.ts`
  - `src/components/calls/ui/hooks/useTranscriptionEditor.ts`

---

# 6) API internes (signatures à implémenter)

## Application

<pre class="overflow-visible!" data-start="8126" data-end="8675"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>class</span><span></span><span>AutoTranscribeCall</span><span> {
  </span><span>constructor</span><span>(
    </span><span>private</span><span> callRepo: CallRepository,
    </span><span>private</span><span> asr: TranscriptionService
  ) {}
  </span><span>run</span><span>(</span><span>callId</span><span>: </span><span>string</span><span>, opts?: </span><span>TranscribeOptions</span><span>): </span><span>Promise</span><span><</span><span>TranscriptJSON</span><span>>;
}

</span><span>class</span><span></span><span>StartAutoTranscriptionBatch</span><span> {
  </span><span>constructor</span><span>(
    </span><span>private</span><span> callRepo: CallRepository,
    </span><span>private</span><span> jobsRepo: JobsRepository,
  ) {}
  </span><span>run</span><span>(</span><span>callIds</span><span>: </span><span>string</span><span>[]): </span><span>Promise</span><span><</span><span>void</span><span>>;
}

</span><span>class</span><span></span><span>ApproveTranscription</span><span> {
  </span><span>constructor</span><span>(</span><span>private</span><span> callRepo: CallRepository) {}
  </span><span>run</span><span>(</span><span>callId</span><span>: </span><span>string</span><span>): </span><span>Promise</span><span><</span><span>void</span><span>>; </span><span>// sets transcription_status="APPROVED"</span><span>
}
</span></span></code></div></div></pre>

## UI Hooks

<pre class="overflow-visible!" data-start="8689" data-end="9263"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>// Lancer depuis la liste</span><span>
</span><span>function</span><span></span><span>useAutoTranscription</span><span>(</span><span></span><span>) {
  </span><span>return</span><span> {
    </span><span>runFor</span><span>(</span><span>callIds</span><span>: </span><span>string</span><span>[]): </span><span>Promise</span><span><</span><span>void</span><span>>,
    </span><span>processing</span><span>: </span><span>boolean</span><span>,
    </span><span>error</span><span>: </span><span>string</span><span> | </span><span>null</span><span>,
  };
}

</span><span>// Ouvrir, éditer, sauvegarder, approuver</span><span>
</span><span>function</span><span></span><span>useTranscriptionEditor</span><span>(</span><span>callId: string</span><span>) {
  </span><span>return</span><span> {
    </span><span>audioUrl</span><span>: </span><span>string</span><span> | </span><span>null</span><span>,
    </span><span>draft</span><span>: </span><span>TranscriptJSON</span><span>,
    </span><span>setDraft</span><span>: </span><span>(t: TranscriptJSON</span><span>) => </span><span>void</span><span>,
    </span><span>save</span><span>: </span><span>() =></span><span></span><span>Promise</span><span><</span><span>void</span><span>>,      </span><span>// callRepo.updateTranscriptionJson</span><span>
    </span><span>approve</span><span>: </span><span>() =></span><span></span><span>Promise</span><span><</span><span>void</span><span>>,   </span><span>// ApproveTranscription</span><span>
    </span><span>loading</span><span>: </span><span>boolean</span><span>,
    </span><span>error</span><span>: </span><span>string</span><span> | </span><span>null</span><span>,
  };
}
</span></span></code></div></div></pre>

---

# 7) Comportements UI dans la liste

- **Bouton “Transcrire auto”** (actions en lot) : visible pour sélection >0, **désactivé** si un élément est déjà `PROCESSING`. Batch & feedback (progress) comme le legacy des actions.
- **Bouton “Éditer”** (ligne) : actif si `READY` (ou `APPROVED` pour retouches si besoin).
- **Bouton “Confirmer”** : actif si `READY` (passe à `APPROVED`).
- **Filtres** : ajouter `transcription_status` aux filtres existants (status/audio/origine). L’architecture legacy montre déjà comment on étend filtres/tri.
- **Colonne “Relations”** : inchangée, basée sur `turntagged` (✅/⚠️/❌ + tooltip), comme documenté dans le legacy.

---

# 8) Jobs & robustesse

- **Table** `call_processing_jobs` (id, call_id, kind="ASR", status="queued|running|done|error", attempts, error, created_at, updated_at).
- **Edge Function** (cron ou trigger) exécute :
  - `AutoTranscribeCall.run(callId)`
  - On **n’écrit que** `calls.transcription` (JSON) + `transcription_status`.
- **Idempotence** : upsert par `(call_id, kind)` ; backoff sur `error`.
- **Sécurité** : URLs signées pour l’audio.

---

# 9) Critères d’acceptation

- **Transcrire auto** depuis la liste → chaque appel ciblé passe `PROCESSING` puis `READY` avec `calls.transcription` (JSON non vide).
- **Éditer** : je modifie du texte, je change un `turn` ⇒ `Save` persiste en JSON ; je peux revenir plus tard.
- **Confirmer** : statut `APPROVED` ; l’appel apparaît dans les **filtres** et peut partir en **taggage** standard (projection `word` temporaire), `turntagged` continue d’alimenter la **colonne Relations** .

---

# 10) Plan de livraison (résumé)

1. **Domain** : `TranscriptionService` + méthodes CallRepo.
2. **Application** : `AutoTranscribeCall`, `StartAutoTranscriptionBatch`, `ApproveTranscription`.
3. **Infra** : adapter ASR + updates Supabase + worker jobs.
4. **UI** :
   - Liste : boutons & filtres (patterns `CallTableList`).
   - Éditeur : lecture/édition JSON + save/approve.
5. **Tests** : un appel end-to-end puis batch.
