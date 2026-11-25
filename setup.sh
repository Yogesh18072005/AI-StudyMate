#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

command -v node >/dev/null 2>&1 || {
  echo "Node.js is required. Install the version specified in .nvmrc." >&2
  exit 1
}
command -v corepack >/dev/null 2>&1 || {
  echo "Corepack is required to install the frontend's pinned pnpm version." >&2
  exit 1
}

echo "Installing backend dependencies from package-lock.json..."
npm ci --legacy-peer-deps

echo "Installing frontend dependencies from pnpm-lock.yaml..."
corepack pnpm --dir frontend install --frozen-lockfile

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example. Review its settings before starting."
fi

echo "Starting AI-StudyMate backend and frontend..."
npm run dev &
BACKEND_PID=$!

corepack pnpm --dir frontend dev &
FRONTEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:5173"
wait
