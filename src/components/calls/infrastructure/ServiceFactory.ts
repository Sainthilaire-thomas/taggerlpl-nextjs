// src/components/calls/infrastructure/ServiceFactory.ts
import { SupabaseCallRepository } from "./supabase/SupabaseCallRepository";
import { SupabaseStorageRepository } from "./supabase/SupabaseStorageRepository";
import { CallService } from "../domain/services/CallService";
import { ValidationService } from "../domain/services/ValidationService";
import { DuplicateService } from "../domain/services/DuplicateService";
import { StorageService } from "../domain/services/StorageService";

export const createServices = () => {
  const callRepo = new SupabaseCallRepository();
  const storageRepo = new SupabaseStorageRepository();

  const validationService = new ValidationService();
  const callService = new CallService(callRepo, validationService);
  const duplicateService = new DuplicateService(callRepo);
  const storageService = new StorageService(storageRepo);

  return {
    callService,
    duplicateService,
    storageService,
    validationService,
  };
};
