// src/components/calls/domain/entities/TranscriptionWord.ts

/**
 * Entité représentant un mot dans une transcription
 *
 * Cette classe encapsule la logique métier d'un mot avec ses timestamps,
 * son speaker et sa validation.
 */
export class TranscriptionWord {
  constructor(
    public readonly text: string,
    public readonly startTime: number,
    public readonly endTime: number,
    public readonly speaker: string,
    public readonly turn?: string,
    public readonly confidence?: number
  ) {
    // Validation dans le constructeur pour garantir la cohérence
    this.validateWord();
  }

  /**
   * Valide la cohérence des données du mot
   * @throws {Error} Si les données sont invalides
   */
  private validateWord(): void {
    if (!this.text || this.text.trim().length === 0) {
      throw new Error("Word text cannot be empty");
    }

    if (this.startTime < 0) {
      throw new Error("Start time cannot be negative");
    }

    if (this.endTime <= this.startTime) {
      throw new Error("End time must be greater than start time");
    }

    if (!this.speaker || this.speaker.trim().length === 0) {
      throw new Error("Speaker cannot be empty");
    }

    if (
      this.confidence !== undefined &&
      (this.confidence < 0 || this.confidence > 1)
    ) {
      throw new Error("Confidence must be between 0 and 1");
    }
  }

  /**
   * Vérifie si le mot est valide selon les règles métier
   */
  isValid(): boolean {
    try {
      this.validateWord();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calcule la durée du mot en secondes
   */
  getDuration(): number {
    return this.endTime - this.startTime;
  }

  /**
   * Détermine si ce mot chevauche avec un autre temporellement
   */
  overlapsWith(other: TranscriptionWord): boolean {
    return this.startTime < other.endTime && this.endTime > other.startTime;
  }

  /**
   * Détermine si ce mot est adjacent temporellement à un autre
   * @param toleranceMs Tolérance en millisecondes pour considérer les mots comme adjacents
   */
  isAdjacentTo(other: TranscriptionWord, toleranceMs: number = 100): boolean {
    const tolerance = toleranceMs / 1000; // Convertir en secondes
    return (
      Math.abs(this.endTime - other.startTime) <= tolerance ||
      Math.abs(other.endTime - this.startTime) <= tolerance
    );
  }

  /**
   * Vérifie si c'est un marqueur de fin de tour (selon votre logique métier)
   */
  isTurnEndMarker(): boolean {
    return this.turn === "--" || this.text.trim() === "";
  }

  /**
   * Détermine si le mot a une confiance suffisante
   * @param threshold Seuil de confiance minimum (par défaut 0.5)
   */
  hasGoodConfidence(threshold: number = 0.5): boolean {
    return this.confidence === undefined || this.confidence >= threshold;
  }

  /**
   * Crée une instance depuis des données JSON (factory method)
   */
  static fromJSON(data: any): TranscriptionWord {
    return new TranscriptionWord(
      data.text || data.word || "",
      data.startTime || data.start_time || 0,
      data.endTime || data.end_time || 0,
      data.speaker || "unknown",
      data.turn,
      data.confidence
    );
  }

  /**
   * Crée une instance depuis les données de votre base (factory method)
   */
  static fromDatabase(data: any): TranscriptionWord {
    return new TranscriptionWord(
      data.text || data.word || "",
      data.startTime || data.start_time || 0,
      data.endTime || data.end_time || 0,
      data.speaker || "unknown",
      data.turn,
      data.confidence
    );
  }

  /**
   * Sérialise vers un objet JSON
   */
  toJSON(): any {
    return {
      text: this.text,
      startTime: this.startTime,
      endTime: this.endTime,
      speaker: this.speaker,
      turn: this.turn,
      confidence: this.confidence,
    };
  }

  /**
   * Sérialise vers le format de votre base de données
   */
  toDatabase(): any {
    return {
      text: this.text,
      startTime: this.startTime,
      endTime: this.endTime,
      speaker: this.speaker,
      turn: this.turn || null,
      confidence: this.confidence || null,
    };
  }

  /**
   * Compare deux mots pour égalité (utile pour les tests)
   */
  equals(other: TranscriptionWord): boolean {
    return (
      this.text === other.text &&
      this.startTime === other.startTime &&
      this.endTime === other.endTime &&
      this.speaker === other.speaker &&
      this.turn === other.turn &&
      this.confidence === other.confidence
    );
  }

  /**
   * Représentation textuelle pour debug
   */
  toString(): string {
    const duration = this.getDuration().toFixed(2);
    const confidence = this.confidence
      ? ` (${(this.confidence * 100).toFixed(1)}%)`
      : "";
    return `[${this.speaker}] "${this.text}" [${this.startTime}s-${this.endTime}s, ${duration}s]${confidence}`;
  }

  /**
   * Clone le mot avec des modifications optionnelles (immutabilité)
   */
  withChanges(
    changes: Partial<{
      text: string;
      startTime: number;
      endTime: number;
      speaker: string;
      turn?: string;
      confidence?: number;
    }>
  ): TranscriptionWord {
    return new TranscriptionWord(
      changes.text ?? this.text,
      changes.startTime ?? this.startTime,
      changes.endTime ?? this.endTime,
      changes.speaker ?? this.speaker,
      changes.turn ?? this.turn,
      changes.confidence ?? this.confidence
    );
  }
}
