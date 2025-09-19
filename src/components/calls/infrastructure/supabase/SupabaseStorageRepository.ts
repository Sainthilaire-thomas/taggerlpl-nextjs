// src/components/calls/infrastructure/supabase/SupabaseStorageRepository.ts
import supabaseClient from "@/lib/supabaseClient";
import {
  StorageRepository,
  FileMetadata,
} from "../../domain/repositories/StorageRepository";
import {
  RepositoryError,
  StorageError,
} from "../../shared/exceptions/DomainExceptions";

const BUCKET = "calls"; // <- adapte si ton bucket a un autre nom

export class SupabaseStorageRepository implements StorageRepository {
  constructor(private sb = supabaseClient, private bucket: string = BUCKET) {}

  /**
   * Upload un fichier et retourne le chemin de stockage
   */
  async uploadFile(file: File, path?: string): Promise<string> {
    try {
      const key = path ?? this.defaultPath(file);
      const { error } = await this.sb.storage
        .from(this.bucket)
        .upload(key, file, { upsert: false });

      if (error) throw new StorageError(`Upload failed: ${error.message}`);
      return key;
    } catch (e: any) {
      throw new StorageError(e?.message ?? "Upload failed", e);
    }
  }

  /**
   * Supprime un fichier du stockage
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const { error } = await this.sb.storage.from(this.bucket).remove([path]);
      if (error) throw new StorageError(`Delete failed: ${error.message}`);
    } catch (e: any) {
      throw new StorageError(e?.message ?? "Delete failed", e);
    }
  }

  /**
   * Génère une URL signée temporaire
   */
  async generateSignedUrl(
    path: string,
    expiration: number = 1200
  ): Promise<string> {
    try {
      const safeExp = Math.min(expiration, 24 * 60 * 60);
      const { data, error } = await this.sb.storage
        .from(this.bucket)
        .createSignedUrl(path, safeExp);
      if (error || !data?.signedUrl) {
        throw new StorageError(`Signed URL failed: ${error?.message}`);
      }
      return data.signedUrl;
    } catch (e: any) {
      throw new StorageError(e?.message ?? "Signed URL failed", e);
    }
  }

  /**
   * Vérifie l'existence d'un fichier
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      const { dir, name } = this.splitPath(path);
      const { data, error } = await this.sb.storage
        .from(this.bucket)
        .list(dir, {
          search: name,
          limit: 1,
        });
      if (error) throw new RepositoryError(`Exists failed: ${error.message}`);
      return !!data?.some((f) => f.name === name);
    } catch (e: any) {
      throw new RepositoryError(e?.message ?? "Exists failed", e);
    }
  }

  /**
   * Récupère des métadonnées (approx via list)
   */
  async getFileMetadata(path: string): Promise<FileMetadata | null> {
    try {
      const { dir, name } = this.splitPath(path);
      const { data, error } = await this.sb.storage
        .from(this.bucket)
        .list(dir, {
          search: name,
          limit: 1,
        });
      if (error) throw new RepositoryError(`Metadata failed: ${error.message}`);

      const item = data?.find((f) => f.name === name);
      if (!item) return null;

      // supabase-js v2: la plupart des infos sont dans item.metadata
      const meta: any = (item as any).metadata ?? {};

      // Taille — on essaie metadata.size (number) puis size/contentLength (string)
      const size =
        typeof meta.size === "number"
          ? meta.size
          : Number.parseInt(meta.size ?? meta.contentLength ?? "0", 10) || 0;

      // MIME type — plusieurs clés possibles selon stockage
      const mimeType =
        meta.mimetype ??
        meta.mimeType ??
        meta.contentType ??
        "application/octet-stream";

      // Last modified — on privilégie la date dans metadata, sinon updated_at/created_at
      const lastModified = meta.lastModified
        ? new Date(meta.lastModified)
        : new Date(
            (item as any).updated_at ?? (item as any).created_at ?? Date.now()
          );

      const etag = meta.eTag ?? meta.etag ?? undefined;

      return { size, mimeType, lastModified, etag };
    } catch (e: any) {
      throw new RepositoryError(e?.message ?? "Metadata failed", e);
    }
  }

  /**
   * Copie un fichier vers une nouvelle clé
   */
  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      // supabase-js v2 propose copy/move côté storage
      const { error } = await this.sb.storage
        .from(this.bucket)
        .copy(sourcePath, destinationPath);
      if (error) throw new StorageError(`Copy failed: ${error.message}`);
    } catch (e: any) {
      throw new StorageError(e?.message ?? "Copy failed", e);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  private defaultPath(file: File): string {
    const ts = Date.now();
    const sanitized = (file.name || "file").replace(/[^a-zA-Z0-9.-]/g, "_");
    return `audio/${ts}_${sanitized}`;
  }

  private splitPath(p: string): { dir: string; name: string } {
    const trimmed = p.replace(/^\/+/, "");
    const idx = trimmed.lastIndexOf("/");
    if (idx === -1) return { dir: "", name: trimmed };
    return { dir: trimmed.slice(0, idx), name: trimmed.slice(idx + 1) };
  }
}
