#!/usr/bin/env bash
set -euo pipefail

echo "[local] Building images (frontend/backend)"
docker compose build frontend backend

echo "[local] Starting services: backend, frontend, mongo, neo4j, prometheus"
docker compose up -d backend frontend mongo neo4j prometheus
sleep 2

echo "[local] Status:"
docker compose ps || true

echo "[local] Health checks:"
curl -sS -o /dev/null -w "backend /health: %{http_code}\n" http://localhost:4000/health || true
curl -sS -o /dev/null -w "backend /api/health: %{http_code}\n" http://localhost:4000/api/health || true
curl -sS -o /dev/null -w "frontend /: %{http_code}\n" http://localhost:3000/ || true
curl -sSI http://localhost:4000/avatars/veee.png | head -n 1 || true

echo "[local] Optional: seed dev data"
echo "  curl -X POST -s http://localhost:4000/api/dev/seed | jq ."

echo "[local] Done. Visit http://localhost:3000"
