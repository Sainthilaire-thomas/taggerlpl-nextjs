// src/features/phase3-analysis/level1-validation/ui/hooks/index.ts
/**
 * Export centralisé des hooks Level 1 Validation
 * Phase 3 - Level 1 Validation
 */

// Existing hooks
export { useLevel1Testing } from './useLevel1Testing';
export { useAnalysisPairs } from './useAnalysisPairs';
export { useLevel2Preview } from './useLevel2Preview';

// New versioning & investigation hooks
export { useTestRuns } from './useTestRuns';
export { useInvestigation } from './useInvestigation';
export { useVersionValidation } from './useVersionValidation';

// H1/H2 comparison hooks (for Results sections)
export { useH1Comparison } from './useH1Comparison';
export { useH2Mediation } from './useH2Mediation';
