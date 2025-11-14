# ============================================
# Script v3 - Corrections finales ciblées
# ============================================

Write-Host "🚀 Script v3 - Corrections finales..." -ForegroundColor Cyan

function Replace-InFile {
    param([string]$FilePath, [string]$OldPattern, [string]$NewPattern)
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        if ($content -match [regex]::Escape($OldPattern)) {
            $content = $content -replace [regex]::Escape($OldPattern), $NewPattern
            Set-Content $FilePath -Value $content -Encoding UTF8 -NoNewline
            return $true
        }
    }
    return $false
}

$count = 0

# ============================================
# 1. Corriger imports relatifs "../types"
# ============================================
Write-Host "📦 Correction '../types' vers '@/types/algorithm-lab'..." -ForegroundColor Yellow

$files = @(
    "src/features/phase3-analysis/level1-validation/ui/components/comparison/VersionComparator.tsx",
    "src/features/phase3-analysis/level1-validation/ui/components/algorithms/BaseAlgorithmTesting.tsx",
    "src/features/phase3-analysis/level1-validation/ui/components/shared/results/VersionSelector.tsx"
)

foreach ($file in $files) {
    if (Replace-InFile $file 'from "../../../types"' 'from "@/types/algorithm-lab"') {
        $count++
        Write-Host "  ✓ $(Split-Path $file -Leaf)" -ForegroundColor Green
    }
    if (Replace-InFile $file 'from "../../../../types"' 'from "@/types/algorithm-lab"') {
        $count++
        Write-Host "  ✓ $(Split-Path $file -Leaf)" -ForegroundColor Green
    }
}

# ============================================
# 2. Corriger imports hooks relatifs
# ============================================
Write-Host "🪝 Correction imports hooks relatifs..." -ForegroundColor Yellow

$hooksFiles = Get-ChildItem "src/features/phase3-analysis/level1-validation/ui/components" -Recurse -Include "*.tsx","*.ts" -File

foreach ($file in $hooksFiles) {
    $changed = $false
    
    if (Replace-InFile $file.FullName '../../../hooks/useLevel1Testing' '@/features/phase3-analysis/level1-validation/ui/hooks/useLevel1Testing') { $changed = $true }
    if (Replace-InFile $file.FullName '../../../../hooks/useLevel1Testing' '@/features/phase3-analysis/level1-validation/ui/hooks/useLevel1Testing') { $changed = $true }
    if (Replace-InFile $file.FullName '../../../hooks/useAlgorithmVersioning' '@/features/phase3-analysis/level1-validation/ui/hooks/useAlgorithmVersioning') { $changed = $true }
    if (Replace-InFile $file.FullName '../../../hooks/usePostValidationVersioning' '@/features/phase3-analysis/level1-validation/ui/hooks/usePostValidationVersioning') { $changed = $true }
    if (Replace-InFile $file.FullName '../../../../hooks/useClassifierStatus' '@/features/phase3-analysis/level1-validation/ui/hooks/useClassifierStatus') { $changed = $true }
    
    if ($changed) {
        $count++
        Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
    }
}

# ============================================
# 3. Corriger imports algorithms relatifs
# ============================================
Write-Host "🔧 Correction imports algorithms relatifs..." -ForegroundColor Yellow

$algoFiles = Get-ChildItem "src/features/phase3-analysis/level1-validation/ui/components" -Recurse -Include "*.tsx","*.ts" -File

foreach ($file in $algoFiles) {
    $changed = $false
    
    if (Replace-InFile $file.FullName '../../../algorithms/level1/shared/ClassifierRegistry' '@/features/phase3-analysis/level1-validation/algorithms/shared/ClassifierRegistry') { $changed = $true }
    if (Replace-InFile $file.FullName '../../../algorithms/level1/shared/BaseClassifier' '@/features/phase3-analysis/level1-validation/algorithms/shared/BaseClassifier') { $changed = $true }
    
    if ($changed) {
        $count++
        Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
    }
}

# ============================================
# 4. Corriger imports shared UI relatifs mal formés
# ============================================
Write-Host "🎨 Correction imports shared UI mal formés..." -ForegroundColor Yellow

$file = "src/features/phase3-analysis/level1-validation/ui/components/algorithms/BaseAlgorithmTesting.tsx"
if (Replace-InFile $file '../../../../shared/molecules/AlgorithmSelector' '@/features/phase3-analysis/shared/ui/molecules/AlgorithmSelector') {
    $count++
    Write-Host "  ✓ BaseAlgorithmTesting.tsx" -ForegroundColor Green
}

$file = "src/features/phase3-analysis/level1-validation/ui/components/individual/TechnicalValidation/TechnicalValidation.tsx"
if (Replace-InFile $file '../../../shared/ClassifierSelector' '@/features/phase3-analysis/shared/ui/molecules/ClassifierSelector') {
    $count++
    Write-Host "  ✓ TechnicalValidation.tsx" -ForegroundColor Green
}

# ============================================
# 5. Corriger imports types mal formés
# ============================================
Write-Host "📝 Correction imports types mal formés..." -ForegroundColor Yellow

$file = "src/features/phase3-analysis/level1-validation/ui/components/shared/results/base/ResultsSample/types.ts"
if (Replace-InFile $file 'from "AlgorithmLab/types/core"' 'from "@/types/algorithm-lab/core"') {
    $count++
    Write-Host "  ✓ ResultsSample types.ts" -ForegroundColor Green
}

$file = "src/features/phase3-analysis/level1-validation/ui/hooks/useLevel1Testing.ts"
if (Replace-InFile $file 'from "../types/algorithms/base"' 'from "@/types/algorithm-lab/algorithms"') {
    $count++
    Write-Host "  ✓ useLevel1Testing.ts" -ForegroundColor Green
}
if (Replace-InFile $file 'from "../types/utils/corpusFilters"' 'from "@/types/algorithm-lab/utils"') {
    $count++
}
if (Replace-InFile $file 'from "../types/utils/inputPreparation"' 'from "@/types/algorithm-lab/utils"') {
    $count++
}
if (Replace-InFile $file 'from "../types/h2Types"' 'from "@/types/algorithm-lab"') {
    $count++
}

# ============================================
# 6. Corriger imports metrics-framework mal formés
# ============================================
Write-Host "📊 Correction imports metrics-framework mal formés..." -ForegroundColor Yellow

$metricsFiles = Get-ChildItem "src/features/phase3-analysis/level2-hypotheses/shared" -Recurse -Include "*.ts","*.tsx" -File

foreach ($file in $metricsFiles) {
    $changed = $false
    
    # Corriger les imports qui ont "../@/features" au lieu de "@/features"
    if (Replace-InFile $file.FullName '../@/features/phase3-analysis/shared/metrics-framework' '@/features/phase3-analysis/shared/metrics-framework') { $changed = $true }
    
    if ($changed) {
        $count++
        Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Script v3 terminé ! $count corrections" -ForegroundColor Green
Write-Host "  Relancer : npx tsc --noEmit --pretty 2>&1 | Select-String 'Found'" -ForegroundColor Cyan
