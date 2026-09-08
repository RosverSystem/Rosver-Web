# Deploy RosverSac a Railway (PowerShell).
# Uso: desde la raíz del monorepo, con RAILWAY_TOKEN en .env
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$App = Join-Path $Root "RosverSac"

Get-Content (Join-Path $Root ".env") | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim()
  }
}

if (-not $env:RAILWAY_TOKEN) {
  Write-Error "Falta RAILWAY_TOKEN. Crea uno en https://railway.app/account/tokens y pégalo en .env"
}

Set-Location $App
Write-Host "==> whoami"
railway whoami

Write-Host "==> status / init si hace falta"
$st = railway status 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "==> init proyecto"
  railway init -n rosver-web
}

Write-Host "==> Postgres"
railway add --database postgres 2>&1 | Out-Host

Write-Host "==> up"
railway up --detach

Write-Host "==> domain"
railway domain 2>&1 | Out-Host

Write-Host "Listo. Revisa URL en Railway dashboard."
