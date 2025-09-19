// Exports des entités (classes, pas des types)
export { TranscriptionWord } from "./TranscriptionWord";
export { AudioFile } from "./AudioFile";
export { Call } from "./Call";

// Exports des types et enums
export type { CallStatus } from "../../shared/types/CallStatus";
export {
  VALID_STATUS_TRANSITIONS,
  isValidStatusTransition,
  getStatusLabel,
  getStatusColor,
} from "../../shared/types/CallStatus";

// Exports des exceptions (classes)
export {
  DomainError,
  ValidationError,
  BusinessRuleError,
  NotFoundError,
  ConflictError,
  RepositoryError,
  StorageError,
  ConfigurationError,
} from "../../shared/exceptions/DomainExceptions";
