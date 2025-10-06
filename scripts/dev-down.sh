#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/.pids"

stop_if_running() {
  local name="$1"
  local pid_file="$PID_DIR/${name}.pid"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid=$(cat "$pid_file" || true)
    if [[ -n "$pid" ]] && ps -p "$pid" > /dev/null 2>&1; then
      echo "Stopping $name (pid $pid)"
      kill "$pid" || true
      sleep 1
      if ps -p "$pid" > /dev/null 2>&1; then
        kill -9 "$pid" || true
      fi
    fi
    rm -f "$pid_file"
  else
    echo "$name is not running"
  fi
}

stop_if_running backend
stop_if_running frontend

echo "All background dev processes stopped."
