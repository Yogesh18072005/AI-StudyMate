#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "Installing backend dependencies..."
npm install

echo "Installing frontend dependencies..."
npm install --prefix frontend

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example. Review its settings before starting."
fi

echo "Starting AI-StudyMate backend and frontend..."
npm run dev &
BACKEND_PID=$!

npm run dev --prefix frontend &
FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:5173"
wait
