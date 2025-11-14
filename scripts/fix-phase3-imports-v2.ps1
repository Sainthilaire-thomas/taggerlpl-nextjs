# ============================================
# Script v2 - Corrections spécifiques
# ============================================

Write-Host "🚀 Script v2 - Corrections ciblées..." -ForegroundColor Cyan

# Fonction helper
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

# ============================================
# 1. Scripts - Corriger precompute-h2-results.ts
# ============================================
Write-Host "📜 Correction script precompute-h2-results.ts..." -ForegroundColor Yellow

$scriptReplacements = @(
    @{ Old = "@/algorithms/level1/shared/AlgorithmRegistry"; New = "@/features/phase3-analysis/level1-validation/algorithms/shared/AlgorithmRegistry" },
    @{ Old = "@/algorithms/level1/M1Algorithms/M1ActionVerbCounter"; New = "@/features/phase3-analysis/level1-validation/algorithms/mediators/M1Algorithms/M1ActionVerbCounter" },
    @{ Old = "@/algorithms/level1/M2Algorithms/M2CompositeAlignmentCalculator"; New = "@/features/phase3-analysis/level1-validation/algorithms/mediators/M2Algorithms/M2CompositeAlignmentCalculator" },
    @{ Old = "@/algorithms/level1/M3Algorithms/PausesM3Calculator"; New = "@/features/phase3-analysis/level1-validation/algorithms/mediators/M3Algorithms/PausesM3Calculator" }
)

foreach ($r in $scriptReplacements) {
    if (Replace-InFile "scripts/precompute-h2-results.ts" $r.Old $r.New) {
        Write-Host "  ✓ Corrigé" -ForegroundColor Green
    }
}

# ============================================
# 2. API Routes - Corriger algolab routes
# ============================================
Write-Host "🔌 Correction API routes algolab..." -ForegroundColor Yellow

$apiReplacements = @(
    @{ Old = "@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/AlgorithmRegistry"; New = "@/features/phase3-analysis/level1-validation/algorithms/shared/AlgorithmRegistry" },
    @{ Old = "@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared/initializeAlgorithms"; New = "@/features/phase3-analysis/level1-validation/algorithms/shared/initializeAlgorithms" }
)

$apiFiles = @(
    "src/app/api/algolab/classifiers/[name]/route.ts",
    "src/app/api/algolab/classifiers/route.ts",
    "src/app/api/algolab/classify/route.tsx"
)

foreach ($file in $apiFiles) {
    foreach ($r in $apiReplacements) {
        Replace-InFile $file $r.Old $r.New | Out-Null
    }
    Write-Host "  ✓ $(Split-Path $file -Leaf)" -ForegroundColor Green
}

# ============================================
# 3. Imports relatifs manquants dans algorithms
# ============================================
Write-Host "🔧 Correction imports relatifs algorithms..." -ForegroundColor Yellow

$file = "src/features/phase3-analysis/level1-validation/algorithms/shared/initializeAlgorithms.ts"
$relativeReplacements = @(
    @{ Old = '"../XAlgorithms/RegexXClassifier"'; New = '"../classifiers/client/RegexClientClassifier"' },
    @{ Old = '"../XAlgorithms/SpacyXClassifier"'; New = '"../classifiers/client/SpacyClientClassifier"' },
    @{ Old = '"../XAlgorithms/OpenAIXClassifier"'; New = '"../classifiers/client/OpenAIClientClassifier"' },
    @{ Old = '"../XAlgorithms/OpenAI3TXClassifier"'; New = '"../classifiers/client/OpenAI3TClientClassifier"' },
    @{ Old = '"../YAlgorithms/RegexYClassifier"'; New = '"../classifiers/conseiller/RegexConseillerClassifier"' },
    @{ Old = '"../M1Algorithms/M1ActionVerbCounter"'; New = '"../mediators/M1Algorithms/M1ActionVerbCounter"' },
    @{ Old = '"../M2Algorithms/M2LexicalAlignmentCalculator"'; New = '"../mediators/M2Algorithms/M2LexicalAlignmentCalculator"' },
    @{ Old = '"../M2Algorithms/M2SemanticAlignmentCalculator"'; New = '"../mediators/M2Algorithms/M2SemanticAlignmentCalculator"' },
    @{ Old = '"../M2Algorithms/M2CompositeAlignmentCalculator"'; New = '"../mediators/M2Algorithms/M2CompositeAlignmentCalculator"' },
    @{ Old = '"../M3Algorithms/PausesM3Calculator"'; New = '"../mediators/M3Algorithms/PausesM3Calculator"' }
)

foreach ($r in $relativeReplacements) {
    Replace-InFile $file $r.Old $r.New | Out-Null
}
Write-Host "  ✓ initializeAlgorithms.ts" -ForegroundColor Green

# ============================================
# 4. Hooks - imports manquants
# ============================================
Write-Host "🪝 Correction imports hooks..." -ForegroundColor Yellow

$hooksReplacements = @(
    @{ File = "src/features/phase3-analysis/level1-validation/ui/hooks/useAlgorithmVersioning.ts"; Old = '"../types"'; New = '"@/types/algorithm-lab"' },
    @{ File = "src/features/phase3-analysis/level1-validation/ui/hooks/usePostValidationVersioning.ts"; Old = '"../types"'; New = '"@/types/algorithm-lab"' },
    @{ File = "src/features/phase3-analysis/level1-validation/ui/hooks/useLevel1Testing.ts"; Old = '"../algorithms/level1/shared/BaseClassifier"'; New = '"../../algorithms/shared/BaseClassifier"' },
    @{ File = "src/features/phase3-analysis/level1-validation/ui/hooks/useClassifierStatus.ts"; Old = "@/app/(protected)/analysis/components/AlgorithmLab/algorithms/level1/shared"; New = "@/features/phase3-analysis/level1-validation/algorithms/shared" }
)

foreach ($r in $hooksReplacements) {
    if (Replace-InFile $r.File $r.Old $r.New) {
        Write-Host "  ✓ $(Split-Path $r.File -Leaf)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Script v2 terminé !" -ForegroundColor Green
Write-Host "  Relancer : npx tsc --noEmit --pretty 2>&1 | Select-String 'Found'" -ForegroundColor Cyan
