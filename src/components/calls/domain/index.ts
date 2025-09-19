// src/components/calls/domain/index.ts - À CORRIGER AUSSI

// Exports des entités (classes)
export { TranscriptionWord, AudioFile, Call } from "./entities";

// Exports des services (classes)
export {
  ValidationService,
  CallService,
  StorageService,
  DuplicateService,
} from "./services";

// Exports des types de services
export type { DuplicateStats, DuplicateDetectionConfig } from "./services";

// Exports des repositories (interfaces = types)
export type {
  CallRepository,
  StorageRepository,
  FileMetadata,
} from "./repositories";
