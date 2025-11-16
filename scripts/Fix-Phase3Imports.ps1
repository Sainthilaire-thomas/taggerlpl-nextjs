# ================================================================
# SCRIPT DE CORRECTION AUTOMATIQUE DES IMPORTS - PHASE 3 LEVEL 1
# ================================================================
# Auteur: Thomas + Claude
# Date: 15 novembre 2025
# Objectif: Corriger tous les imports dans les hooks et shared components migrés

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  CORRECTION IMPORTS - PHASE 3 LEVEL 1" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$totalFiles = 0
$totalReplacements = 0

# ================================================================
# FONCTION: Corriger les imports dans un fichier
# ================================================================
function Fix-Imports {
    param(
        [string]$FilePath,
        [string]$FileType
    )
    
    Write-Host "📝 Traitement: $($FilePath.Split('\')[-1])" -ForegroundColor Yellow
    
    $content = Get-Content $FilePath -Raw -Encoding UTF8
    $originalContent = $content
    $replacements = 0
    
    # ============================================================
    # PATTERNS DE REMPLACEMENT UNIVERSELS
    # ============================================================
    
    # 1. Types - Toujours depuis @/types/algorithm-lab
    $patterns = @{
        # Types algorithm-lab
        "from ['\`"]../types['\`"]" = "from '@/types/algorithm-lab'"
        "from ['\`"]../../types['\`"]" = "from '@/types/algorithm-lab'"
        "from ['\`"]../../../types['\`"]" = "from '@/types/algorithm-lab'"
        "from ['\`"]../../../../types['\`"]" = "from '@/types/algorithm-lab'"
        "from ['\`"]@/app/\(protected\)/analysis/types['\`"]" = "from '@/types/algorithm-lab'"
        
        # 2. Algorithmes - Nouveau chemin
        "from ['\`"]../algorithms/" = "from '@/features/phase3-analysis/level1-validation/algorithms/"
        "from ['\`"]../../algorithms/" = "from '@/features/phase3-analysis/level1-validation/algorithms/"
        "from ['\`"]../../../algorithms/" = "from '@/features/phase3-analysis/level1-validation/algorithms/"
        "from ['\`"]../../../../algorithms/" = "from '@/features/phase3-analysis/level1-validation/algorithms/"
        
        # 3. Components - Nouveau chemin
        "from ['\`"]../components/" = "from '@/features/phase3-analysis/level1-validation/ui/components/"
        "from ['\`"]../../components/" = "from '@/features/phase3-analysis/level1-validation/ui/components/"
        "from ['\`"]../../../components/" = "from '@/features/phase3-analysis/level1-validation/ui/components/"
        "from ['\`"]../../../../components/" = "from '@/features/phase3-analysis/level1-validation/ui/components/"
        
        # 4. Hooks - Entre hooks (même dossier)
        "from ['\`"]../hooks/" = "from '@/features/phase3-analysis/level1-validation/ui/hooks/"
        "from ['\`"]../../hooks/" = "from '@/features/phase3-analysis/level1-validation/ui/hooks/"
        "from ['\`"]./use" = "from './use"  # Imports relatifs dans même dossier OK
        
        # 5. Utils
        "from ['\`"]../utils/" = "from '@/features/phase3-analysis/level1-validation/shared/utils/"
        "from ['\`"]../../utils/" = "from '@/features/phase3-analysis/level1-validation/shared/utils/"
        
        # 6. Services Supabase (centralisés)
        "from ['\`"]@/app/\(protected\)/analysis/services/" = "from '@/lib/supabase/"
        
        # 7. Anciennes références absolues à l'ancien emplacement
        "from ['\`"]@/app/\(protected\)/analysis/components/AlgorithmLab/algorithms/" = "from '@/features/phase3-analysis/level1-validation/algorithms/"
        "from ['\`"]@/app/\(protected\)/analysis/components/AlgorithmLab/components/" = "from '@/features/phase3-analysis/level1-validation/ui/components/"
        "from ['\`"]@/app/\(protected\)/analysis/components/AlgorithmLab/hooks/" = "from '@/features/phase3-analysis/level1-validation/ui/hooks/"
    }
    
    # Appliquer tous les patterns
    foreach ($pattern in $patterns.Keys) {
        $replacement = $patterns[$pattern]
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replacement
            $replacements++
        }
    }
    
    # ============================================================
    # CORRECTIONS SPÉCIFIQUES PAR TYPE DE FICHIER
    # ============================================================
    
    if ($FileType -eq "Hook") {
        # Corrections spécifiques aux hooks
        
        # Imports de Supabase client
        $content = $content -replace "from ['\`"]@/lib/supabase/client['\`"]", "from '@/lib/supabase/client'"
        
        # Types entities (peuvent être utilisés par les hooks)
        $content = $content -replace "from ['\`"]@/types/entities/", "from '@/types/entities/"
    }
    
    if ($FileType -eq "Component") {
        # Corrections spécifiques aux composants
        
        # Material-UI (doit rester inchangé)
        # Ne rien faire, c'est déjà OK
        
        # Imports de hooks depuis composants shared
        $content = $content -replace "from ['\`"]../../hooks/", "from '@/features/phase3-analysis/level1-validation/ui/hooks/"
        $content = $content -replace "from ['\`"]../../../hooks/", "from '@/features/phase3-analysis/level1-validation/ui/hooks/"
    }
    
    # ============================================================
    # SAUVEGARDER SI MODIFICATIONS
    # ============================================================
    
    if ($content -ne $originalContent) {
        Set-Content -Path $FilePath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "   ✅ $replacements correction(s) appliquée(s)" -ForegroundColor Green
        return $replacements
    } else {
        Write-Host "   ℹ️  Aucune correction nécessaire" -ForegroundColor Gray
        return 0
    }
}

# ================================================================
# TRAITEMENT DES HOOKS
# ================================================================

Write-Host "`n🔧 CORRECTION DES HOOKS" -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

$hooksPath = "src/features/phase3-analysis/level1-validation/ui/hooks"
$hookFiles = Get-ChildItem -Path $hooksPath -Filter "*.ts" -File

foreach ($file in $hookFiles) {
    $replacements = Fix-Imports -FilePath $file.FullName -FileType "Hook"
    $totalReplacements += $replacements
    $totalFiles++
}

# ================================================================
# TRAITEMENT DES SHARED COMPONENTS
# ================================================================

Write-Host "`n🔧 CORRECTION DES SHARED COMPONENTS" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

$sharedPath = "src/features/phase3-analysis/level1-validation/ui/components/shared"
$sharedFiles = Get-ChildItem -Path $sharedPath -Filter "*.tsx" -File

foreach ($file in $sharedFiles) {
    $replacements = Fix-Imports -FilePath $file.FullName -FileType "Component"
    $totalReplacements += $replacements
    $totalFiles++
}

# ================================================================
# RÉSUMÉ
# ================================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "              RÉSUMÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fichiers traités:      $totalFiles" -ForegroundColor White
Write-Host "Corrections totales:   $totalReplacements" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# ================================================================
# VÉRIFICATION RAPIDE
# ================================================================

Write-Host "🔍 VÉRIFICATION RAPIDE DES IMPORTS RESTANTS...`n" -ForegroundColor Yellow

$allFiles = Get-ChildItem -Path $hooksPath, $sharedPath -Include "*.ts", "*.tsx" -Recurse -File
$suspiciousImports = @()

foreach ($file in $allFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Chercher des imports relatifs suspects (trop de ../)
    if ($content -match "from ['\`"](\.\./){4,}") {
        $suspiciousImports += $file.Name
    }
    
    # Chercher des imports vers l'ancien emplacement
    if ($content -match "@/app/\(protected\)/analysis/components/AlgorithmLab") {
        $suspiciousImports += $file.Name
    }
}

if ($suspiciousImports.Count -gt 0) {
    Write-Host "⚠️  Imports suspects trouvés dans:" -ForegroundColor Red
    $suspiciousImports | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    Write-Host "`n❌ Vérification manuelle nécessaire" -ForegroundColor Red
} else {
    Write-Host "✅ Aucun import suspect détecté!" -ForegroundColor Green
}

Write-Host "`n🎯 PROCHAINE ÉTAPE: Tester la compilation TypeScript" -ForegroundColor Cyan
Write-Host "   Commande: npx tsc --noEmit 2>&1 | Select-String 'phase3-analysis'`n" -ForegroundColor White
