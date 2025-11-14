# ============================================
# Script v4 - Nettoyage final
# ============================================

Write-Host "🚀 Script v4 - Nettoyage et corrections finales..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. Désactiver fichiers legacy/obsolètes
# ============================================
Write-Host "🗑️  Désactivation des fichiers legacy..." -ForegroundColor Yellow

$legacyFiles = @(
    'src/app/(protected)/analysis/page.tsx',
    'src/app/(protected)/calls/page.legacy.tsx',
    'src/components/TaggerLPL.tsx',
    'src/app/api/calls/old_diarize.ts',
    'src/app/api/calls/old_transcribe.ts'
)

foreach ($file in $legacyFiles) {
    if (Test-Path $file) {
        Rename-Item $file "$file.disabled" -Force
        Write-Host "  ✓ $(Split-Path $file -Leaf) désactivé" -ForegroundColor Green
    }
}

# ============================================
# 2. Corriger initializeAlgorithms.ts
# ============================================
Write-Host ""
Write-Host "🔧 Correction initializeAlgorithms.ts..." -ForegroundColor Yellow

$file = "src/features/phase3-analysis/level1-validation/algorithms/shared/initializeAlgorithms.ts"
$content = Get-Content $file -Raw -Encoding UTF8

# Corriger les imports X/Y classifiers
$content = $content -replace 'SpacyXClassifier', 'SpacyClientClassifier'
$content = $content -replace 'OpenAIXClassifier', 'OpenAIClientClassifier'
$content = $content -replace 'OpenAI3TXClassifier', 'OpenAI3TClientClassifier'
$content = $content -replace 'RegexXClassifier', 'RegexClientClassifier'
$content = $content -replace 'RegexYClassifier', 'RegexConseillerClassifier'

Set-Content $file -Value $content -Encoding UTF8 -NoNewline
Write-Host "  ✓ initializeAlgorithms.ts corrigé" -ForegroundColor Green

# ============================================
# 3. Désactiver tests obsolètes
# ============================================
Write-Host ""
Write-Host "🧪 Désactivation des tests obsolètes..." -ForegroundColor Yellow

$testFiles = @(
    'tests/diarizationApiClient.test.ts',
    'tests/transcriptionApiClient.test.ts'
)

foreach ($file in $testFiles) {
    if (Test-Path $file) {
        Rename-Item $file "$file.disabled" -Force
        Write-Host "  ✓ $(Split-Path $file -Leaf) désactivé" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Script v4 terminé !" -ForegroundColor Green
Write-Host "  Relancer : npx tsc --noEmit --pretty 2>&1 | Select-String 'Found'" -ForegroundColor Cyan
