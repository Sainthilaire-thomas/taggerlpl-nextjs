// src/features/phase3-analysis/level1-validation/ui/components/Level2Preview/index.ts
/**
 * Composants de prévisualisation Level 2 pour Level 1
 * 
 * Permet d'afficher les indicateurs H1/H2 directement après validation
 * algorithmique, sans avoir à naviguer vers Level 2.
 */

export { Level2PreviewPanel } from './Level2PreviewPanel';
export type { default as Level2PreviewPanelType } from './Level2PreviewPanel';

// Re-export des types et hooks pour faciliter l'utilisation
export {
  useLevel2Preview,
  useLevel2QuickPreview,
} from '../../hooks/useLevel2Preview';

export type {
  Level2PreviewResult,
  H1PreviewData,
  H2PreviewData,
  ThresholdMode,
  ValidationMetrics,
} from '../../hooks/useLevel2Preview';

export {
  Level2PreviewService,
  level2PreviewService,
} from '../../services/Level2PreviewService';
