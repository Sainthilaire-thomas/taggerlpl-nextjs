// src/components/calls/domain/services/StorageService.ts

import { AudioFile } from "../entities/AudioFile";
import { StorageRepository } from "../repositories/StorageRepository";
import { StorageError } from "../../shared/exceptions/DomainExceptions";

/**
 * Service métier pour la gestion du stockage de fichiers
 * Orchestrie les opérations de stockage et encapsule la logique métier
 */
export class StorageService {
  constructor(private storageRepository: StorageRepository) {}

  /**
   * Upload un fichier audio avec validation et génération d'URL signée
   */
  async uploadAudio(file: File): Promise<AudioFile> {
    try {
      // Génération d'un chemin de stockage unique
      const storagePath = this.generateAudioPath(file);

      // Upload du fichier
      const uploadedPath = await this.storageRepository.uploadFile(
        file,
        storagePath
      );

      // Génération de l'URL signée
      const signedUrl = await this.storageRepository.generateSignedUrl(
        uploadedPath
      );

      // Création de l'entité AudioFile
      return AudioFile.fromFile(file, uploadedPath, signedUrl);
    } catch (error) {
      throw new StorageError(
        `Failed to upload audio file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Supprime un fichier audio du stockage
   */
  async deleteAudio(path: string): Promise<void> {
    try {
      const exists = await this.storageRepository.fileExists(path);
      if (!exists) {
        // Ne pas lever d'erreur si le fichier n'existe pas (idempotence)
        return;
      }

      await this.storageRepository.deleteFile(path);
    } catch (error) {
      throw new StorageError(
        `Failed to delete audio file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Génère une URL signée pour accéder à un fichier
   */
  async generateSignedUrl(
    path: string,
    expiration: number = 1200
  ): Promise<string> {
    try {
      // Validation de l'expiration (max 24h pour des raisons de sécurité)
      const maxExpiration = 24 * 60 * 60; // 24 heures
      const safeExpiration = Math.min(expiration, maxExpiration);

      return await this.storageRepository.generateSignedUrl(
        path,
        safeExpiration
      );
    } catch (error) {
      throw new StorageError(
        `Failed to generate signed URL: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Vérifie si un fichier existe dans le stockage
   */
  async fileExists(path: string): Promise<boolean> {
    return this.storageRepository.fileExists(path);
  }

  /**
   * Obtient les métadonnées d'un fichier
   */
  async getFileMetadata(path: string) {
    return this.storageRepository.getFileMetadata(path);
  }

  /**
   * Génère un chemin de stockage unique pour un fichier audio
   */
  private generateAudioPath(file: File): string {
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "unknown";
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

    return `audio/${timestamp}_${sanitizedName}`;
  }
}
