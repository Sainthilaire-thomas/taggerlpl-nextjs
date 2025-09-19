import { CallStatus } from "../../shared/types/CallStatus";
import {
  ValidationError,
  BusinessRuleError,
} from "../../shared/exceptions/DomainExceptions";
import {
  UpgradeAnalysis,
  CallUpgradeData,
  UpgradeRecommendation,
} from "../../shared/types/CommonTypes";
import { AudioFile } from "./AudioFile";
import { Transcription } from "./Transcription";

export class Call {
  constructor(
    public readonly id: string,
    public readonly filename?: string,
    public readonly description?: string,
    public readonly status: CallStatus = CallStatus.DRAFT,
    public readonly origin?: string,
    private audioFile?: AudioFile,
    private transcription?: Transcription,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  // Business logic methods
  isReadyForTagging(): boolean {
    return this.hasValidAudio() && this.hasValidTranscription();
  }

  hasValidAudio(): boolean {
    return !!this.audioFile && this.audioFile.isValid();
  }

  hasValidTranscription(): boolean {
    return !!this.transcription && this.transcription.isValid();
  }

  canBeUpgraded(newData: Partial<CallUpgradeData>): UpgradeAnalysis {
    const canAddAudio = !this.hasValidAudio() && !!newData.audioFile;
    const canAddTranscription =
      !this.hasValidTranscription() && !!newData.transcriptionData;

    return {
      canAddAudio,
      canAddTranscription,
      hasConflict:
        this.isComplete() &&
        (!!newData.audioFile || !!newData.transcriptionData),
      recommendation: this.getUpgradeRecommendation(
        canAddAudio,
        canAddTranscription
      ),
    };
  }

  private isComplete(): boolean {
    return this.hasValidAudio() && this.hasValidTranscription();
  }

  private getUpgradeRecommendation(
    canAddAudio: boolean,
    canAddTranscription: boolean
  ): UpgradeRecommendation {
    if (canAddAudio || canAddTranscription) return "upgrade";
    if (this.isComplete()) return "create_new";
    return "block";
  }

  // Getters for encapsulation
  getAudioFile(): AudioFile | undefined {
    return this.audioFile;
  }

  getTranscription(): Transcription | undefined {
    return this.transcription;
  }

  // Update methods (immutable)
  withAudio(audioFile: AudioFile): Call {
    return new Call(
      this.id,
      this.filename,
      this.description,
      this.status,
      this.origin,
      audioFile,
      this.transcription,
      this.createdAt,
      new Date()
    );
  }

  withTranscription(transcription: Transcription): Call {
    return new Call(
      this.id,
      this.filename,
      this.description,
      this.status,
      this.origin,
      this.audioFile,
      transcription,
      this.createdAt,
      new Date()
    );
  }

  withOrigin(origin: string): Call {
    return new Call(
      this.id,
      this.filename,
      this.description,
      this.status,
      origin,
      this.audioFile,
      this.transcription,
      this.createdAt,
      new Date()
    );
  }

  withStatus(status: CallStatus): Call {
    return new Call(
      this.id,
      this.filename,
      this.description,
      status,
      this.origin,
      this.audioFile,
      this.transcription,
      this.createdAt,
      new Date()
    );
  }
}
