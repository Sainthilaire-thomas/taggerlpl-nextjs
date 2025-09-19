// src/components/calls/shared/exceptions/DomainExceptions.ts

/**
 * Exception de base pour le domaine Calls
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;

    // Maintient la stack trace correct
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Exception levée lors d'erreurs de validation
 */
export class ValidationError extends DomainError {
  constructor(public readonly errors: string[]) {
    super(`Validation failed: ${errors.join(", ")}`);
  }

  /**
   * Crée une ValidationError à partir d'une seule erreur
   */
  static single(error: string): ValidationError {
    return new ValidationError([error]);
  }
}

/**
 * Exception levée lors de violation de règles métier
 */
export class BusinessRuleError extends DomainError {
  constructor(message: string, public readonly rule?: string) {
    super(message);
  }
}

/**
 * Exception levée quand une entité n'est pas trouvée
 */
export class NotFoundError extends DomainError {
  constructor(entity: string, identifier: string) {
    super(`${entity} with identifier '${identifier}' not found`);
  }
}

/**
 * Exception levée lors de conflits de données
 */
export class ConflictError extends DomainError {
  constructor(message: string, public readonly conflictDetails?: any) {
    super(message);
  }
}

/**
 * Exception levée lors d'erreurs d'accès aux données
 */
export class RepositoryError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "RepositoryError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RepositoryError);
    }
  }
}

/**
 * Exception levée lors d'erreurs de stockage de fichiers
 */
export class StorageError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = "StorageError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StorageError);
    }
  }
}

/**
 * Exception levée lors d'erreurs de configuration
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConfigurationError);
    }
  }
}
