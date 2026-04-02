# Minigolf Application Manager (Simple Version)
# Shows output in visible terminal windows

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "stop", "start-backend", "start-frontend", "stop-backend", "stop-frontend", "status", "install", "install-backend", "install-frontend", "clean", "help")]
    [string]$Command = "help"
)

# Configuration
$BackendDir = "backend"
$FrontendDir = "frontend"
$BackendPort = 8000
$FrontendPort = 5173
$PidDir = ".pids"

# Ensure PID directory exists
if (!(Test-Path $PidDir)) {
    New-Item -ItemType Directory -Path $PidDir -Force | Out-Null
}

function Write-ColorOutput {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Show-Help {
    Write-ColorOutput "Minigolf Application Commands (Simple Version):" "Cyan"
    Write-Host ""
    Write-Host "  .\manage-simple.ps1 start          - Start both services in visible windows"
    Write-Host "  .\manage-simple.ps1 stop           - Stop all Python/Node processes"
    Write-Host "  .\manage-simple.ps1 start-backend  - Start Django backend"
    Write-Host "  .\manage-simple.ps1 start-frontend - Start Vite frontend"
    Write-Host "  .\manage-simple.ps1 stop-backend   - Stop Django backend"
    Write-Host "  .\manage-simple.ps1 stop-frontend  - Stop Vite frontend"
    Write-Host "  .\manage-simple.ps1 install        - Install dependencies"
}

function Install-Dependencies {
    Write-ColorOutput "Installing backend dependencies..." "Yellow"
    Set-Location $BackendDir
    & python -m pip install -r requirements.txt
    Set-Location ..
    
    Write-ColorOutput "Installing frontend dependencies..." "Yellow"
    Set-Location $FrontendDir
    & npm install
    Set-Location ..
    
    Write-ColorOutput "All dependencies installed!" "Green"
}

function Start-AllServices {
    Start-BackendService
    Start-Sleep -Seconds 2
    Start-FrontendService
    Write-ColorOutput "Both services started!" "Green"
    Write-ColorOutput "Frontend: http://localhost:$FrontendPort" "Cyan"  
    Write-ColorOutput "Backend:  http://localhost:$BackendPort" "Cyan"
}

function Start-BackendService {
    Write-ColorOutput "Starting Django backend in new window..." "Yellow"
    $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendDir'; python manage.py runserver $BackendPort" -WindowStyle Normal -PassThru
    $process.Id | Out-File -FilePath "$PidDir\backend.pid" -Encoding UTF8
    Write-ColorOutput "Backend starting on port $BackendPort" "Green"
}

function Start-FrontendService {
    Write-ColorOutput "Starting Vite frontend in new window..." "Yellow"
    $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FrontendDir'; npm run dev -- --port $FrontendPort" -WindowStyle Normal -PassThru
    $process.Id | Out-File -FilePath "$PidDir\frontend.pid" -Encoding UTF8
    Write-ColorOutput "Frontend starting on port $FrontendPort" "Green"
}

function Stop-AllServices {
    Stop-BackendService
    Stop-FrontendService
    Write-ColorOutput "All services stopped!" "Green"
}

function Stop-BackendService {
    Write-ColorOutput "Stopping Django backend..." "Yellow"
    $pidFile = "$PidDir\backend.pid"
    if (Test-Path $pidFile) {
        $processId = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
        if ($processId -match '^\d+$') {
            $backendProcess = Get-Process -Id ([int]$processId) -ErrorAction SilentlyContinue
            if ($backendProcess -and $backendProcess.ProcessName -eq "powershell") {
                Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
            }
        }
        Remove-Item $pidFile -ErrorAction SilentlyContinue
    }
    # Fallback: kill any remaining Python processes
    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-ColorOutput "Backend stopped" "Green"
}

function Stop-FrontendService {
    Write-ColorOutput "Stopping Vite frontend..." "Yellow"
    $pidFile = "$PidDir\frontend.pid"
    if (Test-Path $pidFile) {
        $processId = (Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
        if ($processId -match '^\d+$') {
            $frontendProcess = Get-Process -Id ([int]$processId) -ErrorAction SilentlyContinue
            if ($frontendProcess -and $frontendProcess.ProcessName -eq "powershell") {
                Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
            }
        }
        Remove-Item $pidFile -ErrorAction SilentlyContinue
    }
    # Fallback: kill any remaining Node processes
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-ColorOutput "Frontend stopped" "Green"
}

function Show-Status {
    Write-ColorOutput "Service Status:" "Cyan"
    
    $pythonProcesses = Get-Process python -ErrorAction SilentlyContinue
    $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
    
    if ($pythonProcesses) {
        Write-ColorOutput "Backend:  Running ($($pythonProcesses.Count) Python processes)" "Green"
    } else {
        Write-ColorOutput "Backend:  Not running" "Red"
    }
    
    if ($nodeProcesses) {
        Write-ColorOutput "Frontend: Running ($($nodeProcesses.Count) Node processes)" "Green"
    } else {
        Write-ColorOutput "Frontend: Not running" "Red"
    }
    
    Write-Host ""
    Write-ColorOutput "URLs:" "Cyan"  
    Write-ColorOutput "Frontend: http://localhost:$FrontendPort" "White"
    Write-ColorOutput "Backend:  http://localhost:$BackendPort" "White"
}

function Clean-Up {
    Stop-AllServices
    Write-ColorOutput "Cleaning up..." "Yellow"
    
    # Remove PID directory
    if (Test-Path $PidDir) {
        Remove-Item $PidDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Clean Python cache files
    Get-ChildItem -Path $BackendDir -Recurse -Name "*.pyc" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
    
    # Clean frontend dist directory
    $distPath = "$FrontendDir\dist"
    if (Test-Path $distPath) {
        Remove-Item $distPath -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    Write-ColorOutput "Cleanup completed!" "Green"
}

# Main command dispatcher
switch ($Command.ToLower()) {
    "start" { Start-AllServices }
    "stop" { Stop-AllServices }
    "start-backend" { Start-BackendService }
    "start-frontend" { Start-FrontendService }
    "stop-backend" { Stop-BackendService }
    "stop-frontend" { Stop-FrontendService }
    "status" { Show-Status }
    "install" { Install-Dependencies }
    "clean" { Clean-Up }
    "help" { Show-Help }
    default { Show-Help }
}