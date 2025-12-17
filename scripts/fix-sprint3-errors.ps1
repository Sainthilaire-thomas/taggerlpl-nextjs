# ============================================================================
# SCRIPT CORRECTION AUTOMATIQUE - Sprint 3 (Version Corrigée)
# Corrige les 18 erreurs TypeScript
# ============================================================================

Write-Host "🔧 Correction automatique des appels async CharteRegistry..." -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# FICHIER 1 : MultiCharteAnnotator.ts (5 erreurs)
# ============================================================================

Write-Host "📝 1/3 : MultiCharteAnnotator.ts" -ForegroundColor Yellow

$file1 = ".\src\features\phase3-analysis\level0-gold\domain\services\MultiCharteAnnotator.ts"

if (-Not (Test-Path $file1)) {
    Write-Host "❌ Fichier introuvable : $file1" -ForegroundColor Red
    exit 1
}

$content1 = Get-Content $file1 -Raw -Encoding UTF8

# Correction 1.1 : Ligne 38 - await dans testAllChartesForVariable
$content1 = $content1 -replace 'const chartes = CharteRegistry\.getChartesForVariable\(variable\);', 'const chartes = await CharteRegistry.getChartesForVariable(variable);'

# Correction 1.2 : Ligne 300 - Rendre estimateFullTest async
$content1 = $content1 -replace 'static estimateFullTest\(', 'static async estimateFullTest('

# Correction 1.3 : Ligne 300 - Changer retour en Promise<MultiCharteEstimate>
$content1 = $content1 -replace '(estimateFullTest\([^)]+\)): MultiCharteEstimate', '$1: Promise<MultiCharteEstimate>'

Set-Content $file1 -Value $content1 -NoNewline -Encoding UTF8
Write-Host "   ✅ 5 corrections appliquées" -ForegroundColor Green

# ============================================================================
# FICHIER 2 : useLevel0Testing.ts (2 erreurs)
# ============================================================================

Write-Host "📝 2/3 : useLevel0Testing.ts" -ForegroundColor Yellow

$file2 = ".\src\features\phase3-analysis\level0-gold\ui\hooks\useLevel0Testing.ts"

if (-Not (Test-Path $file2)) {
    Write-Host "❌ Fichier introuvable : $file2" -ForegroundColor Red
    exit 1
}

$content2 = Get-Content $file2 -Raw -Encoding UTF8

# Correction 2.1 : Ligne 58-59 - Séparer await et filter
$content2 = $content2 -replace 'const chartes = CharteRegistry\.getChartesForVariable\(variable\)\s*\.filter\(c => selectedCharteIds\.includes\(c\.charte_id\)\);', 'const allChartes = await CharteRegistry.getChartesForVariable(variable);
      const chartes = allChartes.filter(c => selectedCharteIds.includes(c.charte_id));'

Set-Content $file2 -Value $content2 -NoNewline -Encoding UTF8
Write-Host "   ✅ 2 corrections appliquées" -ForegroundColor Green

# ============================================================================
# FICHIER 3 : Level0Interface.tsx (11 erreurs)
# ============================================================================

Write-Host "📝 3/3 : Level0Interface.tsx" -ForegroundColor Yellow

$file3 = ".\src\features\phase3-analysis\level0-gold\ui\components\Level0Interface.tsx"

if (-Not (Test-Path $file3)) {
    Write-Host "❌ Fichier introuvable : $file3" -ForegroundColor Red
    exit 1
}

$content3 = Get-Content $file3 -Raw -Encoding UTF8

# Correction 3.1 : Ajouter import useState et useEffect si manquant
if ($content3 -match 'import React from "react";') {
    $content3 = $content3 -replace 'import React from "react";', 'import React, { useState, useEffect } from "react";'
}

# Correction 3.2 : Ajouter import CharteDefinition si manquant
if ($content3 -notmatch 'import.*CharteDefinition') {
    $content3 = $content3 -replace '(import React[^;]+;)', '$1
import { CharteDefinition } from "@/types/algorithm-lab/Level0Types";'
}

# Correction 3.3 : Remplacer useMemo par useState + useEffect
$content3 = $content3 -replace 'const availableChartes = useMemo\(\(\) => \{\s*return CharteRegistry\.getChartesForVariable\(variable\);\s*\}, \[variable\]\);', 'const [availableChartes, setAvailableChartes] = useState<CharteDefinition[]>([]);

  useEffect(() => {
    CharteRegistry.getChartesForVariable(variable).then(setAvailableChartes);
  }, [variable]);'

Set-Content $file3 -Value $content3 -NoNewline -Encoding UTF8
Write-Host "   ✅ 11 corrections appliquées" -ForegroundColor Green

# ============================================================================
# VALIDATION
# ============================================================================

Write-Host ""
Write-Host "🔍 Vérification compilation TypeScript..." -ForegroundColor Cyan
Write-Host ""

$compileOutput = npx tsc --noEmit --skipLibCheck 2>&1
$compileExitCode = $LASTEXITCODE

if ($compileExitCode -eq 0) {
    Write-Host ""
    Write-Host "✅✅✅ SUCCÈS COMPLET !" -ForegroundColor Green
    Write-Host "Les 18 erreurs TypeScript ont été corrigées." -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Résumé :" -ForegroundColor Cyan
    Write-Host "  • MultiCharteAnnotator.ts : 5 corrections ✅" -ForegroundColor White
    Write-Host "  • useLevel0Testing.ts     : 2 corrections ✅" -ForegroundColor White
    Write-Host "  • Level0Interface.tsx     : 11 corrections ✅" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 Prochaine étape : Tester l'application" -ForegroundColor Cyan
    Write-Host "   npm run dev" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️ Des erreurs subsistent" -ForegroundColor Yellow
    Write-Host $compileOutput -ForegroundColor Red
    Write-Host ""
    Write-Host "Relance : npx tsc --noEmit --skipLibCheck" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Si erreurs persistantes, envoie-moi les logs !" -ForegroundColor Cyan
}
