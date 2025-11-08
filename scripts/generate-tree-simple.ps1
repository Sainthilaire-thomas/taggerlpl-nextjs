# generate-tree-simple.ps1
# Script pour generer l'arborescence visuelle du projet

param(
    [string]$OutputFile = "docs/project_tree.txt"
)

# Creer le dossier docs si necessaire
if (!(Test-Path "docs")) {
    New-Item -ItemType Directory -Path "docs" | Out-Null
}

Write-Host "Generation de l'arborescence..." -ForegroundColor Green

# Recuperer tous les fichiers
$files = Get-ChildItem -Recurse -File | 
    Where-Object { $_.FullName -notmatch '(node_modules|\\.next|\\.git|dist|build)' } |
    ForEach-Object { $_.FullName.Replace((Get-Location).Path + '\', '') } |
    Sort-Object

# Construire la structure d'arbre
$tree = @{}

foreach ($file in $files) {
    $parts = $file -split '\\'
    $current = $tree
    
    for ($i = 0; $i -lt $parts.Length; $i++) {
        $part = $parts[$i]
        if ($i -eq $parts.Length - 1) {
            # Fichier
            if (-not $current.ContainsKey('__files__')) {
                $current['__files__'] = @()
            }
            $current['__files__'] += $part
        } else {
            # Dossier
            if (-not $current.ContainsKey($part)) {
                $current[$part] = @{}
            }
            $current = $current[$part]
        }
    }
}

# Fonction pour afficher l'arbre
function Show-Tree {
    param(
        [hashtable]$Node,
        [string]$Indent = "",
        [bool]$IsLast = $true
    )
    
    $output = @()
    $folders = $Node.Keys | Where-Object { $_ -ne '__files__' } | Sort-Object
    $files = if ($Node.ContainsKey('__files__')) { $Node['__files__'] | Sort-Object } else { @() }
    
    # Dossiers
    $folderCount = $folders.Count
    $currentFolder = 0
    foreach ($folder in $folders) {
        $currentFolder++
        $isLastFolder = ($currentFolder -eq $folderCount -and $files.Count -eq 0)
        
        $prefix = if ($isLastFolder) { "+-- " } else { "|-- " }
        $output += "$Indent$prefix$folder/"
        
        $newIndent = if ($isLastFolder) { "$Indent    " } else { "$Indent|   " }
        $output += Show-Tree -Node $Node[$folder] -Indent $newIndent -IsLast $isLastFolder
    }
    
    # Fichiers
    $fileCount = $files.Count
    $currentFile = 0
    foreach ($file in $files) {
        $currentFile++
        $isLastFile = ($currentFile -eq $fileCount)
        
        $prefix = if ($isLastFile) { "+-- " } else { "|-- " }
        $output += "$Indent$prefix$file"
    }
    
    return $output
}

# Generer l'arborescence
$output = @()
$output += "ARBORESCENCE PROJET TAGGERLPL"
$output += "=" * 80
$output += ""

# Racine
$rootFolders = $tree.Keys | Where-Object { $_ -ne '__files__' } | Sort-Object
$rootFiles = if ($tree.ContainsKey('__files__')) { $tree['__files__'] | Sort-Object } else { @() }

# Fichiers racine
foreach ($file in $rootFiles) {
    $output += $file
}

# Dossiers racine
$folderCount = $rootFolders.Count
$currentFolder = 0
foreach ($folder in $rootFolders) {
    $currentFolder++
    $isLast = ($currentFolder -eq $folderCount)
    
    $prefix = if ($isLast) { "+-- " } else { "|-- " }
    $output += "$prefix$folder/"
    
    $indent = if ($isLast) { "    " } else { "|   " }
    $output += Show-Tree -Node $tree[$folder] -Indent $indent -IsLast $isLast
}

# Sauvegarder
$output | Out-File -FilePath $OutputFile -Encoding utf8

$fileCount = $files.Count
Write-Host "Termine! $fileCount fichiers dans $OutputFile" -ForegroundColor Green
