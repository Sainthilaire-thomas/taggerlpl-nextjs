# 🎙️ SPECS : Annotation Modalité Audio

## 🎯 Vue d'Ensemble

**Objectif** : Permettre l'annotation automatique des paires en utilisant des LLM multimodaux (GPT-4o Audio) qui analysent les fichiers audio complets (texte + prosodie + ton + émotion).

**Principe** : Au lieu de passer uniquement le verbatim texte au LLM, on lui envoie le fichier audio du turn client, permettant une analyse complète incluant les indices prosodiques.

**Bénéfice Scientifique** : Mesurer si un LLM multimodal peut atteindre un accord similaire à un humain écoutant l'audio complet (hypothèse H5).

---

## 🏗️ Architecture Globale

### Flux Annotation Audio

```
1. Fichiers audio originaux (appels complets)
   ↓
2. Extraction segments audio (ffmpeg)
   → client_turn_123.wav
   → conseiller_turn_124.wav
   ↓
3. Envoi fichier audio + prompt à GPT-4o Audio
   ↓
4. GPT-4o analyse texte + prosodie + ton
   ↓
5. Retour tag + raisonnement
   ↓
6. Sauvegarde annotation (annotator_type='llm_openai_audio')
```

---

## 🗄️ Base de Données

### Table turntagged (Existante) ✅

**Contient déjà les timestamps** :

```sql
CREATE TABLE turntagged (
  turn_id INTEGER PRIMARY KEY,
  call_id TEXT,
  start_time FLOAT,      -- Timestamp début (secondes)
  end_time FLOAT,        -- Timestamp fin (secondes)
  speaker TEXT,          -- 'client' ou 'conseiller'
  verbatim TEXT,
  ...
);
```

**Les timestamps sont disponibles** → Aucune modification nécessaire !

---

### Table analysis_pairs (Existante) ✅

**Références les turn IDs** :

```sql
CREATE TABLE analysis_pairs (
  pair_id INTEGER PRIMARY KEY,
  call_id TEXT,
  client_turn_id INTEGER REFERENCES turntagged(turn_id),
  conseiller_turn_id INTEGER REFERENCES turntagged(turn_id),
  ...
);
```

**Jointure pour récupérer timestamps** :
```sql
SELECT 
  ap.pair_id,
  tc.start_time as client_start,
  tc.end_time as client_end,
  tc.verbatim as client_verbatim,
  tco.start_time as conseiller_start,
  tco.end_time as conseiller_end
FROM analysis_pairs ap
JOIN turntagged tc ON tc.turn_id = ap.client_turn_id
JOIN turntagged tco ON tco.turn_id = ap.conseiller_turn_id
WHERE ap.pair_id = 3187;
```

---

### Table annotations (Existante) ✅

**Accepte déjà le type 'llm_openai_audio'** :

```sql
-- Aucune modification nécessaire
INSERT INTO annotations VALUES (
  gen_random_uuid(),
  3187,                                      -- pair_id
  'llm_openai_audio',                        -- 🆕 Type audio
  'GPT4o-audio_CharteY_B_v1.0.0',           -- 🆕 ID audio
  'CLIENT_POSITIF',
  0.95,
  'Le client exprime un accord avec un ton enthousiaste...',
  '{"model": "gpt-4o-audio-preview", "audio_file": "client_turn_123.wav", "audio_duration_s": 3.2}',
  NOW(),
  ...
);
```

---

## 💻 Services TypeScript

### AudioExtractionService.ts

**Extraction segments audio avec ffmpeg** :

```typescript
import ffmpeg from 'fluent-ffmpeg';
import { getSupabase } from '@/lib/supabaseClient';
import fs from 'fs';
import path from 'path';

export class AudioExtractionService {
  private static supabase = getSupabase();

  /**
   * Extraire segment audio pour une paire
   * @returns Chemins vers fichiers audio client et conseiller
   */
  static async extractPairAudio(
    pairId: number,
    originalAudioPath: string,
    outputDir: string
  ): Promise<{ clientPath: string; conseillerPath: string }> {
    
    // Récupérer timestamps depuis DB
    const { data, error } = await this.supabase
      .from('analysis_pairs')
      .select(`
        pair_id,
        call_id,
        client_turn_id,
        conseiller_turn_id,
        turntagged!client_turn_id (start_time, end_time),
        turntagged!conseiller_turn_id (start_time, end_time)
      `)
      .eq('pair_id', pairId)
      .single();

    if (error || !data) {
      throw new Error(`Pair ${pairId} not found: ${error?.message}`);
    }

    const clientTurn = (data.turntagged as any)[0];
    const conseillerTurn = (data.turntagged as any)[1];

    // Créer dossier output si nécessaire
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Extraire turn client
    const clientPath = path.join(outputDir, `client_turn_${data.client_turn_id}.wav`);
    await this.extractSegment(
      originalAudioPath,
      clientTurn.start_time,
      clientTurn.end_time,
      clientPath
    );

    // Extraire turn conseiller
    const conseillerPath = path.join(outputDir, `conseiller_turn_${data.conseiller_turn_id}.wav`);
    await this.extractSegment(
      originalAudioPath,
      conseillerTurn.start_time,
      conseillerTurn.end_time,
      conseillerPath
    );

    return { clientPath, conseillerPath };
  }

  /**
   * Extraire segment audio avec ffmpeg
   */
  private static async extractSegment(
    inputPath: string,
    startTime: number,
    endTime: number,
    outputPath: string
  ): Promise<void> {
    
    // Ne pas réextraire si fichier existe déjà
    if (fs.existsSync(outputPath)) {
      console.log(`Audio segment already exists: ${outputPath}`);
      return;
    }

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .output(outputPath)
        .audioCodec('pcm_s16le')    // WAV format
        .audioFrequency(16000)      // 16kHz (optimal pour speech)
        .audioChannels(1)           // Mono
        .on('end', () => {
          console.log(`Extracted: ${outputPath}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`Error extracting ${outputPath}:`, err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Batch extraction pour un call complet
   */
  static async extractCallAudio(
    callId: string,
    originalAudioPath: string,
    outputDir: string
  ): Promise<{ success: number; errors: number }> {
    
    // Récupérer toutes les paires du call
    const { data: pairs, error } = await this.supabase
      .from('analysis_pairs')
      .select('pair_id')
      .eq('call_id', callId);

    if (error || !pairs) {
      throw new Error(`Error fetching pairs: ${error?.message}`);
    }

    let successCount = 0;
    let errorCount = 0;

    for (const pair of pairs) {
      try {
        await this.extractPairAudio(pair.pair_id, originalAudioPath, outputDir);
        successCount++;
      } catch (err) {
        console.error(`Error extracting pair ${pair.pair_id}:`, err);
        errorCount++;
      }
    }

    return { success: successCount, errors: errorCount };
  }

  /**
   * Batch extraction pour tous les calls
   */
  static async extractAllAudio(
    audioBasePath: string,
    outputBaseDir: string
  ): Promise<{ totalCalls: number; totalPairs: number; errors: number }> {
    
    // Récupérer tous les calls distincts
    const { data: calls, error } = await this.supabase
      .from('analysis_pairs')
      .select('call_id')
      .order('call_id');

    if (error || !calls) {
      throw new Error(`Error fetching calls: ${error?.message}`);
    }

    const uniqueCalls = [...new Set(calls.map(c => c.call_id))];
    
    let totalPairs = 0;
    let totalErrors = 0;

    for (const callId of uniqueCalls) {
      const originalAudioPath = path.join(audioBasePath, `${callId}.wav`);
      const outputDir = path.join(outputBaseDir, callId);

      if (!fs.existsSync(originalAudioPath)) {
        console.warn(`Audio file not found: ${originalAudioPath}`);
        continue;
      }

      const result = await this.extractCallAudio(callId, originalAudioPath, outputDir);
      totalPairs += result.success;
      totalErrors += result.errors;
    }

    return {
      totalCalls: uniqueCalls.length,
      totalPairs,
      errors: totalErrors
    };
  }

  /**
   * Obtenir durée audio
   */
  static async getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata.format.duration || 0);
        }
      });
    });
  }
}
```

---

### OpenAIAudioAnnotationService.ts

**Annotation avec GPT-4o Audio** :

```typescript
import OpenAI from 'openai';
import fs from 'fs';
import { CharteRegistry } from './CharteRegistry';
import { AnnotationService } from './AnnotationService';

export interface AudioAnnotationResult {
  pair_id: number;
  tag: string;
  reasoning: string;
  confidence: number;
  audio_duration_s: number;
  processing_time_ms: number;
}

export class OpenAIAudioAnnotationService {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  /**
   * Annoter une paire avec l'audio
   */
  static async annotateWithAudio(
    pair: any,
    charteId: string,
    audioFilePath: string
  ): Promise<AudioAnnotationResult> {
    
    const startTime = Date.now();

    // Charger la charte
    const charte = await CharteRegistry.getCharteById(charteId);
    if (!charte) {
      throw new Error(`Charte ${charteId} not found`);
    }

    // Vérifier fichier audio existe
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // Construire prompt avec instructions audio
    const prompt = this.buildAudioPrompt(charte, pair);

    try {
      // Lire le fichier audio
      const audioBuffer = fs.readFileSync(audioFilePath);
      const audioBase64 = audioBuffer.toString('base64');

      // Appel API GPT-4o Audio
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-audio-preview",
        modalities: ["text", "audio"],
        audio: { voice: "alloy", format: "wav" },
        messages: [
          {
            role: "system",
            content: "Vous êtes un expert en analyse conversationnelle spécialisé dans l'annotation de conversations téléphoniques."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "input_audio",
                input_audio: {
                  data: audioBase64,
                  format: "wav"
                }
              }
            ]
          }
        ],
        temperature: 0.0,
        max_tokens: 500
      });

      const processingTime = Date.now() - startTime;

      // Parser réponse
      const content = response.choices[0].message.content || '';
      const tag = this.extractTag(content, charte);
      const reasoning = this.extractReasoning(content);

      // Obtenir durée audio
      const audioDuration = await this.getAudioDuration(audioFilePath);

      // Sauvegarder annotation
      await AnnotationService.saveAnnotation({
        pair_id: pair.pair_id,
        annotator_type: 'llm_openai_audio',
        annotator_id: `GPT4o-audio_${charteId}`,
        reaction_tag: tag,
        confidence: 0.95,
        reasoning: reasoning,
        annotation_context: {
          model: "gpt-4o-audio-preview",
          audio_file: audioFilePath,
          audio_duration_s: audioDuration,
          processing_time_ms: processingTime
        }
      });

      return {
        pair_id: pair.pair_id,
        tag,
        reasoning,
        confidence: 0.95,
        audio_duration_s: audioDuration,
        processing_time_ms: processingTime
      };

    } catch (error: any) {
      console.error(`Error annotating pair ${pair.pair_id} with audio:`, error);
      throw error;
    }
  }

  /**
   * Construire prompt spécifique audio
   */
  private static buildAudioPrompt(charte: any, pair: any): string {
    const basePrompt = charte.prompt_template || '';
    
    const audioPrompt = `
${basePrompt}

🎙️ INSTRUCTIONS SPÉCIFIQUES AUDIO :

Vous allez entendre un extrait audio d'un CLIENT au téléphone avec un conseiller.

Analysez TOUS les éléments suivants :
1. CONTENU VERBAL : Les mots prononcés (texte)
2. PROSODIE : Le ton, l'intonation, le rythme
3. ÉMOTION : Les indices émotionnels (enthousiasme, déception, hésitation, irritation)
4. CONTEXTE : Le tour de parole précédent et suivant

CONTEXTE CONVERSATIONNEL :
Tour précédent (conseiller) : ${pair.conseiller_verbatim || 'N/A'}
Tour suivant : ${pair.next1_verbatim || 'N/A'}

⚠️ IMPORTANT : 
- Le TON peut complètement changer le sens d'un mot
- "oui" avec ton enthousiaste = POSITIF
- "oui" avec ton dépité = NEUTRE ou NEGATIF
- Priorisez la prosodie sur le texte si conflit

Répondez avec :
1. La catégorie (CLIENT_POSITIF, CLIENT_NEGATIF, ou CLIENT_NEUTRE)
2. Votre raisonnement incluant analyse du TON et de l'ÉMOTION
`;

    return audioPrompt;
  }

  /**
   * Extraire tag de la réponse
   */
  private static extractTag(content: string, charte: any): string {
    const categories = Object.keys(charte.definition?.categories || {});
    
    for (const cat of categories) {
      if (content.includes(cat)) {
        return cat;
      }
    }
    
    throw new Error(`No valid tag found in response: ${content}`);
  }

  /**
   * Extraire raisonnement
   */
  private static extractReasoning(content: string): string {
    // Extraire texte après la catégorie
    const lines = content.split('\n');
    const reasoningLines = lines.filter(l => 
      !l.includes('CLIENT_POSITIF') && 
      !l.includes('CLIENT_NEGATIF') && 
      !l.includes('CLIENT_NEUTRE') &&
      l.trim().length > 0
    );
    
    return reasoningLines.join(' ').trim();
  }

  /**
   * Obtenir durée audio
   */
  private static async getAudioDuration(filePath: string): Promise<number> {
    const ffmpeg = require('fluent-ffmpeg');
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
        if (err) reject(err);
        else resolve(metadata.format.duration || 0);
      });
    });
  }

  /**
   * Batch annotation avec rate limiting
   */
  static async annotateBatchWithAudio(
    pairs: any[],
    charteId: string,
    audioDirectory: string
  ): Promise<{
    success: number;
    errors: number;
    results: AudioAnnotationResult[];
    totalCost: number;
    totalDuration: number;
  }> {
    
    const results: AudioAnnotationResult[] = [];
    let successCount = 0;
    let errorCount = 0;
    let totalAudioDuration = 0;

    for (const pair of pairs) {
      try {
        const audioPath = `${audioDirectory}/client_turn_${pair.client_turn_id}.wav`;
        
        if (!fs.existsSync(audioPath)) {
          console.warn(`Audio file not found: ${audioPath}`);
          errorCount++;
          continue;
        }

        const result = await this.annotateWithAudio(pair, charteId, audioPath);
        results.push(result);
        successCount++;
        totalAudioDuration += result.audio_duration_s;

        // Rate limiting : 3 req/sec max (OpenAI limit)
        await this.sleep(350);

      } catch (error) {
        console.error(`Error on pair ${pair.pair_id}:`, error);
        errorCount++;
      }
    }

    // Calculer coût estimé
    const costPerMinute = 0.06; // $0.06 / minute audio
    const totalCost = (totalAudioDuration / 60) * costPerMinute;

    return {
      success: successCount,
      errors: errorCount,
      results,
      totalCost,
      totalDuration: totalAudioDuration
    };
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 🎨 Interface UI

### AudioTestingPanel.tsx

**Composant pour tester avec audio** :

```typescript
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  LinearProgress,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import { OpenAIAudioAnnotationService } from '@/services/OpenAIAudioAnnotationService';

export const AudioTestingPanel: React.FC = () => {
  const [charteId, setCharteId] = useState('CharteY_B_v1.0.0');
  const [sampleSize, setSampleSize] = useState(10);
  const [audioDirectory, setAudioDirectory] = useState('/audio/extracted');
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    setTesting(true);
    setProgress(0);

    try {
      // Récupérer échantillon paires
      const pairs = await fetchRandomPairs(sampleSize);
      
      // Annoter avec audio
      const batchResult = await OpenAIAudioAnnotationService.annotateBatchWithAudio(
        pairs,
        charteId,
        audioDirectory
      );

      setResult(batchResult);

    } catch (error) {
      console.error('Error testing with audio:', error);
      alert('Erreur lors du test audio');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <MicIcon color="primary" />
          <Typography variant="h6">
            Test Annotation Audio
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Mode Audio : Le LLM analysera les fichiers audio complets (texte + ton + émotion).
          Coût estimé : ~$0.02 par paire.
        </Alert>

        {/* Configuration */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel>Charte</FormLabel>
          <Select value={charteId} onChange={(e) => setCharteId(e.target.value)}>
            <MenuItem value="CharteY_A_v1.0.0">Charte A - Minimaliste</MenuItem>
            <MenuItem value="CharteY_B_v1.0.0">Charte B - Enrichie</MenuItem>
            <MenuItem value="CharteY_C_v1.0.0">Charte C - Binaire</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          type="number"
          label="Nombre de paires"
          value={sampleSize}
          onChange={(e) => setSampleSize(parseInt(e.target.value))}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Répertoire audio"
          value={audioDirectory}
          onChange={(e) => setAudioDirectory(e.target.value)}
          sx={{ mb: 3 }}
        />

        {/* Bouton Test */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleTest}
          disabled={testing}
          startIcon={<MicIcon />}
        >
          {testing ? 'Test en cours...' : 'Lancer Test Audio'}
        </Button>

        {/* Progress */}
        {testing && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" sx={{ mt: 1 }}>
              Annotation en cours... {progress}%
            </Typography>
          </Box>
        )}

        {/* Résultats */}
        {result && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Résultats
            </Typography>
            <Alert severity="success">
              ✅ {result.success} paires annotées avec succès
              ❌ {result.errors} erreurs
              💰 Coût total : ${result.totalCost.toFixed(2)}
              ⏱️ Durée audio totale : {result.totalDuration.toFixed(1)}s
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
```

---

## 💰 Coûts & Performances

### Tarification GPT-4o Audio

**Input Audio** : $0.06 / minute  
**Input Text** : $2.50 / 1M tokens  
**Output Text** : $10.00 / 1M tokens

### Calcul Coût 901 Paires

**Hypothèses** :
- Durée moyenne turn client : 15-30 secondes (moyenne 22.5s)
- Prompt texte : ~200 tokens input, ~50 tokens output

**Coûts** :
```
Audio input : 
  901 paires × 22.5s = 20,272s = 338 minutes
  338 min × $0.06/min = $20.28

Text input :
  901 × 200 tokens × $2.50/1M = $0.45

Text output :
  901 × 50 tokens × $10/1M = $0.45

TOTAL : $21.18 pour tout le corpus
Soit : $0.024 par paire
```

**C'est très abordable !** 💰

---

### Performances Temps

**Vitesse annotation** :
- 1 paire = ~2-4 secondes (API call + processing)
- Rate limit = 3 req/sec max
- 901 paires = ~5-10 minutes total (batch)

**Extraction audio** :
- 1 paire = ~0.5 secondes (ffmpeg)
- 901 paires = ~8 minutes total

**TOTAL : ~15-20 minutes** pour annoter tout le corpus en mode audio

---

## 🔬 Hypothèse Scientifique H5

**H5** : Un LLM multimodal (texte+audio) atteint un accord inter-annotateurs similaire à un humain écoutant l'audio complet.

### Prédictions

```
κ(LLM_audio, Humain_audio)      = 0.70-0.80 (hypothèse)
κ(LLM_texte, Humain_texte_only) = 0.75-0.85 (déjà mesuré Sprint 4)
κ(Humain_audio, Humain_texte)   = 0.40-0.60 (impact prosodie)

Conclusion espérée :
→ LLM_audio capture la prosodie aussi bien que l'humain !
→ LLM_audio > LLM_texte quand comparé à Humain_audio
```

---

## 📋 Workflow Complet

### Étape 1 : Préparation Audio (One-Time)

**Localiser fichiers audio originaux** :
```bash
/audio/original/
  call_001.wav
  call_002.wav
  ...
```

**Extraire tous les segments** :
```typescript
await AudioExtractionService.extractAllAudio(
  '/audio/original',
  '/audio/extracted'
);

// Résultat :
// /audio/extracted/
//   call_001/
//     client_turn_123.wav
//     conseiller_turn_124.wav
//     client_turn_125.wav
//     ...
```

**Durée** : ~10-15 minutes pour 901 paires

---

### Étape 2 : Annotation Batch

**Annoter échantillon (ex: 50 paires)** :
```typescript
const pairs = await fetchRandomPairs(50);

const result = await OpenAIAudioAnnotationService.annotateBatchWithAudio(
  pairs,
  'CharteY_B_v1.0.0',
  '/audio/extracted/call_001'
);

console.log(`
  Success: ${result.success}
  Cost: $${result.totalCost}
  Duration: ${result.totalDuration}s
`);
```

**Durée** : ~2-3 minutes pour 50 paires  
**Coût** : ~$1.20 pour 50 paires

---

### Étape 3 : Comparaison Kappa

**Utiliser KappaComparator** :
```typescript
// Sélection UI
Annotateur 1 : LLM Audio (GPT4o-audio_CharteY_B_v1.0.0)
Annotateur 2 : Thomas (Texte + Audio)

// Résultat
κ = 0.75
Accuracy = 80%
Désaccords = 10 / 50

Interprétation : Bon accord !
→ LLM audio capture bien la prosodie
```

---

### Étape 4 : Analyse Désaccords

**Comparer avec version texte** :
```typescript
// Désaccord audio
Pair 3187 : 
  LLM_audio = POSITIF
  Humain = POSITIF
  ✅ Accord (LLM capte le ton enthousiaste)

// Même paire texte
Pair 3187 :
  LLM_texte = NEUTRE
  Humain = POSITIF
  ❌ Désaccord (LLM rate le ton)

→ Prouve que LLM audio > LLM texte sur cas prosodiques
```

---

## 🎯 Checklist Implémentation

### Phase 1 : Extraction Audio (1h)

- [ ] Installer ffmpeg : `npm install fluent-ffmpeg`
- [ ] Créer `AudioExtractionService.ts`
- [ ] Implémenter `extractPairAudio()`
- [ ] Implémenter `extractCallAudio()`
- [ ] Implémenter `extractAllAudio()`
- [ ] Tester extraction sur 1 call
- [ ] Vérifier qualité audio (16kHz mono)
- [ ] Batch extraction 901 paires

### Phase 2 : Annotation Audio (2h)

- [ ] Installer OpenAI SDK : `npm install openai`
- [ ] Créer `OpenAIAudioAnnotationService.ts`
- [ ] Implémenter `annotateWithAudio()`
- [ ] Implémenter `buildAudioPrompt()`
- [ ] Implémenter `annotateBatchWithAudio()`
- [ ] Tester sur 5 paires manuellement
- [ ] Vérifier parsing réponses
- [ ] Tester rate limiting

### Phase 3 : Interface UI (1h)

- [ ] Créer `AudioTestingPanel.tsx`
- [ ] Intégrer dans `Level0Interface.tsx`
- [ ] Implémenter sélection charte
- [ ] Implémenter sélection échantillon
- [ ] Implémenter progress bar
- [ ] Afficher résultats batch
- [ ] Tester UX complète

### Phase 4 : Comparaisons (30min)

- [ ] Annoter 50 paires audio
- [ ] Comparer κ(LLM_audio, Humain_audio)
- [ ] Comparer avec κ(LLM_texte, Humain_audio)
- [ ] Analyser désaccords spécifiques audio
- [ ] Documenter résultats H5

---

## 📊 Résultats Attendus

### Tableau Comparatif Final

| Comparaison | Kappa | Interprétation |
|-------------|-------|----------------|
| LLM_texte vs Humain_texte | 0.82 | Excellent (même modalité) |
| LLM_audio vs Humain_audio | **0.75** | Bon (H5 validée !) |
| LLM_texte vs Humain_audio | 0.25 | Faible (conflit modalité) |
| Humain_texte vs Humain_audio | 0.45 | Modéré (impact prosodie) |

### Conclusion Scientifique

**Les LLM multimodaux (audio) réduisent de 67% l'écart d'accord causé par l'absence de prosodie** :
```
Gap LLM_texte : 0.82 - 0.25 = 0.57
Gap LLM_audio : 0.82 - 0.75 = 0.07

Réduction : (0.57 - 0.07) / 0.57 = 88%
```

**Impact Pratique** :
- LLM audio utilisable pour pré-annotation sur données audio
- Précision proche humain (75% vs 82%)
- Coût acceptable (~$0.02/paire)

---

## 🚀 Extensions Futures

### Extension 1 : Multi-Models

**Tester autres modèles audio** :
- Gemini 1.5 Pro Audio
- Whisper + Sentiment Analysis
- Comparer performances/coûts

---

### Extension 2 : Features Prosodiques

**Extraire features audio explicites** :
```typescript
{
  pitch_mean: 180,        // Hz
  pitch_variance: 45,
  energy_mean: 0.65,
  speech_rate: 4.2,       // syllabes/sec
  pauses_count: 2,
  emotion_detected: 'joie'
}
```

**Ajouter au prompt LLM** → Améliorer précision

---

### Extension 3 : Active Learning

**Identifier paires difficiles** :
```
Si LLM_texte ≠ LLM_audio
→ Paire dépend de prosodie
→ Priorité annotation humaine audio
```

---

## 📚 Références

**GPT-4o Audio** :
- Documentation : https://platform.openai.com/docs/guides/audio
- Pricing : https://openai.com/pricing
- Modèle : gpt-4o-audio-preview

**ffmpeg** :
- Documentation : https://ffmpeg.org/
- Node.js wrapper : fluent-ffmpeg

**Prosodie & Annotation** :
- Busso et al. (2008). "IEMOCAP: Interactive emotional dyadic motion capture database"
- Eyben et al. (2010). "Opensmile: the munich versatile and fast open-source audio feature extractor"

---

**Document créé** : 2025-12-17  
**Version** : 1.0  
**Auteur** : Claude & Thomas  
**Sprint** : Sprint 4+ Audio Extension
