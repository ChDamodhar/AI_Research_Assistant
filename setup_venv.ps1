# AI Research Assistant — Setup Script
# Run this script to create virtual environment and install dependencies

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  AI Research Assistant — Backend Setup" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create virtual environment
Write-Host "[1/4] Creating virtual environment..." -ForegroundColor Yellow
python -m venv venv
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create virtual environment. Make sure Python 3.12+ is installed." -ForegroundColor Red
    exit 1
}
Write-Host "  Virtual environment created." -ForegroundColor Green

# Step 2: Activate virtual environment
Write-Host "[2/4] Activating virtual environment..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"
Write-Host "  Virtual environment activated." -ForegroundColor Green

# Step 3: Upgrade pip
Write-Host "[3/4] Upgrading pip..." -ForegroundColor Yellow
python -m pip install --upgrade pip
Write-Host "  pip upgraded." -ForegroundColor Green

# Step 4: Install requirements
Write-Host "[4/4] Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies." -ForegroundColor Red
    exit 1
}
Write-Host "  Dependencies installed." -ForegroundColor Green

# Create required directories
Write-Host ""
Write-Host "Creating required directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "reports" | Out-Null
New-Item -ItemType Directory -Force -Path "chroma_db" | Out-Null
New-Item -ItemType Directory -Force -Path "logs" | Out-Null
Write-Host "  Directories created." -ForegroundColor Green

# Copy .env if not exists
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ""
    Write-Host "  .env file created from .env.example" -ForegroundColor Green
    Write-Host "  IMPORTANT: Edit .env and add your GEMINI_API_KEY!" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Edit .env and set your GEMINI_API_KEY" -ForegroundColor White
Write-Host "  2. Activate venv: .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "  3. Start server: uvicorn app.main:app --reload" -ForegroundColor White
Write-Host "  4. Open Swagger: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
