# 📑 Documentation – Transcription & Diarisation

## 1. Rappel du flux global

1. **Transcription automatique**
   - Appel à **OpenAI Whisper API** (`/audio/transcriptions`, format `verbose_json`).
   - Normalisation → génération du tableau `words[]` avec `text`, `startTime`, `endTime`.
   - Pas encore de `turn` (locuteur).
2. **Diarisation automatique**
   - Appel à un **provider externe** (ex. pyannote.audio, AssemblyAI, Deepgram).
   - Retour = segments de type `{ start, end, speaker }`.
   - Fusion avec les `words[]` pour remplir le champ `turn` (`turn1`, `turn2`, …).
3. **Édition / validation**
   - Correction texte, split/merge de tours, ajout/suppression de balises.
   - Validation automatique (temps croissant, balises appariées, cohérence des tours).
   - Sauvegarde finale dans `call.transcription`.

---

## 2. Côté Infrastructure

### ✅ Tâches à effectuer

#### a) Provider OpenAI Whisper (ASR)

Créer `infrastructure/asr/OpenAIWhisperProvider.ts` :

<pre class="overflow-visible!" data-start="1297" data-end="1576"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>class</span><span></span><span>OpenAIWhisperProvider</span><span> {
  </span><span>async</span><span></span><span>transcribeAudio</span><span>(</span><span>fileUrl</span><span>: </span><span>string</span><span>): </span><span>Promise</span><span><</span><span>any</span><span>> {
    </span><span>// 1. Télécharger le fichier ou utiliser signed URL Supabase</span><span>
    </span><span>// 2. Appeler l’API OpenAI /audio/transcriptions</span><span>
    </span><span>// 3. Retourner le JSON détaillé (verbose_json)</span><span>
  }
}
</span></span></code></div></div></pre>

- Paramétrer pour récupérer :
  - `words[]` avec `start`, `end`, `text`
  - Optionnellement `confidence`

#### b) Provider externe pour diarisation

Créer `infrastructure/diarization/ExternalDiarizationProvider.ts` :

<pre class="overflow-visible!" data-start="1796" data-end="2141"><div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs"></div></div></div><div class="overflow-y-auto p-4" dir="ltr"><code class="whitespace-pre! language-ts"><span><span>export</span><span></span><span>interface</span><span></span><span>DiarizationSegment</span><span> {
  </span><span>start</span><span>: </span><span>number</span><span>;
  </span><span>end</span><span>: </span><span>number</span><span>;
  </span><span>speaker</span><span>: </span><span>string</span><span>; </span><span>// "turn1", "turn2", ...</span><span>
}

</span><span>export</span><span></span><span>class</span><span></span><span>ExternalDiarizationProvider</span><span> {
  </span><span>async</span><span></span><span>inferSpeakers</span><span>(</span><span>fileUrl</span><span>: </span><span>string</span><span>): </span><span>Promise</span><span><</span><span>DiarizationSegment</span><span>[]> {
    </span><span>// Appel vers pyannote/AssemblyAI/Deepgram...</span><span>
    </span><span>// Retourne une liste de segments temporels</span><span>
  }
}
</span></span></code></div></div></pre>

#### c) Repo Supabase

Étendre `SupabaseCallRepository` avec :

- `updateTranscription(callId: string, transcription: any)`

  (sauvegarde dans champ `call.transcription`).

---

## 3. Côté Domaine

### ✅ Tâches à effectuer

#### a) `TranscriptionService`

- `normalize(rawOpenAI: any): { words: Word[] }`

  → mapping du JSON OpenAI → ton format (`text`, `startTime`, `endTime`, `turn:""`, `type:""`).

- `assignTurns(words: Word[], diar: DiarizationSegment[]): Word[]`

  → rattache chaque mot au bon `turn`.

- `mergeTranscriptionAndDiarization(words, diar)`

  → combine les deux sources.

#### b) `TranscriptionWorkflow`

- `transcribe(callId: string)`
  - Appelle `OpenAIWhisperProvider.transcribeAudio()`
  - Normalise avec `TranscriptionService.normalize()`
  - `updateTranscription(callId, { words })`
- `diarize(callId: string)`
  - Charge `{ words }` depuis `call.transcription`
  - Appelle `ExternalDiarizationProvider.inferSpeakers()`
  - `TranscriptionService.assignTurns(words, diarSegments)`
  - `updateTranscription(callId, { words })`
- `validateAndSave(callId: string)`
  - Vérifie cohérence des temps, des balises, des tours
  - Sauvegarde si ok

---

## 4. Côté UI (onglet Transcription)

### ✅ Tâches à effectuer

- **Boutons existants** à relier :
  1. **Transcrire automatiquement** → `TranscriptionWorkflow.transcribe(call.id)`
  2. **Séparer locuteurs** → `TranscriptionWorkflow.diarize(call.id)`
  3. **Valider & Sauvegarder** → `TranscriptionWorkflow.validateAndSave(call.id)`
- **Outils d’édition** (split/merge, changement de locuteur, correction texte, ajout balises) → utilisent `TranscriptionService` directement, puis sauvegarde.

---

## 5. Points d’attention

- **OpenAI Whisper** : pas de diarisation → nécessite un **provider séparé** .
- **Merge** obligatoire : il faut **aligner temps OpenAI (mots) et temps diarisation (segments)** .
- **Mapping speakers génériques** : garder `turn1`, `turn2`, etc. ; l’UI peut afficher “Client/Conseiller”.
- **Évolutif** : si un jour OpenAI propose la diarisation native, seul `ExternalDiarizationProvider` devra changer.
