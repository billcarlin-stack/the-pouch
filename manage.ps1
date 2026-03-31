<#
.SYNOPSIS
    Tactical Management Script for The Nest (Hawthorn FC)
    
    Usage:
    .\manage.ps1 -Action build -Target frontend
    .\manage.ps1 -Action run -Target all
    .\manage.ps1 -Action deploy -Target backend
#>

param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("build", "run", "deploy", "setup")]
    [string]$Action,

    [Parameter(Mandatory=$true)]
    [ValidateSet("backend", "frontend", "all")]
    [string]$Target
)

$RootPath = Get-Location
$BackendPath = Join-Path $RootPath "backend"
$FrontendPath = Join-Path $RootPath "frontend"

function Run-Backend {
    Write-Host "--- Launching Backend (Flask) ---" -ForegroundColor Cyan
    cd $BackendPath
    if (-not (Test-Path "venv")) {
        Write-Host "Creating virtual environment..."
        python -m venv venv
    }
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    python app.py
}

function Run-Frontend {
    Write-Host "--- Launching Frontend (Vite) ---" -ForegroundColor Yellow
    cd $FrontendPath
    npm install
    npm run dev
}

function Build-Frontend {
    Write-Host "--- Building Frontend ---" -ForegroundColor Yellow
    cd $FrontendPath
    npm install
    npm run build
}

function Deploy-Backend {
    Write-Host "--- Deploying Backend to Cloud Run ---" -ForegroundColor Cyan
    cd $BackendPath
    gcloud run deploy the-nest-api --source . --region australia-southeast1 --allow-unauthenticated
}

function Deploy-Frontend {
    Write-Host "--- Deploying Frontend via Cloud Build ---" -ForegroundColor Yellow
    cd $FrontendPath
    gcloud builds submit --config cloudbuild.yaml .
}

switch ($Action) {
    "run" {
        if ($Target -eq "backend" -or $Target -eq "all") {
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendPath'; .\venv\Scripts\Activate.ps1; python app.py"
        }
        if ($Target -eq "frontend" -or $Target -eq "all") {
            # Vite default is http://localhost:5173
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendPath'; npm run dev"
            Write-Host "Site will be available at http://localhost:5173" -ForegroundColor Green
        }
    }
    "build" {
        if ($Target -eq "frontend" -or $Target -eq "all") { Build-Frontend }
    }
    "deploy" {
        if ($Target -eq "backend" -or $Target -eq "all") { Deploy-Backend }
        if ($Target -eq "frontend" -or $Target -eq "all") { Deploy-Frontend }
    }
    "setup" {
        Write-Host "Setting up environments..."
        cd $BackendPath
        python -m venv venv
        .\venv\Scripts\Activate.ps1
        pip install -r requirements.txt
        cd $FrontendPath
        npm install
    }
}
