# generate-tree.ps1
# Script simple pour generer l'arborescence du projet TaggerLPL

param(
    [string]$OutputFile = "docs/project_tree.txt",
    [switch]$OpenAfter,
    [switch]$Verbose
)

$ErrorActionPreference = 'Continue'

# Creer le dossier docs si necessaire
$outputDir = Split-Path $OutputFile -Parent
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

Write-Host "Generation de l'arborescence du projet..." -ForegroundColor Cyan

# Generer l'arborescence
$output = @()
$output += "=" * 80
$output += "ARBORESCENCE PROJET TAGGERLPL"
$output += "Generee le: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')"
$output += "=" * 80
$output += ""

# Recuperer tous les fichiers
$files = Get-ChildItem -Recurse -File | Where-Object {
    $_.FullName -notmatch '(node_modules|\\.next|\\.git|dist|build|coverage)'
}

$totalFiles = $files.Count
Write-Host "  $totalFiles fichiers trouves" -ForegroundColor Yellow

# Generer la liste triee
$files | ForEach-Object {
    $relativePath = $_.FullName.Replace((Get-Location).Path + '\', '')
    $output += $relativePath
}

# Sauvegarder
$output | Out-File -FilePath $OutputFile -Encoding utf8

Write-Host "  Arborescence sauvegardee: $OutputFile" -ForegroundColor Green

# Statistiques rapides
if ($Verbose) {
    $tsFiles = $files | Where-Object { $_.Extension -in '.ts','.tsx' }
    $jsFiles = $files | Where-Object { $_.Extension -in '.js','.jsx' }
    
    Write-Host ""
    Write-Host "Statistiques:" -ForegroundColor Cyan
    Write-Host "  - Total: $totalFiles fichiers" -ForegroundColor White
    Write-Host "  - TypeScript: $($tsFiles.Count) fichiers" -ForegroundColor White
    Write-Host "  - JavaScript: $($jsFiles.Count) fichiers" -ForegroundColor White
}

# Ouvrir si demande
if ($OpenAfter) {
    Write-Host "  Ouverture du fichier..." -ForegroundColor Yellow
    code $OutputFile
}

Write-Host "Termine!" -ForegroundColor Green
