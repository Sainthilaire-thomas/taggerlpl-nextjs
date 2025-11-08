#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Generate TypeScript types from Supabase database schema

.DESCRIPTION
    This script uses Supabase CLI to generate database.types.ts from the remote schema.
    It adds a custom header with generation timestamp.

.EXAMPLE
    .\scripts\generate-types.ps1
#>

$ErrorActionPreference = "Stop"

# Force UTF-8 encoding for console output
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Configuration
$PROJECT_ID = "jregkxiwrnquslbocicz"
$OUTPUT_FILE = "src/types/database.types.ts"

Write-Host "🔄 Generating types from Supabase..." -ForegroundColor Cyan

try {
    # Ensure output directory exists
    $outputDir = Split-Path -Parent $OUTPUT_FILE
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
    }

    Write-Host "   Calling Supabase CLI..." -ForegroundColor Gray
    
    # Generate types to temporary location
    $tempFile = [System.IO.Path]::GetTempFileName()
    npx supabase gen types typescript --project-id $PROJECT_ID | Out-File -FilePath $tempFile -Encoding utf8
    
    if ($LASTEXITCODE -ne 0) {
        throw "Supabase CLI command failed with exit code $LASTEXITCODE"
    }

    # Read generated content
    $generatedTypes = Get-Content -Path $tempFile -Raw -Encoding UTF8

    # Create header
    $header = @"
/**
 * Database types auto-generated from Supabase
 * 
 * ⚠️  DO NOT EDIT MANUALLY
 * 
 * To regenerate:
 *   - Run task: Ctrl+Shift+P → "Tasks: Run Task" → "Generate Supabase Types"
 *   - Or run: npm run generate:types
 *   - Or run: .\scripts\generate-types.ps1
 * 
 * Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
 * Project ID: $PROJECT_ID
 */

"@

    # Combine header + generated types
    $finalContent = $header + $generatedTypes
    
    # Write to final destination with proper encoding
    $finalContent | Out-File -FilePath $OUTPUT_FILE -Encoding utf8 -NoNewline
    
    # Cleanup temp file
    Remove-Item -Path $tempFile -ErrorAction SilentlyContinue

    # Get file size
    $fileSize = (Get-Item $OUTPUT_FILE).Length
    $fileSizeKB = [math]::Round($fileSize / 1KB, 2)

    Write-Host "✅ Types generated successfully!" -ForegroundColor Green
    Write-Host "   File: $OUTPUT_FILE" -ForegroundColor Gray
    Write-Host "   Size: $fileSizeKB KB" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "❌ Error generating types:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
