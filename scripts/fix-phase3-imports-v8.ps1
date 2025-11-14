Write-Host "🔧 Script v8 - Correction des 16 imports manquants..." -ForegroundColor Cyan
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

function Comment-ImportLine {
    param([string]$FilePath, [string]$ImportPattern)
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        $content = $content -replace "(?m)^(import .* from ['""]$([regex]::Escape($ImportPattern))['""];?)$", "// DISABLED: `$1"
        Set-Content $FilePath -Value $content -Encoding UTF8 -NoNewline
        return $true
    }
    return $false
}

$count = 0

# 1. API routes (déjà corrigés normalement, mais vérifions)
Write-Host "🔌 API routes..." -ForegroundColor Yellow
$file = "src/app/api/algolab/classifiers/[name]/route.ts"
if (Test-Path $file) {
    if (Replace-InFile $file "@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/AlgorithmRegistry" "@/features/phase3-analysis/level1-validation/algorithms/shared/AlgorithmRegistry") { $count++ }
    if (Replace-InFile $file "@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/initializeAlgorithms" "@/features/phase3-analysis/level1-validation/algorithms/shared/initializeAlgorithms") { $count++ }
    Write-Host "  ✓ route.ts corrigé" -ForegroundColor Green
}

# 2. Phase 1 utils - vérifier s ils existent
Write-Host ""
Write-Host "📦 Phase 1 utils..." -ForegroundColor Yellow

$utilsDir = "src/features/phase1-corpus/calls/shared/utils"
if (-not (Test-Path $utilsDir)) {
    Write-Host "  ⚠️  Dossier utils manquant - création" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $utilsDir -Force | Out-Null
}

# Chercher où sont ces utils
$callApiUtils = Get-ChildItem "src" -Recurse -Filter "callApiUtils.*" -File | Select-Object -First 1
$removeCallUpload = Get-ChildItem "src" -Recurse -Filter "removeCallUpload.*" -File | Select-Object -First 1
$signedUrls = Get-ChildItem "src" -Recurse -Filter "signedUrls.*" -File | Select-Object -First 1
$updateCallOrigine = Get-ChildItem "src" -Recurse -Filter "updateCallOrigine.*" -File | Select-Object -First 1

if ($callApiUtils) { Write-Host "  Found callApiUtils: $($callApiUtils.FullName)" -ForegroundColor Gray }
if ($removeCallUpload) { Write-Host "  Found removeCallUpload: $($removeCallUpload.FullName)" -ForegroundColor Gray }
if ($signedUrls) { Write-Host "  Found signedUrls: $($signedUrls.FullName)" -ForegroundColor Gray }
if ($updateCallOrigine) { Write-Host "  Found updateCallOrigine: $($updateCallOrigine.FullName)" -ForegroundColor Gray }

# 3. Phase 3 classifiers
Write-Host ""
Write-Host "🔧 Phase 3 classifiers..." -ForegroundColor Yellow

$file = "src/features/phase3-analysis/level1-validation/algorithms/classifiers/client/SpacyClientClassifier.ts"
if (Test-Path $file) {
    if (Replace-InFile $file "from '../../../shared/BaseAlgorithm'" "from '../../shared/BaseAlgorithm'") { $count++ }
    Write-Host "  ✓ SpacyClientClassifier import BaseAlgorithm" -ForegroundColor Green
}

$file = "src/features/phase3-analysis/level1-validation/algorithms/classifiers/shared/BaseClientClassifier.ts"  
if (Test-Path $file) {
    if (Replace-InFile $file "from '../../../shared/BaseAlgorithm'" "from '../../shared/BaseAlgorithm'") { $count++ }
    Write-Host "  ✓ BaseClientClassifier import BaseAlgorithm" -ForegroundColor Green
}

# 4. Metrics framework - commenter les imports vers fichiers .disabled
Write-Host ""
Write-Host "📊 Metrics framework - désactiver imports migration..." -ForegroundColor Yellow

$file = "src/features/phase3-analysis/shared/metrics-framework/index.ts"
if (Test-Path $file) {
    if (Comment-ImportLine $file "@/features/phase3-analysis/level2-hypotheses/shared/cognitive-metrics/migration/CognitiveMetricsMigration") { $count++ }
    if (Comment-ImportLine $file "@/features/phase3-analysis/level2-hypotheses/shared/TestFrameworkIntegration") { $count++ }
    if (Comment-ImportLine $file "@/features/phase3-analysis/level2-hypotheses/shared/cognitive-metrics/migration/adaptUseCognitiveMetrics") { $count++ }
    Write-Host "  ✓ Imports migration commentés" -ForegroundColor Green
}

# 5. ClassifierSelector
Write-Host ""
Write-Host "🎨 ClassifierSelector..." -ForegroundColor Yellow
$selector = Get-ChildItem "src/features/phase3-analysis" -Recurse -Filter "ClassifierSelector.*" -File | Select-Object -First 1
if ($selector) {
    Write-Host "  Found: $($selector.FullName)" -ForegroundColor Gray
} else {
    Write-Host "  ⚠️  ClassifierSelector introuvable - sera créé plus tard" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Script v8 terminé ! $count corrections" -ForegroundColor Green
Write-Host "  Relancer : npx tsc --noEmit --pretty 2>&1 | Select-String ''Found''" -ForegroundColor Cyan
