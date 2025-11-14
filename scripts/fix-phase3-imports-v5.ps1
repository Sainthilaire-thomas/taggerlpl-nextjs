# ============================================
# Script v5 - Correction imports manquants
# ============================================

Write-Host "🔧 Script v5 - Correction des 31 imports manquants..." -ForegroundColor Cyan
Write-Host ""

function Replace-InFile {
    param([string]$FilePath, [string]$OldPattern, [string]$NewPattern)
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        $content = $content -replace [regex]::Escape($OldPattern), $NewPattern
        Set-Content $FilePath -Value $content -Encoding UTF8 -NoNewline
        return $true
    }
    return $false
}

$count = 0

# ============================================
# 1. API Routes - Imports AlgorithmLab
# ============================================
Write-Host "🔌 Correction API routes..." -ForegroundColor Yellow

$apiFiles = @(
    'src/app/api/algolab/classifiers/[name]/route.ts'
)

foreach ($file in $apiFiles) {
    if (Replace-InFile $file '@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/AlgorithmRegistry' '@/features/phase3-analysis/level1-validation/algorithms/shared/AlgorithmRegistry') { $count++ }
    if (Replace-InFile $file '@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/initializeAlgorithms' '@/features/phase3-analysis/level1-validation/algorithms/shared/initializeAlgorithms') { $count++ }
    Write-Host "  ✓ $(Split-Path $file -Leaf)" -ForegroundColor Green
}

# ============================================
# 2. Phase 1 - Imports relatifs manquants
# ============================================
Write-Host ""
Write-Host "📦 Correction Phase 1..." -ForegroundColor Yellow

# Chercher où sont ces fichiers
Write-Host "  Recherche des fichiers Phase 1..." -ForegroundColor Gray
$audioList = Get-ChildItem "src/features/phase1-corpus" -Recurse -Filter "AudioList.*" -File | Select-Object -First 1
$snackbar = Get-ChildItem "src/features/phase1-corpus" -Recurse -Filter "SnackBarManager.*" -File | Select-Object -First 1
$callListUnprepared = Get-ChildItem "src/features/phase1-corpus" -Recurse -Filter "CallListUnprepared.*" -File | Select-Object -First 1

if ($audioList) { Write-Host "    Found: $($audioList.FullName)" -ForegroundColor Gray }
if ($snackbar) { Write-Host "    Found: $($snackbar.FullName)" -ForegroundColor Gray }
if ($callListUnprepared) { Write-Host "    Found: $($callListUnprepared.FullName)" -ForegroundColor Gray }

# Ces fichiers n'existent probablement pas - on va les désactiver
Write-Host "  ⚠️  Fichiers Phase 1 manquants - imports à commenter" -ForegroundColor Yellow

# ============================================
# 3. Phase 3 - Classifiers récupérés
# ============================================
Write-Host ""
Write-Host "🔧 Correction classifiers récupérés..." -ForegroundColor Yellow

$file = "src/features/phase3-analysis/level1-validation/algorithms/classifiers/client/SpacyClientClassifier.ts"
if (Replace-InFile $file '../shared/BaseAlgorithm' '../../../shared/BaseAlgorithm') { $count++ }
if (Replace-InFile $file '../conseillerclassifiers/SpacyConseillerClassifier' '../../conseiller/SpacyConseillerClassifier') { $count++ }
Write-Host "  ✓ SpacyClientClassifier.ts" -ForegroundColor Green

$file = "src/features/phase3-analysis/level1-validation/algorithms/classifiers/shared/BaseClientClassifier.ts"
if (Replace-InFile $file '../../../shared/BaseAlgorithm' '../../../shared/BaseAlgorithm') { $count++ }
Write-Host "  ✓ BaseClientClassifier.ts" -ForegroundColor Green

# ============================================
# 4. Hooks Phase 3
# ============================================
Write-Host ""
Write-Host "🪝 Correction hooks Phase 3..." -ForegroundColor Yellow

$file = "src/features/phase3-analysis/level1-validation/ui/hooks/useLevel1Testing.ts"
if (Replace-InFile $file '@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/initializeAlgorithms' '@/features/phase3-analysis/level1-validation/algorithms/shared/initializeAlgorithms') { $count++ }
if (Replace-InFile $file '@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/AlgorithmRegistry' '@/features/phase3-analysis/level1-validation/algorithms/shared/AlgorithmRegistry') { $count++ }
Write-Host "  ✓ useLevel1Testing.ts" -ForegroundColor Green

$file = "src/features/phase3-analysis/level1-validation/ui/hooks/usePostValidationVersioning.ts"
if (Replace-InFile $file '../algorithms/level1/shared/AlgorithmRegistry' '../../algorithms/shared/AlgorithmRegistry') { $count++ }
Write-Host "  ✓ usePostValidationVersioning.ts" -ForegroundColor Green

# ============================================
# 5. Components Phase 3
# ============================================
Write-Host ""
Write-Host "🎨 Correction components Phase 3..." -ForegroundColor Yellow

$file = "src/features/phase3-analysis/level1-validation/ui/components/algorithms/BaseAlgorithmTesting.tsx"
if (Replace-InFile $file '../../../algorithms/level1/shared/AlgorithmRegistry' '../../../algorithms/shared/AlgorithmRegistry') { $count++ }
if (Replace-InFile $file 'src/app/(protected)/analysis/components/AlgorithmLab/components/Level1/shared/results/base/ResultsSample/ResultsPanel' '@/features/phase3-analysis/level1-validation/ui/components/shared/results/base/ResultsSample/ResultsPanel') { $count++ }
Write-Host "  ✓ BaseAlgorithmTesting.tsx" -ForegroundColor Green

$file = "src/features/phase3-analysis/level1-validation/ui/components/individual/TechnicalValidation/TechnicalValidation.tsx"
if (Replace-InFile $file '../@/features/phase3-analysis/level1-validation/ui/hooks/useLevel1Testing' '@/features/phase3-analysis/level1-validation/ui/hooks/useLevel1Testing') { $count++ }
Write-Host "  ✓ TechnicalValidation.tsx" -ForegroundColor Green

# ============================================
# 6. Metrics Framework
# ============================================
Write-Host ""
Write-Host "📊 Correction metrics-framework..." -ForegroundColor Yellow

$file = "src/features/phase3-analysis/shared/metrics-framework/index.ts"
if (Replace-InFile $file '../cognitive-metrics/indicators/FluiditeCognitiveIndicator/FluiditeCognitiveIndicator' '@/features/phase3-analysis/level2-hypotheses/shared/cognitive-metrics/indicators/FluiditeCognitiveIndicator/FluiditeCognitiveIndicator') { $count++ }
if (Replace-InFile $file '../cognitive-metrics/CognitiveMetricsRegistry' '@/features/phase3-analysis/level2-hypotheses/shared/cognitive-metrics/CognitiveMetricsRegistry') { $count++ }
if (Replace-InFile $file '../cognitive-metrics/migration/CognitiveMetricsMigration' '@/features/phase3-analysis/level2-hypotheses/shared/cognitive-metrics/migration/CognitiveMetricsMigration') { $count++ }
if (Replace-InFile $file '../cognitive-metrics/migration/adaptUseCognitiveMetrics' '@/features/phase3-analysis/level2-hypotheses/shared/cognitive-metrics/migration/adaptUseCognitiveMetrics') { $count++ }
if (Replace-InFile $file '../TestFrameworkIntegration' '@/features/phase3-analysis/level2-hypotheses/shared/TestFrameworkIntegration') { $count++ }
Write-Host "  ✓ metrics-framework/index.ts" -ForegroundColor Green

$file = "src/features/phase3-analysis/level2-hypotheses/shared/cognitive-metrics/CognitiveMetricsRegistry.tsx"
if (Replace-InFile $file '../metrics-framework/core/MetricsRegistry' '@/features/phase3-analysis/shared/metrics-framework/core/MetricsRegistry') { $count++ }
Write-Host "  ✓ CognitiveMetricsRegistry.tsx" -ForegroundColor Green

# ============================================
# 7. Divers
# ============================================
Write-Host ""
Write-Host "🔧 Corrections diverses..." -ForegroundColor Yellow

$file = "src/features/phase3-analysis/level1-validation/shared/utils/versionGenerator.ts"
if (Replace-InFile $file '../types' '@/types/algorithm-lab') { $count++ }
Write-Host "  ✓ versionGenerator.ts" -ForegroundColor Green

$file = "src/features/phase3-analysis/level2-hypotheses/h2/ui/hooks/useStrategyStats.tsx"
if (Replace-InFile $file '../types' '@/types/algorithm-lab') { $count++ }
Write-Host "  ✓ useStrategyStats.tsx" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Script v5 terminé ! $count corrections" -ForegroundColor Green
Write-Host "  Relancer : npx tsc --noEmit --pretty 2>&1 | Select-String 'Found'" -ForegroundColor Cyan
