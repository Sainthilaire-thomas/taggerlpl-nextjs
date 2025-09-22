/**
 * Workflow d'orchestration: UI → (ASR) → (Diarisation) → Validation/Sauvegarde
 */

import { TranscriptionJson, TranscriptionResult } from "../../shared/types";
import { CallRepository } from "../repositories/CallRepository";
import { StorageRepository } from "../repositories/StorageRepository";
import { TranscriptionASRService } from "../services/TranscriptionASRService";
import {
  OpenAIWhisperProvider,
  OpenAIWhisperOptions,
} from "../../infrastructure/asr/OpenAIWhisperProvider";
import { IDiarizationProvider } from "../../infrastructure/diarization/ExternalDiarizationProvider";

// Helper: résout une URL exploitable par les providers (si c'est déjà http(s) on garde tel quel,
// sinon on génère une URL signée depuis le storage)
const resolveSignedUrl = async (
  storage: StorageRepository,
  audioRef: string
): Promise<string> => {
  if (/^https?:\/\//i.test(audioRef)) return audioRef;
  // 1h par défaut (adapte si besoin)
  return storage.generateSignedUrl(audioRef, 60 * 60);
};

// Helper: récupère l'URL/chemin audio quelle que soit la propriété utilisée dans l'entité Call
const getAudioRef = (call: any): string | undefined =>
  call?.audioUrl ?? call?.audiourl ?? call?.audio_url ?? undefined;

export class TranscriptionASRWorkflow {
  constructor(
    private readonly callRepo: CallRepository,
    private readonly storageRepo: StorageRepository,
    private readonly asrProvider: OpenAIWhisperProvider,
    private readonly diarProvider: IDiarizationProvider,
    private readonly service: TranscriptionASRService
  ) {}

  /** Étape 1: Transcription via OpenAI + normalisation */
  async transcribe(
    callId: string,
    asrOptions: OpenAIWhisperOptions = {}
  ): Promise<TranscriptionResult> {
    const call = await this.callRepo.findById(callId); // ← findById (pas getById)
    if (!call) throw new Error(`Call ${callId} introuvable`);

    const audioRef = getAudioRef(call);
    if (!audioRef) throw new Error(`Call ${callId} sans audio`);

    const signed = await resolveSignedUrl(this.storageRepo, String(audioRef)); // ← generateSignedUrl sous le capot
    const raw = await this.asrProvider.transcribeAudio(signed, asrOptions);

    const normalized: TranscriptionJson = this.service.normalize(raw, {
      language: asrOptions.language ?? "fr-FR",
      source: "asr:auto",
    });

    // Ton port expose update(call) (pas updateTranscription)
    const updatedCall: any = { ...call, transcription: normalized };
    await this.callRepo.update(updatedCall);

    return { callId, transcription: normalized };
  }

  /** Étape 2: Diarisation via provider externe + assignation des turns */
  async diarize(callId: string): Promise<TranscriptionResult> {
    const call = await this.callRepo.findById(callId); // ← findById
    if (!call) throw new Error(`Call ${callId} introuvable`);

    const audioRef = getAudioRef(call);
    if (!audioRef) throw new Error(`Call ${callId} sans audio`);

    const current: TranscriptionJson = (call as any).transcription ?? {
      words: [],
    };
    if (!current.words?.length) {
      throw new Error("Aucune transcription à diariser. Lance d'abord l'ASR.");
    }

    const signed = await resolveSignedUrl(this.storageRepo, String(audioRef)); // ← generateSignedUrl
    const diarSegments = await this.diarProvider.inferSpeakers(signed);

    const updatedWords = this.service.assignTurns(
      [...current.words],
      diarSegments
    );
    const updated: TranscriptionJson = { ...current, words: updatedWords };

    const updatedCall: any = { ...call, transcription: updated };
    await this.callRepo.update(updatedCall); // ← update(call)

    return { callId, transcription: updated };
  }

  /** Étape 3: Validation & Sauvegarde (si déjà édité en mémoire côté UI) */
  async validateAndSave(
    callId: string,
    candidate?: TranscriptionJson
  ): Promise<TranscriptionResult> {
    const call = await this.callRepo.findById(callId); // ← findById
    if (!call) throw new Error(`Call ${callId} introuvable`);

    const current: TranscriptionJson = candidate ??
      (call as any).transcription ?? { words: [] };

    const { ok, warnings } = this.service.validateAll(current.words);
    if (!ok) {
      throw new Error(`Validation échouée: ${warnings.join(" | ")}`);
    }

    const updatedCall: any = { ...call, transcription: current };
    await this.callRepo.update(updatedCall); // ← update(call)

    return { callId, transcription: current };
  }
}
