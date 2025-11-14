Write-Host "🔧 Script v7 - Désactiver fichiers migration..." -ForegroundColor Cyan
Write-Host ""

$files = @(
    "src/features/phase3-analysis/level2-hypotheses/shared/cognitive-metrics/migration/adaptUseCognitiveMetrics.ts",
    "src/features/phase3-analysis/level2-hypotheses/shared/cognitive-metrics/migration/CognitiveMetricsMigration.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Move-Item $file "$file.disabled" -Force
        Write-Host "  ✓ $(Split-Path $file -Leaf) désactivé" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Fichiers migration désactivés !" -ForegroundColor Green
Write-Host "  Relancer : npx tsc --noEmit --pretty 2>&1 | Select-String ''Found''" -ForegroundColor Cyan
