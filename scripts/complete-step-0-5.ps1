#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Complete Step 0.5 - Types Solidification (Minimum Vital)

.DESCRIPTION
    Applies the 3 critical actions to complete Step 0.5:
    1. Add h2.entities to entities/index.ts barrel export
    2. Create main types barrel export (types/index.ts)
    3. Add missing @/types paths to tsconfig.json

.NOTES
    Duration: ~2 minutes
    Run from project root: .\scripts\complete-step-0-5.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Colors
$ColorSuccess = "Green"
$ColorInfo = "Cyan"
$ColorWarning = "Yellow"
$ColorError = "Red"

Write-Host "`n📋 ÉTAPE 0.5 - SOLIDIFICATION TYPES (Actions finales)`n" -ForegroundColor $ColorInfo

# ============================================================================
# ACTION 1: Add h2.entities to entities/index.ts
# ============================================================================
Write-Host "ACTION 1: Ajouter h2.entities au barrel entities..." -ForegroundColor $ColorInfo

$entitiesIndexPath = "src/types/entities/index.ts"
$h2Export = @"

// H2 analysis entities
export * from './h2.entities';
"@

if (Test-Path $entitiesIndexPath) {
    $content = Get-Content $entitiesIndexPath -Raw
    
    if ($content -notmatch "h2\.entities") {
        Add-Content -Path $entitiesIndexPath -Value $h2Export
        Write-Host "  ✅ h2.entities ajouté à entities/index.ts" -ForegroundColor $ColorSuccess
    } else {
        Write-Host "  ⏭️  h2.entities déjà présent dans entities/index.ts" -ForegroundColor $ColorWarning
    }
} else {
    Write-Host "  ❌ Fichier $entitiesIndexPath introuvable!" -ForegroundColor $ColorError
    exit 1
}

# ============================================================================
# ACTION 2: Create main types barrel export
# ============================================================================
Write-Host "`nACTION 2: Créer le barrel principal types/index.ts..." -ForegroundColor $ColorInfo

$typesIndexPath = "src/types/index.ts"
$typesIndexContent = @"
/**
 * Central export point for all types
 * 
 * Usage:
 *   import { Call, Tag, TurnTagged, Database } from '@/types'
 * 
 * This provides a single source of truth for all TypeScript types
 * across the TaggerLPL application.
 */

// ============================================================================
// DATABASE TYPES (Auto-generated from Supabase)
// ============================================================================
export * from './database.types';

// ============================================================================
// ENTITY TYPES (Business domain types)
// ============================================================================
export * from './entities';

// ============================================================================
// COMMON TYPES (Shared utilities)
// ============================================================================
export * from './common';

// ============================================================================
// FUTURE EXTENSIONS (Uncomment when created)
// ============================================================================
// export * from './ui';              // UI component types
// export * from './algorithm-lab';   // AlgorithmLab types
"@

if (-not (Test-Path $typesIndexPath)) {
    Set-Content -Path $typesIndexPath -Value $typesIndexContent
    Write-Host "  ✅ types/index.ts créé avec succès" -ForegroundColor $ColorSuccess
} else {
    Write-Host "  ⏭️  types/index.ts existe déjà" -ForegroundColor $ColorWarning
}

# ============================================================================
# ACTION 3: Update tsconfig.json paths
# ============================================================================
Write-Host "`nACTION 3: Mettre à jour tsconfig.json paths..." -ForegroundColor $ColorInfo

$tsconfigPath = "tsconfig.json"

if (Test-Path $tsconfigPath) {
    $tsconfig = Get-Content $tsconfigPath -Raw | ConvertFrom-Json
    
    # Check if paths need to be added
    $needsUpdate = $false
    
    if (-not $tsconfig.compilerOptions.paths.'@/types') {
        $tsconfig.compilerOptions.paths | Add-Member -NotePropertyName '@/types' -NotePropertyValue @("./src/types") -Force
        $needsUpdate = $true
    }
    
    if (-not $tsconfig.compilerOptions.paths.'@/types/*') {
        $tsconfig.compilerOptions.paths | Add-Member -NotePropertyName '@/types/*' -NotePropertyValue @("./src/types/*") -Force
        $needsUpdate = $true
    }
    
    if (-not $tsconfig.compilerOptions.paths.'@/lib/*') {
        $tsconfig.compilerOptions.paths | Add-Member -NotePropertyName '@/lib/*' -NotePropertyValue @("./src/lib/*") -Force
        $needsUpdate = $true
    }
    
    if ($needsUpdate) {
        $tsconfig | ConvertTo-Json -Depth 10 | Set-Content $tsconfigPath
        Write-Host "  ✅ tsconfig.json mis à jour avec @/types paths" -ForegroundColor $ColorSuccess
    } else {
        Write-Host "  ⏭️  tsconfig.json déjà à jour" -ForegroundColor $ColorWarning
    }
} else {
    Write-Host "  ❌ Fichier $tsconfigPath introuvable!" -ForegroundColor $ColorError
    exit 1
}

# ============================================================================
# VERIFICATION
# ============================================================================
Write-Host "`n🔍 VÉRIFICATION..." -ForegroundColor $ColorInfo

$checks = @(
    @{ Path = "src/types/index.ts"; Name = "Barrel principal types" }
    @{ Path = "src/types/entities/index.ts"; Name = "Barrel entities (avec h2)" }
    @{ Path = "tsconfig.json"; Name = "tsconfig avec @/types paths" }
)

$allGood = $true
foreach ($check in $checks) {
    if (Test-Path $check.Path) {
        Write-Host "  ✅ $($check.Name)" -ForegroundColor $ColorSuccess
    } else {
        Write-Host "  ❌ $($check.Name)" -ForegroundColor $ColorError
        $allGood = $false
    }
}

# ============================================================================
# SUMMARY
# ============================================================================
Write-Host "`n📊 RÉSUMÉ ÉTAPE 0.5`n" -ForegroundColor $ColorInfo

if ($allGood) {
    Write-Host "✅ Étape 0.5 complétée avec succès!" -ForegroundColor $ColorSuccess
    Write-Host "`nVous pouvez maintenant:" -ForegroundColor $ColorInfo
    Write-Host "  1. Tester la compilation: npm run build -- --no-lint" -ForegroundColor "White"
    Write-Host "  2. Vérifier l'auto-complétion dans VS Code" -ForegroundColor "White"
    Write-Host "  3. Passer à l'Étape 1 (restructuration)" -ForegroundColor "White"
    
    Write-Host "`n📝 Import examples:" -ForegroundColor $ColorInfo
    Write-Host '  import { Call, Tag, TurnTagged } from "@/types"' -ForegroundColor "Gray"
    Write-Host '  import { Database } from "@/types"' -ForegroundColor "Gray"
    Write-Host '  import { H2AnalysisPair } from "@/types"' -ForegroundColor "Gray"
} else {
    Write-Host "❌ Certaines vérifications ont échoué" -ForegroundColor $ColorError
    Write-Host "Veuillez corriger les erreurs ci-dessus" -ForegroundColor $ColorWarning
}

Write-Host ""
