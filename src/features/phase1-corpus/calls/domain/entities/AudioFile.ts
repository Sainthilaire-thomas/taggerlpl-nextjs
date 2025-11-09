// src/components/calls/domain/entities/AudioFile.ts

import { ValidationError } from "../../shared/exceptions/DomainExceptions";

/**
 * Entité représentant un fichier audio dans le système
 *
 * Encapsule toute la logique métier liée aux fichiers audio :
 * validation, format, taille, etc.
 */
export class AudioFile {
  // Configuration des formats supportés
  private static readonly SUPPORTED_FORMATS = [
    "mp3",
    "wav",
    "m4a",
    "aac",
    "ogg",
  ];
  private static readonly MAX_SIZE_MB = 100;
  private static readonly MAX_SIZE_BYTES = AudioFile.MAX_SIZE_MB * 1024 * 1024;

  constructor(
    public readonly path: string,
    public readonly url?: string,
    public readonly originalFile?: File,
    public readonly size?: number,
    public readonly mimeType?: string,
    public readonly duration?: number,
    public readonly uploadedAt: Date = new Date()
  ) {
    this.validateAudioFile();
  }

  /**
   * Valide les propriétés du fichier audio
   */
  private validateAudioFile(): void {
    if (!this.path || this.path.trim().length === 0) {
      throw new ValidationError(["Audio file path is required"]);
    }

    if (this.size !== undefined && this.size <= 0) {
      throw new ValidationError(["Audio file size must be positive"]);
    }

    if (this.size !== undefined && this.size > AudioFile.MAX_SIZE_BYTES) {
      throw new ValidationError([
        `Audio file too large: ${this.getSizeInMB()}MB (max: ${
          AudioFile.MAX_SIZE_MB
        }MB)`,
      ]);
    }

    if (this.mimeType && !this.isSupportedFormat()) {
      throw new ValidationError([
        `Unsupported audio format: ${
          this.mimeType
        }. Supported formats: ${AudioFile.SUPPORTED_FORMATS.join(", ")}`,
      ]);
    }

    if (this.duration !== undefined && this.duration <= 0) {
      throw new ValidationError(["Audio duration must be positive"]);
    }
  }

  /**
   * Vérifie si le fichier audio est valide
   */
  isValid(): boolean {
    try {
      this.validateAudioFile();
      return this.path.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Vérifie si le fichier peut être lu (a une URL valide)
   */
  isPlayable(): boolean {
    return this.isValid() && !!this.url && this.url.length > 0;
  }

  /**
   * Détermine si le format est supporté
   */
  isSupportedFormat(): boolean {
    if (!this.mimeType) return true; // On ne peut pas vérifier, on suppose que c'est OK

    const format = this.getFileExtension();
    return AudioFile.SUPPORTED_FORMATS.includes(format.toLowerCase());
  }

  /**
   * Extrait l'extension du fichier
   */
  getFileExtension(): string {
    if (this.originalFile) {
      return this.originalFile.name.split(".").pop()?.toLowerCase() || "";
    }

    if (this.mimeType) {
      return this.mimeType.split("/")[1] || "";
    }

    return this.path.split(".").pop()?.toLowerCase() || "";
  }

  /**
   * Obtient la taille en MB (arrondie à 2 décimales)
   */
  getSizeInMB(): number {
    if (!this.size) return 0;
    return Math.round((this.size / 1024 / 1024) * 100) / 100;
  }

  /**
   * Obtient la durée formatée (mm:ss)
   */
  getFormattedDuration(): string {
    if (!this.duration) return "0:00";

    const minutes = Math.floor(this.duration / 60);
    const seconds = Math.floor(this.duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * Vérifie si le fichier est "lourd" (> 50MB)
   */
  isLargeFile(): boolean {
    return this.getSizeInMB() > 50;
  }

  /**
   * Vérifie si le fichier est "long" (> 30 minutes)
   */
  isLongDuration(): boolean {
    return (this.duration || 0) > 30 * 60; // 30 minutes en secondes
  }

  /**
   * Obtient le nom du fichier original
   */
  getFileName(): string {
    if (this.originalFile) {
      return this.originalFile.name;
    }

    return this.path.split("/").pop() || "unknown";
  }

  /**
   * Crée une instance depuis un File (factory method)
   */
  static fromFile(file: File, path: string, url?: string): AudioFile {
    return new AudioFile(
      path,
      url,
      file,
      file.size,
      file.type,
      undefined // Duration sera calculée plus tard
    );
  }

  /**
   * Crée une instance depuis les données de la base (factory method)
   */
  static fromDatabase(data: any): AudioFile {
    return new AudioFile(
      data.filepath || data.path,
      data.audiourl || data.url,
      undefined, // Pas de File original depuis la base
      data.size,
      data.mime_type || data.mimeType,
      data.duration,
      data.uploaded_at ? new Date(data.uploaded_at) : new Date()
    );
  }

  /**
   * Sérialise vers un objet pour la base de données
   */
  toDatabase(): any {
    return {
      filepath: this.path,
      audiourl: this.url,
      size: this.size,
      mime_type: this.mimeType,
      duration: this.duration,
      uploaded_at: this.uploadedAt,
    };
  }

  /**
   * Sérialise vers un objet JSON
   */
  toJSON(): any {
    return {
      path: this.path,
      url: this.url,
      size: this.size,
      sizeInMB: this.getSizeInMB(),
      mimeType: this.mimeType,
      duration: this.duration,
      formattedDuration: this.getFormattedDuration(),
      fileName: this.getFileName(),
      extension: this.getFileExtension(),
      isPlayable: this.isPlayable(),
      uploadedAt: this.uploadedAt,
    };
  }

  /**
   * Compare deux fichiers audio pour égalité
   */
  equals(other: AudioFile): boolean {
    return (
      this.path === other.path &&
      this.url === other.url &&
      this.size === other.size
    );
  }

  /**
   * Représentation textuelle pour debug
   */
  toString(): string {
    const sizeStr = this.size ? ` (${this.getSizeInMB()}MB)` : "";
    const durationStr = this.duration
      ? ` - ${this.getFormattedDuration()}`
      : "";
    return `AudioFile: ${this.getFileName()}${sizeStr}${durationStr}`;
  }

  /**
   * Crée une copie avec des modifications (immutabilité)
   */
  withChanges(
    changes: Partial<{
      path: string;
      url: string;
      size: number;
      mimeType: string;
      duration: number;
    }>
  ): AudioFile {
    return new AudioFile(
      changes.path ?? this.path,
      changes.url ?? this.url,
      this.originalFile,
      changes.size ?? this.size,
      changes.mimeType ?? this.mimeType,
      changes.duration ?? this.duration,
      this.uploadedAt
    );
  }

  /**
   * Crée une copie avec une nouvelle URL (utile pour les URLs signées)
   */
  withSignedUrl(signedUrl: string): AudioFile {
    return this.withChanges({ url: signedUrl });
  }
}
