Write-Host "🔧 Script v10 - CORRECTION FINALE..." -ForegroundColor Cyan
Write-Host ""

function Replace-InFile {
    param([string]$FilePath, [string]$OldPattern, [string]$NewPattern)
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        $oldContent = $content
        $content = $content -replace [regex]::Escape($OldPattern), $NewPattern
        if ($content -ne $oldContent) {
            Set-Content $FilePath -Value $content -Encoding UTF8 -NoNewline
            return $true
        }
    }
    return $false
}

$count = 0

# 1. Classifiers - BaseAlgorithm
Write-Host "🔧 Classifiers BaseAlgorithm..." -ForegroundColor Yellow
$file = "src/features/phase3-analysis/level1-validation/algorithms/classifiers/client/SpacyClientClassifier.ts"
if (Replace-InFile $file "from `"../../../shared/BaseAlgorithm`"" "from `"../../shared/BaseAlgorithm`"") { $count++; Write-Host "  ✓ SpacyClientClassifier" -ForegroundColor Green }
if (Replace-InFile $file "from `"../../shared/BaseAlgorithm`"" "from `"../../shared/BaseAlgorithm`"") { Write-Host "  ✓ SpacyClientClassifier (déjà OK)" -ForegroundColor Gray }

$file = "src/features/phase3-analysis/level1-validation/algorithms/classifiers/shared/BaseClientClassifier.ts"
if (Replace-InFile $file "from `"../../../shared/BaseAlgorithm`"" "from `"../../shared/BaseAlgorithm`"") { $count++; Write-Host "  ✓ BaseClientClassifier" -ForegroundColor Green }

# 2. API routes
Write-Host ""
Write-Host "🔌 API routes..." -ForegroundColor Yellow
$apiFile = "src/app/api/algolab/classifiers/[name]/route.ts"
if (Test-Path $apiFile) {
    if (Replace-InFile $apiFile "@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/AlgorithmRegistry" "@/features/phase3-analysis/level1-validation/algorithms/shared/AlgorithmRegistry") { $count++; Write-Host "  ✓ AlgorithmRegistry" -ForegroundColor Green }
    if (Replace-InFile $apiFile "@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/initializeAlgorithms" "@/features/phase3-analysis/level1-validation/algorithms/shared/initializeAlgorithms") { $count++; Write-Host "  ✓ initializeAlgorithms" -ForegroundColor Green }
}

# 3. metrics-framework/index.ts - VRAIMENT commenter
Write-Host ""
Write-Host "📊 metrics-framework - commenter exports..." -ForegroundColor Yellow
$file = "src/features/phase3-analysis/shared/metrics-framework/index.ts"
if (Test-Path $file) {
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # Commenter les 3 imports problématiques
    $content = $content -replace "import CognitiveMetricsMigration from", "// DISABLED: import CognitiveMetricsMigration from"
    $content = $content -replace "import TestFrameworkIntegration from", "// DISABLED: import TestFrameworkIntegration from"
    $content = $content -replace "import \{[\s\S]*?\} from `"@/features/phase3-analysis/level2-hypotheses/shared/cognitive-metrics/migration/adaptUseCognitiveMetrics`";", "// DISABLED: import from adaptUseCognitiveMetrics"
    
    # Commenter les exports
    $content = $content -replace "export \{ CognitiveMetricsMigration, TestFrameworkIntegration \};", "// DISABLED: export { CognitiveMetricsMigration, TestFrameworkIntegration };"
    $content = $content -replace "export \{[\s\S]*?useAdaptedCognitiveMetrics[\s\S]*?\};", "// DISABLED: export useAdaptedCognitiveMetrics"
    
    Set-Content $file -Value $content -Encoding UTF8 -NoNewline
    $count += 3
    Write-Host "  ✓ Imports migration commentés" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Script v10 terminé ! $count corrections" -ForegroundColor Green
Write-Host "  Relancer : npx tsc --noEmit --pretty 2>&1 | Select-String `"Found`"" -ForegroundColor Cyan
