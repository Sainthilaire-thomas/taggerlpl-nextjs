import { TRANSCRIPTION_CONSTANTS } from "@/lib/config/transcriptionConfig";

export const calculateCost = (audioSeconds: number): number => {
  const minutes = audioSeconds / 60;
  return minutes * TRANSCRIPTION_CONSTANTS.WHISPER_COST_PER_MINUTE;
};
