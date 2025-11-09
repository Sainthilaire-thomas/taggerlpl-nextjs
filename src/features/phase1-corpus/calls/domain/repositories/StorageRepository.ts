// src/components/calls/domain/repositories/StorageRepository.ts

/**
 * Interface pour la gestion du stockage de fichiers
 * Abstrait les détails d'implémentation (Supabase, AWS S3, etc.)
 */
export interface StorageRepository {
  /**
   * Upload un fichier et retourne le chemin de stockage
   */
  uploadFile(file: File, path?: string): Promise<string>;

  /**
   * Supprime un fichier du stockage
   */
  deleteFile(path: string): Promise<void>;

  /**
   * Génère une URL signée temporaire pour accéder au fichier
   */
  generateSignedUrl(path: string, expiration?: number): Promise<string>;

  /**
   * Vérifie si un fichier existe
   */
  fileExists(path: string): Promise<boolean>;

  /**
   * Obtient les métadonnées d'un fichier
   */
  getFileMetadata(path: string): Promise<FileMetadata | null>;

  /**
   * Copie un fichier vers un nouveau chemin
   */
  copyFile(sourcePath: string, destinationPath: string): Promise<void>;
}

/**
 * Métadonnées d'un fichier
 */
export interface FileMetadata {
  size: number;
  mimeType: string;
  lastModified: Date;
  etag?: string;
}
