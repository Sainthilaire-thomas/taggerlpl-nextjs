import { TranscriptionWord } from "./TranscriptionWord";
import { TranscriptionMetadata } from "../../shared/types/CommonTypes";

export class Transcription {
  constructor(
    public readonly words: TranscriptionWord[],
    public readonly metadata?: TranscriptionMetadata
  ) {}

  isValid(): boolean {
    return this.words.length > 0 && this.words.every((word) => word.isValid());
  }

  getWordCount(): number {
    return this.words.length;
  }

  getDurationInSeconds(): number {
    if (this.words.length === 0) return 0;
    const lastWord = this.words[this.words.length - 1];
    return lastWord.endTime - this.words[0].startTime;
  }

  getSpeakers(): string[] {
    const speakers = new Set(this.words.map((w) => w.speaker).filter(Boolean));
    return Array.from(speakers);
  }

  getWordsInRange(startTime: number, endTime: number): TranscriptionWord[] {
    return this.words.filter(
      (w) => w.startTime >= startTime && w.endTime <= endTime
    );
  }

  static fromJSON(jsonData: any): Transcription {
    const words =
      jsonData.words?.map((w: any) => TranscriptionWord.fromJSON(w)) || [];
    return new Transcription(words, jsonData.metadata);
  }
}
