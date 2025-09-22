/**
 * Provider ASR basé sur OpenAI Whisper API (/audio/transcriptions).
 * ⚠️ OpenAI ne fournit pas de diarisation native.
 * Sortie attendue: JSON "verbose" avec mots et timecodes, que l'on normalisera ensuite.
 *
 * Prérequis ENV:
 * - OPENAI_API_KEY
 * - OPENAI_BASE_URL (optionnel si tu utilises l'endpoint public)
 */

export type OpenAIWhisperOptions = {
  model?: string; // ex: "whisper-1" / "gpt-4o-mini-transcribe" selon disponibilité
  language?: string; // ex: "fr"
  temperature?: number; // optionnel
};

export class OpenAIWhisperProvider {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = "https://api.openai.com/v1"
  ) {}

  /**
   * @param fileUrl URL audio signée (Supabase) ou publique
   */
  async transcribeAudio(
    fileUrl: string,
    options: OpenAIWhisperOptions = {}
  ): Promise<any> {
    // ⚠️ Deux stratégies :
    // 1) Télécharger le binaire côté serveur puis envoyer en multipart/form-data
    // 2) Faire passer l'URL si le provider l'accepte directement (généralement il faut uploader le fichier)
    //
    // Ici, on illustre le cas #1 de façon simplifiée. À adapter selon ton runtime (Next.js route handler, etc.)
    const resAudio = await fetch(fileUrl);
    if (!resAudio.ok) {
      throw new Error(
        `OpenAIWhisperProvider: échec de téléchargement audio: ${resAudio.status}`
      );
    }
    const blob = await resAudio.blob();
    const form = new FormData();
    form.append("file", blob, "audio.wav");

    // Paramètres OpenAI Whisper
    form.append("model", options.model ?? "whisper-1");
    // "response_format":"verbose_json" pour récupérer segments/mots si dispo
    form.append("response_format", "verbose_json");
    if (options.language) form.append("language", options.language);
    if (options.temperature !== undefined)
      form.append("temperature", String(options.temperature));

    const resp = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: form,
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`OpenAI Whisper API error: ${resp.status} ${errText}`);
    }

    // JSON "verbose" (structure dépendante du modèle)
    const data = await resp.json();
    return data;
  }
}
