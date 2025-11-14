# ============================================
# Script de correction automatique des imports Phase 3
# ============================================

Write-Host "🚀 Début de la correction automatique des imports..." -ForegroundColor Cyan
Write-Host ""

# Fonction pour remplacer dans un fichier
function Replace-InFile {
    param(
        [string]$FilePath,
        [string]$OldPattern,
        [string]$NewPattern
    )
    
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

# Compteurs
$totalFiles = 0
$totalReplacements = 0

# ============================================
# CATÉGORIE 1 : Types centralisés
# ============================================
Write-Host "📦 Catégorie 1 : Correction des imports types..." -ForegroundColor Yellow

$typeReplacements = @(
    @{
        Old = "@/app/(protected)/analysis/components/AlgorithmLab/types"
        New = "@/types/algorithm-lab"
    },
    @{
        Old = "@/app/(protected)/analysis/components/AlgorithmLab/types/algorithms/base"
        New = "@/types/algorithm-lab/algorithms"
    }
)

# Trouver tous les fichiers TypeScript/React dans features/phase3-analysis
$files = Get-ChildItem -Path "src/features/phase3-analysis" -Recurse -Include "*.ts","*.tsx" -File

foreach ($file in $files) {
    $fileChanged = $false
    
    foreach ($replacement in $typeReplacements) {
        if (Replace-InFile -FilePath $file.FullName -OldPattern $replacement.Old -NewPattern $replacement.New) {
            $fileChanged = $true
            $totalReplacements++
        }
    }
    
    if ($fileChanged) {
        $totalFiles++
        Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "  → $totalReplacements remplacements dans $totalFiles fichiers" -ForegroundColor Cyan
Write-Host ""

# ============================================
# CATÉGORIE 2 : Shared UI Components
# ============================================
Write-Host "🎨 Catégorie 2 : Correction des imports shared UI..." -ForegroundColor Yellow

$sharedReplacements = @(
    @{
        Old = "../../../../../shared/atoms/"
        New = "@/features/phase3-analysis/shared/ui/atoms/"
    },
    @{
        Old = "../../../../../shared/molecules/"
        New = "@/features/phase3-analysis/shared/ui/molecules/"
    },
    @{
        Old = "../../../../../shared/hooks/"
        New = "@/features/phase3-analysis/shared/ui/hooks/"
    },
    @{
        Old = "@/analysis-components/shared/atoms/"
        New = "@/features/phase3-analysis/shared/ui/atoms/"
    },
    @{
        Old = "@/analysis-components/shared/molecules/"
        New = "@/features/phase3-analysis/shared/ui/molecules/"
    },
    @{
        Old = "@/analysis-components/shared/hooks/"
        New = "@/features/phase3-analysis/shared/ui/hooks/"
    }
)

$filesCount = 0
$replacementsCount = 0

$files = Get-ChildItem -Path "src/features/phase3-analysis" -Recurse -Include "*.ts","*.tsx" -File

foreach ($file in $files) {
    $fileChanged = $false
    
    foreach ($replacement in $sharedReplacements) {
        if (Replace-InFile -FilePath $file.FullName -OldPattern $replacement.Old -NewPattern $replacement.New) {
            $fileChanged = $true
            $replacementsCount++
        }
    }
    
    if ($fileChanged) {
        $filesCount++
        Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "  → $replacementsCount remplacements dans $filesCount fichiers" -ForegroundColor Cyan
Write-Host ""

# ============================================
# CATÉGORIE 3 : Metrics Framework
# ============================================
Write-Host "📊 Catégorie 3 : Correction des imports metrics-framework..." -ForegroundColor Yellow

$metricsReplacements = @(
    @{
        Old = "../../../metrics-framework/"
        New = "@/features/phase3-analysis/shared/metrics-framework/"
    },
    @{
        Old = "../../metrics-framework/"
        New = "@/features/phase3-analysis/shared/metrics-framework/"
    }
)

$filesCount = 0
$replacementsCount = 0

$files = Get-ChildItem -Path "src/features/phase3-analysis/level2-hypotheses/shared" -Recurse -Include "*.ts","*.tsx" -File

foreach ($file in $files) {
    $fileChanged = $false
    
    foreach ($replacement in $metricsReplacements) {
        if (Replace-InFile -FilePath $file.FullName -OldPattern $replacement.Old -NewPattern $replacement.New) {
            $fileChanged = $true
            $replacementsCount++
        }
    }
    
    if ($fileChanged) {
        $filesCount++
        Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "  → $replacementsCount remplacements dans $filesCount fichiers" -ForegroundColor Cyan
Write-Host ""

# ============================================
# CATÉGORIE 4 : BaseClassifier imports
# ============================================
Write-Host "🔧 Catégorie 4 : Correction des imports BaseClassifier..." -ForegroundColor Yellow

$baseClassifierFiles = @(
    "src/features/phase3-analysis/level1-validation/algorithms/classifiers/conseiller/OpenAI3TConseillerClassifier.tsx",
    "src/features/phase3-analysis/level1-validation/algorithms/classifiers/conseiller/OpenAIConseillerClassifier.ts",
    "src/features/phase3-analysis/level1-validation/algorithms/classifiers/conseiller/ProxyOpenAIConseillerClassifier.ts",
    "src/features/phase3-analysis/level1-validation/algorithms/classifiers/conseiller/RegexConseillerClassifier.ts",
    "src/features/phase3-analysis/level1-validation/algorithms/classifiers/conseiller/SpacyConseillerClassifier.ts"
)

$filesCount = 0

foreach ($filePath in $baseClassifierFiles) {
    if (Replace-InFile -FilePath $filePath -OldPattern '../shared/BaseClassifier' -NewPattern '../../shared/BaseClassifier') {
        $filesCount++
        Write-Host "  ✓ $(Split-Path $filePath -Leaf)" -ForegroundColor Green
    }
}

Write-Host "  → $filesCount fichiers corrigés" -ForegroundColor Cyan
Write-Host ""

# ============================================
# RÉSUMÉ
# ============================================
Write-Host "✅ Correction automatique terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "  1. Vérifier la compilation : npx tsc --noEmit --pretty"
Write-Host "  2. Corriger manuellement les erreurs restantes"
Write-Host "  3. Tester l'application : npm run dev"
Write-Host ""
