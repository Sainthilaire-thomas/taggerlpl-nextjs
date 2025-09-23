import type { DiarizationSegment } from "@/components/calls/shared/types/TranscriptionTypes";

type AssemblyAIStatus = "queued" | "processing" | "completed" | "error";

interface AssemblyAITranscript {
  id: string;
  status: AssemblyAIStatus;
  error?: string;
  utterances?: Array<{
    start: number; // ms
    end: number; // ms
    text: string;
    confidence?: number;
    speaker?: string; // "A" | "B" | "SPEAKER_00" ...
  }>;
}

export class AssemblyAIDiarizationProvider {
  private readonly baseURL: string;
  private readonly apiKey: string;

  constructor(apiKey?: string, baseURL?: string) {
    this.apiKey = apiKey ?? process.env.ASSEMBLYAI_API_KEY ?? "";
    this.baseURL =
      baseURL ??
      process.env.ASSEMBLYAI_BASE_URL ??
      "https://api.assemblyai.com/v2";
    if (!this.apiKey) throw new Error("ASSEMBLYAI_API_KEY is required");
  }

  async inferSpeakers(
    fileUrl: string,
    options?: {
      languageCode?: string;
      timeoutMs?: number;
      pollIntervalMs?: number;
    }
  ): Promise<DiarizationSegment[]> {
    const languageCode = options?.languageCode ?? "fr";
    const timeoutMs = options?.timeoutMs ?? 8 * 60 * 1000;
    const pollIntervalMs = options?.pollIntervalMs ?? 2000;

    const id = await this.createTranscript(fileUrl, languageCode);
    const result = await this.pollTranscript(id, timeoutMs, pollIntervalMs);
    return this.toSegments(result);
  }

  private async createTranscript(
    audioUrl: string,
    languageCode: string
  ): Promise<string> {
    const res = await fetch(`${this.baseURL}/transcript`, {
      method: "POST",
      headers: {
        Authorization: this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: languageCode,
        speaker_labels: true,
        utterances: true,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(
        `AssemblyAI create transcript failed: HTTP ${res.status} ${res.statusText} ${txt}`
      );
    }

    const data = (await res.json()) as AssemblyAITranscript;
    if (!data.id) throw new Error("AssemblyAI: missing transcript id");
    return data.id;
  }

  private async pollTranscript(
    id: string,
    timeoutMs: number,
    intervalMs: number
  ): Promise<AssemblyAITranscript> {
    const start = Date.now();
    while (true) {
      const res = await fetch(`${this.baseURL}/transcript/${id}`, {
        method: "GET",
        headers: { Authorization: this.apiKey },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `AssemblyAI poll failed: HTTP ${res.status} ${res.statusText} ${txt}`
        );
      }

      const data = (await res.json()) as AssemblyAITranscript;

      if (data.status === "completed") return data;
      if (data.status === "error")
        throw new Error(
          `AssemblyAI processing error: ${data.error || "unknown error"}`
        );

      if (Date.now() - start > timeoutMs)
        throw new Error("AssemblyAI polling timeout");
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  private toSegments(result: AssemblyAITranscript): DiarizationSegment[] {
    const utterances = result.utterances ?? [];
    return utterances.map((u, idx) => ({
      start: u.start / 1000,
      end: u.end / 1000,
      // Mappe "A" -> turn1, "B" -> turn2, "SPEAKER_00" -> turn1, etc.
      speaker: this.toTurn(u.speaker, idx),
    }));
  }

  private toTurn(s?: string, idx?: number): string {
    if (!s) return `turn${(idx ?? 0) + 1}`;
    const match = s.match(/(\d+)$/); // SPEAKER_00 -> 00
    if (match) return `turn${Number(match[1]) + 1}`;
    // "A" -> 1, "B" -> 2...
    if (/^[A-Z]$/.test(s)) return `turn${s.charCodeAt(0) - 64}`;
    return `turn${(idx ?? 0) + 1}`;
  }
}
