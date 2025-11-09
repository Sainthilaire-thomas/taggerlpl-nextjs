/**
 * Provider de diarisation externe (pyannote/AssemblyAI/Deepgram/Speechmatics...).
 * Doit retourner une liste de segments { start, end, speaker }.
 */

import { DiarizationSegment } from "../../shared/types";

export type ExternalDiarizationOptions = {
  // Exemple: nombre de speakers attendu, seuils, etc.
  // speakerCount?: number;
};

export interface IDiarizationProvider {
  inferSpeakers(
    fileUrl: string,
    options?: ExternalDiarizationOptions
  ): Promise<DiarizationSegment[]>;
}

export class ExternalDiarizationProvider implements IDiarizationProvider {
  constructor(
    // Ajoute tes clés/urls de provider si nécessaire
    private readonly apiKey?: string,
    private readonly baseUrl?: string
  ) {}

  async inferSpeakers(
    fileUrl: string,
    _options: ExternalDiarizationOptions = {}
  ): Promise<DiarizationSegment[]> {
    // TODO: implémenter l'appel réseau au service choisi.
    // Pour l’instant, on renvoie une structure simulée pour wiring.
    // À remplacer par un vrai call provider.

    // Ex. mock: 2 locuteurs alternés toutes les ~5s
    return [
      { start: 0, end: 5, speaker: "turn1" },
      { start: 5, end: 10, speaker: "turn2" },
      { start: 10, end: 15, speaker: "turn1" },
    ];
  }
}
