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

if [[ -z "${RAILWAY_TOKEN:-}" ]]; then
  echo "Falta RAILWAY_TOKEN. Crea uno en https://railway.app/account/tokens"
  exit 1
fi

cd "$APP"
echo "==> whoami"
railway whoami

if ! railway status &>/dev/null; then
  echo "==> init proyecto (primera vez)"
  railway init -n rosver-web
fi

echo "==> Postgres (idempotente si ya existe)"
railway add --database postgres || true

echo "==> up"
railway up --detach

echo "==> domain"
railway domain || true

echo "Listo. Revisa URL en Railway dashboard."
