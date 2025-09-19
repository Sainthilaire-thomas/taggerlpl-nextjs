// src/components/calls/domain/services/index.ts - À CORRIGER AUSSI

// Services (classes, pas des types)
export { ValidationService } from "./ValidationService";
export { CallService } from "./CallService";
export { StorageService } from "./StorageService";
export { DuplicateService } from "./DuplicateService";

// Types et interfaces de DuplicateService
export type {
  DuplicateStats,
  DuplicateDetectionConfig,
} from "./DuplicateService";
export { DEFAULT_DUPLICATE_CONFIG } from "./DuplicateService";
