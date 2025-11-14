Write-Host "🔧 Script v9 - Corriger imports Phase 1 utils..." -ForegroundColor Cyan
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

# CallImporter
$file = "src/features/phase1-corpus/calls/CallImporter.tsx"
if (Replace-InFile $file "from `"../shared/utils/callApiUtils`"" "from `"@/components/utils/callApiUtils`"") { $count++ }
Write-Host "  ✓ CallImporter.tsx" -ForegroundColor Green

# CallList
$file = "src/features/phase1-corpus/calls/CallList.tsx"
if (Replace-InFile $file "from `"../shared/utils/removeCallUpload`"" "from `"@/components/utils/removeCallUpload`"") { $count++ }
if (Replace-InFile $file "from `"../shared/utils/signedUrls`"" "from `"@/components/utils/signedUrls`"") { $count++ }
Write-Host "  ✓ CallList.tsx" -ForegroundColor Green

# CallTableList
$file = "src/features/phase1-corpus/calls/CallTableList/CallTableList.tsx"
if (Replace-InFile $file "from `"../../shared/utils/removeCallUpload`"" "from `"@/components/utils/removeCallUpload`"") { $count++ }
if (Replace-InFile $file "from `"../../shared/utils/signedUrls`"" "from `"@/components/utils/signedUrls`"") { $count++ }
if (Replace-InFile $file "from `"../../shared/utils/updateCallOrigine`"" "from `"@/components/utils/updateCallOrigine`"") { $count++ }
Write-Host "  ✓ CallTableList.tsx" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Script v9 terminé ! $count corrections" -ForegroundColor Green
Write-Host "  Relancer : npx tsc --noEmit --pretty 2>&1 | Select-String `"Found`"" -ForegroundColor Cyan
