$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is required. Install the version specified in .nvmrc and rerun setup."
}
if (-not (Get-Command corepack -ErrorAction SilentlyContinue)) {
    throw "Corepack is required to install the frontend's pinned pnpm version. Enable/install Corepack and rerun setup."
}

Write-Host "Installing backend dependencies from package-lock.json..."
Push-Location $root
npm ci --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { throw "Backend dependency installation failed." }

Write-Host "Installing frontend dependencies from pnpm-lock.yaml..."
corepack pnpm --dir frontend install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw "Frontend dependency installation failed." }

if (-not (Test-Path (Join-Path $root ".env"))) {
    Copy-Item (Join-Path $root ".env.example") (Join-Path $root ".env")
    Write-Host "Created .env from .env.example. Review its settings before starting."
}

Pop-Location

Write-Host "Starting AI-StudyMate backend and frontend..."
Start-Process -FilePath "cmd.exe" -ArgumentList @("/k", "cd /d `"$root`" && npm run dev")
Start-Process -FilePath "cmd.exe" -ArgumentList @("/k", "cd /d `"$root`" && corepack pnpm --dir frontend dev")

Write-Host "Backend:  http://localhost:5000"
Write-Host "Frontend: http://localhost:5173"
