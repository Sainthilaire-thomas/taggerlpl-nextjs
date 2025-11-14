# ============================================
# Script v6 - Correction imports Phase 1
# ============================================

Write-Host "🔧 Script v6 - Correction imports Phase 1..." -ForegroundColor Cyan
Write-Host ""

function Replace-InFile {
    param([string]$FilePath, [string]$OldPattern, [string]$NewPattern)
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        $content = $content -replace [regex]::Escape($OldPattern), $NewPattern
        Set-Content $FilePath -Value $content -Encoding UTF8 -NoNewline
        return $true
    }
    return $false
}

$count = 0

# 1. CallImporter
Write-Host "📦 Correction CallImporter.tsx..." -ForegroundColor Yellow
$file = "src/features/phase1-corpus/calls/CallImporter.tsx"
if (Replace-InFile $file 'from "../AudioList"' 'from "@/components/AudioList"') { $count++ }
if (Replace-InFile $file 'from "../utils/callApiUtils"' 'from "../shared/utils/callApiUtils"') { $count++ }
Write-Host "  ✓ CallImporter.tsx" -ForegroundColor Green

# 2. CallList
Write-Host ""
Write-Host "📦 Correction CallList.tsx..." -ForegroundColor Yellow
$file = "src/features/phase1-corpus/calls/CallList.tsx"
if (Replace-InFile $file 'from "../utils/removeCallUpload"' 'from "../shared/utils/removeCallUpload"') { $count++ }
if (Replace-InFile $file 'from "../utils/signedUrls"' 'from "../shared/utils/signedUrls"') { $count++ }
Write-Host "  ✓ CallList.tsx" -ForegroundColor Green

# 3. CallPreparation
Write-Host ""
Write-Host "📦 Correction CallPreparation.tsx..." -ForegroundColor Yellow
$file = "src/features/phase1-corpus/calls/CallPreparation.tsx"
if (Replace-InFile $file 'from "../CallListUnprepared"' 'from "@/components/CallListUnprepared/CallListUnprepared"') { $count++ }
if (Replace-InFile $file 'from "../SnackBarManager"' 'from "@/components/SnackBarManager"') { $count++ }
Write-Host "  ✓ CallPreparation.tsx" -ForegroundColor Green

# 4. CallTableList
Write-Host ""
Write-Host "📦 Correction CallTableList.tsx..." -ForegroundColor Yellow
$file = "src/features/phase1-corpus/calls/CallTableList/CallTableList.tsx"
if (Replace-InFile $file 'from "../../utils/removeCallUpload"' 'from "../../shared/utils/removeCallUpload"') { $count++ }
if (Replace-InFile $file 'from "../../utils/signedUrls"' 'from "../../shared/utils/signedUrls"') { $count++ }
if (Replace-InFile $file 'from "../../utils/updateCallOrigine"' 'from "../../shared/utils/updateCallOrigine"') { $count++ }
Write-Host "  ✓ CallTableList.tsx" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Script v6 terminé ! $count corrections" -ForegroundColor Green
Write-Host "  Relancer : npx tsc --noEmit --pretty 2>&1 | Select-String 'Found'" -ForegroundColor Cyan
