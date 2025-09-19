// src/components/calls/domain/workflows/ImportWorkflow.ts
import { CallService } from "../services/CallService";
import { ValidationService } from "../services/ValidationService";
import { DuplicateService } from "../services/DuplicateService";
import { StorageService } from "../services/StorageService";
import { ValidationError } from "../../shared/exceptions/DomainExceptions";
import {
  ImportResult,
  CallUpgradeData,
  DuplicateAction,
} from "../../shared/types/CommonTypes";

type ImportData = {
  audioFile?: File | null;
  description?: string;
  transcriptionText?: string;
  workdriveFileName?: string;
  origin?: string;
};

type Callbacks = {
  onDuplicateFound?: (dup: any) => Promise<DuplicateAction>;
  onProgress?: (progress: number) => void;
  showMessage?: (message: string) => void;
};

export class ImportWorkflow {
  constructor(
    private callService: CallService,
    private validationService: ValidationService,
    private duplicateService: DuplicateService,
    private storageService: StorageService
  ) {}

  async execute(data: ImportData, cb?: Callbacks): Promise<ImportResult> {
    try {
      // 1) Validation via l'API publique
      const validation = this.validationService.validateCallData({
        audioFile: data.audioFile ?? undefined,
        filename: data.audioFile?.name ?? data.workdriveFileName,
        description: data.description,
        origin: data.origin,
        transcriptionText: data.transcriptionText,
      });

      if (!validation.isValid) {
        throw new ValidationError(validation.errors);
      }

      // 2) Détection de doublons (filename / description / transcriptionText)
      const dup = await this.duplicateService.checkForDuplicates({
        filename: data.audioFile?.name ?? data.workdriveFileName,
        description: data.description,
        transcriptionText: data.transcriptionText,
      });

      if (dup?.isDuplicate && cb?.onDuplicateFound) {
        const choice = await cb.onDuplicateFound(dup);
        if (choice === "cancel" || choice === "block") {
          return { success: false, reason: choice, error: "Import annulé." };
        }
        if (choice === "upgrade") {
          // On fournit un CallUpgradeData conforme (File + transcriptionData parsée si présente)
          const upgradeData: CallUpgradeData = {};
          if (data.audioFile) upgradeData.audioFile = data.audioFile;
          if (data.transcriptionText) {
            try {
              upgradeData.transcriptionData = JSON.parse(
                data.transcriptionText
              );
            } catch (e) {
              throw new ValidationError([
                "Transcription JSON invalide (upgrade): " +
                  (e as Error)?.message,
              ]);
            }
          }
          if (data.description) upgradeData.description = data.description;

          await this.duplicateService.upgradeExistingCall(
            dup.existingCall.id,
            upgradeData
          );

          return {
            success: true,
            callId: dup.existingCall.id,
            message: "Doublon mis à niveau",
          };
        }
        // sinon "create_new" → on continue la création
      }

      // 3) Upload éventuel (uploadAudio renvoie un AudioFile avec URL signée)
      let audioUrl: string | undefined;
      if (data.audioFile) {
        const uploaded = await this.storageService.uploadAudio(data.audioFile);
        // On ne devine pas l'API d'AudioFile : on tente les noms usuels sans casser le typage
        audioUrl =
          (uploaded as any).getSignedUrl?.() ??
          (uploaded as any).signedUrl ??
          (uploaded as any).url ??
          undefined;
      }

      // 4) Création du Call via CallService (CreateCallData strict)
      const call = await this.callService.createCall({
        audioFile: data.audioFile ?? undefined, // File | undefined
        filename: data.audioFile?.name ?? data.workdriveFileName,
        description: data.description,
        origin: data.origin,
        audioUrl, // string | undefined
        transcriptionText: data.transcriptionText,
      });

      const parts: string[] = [];
      if (data.audioFile) parts.push("audio");
      if (data.transcriptionText) parts.push("transcription");

      return {
        success: true,
        callId: call.id,
        message: `Import réussi: ${parts.join(" + ")}`,
      };
    } catch (e: any) {
      return { success: false, error: e?.message ?? "Unknown error" };
    }
  }
}
