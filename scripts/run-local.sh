#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="http://localhost:4000/health"
FRONTEND_URL="http://localhost:3000/"

wait_for_url() {
	local url="$1"; local name="$2"; local tries=${3:-60}
	echo "[local] Waiting for $name at $url"
	for i in $(seq 1 "$tries"); do
		code=$(curl -sS -o /dev/null -w "%{http_code}" "$url" || true)
		if [[ "$code" == "200" ]]; then
			echo "[local] $name is ready (HTTP $code)"
			return 0
		fi
		sleep 1
	done
	echo "[local] $name did not become healthy in time (last code: ${code:-none})"
	return 1
}

echo "[local] Build images"
docker compose build frontend backend

echo "[local] Up services"
docker compose up -d mongo neo4j backend frontend prometheus

echo "[local] Health checks"
wait_for_url "$BACKEND_URL" backend || { echo "[local] Backend logs (tail)"; docker compose logs --no-color backend | tail -n 200 || true; exit 1; }
wait_for_url "$FRONTEND_URL" frontend || { echo "[local] Frontend logs (tail)"; docker compose logs --no-color frontend | tail -n 200 || true; exit 1; }

echo "[local] Seed demo data"
curl -s -X POST http://localhost:4000/api/dev/seed >/dev/null || true

echo "[local] Visit http://localhost:3000"
