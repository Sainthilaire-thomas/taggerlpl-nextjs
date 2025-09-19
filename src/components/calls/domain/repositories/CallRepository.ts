// src/components/calls/domain/repositories/CallRepository.ts

import { Call } from "../entities/Call";
import { CallStatus } from "../../shared/types/CallStatus";

/**
 * Interface pour l'accès aux données des appels
 * Définit le contrat que doivent respecter toutes les implémentations
 */
export interface CallRepository {
  /**
   * Sauvegarde un nouvel appel
   */
  save(call: Call): Promise<void>;

  /**
   * Met à jour un appel existant
   */
  update(call: Call): Promise<void>;

  /**
   * Supprime un appel
   */
  delete(callId: string): Promise<void>;

  /**
   * Trouve un appel par son ID
   */
  findById(id: string): Promise<Call | null>;

  /**
   * Trouve tous les appels (avec pagination optionnelle)
   */
  findAll(offset?: number, limit?: number): Promise<Call[]>;

  /**
   * Trouve les appels par nom de fichier
   */
  findByFilename(filename: string): Promise<Call[]>;

  /**
   * Trouve les appels par hash de contenu (pour détection doublons)
   */
  findByContentHash(hash: string): Promise<Call[]>;

  /**
   * Trouve les appels avec description similaire
   */
  findByDescriptionPattern(pattern: string): Promise<Call[]>;

  /**
   * Trouve les appels par origine
   */
  findByOrigin(origin: string): Promise<Call[]>;

  /**
   * Trouve les appels par statut
   */
  findByStatus(status: CallStatus): Promise<Call[]>;

  /**
   * Compte le nombre total d'appels
   */
  count(): Promise<number>;

  /**
   * Vérifie si un appel avec cet ID existe
   */
  exists(id: string): Promise<boolean>;
}
