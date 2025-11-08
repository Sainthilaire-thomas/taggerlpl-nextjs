# generate-structure-report.ps1
# Script pour générer un rapport détaillé de la structure du projet TaggerLPL

param(
    [string]$OutputDir = "docs",
    [switch]$OpenAfter
)

$ErrorActionPreference = 'Continue'

# Créer le dossier de sortie si nécessaire
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

Write-Host "🚀 Génération du rapport de structure TaggerLPL..." -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. ARBORESCENCE COMPLÈTE DES FICHIERS
# ============================================
Write-Host "📁 Génération de l'arborescence complète..." -ForegroundColor Yellow

$treeOutput = @()
$treeOutput += "=" * 80
$treeOutput += "ARBORESCENCE COMPLÈTE DU PROJET TAGGERLPL"
$treeOutput += "Générée le: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
$treeOutput += "=" * 80
$treeOutput += ""

# Fonction récursive pour construire l'arbre
function Get-DirectoryTree {
    param(
        [string]$Path,
        [string]$Indent = "",
        [int]$MaxDepth = 10,
        [int]$CurrentDepth = 0
    )
    
    if ($CurrentDepth -ge $MaxDepth) { return }
    
    $items = Get-ChildItem -Path $Path -Force | Where-Object { 
        $_.Name -notmatch '^(node_modules|\.next|\.git|dist|build|coverage)$' 
    } | Sort-Object { $_.PSIsContainer }, Name
    
    $itemCount = $items.Count
    $currentItem = 0
    
    foreach ($item in $items) {
        $currentItem++
        $isLast = ($currentItem -eq $itemCount)
        $prefix = if ($isLast) { "└── " } else { "├── " }
        $childIndent = if ($isLast) { "    " } else { "│   " }
        
        if ($item.PSIsContainer) {
            $treeOutput += "$Indent$prefix📁 $($item.Name)/"
            Get-DirectoryTree -Path $item.FullName -Indent "$Indent$childIndent" -MaxDepth $MaxDepth -CurrentDepth ($CurrentDepth + 1)
        } else {
            $size = if ($item.Length -lt 1KB) { 
                "$($item.Length) B" 
            } elseif ($item.Length -lt 1MB) { 
                "$([math]::Round($item.Length / 1KB, 1)) KB" 
            } else { 
                "$([math]::Round($item.Length / 1MB, 2)) MB" 
            }
            $treeOutput += "$Indent$prefix📄 $($item.Name) ($size)"
        }
    }
}

# Générer l'arbre pour src/
if (Test-Path "src") {
    $treeOutput += "src/"
    Get-DirectoryTree -Path "src" -Indent "" -MaxDepth 8
}

$treeOutput | Out-File -FilePath "$OutputDir\complete_structure_tree.txt" -Encoding utf8
Write-Host "  ✅ Arborescence sauvegardée: $OutputDir\complete_structure_tree.txt" -ForegroundColor Green

# ============================================
# 2. STATISTIQUES GLOBALES
# ============================================
Write-Host ""
Write-Host "📊 Calcul des statistiques..." -ForegroundColor Yellow

$statsOutput = @()
$statsOutput += "=" * 80
$statsOutput += "STATISTIQUES PROJET TAGGERLPL"
$statsOutput += "=" * 80
$statsOutput += ""

# Récupérer tous les fichiers (excluant node_modules, .next, etc.)
$allFiles = Get-ChildItem -Path "src" -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $_.FullName -notmatch '[\\/](node_modules|\.next|\.git|dist|build|coverage)[\\/]'
}

$statsOutput += "📁 FICHIERS"
$statsOutput += "-" * 80
$statsOutput += "Total fichiers: $($allFiles.Count)"
$statsOutput += ""

# Par extension
$byExtension = $allFiles | Group-Object Extension | Sort-Object Count -Descending
$statsOutput += "Par type:"
foreach ($ext in $byExtension) {
    $extName = if ($ext.Name) { $ext.Name } else { "[sans extension]" }
    $percentage = [math]::Round(($ext.Count / $allFiles.Count) * 100, 1)
    $statsOutput += "  $extName : $($ext.Count) fichiers ($percentage%)"
}

$statsOutput += ""
$statsOutput += "📏 TAILLE"
$statsOutput += "-" * 80
$totalSize = ($allFiles | Measure-Object -Property Length -Sum).Sum
$statsOutput += "Taille totale: $([math]::Round($totalSize / 1MB, 2)) MB"
$statsOutput += ""

# Plus gros fichiers
$statsOutput += "🏆 Top 10 fichiers les plus volumineux:"
$largestFiles = $allFiles | Sort-Object Length -Descending | Select-Object -First 10
foreach ($file in $largestFiles) {
    $relativePath = $file.FullName -replace [regex]::Escape($PWD.Path + "\"), ""
    $size = [math]::Round($file.Length / 1KB, 1)
    $statsOutput += "  $size KB - $relativePath"
}

$statsOutput += ""
$statsOutput += "💻 CODE TYPESCRIPT/JAVASCRIPT"
$statsOutput += "-" * 80
$tsFiles = $allFiles | Where-Object { $_.Extension -in '.ts', '.tsx', '.js', '.jsx' }
$statsOutput += "Fichiers TypeScript/JavaScript: $($tsFiles.Count)"

# Compter les lignes de code
$totalLines = 0
$tsFiles | ForEach-Object {
    try {
        $lines = (Get-Content $_.FullName -ErrorAction SilentlyContinue | Measure-Object -Line).Lines
        $totalLines += $lines
    } catch {}
}
$statsOutput += "Lignes de code totales (estimation): $totalLines"
$statsOutput += "Moyenne lignes/fichier: $([math]::Round($totalLines / $tsFiles.Count, 0))"

$statsOutput += ""
$statsOutput += "🎨 STYLES"
$statsOutput += "-" * 80
$styleFiles = $allFiles | Where-Object { $_.Extension -in '.css', '.scss', '.sass', '.less' }
$statsOutput += "Fichiers styles: $($styleFiles.Count)"

$statsOutput | Out-File -FilePath "$OutputDir\project_statistics.txt" -Encoding utf8
Write-Host "  ✅ Statistiques sauvegardées: $OutputDir\project_statistics.txt" -ForegroundColor Green

# ============================================
# 3. CARTOGRAPHIE DES MODULES
# ============================================
Write-Host ""
Write-Host "🗺️  Cartographie des modules..." -ForegroundColor Yellow

$modulesOutput = @()
$modulesOutput += "=" * 80
$modulesOutput += "CARTOGRAPHIE DES MODULES"
$modulesOutput += "=" * 80
$modulesOutput += ""

# Module CallManagement
$modulesOutput += "📦 MODULE: CallManagement"
$modulesOutput += "-" * 80
if (Test-Path "src\components\CallManagement") {
    $cmFiles = Get-ChildItem -Path "src\components\CallManagement" -Recurse -File | Where-Object {
        $_.FullName -notmatch '[\\/](node_modules|\.next)[\\/]'
    }
    $modulesOutput += "Localisation: src\components\CallManagement"
    $modulesOutput += "Fichiers: $($cmFiles.Count)"
    $modulesOutput += "Structure:"
    Get-ChildItem -Path "src\components\CallManagement" -Recurse -Directory | ForEach-Object {
        $relativePath = $_.FullName -replace [regex]::Escape($PWD.Path + "\src\components\CallManagement\"), ""
        $modulesOutput += "  📁 $relativePath"
    }
    $modulesOutput += ""
}

# Module TranscriptLPL
$modulesOutput += "📦 MODULE: TranscriptLPL"
$modulesOutput += "-" * 80
if (Test-Path "src\components\TranscriptLPL") {
    $tlFiles = Get-ChildItem -Path "src\components\TranscriptLPL" -Recurse -File | Where-Object {
        $_.FullName -notmatch '[\\/](node_modules|\.next)[\\/]'
    }
    $modulesOutput += "Localisation: src\components\TranscriptLPL"
    $modulesOutput += "Fichiers: $($tlFiles.Count)"
    $modulesOutput += "Composants principaux:"
    Get-ChildItem -Path "src\components\TranscriptLPL" -File -Filter "*.tsx" | ForEach-Object {
        $modulesOutput += "  📄 $($_.Name)"
    }
    $modulesOutput += ""
}

# Module AlgorithmLab
$modulesOutput += "📦 MODULE: AlgorithmLab"
$modulesOutput += "-" * 80
if (Test-Path "src\AlgorithmLab") {
    $alFiles = Get-ChildItem -Path "src\AlgorithmLab" -Recurse -File | Where-Object {
        $_.FullName -notmatch '[\\/](node_modules|\.next)[\\/]'
    }
    $modulesOutput += "Localisation: src\AlgorithmLab"
    $modulesOutput += "Fichiers: $($alFiles.Count)"
    $modulesOutput += "Sous-dossiers principaux:"
    Get-ChildItem -Path "src\AlgorithmLab" -Directory | ForEach-Object {
        $modulesOutput += "  📁 $($_.Name)"
    }
    $modulesOutput += ""
}

# Module SimpleWorkdriveExplorer
$modulesOutput += "📦 MODULE: SimpleWorkdriveExplorer"
$modulesOutput += "-" * 80
if (Test-Path "src\components\SimpleWorkdriveExplorer") {
    $wdFiles = Get-ChildItem -Path "src\components\SimpleWorkdriveExplorer" -Recurse -File | Where-Object {
        $_.FullName -notmatch '[\\/](node_modules|\.next)[\\/]'
    }
    $modulesOutput += "Localisation: src\components\SimpleWorkdriveExplorer"
    $modulesOutput += "Fichiers: $($wdFiles.Count)"
    $modulesOutput += ""
}

# Contextes
$modulesOutput += "🔧 CONTEXTES REACT"
$modulesOutput += "-" * 80
if (Test-Path "src\context") {
    Get-ChildItem -Path "src\context" -File | ForEach-Object {
        $modulesOutput += "  📄 $($_.Name)"
    }
    $modulesOutput += ""
}

$modulesOutput | Out-File -FilePath "$OutputDir\modules_map.txt" -Encoding utf8
Write-Host "  ✅ Cartographie modules sauvegardée: $OutputDir\modules_map.txt" -ForegroundColor Green

# ============================================
# 4. LISTE DÉTAILLÉE DES FICHIERS
# ============================================
Write-Host ""
Write-Host "📋 Génération liste détaillée des fichiers..." -ForegroundColor Yellow

$fileListOutput = @()
$fileListOutput += "=" * 80
$fileListOutput += "LISTE DÉTAILLÉE DES FICHIERS"
$fileListOutput += "=" * 80
$fileListOutput += ""

$allFiles | Sort-Object FullName | ForEach-Object {
    $relativePath = $_.FullName -replace [regex]::Escape($PWD.Path + "\"), ""
    $size = if ($_.Length -lt 1KB) { 
        "$($_.Length) B" 
    } elseif ($_.Length -lt 1MB) { 
        "$([math]::Round($_.Length / 1KB, 1)) KB" 
    } else { 
        "$([math]::Round($_.Length / 1MB, 2)) MB" 
    }
    $modified = $_.LastWriteTime.ToString("yyyy-MM-dd HH:mm")
    $fileListOutput += "$relativePath | $size | $modified"
}

$fileListOutput | Out-File -FilePath "$OutputDir\files_detailed_list.txt" -Encoding utf8
Write-Host "  ✅ Liste fichiers sauvegardée: $OutputDir\files_detailed_list.txt" -ForegroundColor Green

# ============================================
# 5. RAPPORT MARKDOWN CONSOLIDÉ
# ============================================
Write-Host ""
Write-Host "📝 Génération rapport Markdown consolidé..." -ForegroundColor Yellow

$mdOutput = @()
$mdOutput += "# 📊 Rapport Structure TaggerLPL"
$mdOutput += ""
$mdOutput += "*Généré le: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')*"
$mdOutput += ""
$mdOutput += "## 📈 Statistiques Globales"
$mdOutput += ""
$mdOutput += "| Métrique | Valeur |"
$mdOutput += "|----------|--------|"
$mdOutput += "| Total fichiers | $($allFiles.Count) |"
$mdOutput += "| Fichiers TypeScript/JavaScript | $($tsFiles.Count) |"
$mdOutput += "| Fichiers styles | $($styleFiles.Count) |"
$mdOutput += "| Lignes de code (estimation) | $totalLines |"
$mdOutput += "| Taille totale | $([math]::Round($totalSize / 1MB, 2)) MB |"
$mdOutput += ""
$mdOutput += "## 📦 Modules Principaux"
$mdOutput += ""

# CallManagement
if (Test-Path "src\components\CallManagement") {
    $cmFiles = Get-ChildItem -Path "src\components\CallManagement" -Recurse -File
    $mdOutput += "### CallManagement"
    $mdOutput += "- **Localisation**: ``src/components/CallManagement``"
    $mdOutput += "- **Fichiers**: $($cmFiles.Count)"
    $mdOutput += "- **Architecture**: DDD (Domain-Driven Design)"
    $mdOutput += ""
}

# TranscriptLPL
if (Test-Path "src\components\TranscriptLPL") {
    $tlFiles = Get-ChildItem -Path "src\components\TranscriptLPL" -Recurse -File
    $mdOutput += "### TranscriptLPL"
    $mdOutput += "- **Localisation**: ``src/components/TranscriptLPL``"
    $mdOutput += "- **Fichiers**: $($tlFiles.Count)"
    $mdOutput += "- **Fonction**: Module d'annotation synchronisée"
    $mdOutput += ""
}

# AlgorithmLab
if (Test-Path "src\AlgorithmLab") {
    $alFiles = Get-ChildItem -Path "src\AlgorithmLab" -Recurse -File
    $mdOutput += "### AlgorithmLab"
    $mdOutput += "- **Localisation**: ``src/AlgorithmLab``"
    $mdOutput += "- **Fichiers**: $($alFiles.Count)"
    $mdOutput += "- **Fonction**: Algorithmes d'analyse conversationnelle"
    $mdOutput += ""
}

$mdOutput += "## 📁 Fichiers Générés"
$mdOutput += ""
$mdOutput += "1. ``complete_structure_tree.txt`` - Arborescence complète avec icônes"
$mdOutput += "2. ``project_statistics.txt`` - Statistiques détaillées"
$mdOutput += "3. ``modules_map.txt`` - Cartographie des modules"
$mdOutput += "4. ``files_detailed_list.txt`` - Liste fichiers avec métadonnées"
$mdOutput += "5. ``structure_report.md`` - Ce rapport consolidé"

$mdOutput | Out-File -FilePath "$OutputDir\structure_report.md" -Encoding utf8
Write-Host "  ✅ Rapport Markdown sauvegardé: $OutputDir\structure_report.md" -ForegroundColor Green

# ============================================
# RÉSUMÉ FINAL
# ============================================
Write-Host ""
Write-Host "=" * 80 -ForegroundColor Green
Write-Host "✅ GÉNÉRATION TERMINÉE AVEC SUCCÈS" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green
Write-Host ""
Write-Host "📂 Fichiers générés dans le dossier '$OutputDir':" -ForegroundColor Cyan
Write-Host "   1. complete_structure_tree.txt" -ForegroundColor White
Write-Host "   2. project_statistics.txt" -ForegroundColor White
Write-Host "   3. modules_map.txt" -ForegroundColor White
Write-Host "   4. files_detailed_list.txt" -ForegroundColor White
Write-Host "   5. structure_report.md" -ForegroundColor White
Write-Host ""
Write-Host "📊 Statistiques:" -ForegroundColor Cyan
Write-Host "   - Total fichiers analysés: $($allFiles.Count)" -ForegroundColor White
Write-Host "   - Lignes de code: $totalLines" -ForegroundColor White
Write-Host "   - Taille projet: $([math]::Round($totalSize / 1MB, 2)) MB" -ForegroundColor White
Write-Host ""

# Ouvrir les fichiers si demandé
if ($OpenAfter) {
    Write-Host "📖 Ouverture des fichiers..." -ForegroundColor Yellow
    code "$OutputDir\structure_report.md"
    code "$OutputDir\complete_structure_tree.txt"
}

Write-Host "✨ Terminé!" -ForegroundColor Green
