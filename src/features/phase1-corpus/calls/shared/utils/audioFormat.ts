import { TRANSCRIPTION_CONSTANTS } from "@/lib/config/transcriptionConfig";

export const isSupportedAudioFormat = (filename: string): boolean => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return TRANSCRIPTION_CONSTANTS.SUPPORTED_AUDIO_FORMATS.includes(ext as any);
};
