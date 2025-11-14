# ============================================
# Correction imports XAlgorithms récupérés
# ============================================

Write-Host "🔧 Correction des imports dans les fichiers récupérés..." -ForegroundColor Cyan

function Replace-InFile {
    param([string]$FilePath, [string]$OldPattern, [string]$NewPattern)
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        $content = $content -replace [regex]::Escape($OldPattern), $NewPattern
        Set-Content $FilePath -Value $content -Encoding UTF8 -NoNewline
    }
}

# Fichiers à corriger
$clientFiles = @(
    'src/features/phase3-analysis/level1-validation/algorithms/classifiers/client/SpacyClientClassifier.ts',
    'src/features/phase3-analysis/level1-validation/algorithms/classifiers/client/OpenAIClientClassifier.ts',
    'src/features/phase3-analysis/level1-validation/algorithms/classifiers/client/OpenAI3TClientClassifier.ts',
    'src/features/phase3-analysis/level1-validation/algorithms/classifiers/shared/BaseClientClassifier.ts'
)

# Corrections communes
foreach ($file in $clientFiles) {
    Write-Host "  Correction de $(Split-Path $file -Leaf)..." -ForegroundColor Yellow
    
    # Types
    Replace-InFile $file '@/app/(protected)/analysis/components/AlgorithmLab/types' '@/types/algorithm-lab'
    Replace-InFile $file '../../../types' '@/types/algorithm-lab'
    Replace-InFile $file '../../types' '@/types/algorithm-lab'
    
    # BaseClassifier
    Replace-InFile $file './shared/BaseXClassifier' '../shared/BaseClientClassifier'
    Replace-InFile $file '../shared/BaseXClassifier' '../shared/BaseClientClassifier'
    Replace-InFile $file './BaseXClassifier' './BaseClientClassifier'
    
    # BaseAlgorithm
    Replace-InFile $file '../../shared/BaseAlgorithm' '../../../shared/BaseAlgorithm'
    
    Write-Host "    ✓ Corrigé" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Corrections terminées !" -ForegroundColor Green
