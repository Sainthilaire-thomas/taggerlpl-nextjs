// utils/versionIdGenerator.ts
import type { AlgorithmVersionId } from "@/types/algorithm-lab";

export const generateVersionId = (
  algorithmKey: string,
  algorithmVersion: string = '1.0.0'
): AlgorithmVersionId => {
  const timestamp = Date.now();
  const shortHash = timestamp.toString(36).slice(-6);
  
  // Format: algoKey-vX.Y.Z-shortHash
  // Ex: "OpenAIXClassifier-v2.3.1-k7m9px"
  return `${algorithmKey}-v${algorithmVersion}-${shortHash}`;
};
