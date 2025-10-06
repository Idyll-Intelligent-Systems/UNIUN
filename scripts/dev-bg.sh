#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/.pids"
BACKEND_PORT="${BACKEND_PORT:-4002}"
FRONTEND_PORT="${FRONTEND_PORT:-3002}"
API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:${BACKEND_PORT}}"
mkdir -p "$PID_DIR" "$ROOT_DIR/.logs"

# helper to start a process with nohup and write a pid
start_bg() {
  local name="$1"; shift
  local cmd="$*"
  local log="$ROOT_DIR/.logs/${name}.log"
  echo "Starting $name... (logs: $log)"
  nohup bash -lc "$cmd" >"$log" 2>&1 &
  local pid=$!
  echo $pid > "$PID_DIR/${name}.pid"
}

# kill if running
stop_if_running() {
  local name="$1"
  local pid_file="$PID_DIR/${name}.pid"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid=$(cat "$pid_file" || true)
    if [[ -n "$pid" ]] && ps -p "$pid" > /dev/null 2>&1; then
      echo "Stopping $name (pid $pid)"
      kill "$pid" || true
      # give it a moment, then SIGKILL if needed
      sleep 1
      if ps -p "$pid" > /dev/null 2>&1; then
        kill -9 "$pid" || true
      fi
    fi
    rm -f "$pid_file"
  fi
}

# Start backend
stop_if_running backend
start_bg backend "cd $ROOT_DIR/backend && PORT=$BACKEND_PORT npm run dev"

# Start frontend
stop_if_running frontend
start_bg frontend "cd $ROOT_DIR/frontend && NEXT_PUBLIC_API_URL=$API_URL npx next dev -p $FRONTEND_PORT"

# Print quick status
bash "$ROOT_DIR/scripts/dev-status.sh"
