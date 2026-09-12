# Deploy RosverSac a Railway (PowerShell).
# Uso: desde la raíz del monorepo, con RAILWAY_TOKEN en .env
$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot
$App = Join-Path $Root "RosverSac"

Get-Content (Join-Path $Root ".env"), (Join-Path $App ".env") -ErrorAction SilentlyContinue | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim()
  }
}

# CLI reciente: preferir RAILWAY_API_TOKEN; si solo hay RAILWAY_TOKEN UUID, clonar a API_TOKEN
if (-not $env:RAILWAY_API_TOKEN -and $env:RAILWAY_TOKEN) {
  $env:RAILWAY_API_TOKEN = $env:RAILWAY_TOKEN
}
# Evitar Invalid RAILWAY_TOKEN en CLI 5.50+
if ($env:RAILWAY_TOKEN -and $env:RAILWAY_API_TOKEN) {
  Remove-Item Env:RAILWAY_TOKEN -ErrorAction SilentlyContinue
}

if (-not $env:RAILWAY_API_TOKEN -and -not $env:RAILWAY_TOKEN) {
  Write-Error "Falta RAILWAY_API_TOKEN. Crea uno Account en https://railway.app/account/tokens y pégalo en RosverSac/.env"
}

# ── Commit SHA ──────────────────────────────────────────────────────────────
$CommitSha = $null
try {
  $CommitSha = (git -C $Root rev-parse HEAD 2>&1).Trim()
  if ($LASTEXITCODE -ne 0) { throw "git rev-parse HEAD falló (código $LASTEXITCODE)" }
} catch {
  Write-Error "No se pudo resolver git SHA: $_. Asegúrate de estar en un repo git con al menos un commit."
}

Write-Host ""
Write-Host "==> Commit SHA: $CommitSha"

# Árbol de trabajo sucio (warn, no falla salvo --strict)
$dirty = (git -C $Root status --porcelain 2>&1)
if ($dirty) {
  Write-Host "WARN: hay cambios sin commitear. Railway desplegara el arbol actual, no exactamente SHA=$CommitSha"
  Write-Host $dirty
} else {
  Write-Host "OK: arbol de trabajo limpio."
}
Write-Host ""

# Escribe SHA a .deploy-commit (lo lee boot.ts en Railway si no hay env RAILWAY_GIT_COMMIT_SHA)
$deployCommitFile = Join-Path $App ".deploy-commit"
Set-Content -Path $deployCommitFile -Value $CommitSha -Encoding UTF8
Write-Host "==> SHA escrito en .deploy-commit"

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

Write-Host "==> up (commit=$CommitSha)"
railway up --detach

Write-Host "==> domain"
railway domain 2>&1 | Out-Host

Write-Host ""
Write-Host "Listo. Desplegado desde commit=$CommitSha"
Write-Host "Verifica en Railway dashboard Variables que RAILWAY_GIT_COMMIT_SHA coincida."
Write-Host "En /api/health el campo commitSha debe mostrar el mismo valor."
