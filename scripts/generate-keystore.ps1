<#
.SYNOPSIS
Generates an Android Upload Keystore for Google Play App Signing (online.anesthassist.app).
#>

$ErrorActionPreference = "Stop"

$KeystorePath = "anesthassist-upload-keystore.jks"
$Alias = "anesthassist"

if (Test-Path $KeystorePath) {
    Write-Warning "Keystore already exists at $KeystorePath. Skipping generation to prevent accidental overwriting."
    exit 0
}

if (-not (Get-Command keytool -ErrorAction SilentlyContinue)) {
    throw "keytool was not found. Install a JDK and add its bin directory to PATH."
}

Write-Host "=== Generating Android Upload Keystore for AnesthAssist ===" -ForegroundColor Cyan
Write-Host "You will be prompted to choose a secure keystore password." -ForegroundColor Yellow

keytool -genkey -v -keystore $KeystorePath -alias $Alias -keyalg RSA -keysize 2048 -validity 10000 `
    -dname "CN=Dr. Mohamed Abdelwahab, OU=Clinical, O=AnesthAssist, L=Cairo, ST=Cairo, C=EG"

if ($LASTEXITCODE -ne 0 -or -not (Test-Path $KeystorePath)) {
    throw "Keystore generation failed. keytool exit code: $LASTEXITCODE"
}

Write-Host "`nKeystore generated successfully at: $KeystorePath" -ForegroundColor Green
Write-Host "To copy the Base64-encoded string for GitHub Secrets (ANDROID_KEYSTORE_BASE64):" -ForegroundColor Cyan
Write-Host "Run: [Convert]::ToBase64String([IO.File]::ReadAllBytes('$KeystorePath')) | Set-Clipboard" -ForegroundColor White
