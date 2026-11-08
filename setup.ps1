$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "Installing backend dependencies..."
Push-Location $root
npm install
if ($LASTEXITCODE -ne 0) { throw "Backend dependency installation failed." }

Write-Host "Installing frontend dependencies..."
npm install --prefix frontend
if ($LASTEXITCODE -ne 0) { throw "Frontend dependency installation failed." }

if (-not (Test-Path (Join-Path $root ".env"))) {
    Copy-Item (Join-Path $root ".env.example") (Join-Path $root ".env")
    Write-Host "Created .env from .env.example. Review its settings before starting."
}

Pop-Location

Write-Host "Starting AI-StudyMate backend and frontend..."
Start-Process -FilePath "cmd.exe" -ArgumentList @("/k", "cd /d `"$root`" && npm run dev")
Start-Process -FilePath "cmd.exe" -ArgumentList @("/k", "cd /d `"$root`" && npm run dev --prefix frontend")

Write-Host "Backend:  http://localhost:5000"
Write-Host "Frontend: http://localhost:5173"
