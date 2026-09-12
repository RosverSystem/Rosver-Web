#!/usr/bin/env bash
# Deploy RosverSac a Railway (requiere RAILWAY_TOKEN válido en el entorno o .env).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/RosverSac"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

if [[ -z "${RAILWAY_TOKEN:-}" ]] && [[ -z "${RAILWAY_API_TOKEN:-}" ]]; then
  echo "Falta RAILWAY_TOKEN o RAILWAY_API_TOKEN. Crea uno en https://railway.app/account/tokens"
  exit 1
fi

# ── Commit SHA ──────────────────────────────────────────────────────────────
if ! COMMIT_SHA=$(git -C "$ROOT" rev-parse HEAD 2>&1); then
  echo "ERROR: No se pudo resolver git SHA. Asegúrate de estar en un repo git con al menos un commit."
  exit 1
fi
COMMIT_SHA="$(echo "$COMMIT_SHA" | tr -d '[:space:]')"

echo ""
echo "==> Commit SHA: $COMMIT_SHA"

# Árbol de trabajo sucio (warn, no falla)
DIRTY=$(git -C "$ROOT" status --porcelain 2>/dev/null || true)
if [[ -n "$DIRTY" ]]; then
  echo "⚠️  Advertencia: hay cambios sin commitear."
  echo "$DIRTY"
  echo "   Railway desplegará el árbol actual, no exactamente SHA=$COMMIT_SHA"
else
  echo "✓  Árbol de trabajo limpio."
fi
echo ""

# Escribe SHA a .deploy-commit (lo lee boot.ts si no hay env RAILWAY_GIT_COMMIT_SHA)
echo "$COMMIT_SHA" > "$APP/.deploy-commit"
echo "==> SHA escrito en .deploy-commit"

cd "$APP"
echo "==> whoami"
railway whoami

if ! railway status &>/dev/null; then
  echo "==> init proyecto (primera vez)"
  railway init -n rosver-web
fi

echo "==> Postgres (idempotente si ya existe)"
railway add --database postgres || true

echo "==> up (commit=$COMMIT_SHA)"
railway up --detach

echo "==> domain"
railway domain || true

echo ""
echo "Listo. Desplegado desde commit=$COMMIT_SHA"
echo "Verifica en Railway dashboard → Variables que RAILWAY_GIT_COMMIT_SHA coincida."
echo "En /api/health el campo 'commitSha' debe mostrar el mismo valor."
