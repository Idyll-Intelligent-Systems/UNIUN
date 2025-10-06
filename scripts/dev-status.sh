#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/.pids"
BACKEND_PORT="${BACKEND_PORT:-4002}"
FRONTEND_PORT="${FRONTEND_PORT:-3002}"
API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:${BACKEND_PORT}}"

status_one() {
  local name="$1"; shift
  local default_port="$1"; shift
  local pid_file="$PID_DIR/${name}.pid"
  local state="stopped"
  local pid="-"
  if [[ -f "$pid_file" ]]; then
    pid=$(cat "$pid_file" || true)
    if [[ -n "$pid" ]] && ps -p "$pid" > /dev/null 2>&1; then
      state="running"
    fi
  fi
  echo "$name: $state (pid: $pid, port: $default_port)"
}

echo "Background dev status:"
status_one backend "$BACKEND_PORT"
status_one frontend "$FRONTEND_PORT"

echo "Frontend expects NEXT_PUBLIC_API_URL=$API_URL"
