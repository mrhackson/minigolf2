# Minigolf Application Manager
# PowerShell script for Windows to manage both frontend and backend services

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

# Colors
$Colors = @{
    Cyan = "Cyan"
    Green = "Green"
    Yellow = "Yellow"
    Red = "Red" 
}

# Ensure PID directory exists
if (!(Test-Path $PidDir)) {
    New-Item -ItemType Directory -Path $PidDir -Force | Out-Null
}

function Write-ColorOutput {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Show-Help {
    Write-ColorOutput "Minigolf Application Commands:" $Colors.Cyan
    Write-Host ""
    Write-ColorOutput "Main Commands:" $Colors.Green
    Write-Host "  .\manage.ps1 start          - Start both frontend and backend"
    Write-Host "  .\manage.ps1 stop           - Stop both frontend and backend"  
    Write-Host "  .\manage.ps1 status         - Check status of both services"
    Write-Host ""
    Write-ColorOutput "Individual Service Commands:" $Colors.Green
    Write-Host "  .\manage.ps1 start-backend  - Start Django backend server"
    Write-Host "  .\manage.ps1 start-frontend - Start Vite frontend server"
    Write-Host "  .\manage.ps1 stop-backend   - Stop Django backend server"
    Write-Host "  .\manage.ps1 stop-frontend  - Stop Vite frontend server"
    Write-Host ""
    Write-ColorOutput "Setup Commands:" $Colors.Green
    Write-Host "  .\manage.ps1 install        - Install dependencies for both"
    Write-Host "  .\manage.ps1 install-backend - Install Python dependencies"
    Write-Host "  .\manage.ps1 install-frontend - Install Node.js dependencies"
    Write-Host ""
    Write-ColorOutput "Utility Commands:" $Colors.Green
    Write-Host "  .\manage.ps1 clean          - Stop all services and clean up"
}

function Install-Dependencies {
    Write-ColorOutput "Installing all dependencies..." $Colors.Yellow
    Install-BackendDependencies
    Install-FrontendDependencies
    Write-ColorOutput "All dependencies installed!" $Colors.Green
}

function Install-BackendDependencies {
    Write-ColorOutput "Installing Python dependencies..." $Colors.Yellow
    Set-Location $BackendDir
    pip install -r requirements.txt
    Set-Location ..
    Write-ColorOutput "Backend dependencies installed!" $Colors.Green
}

function Install-FrontendDependencies {
    Write-ColorOutput "Installing Node.js dependencies..." $Colors.Yellow
    Set-Location $FrontendDir
    npm install
    Set-Location ..
    Write-ColorOutput "Frontend dependencies installed!" $Colors.Green
}

function Start-AllServices {
    Start-BackendService
    Start-FrontendService
    Write-ColorOutput "Both services started!" $Colors.Green
    Write-ColorOutput "Frontend: http://localhost:$FrontendPort" $Colors.Cyan
    Write-ColorOutput "Backend:  http://localhost:$BackendPort" $Colors.Cyan
}

function Start-BackendService {
    $pidFile = "$PidDir\backend.pid"
    
    if (Test-Path $pidFile) {
        $storedPid = Get-Content $pidFile -ErrorAction SilentlyContinue
        $existingProcess = if ($storedPid) { Get-Process -Id ([int]$storedPid) -ErrorAction SilentlyContinue } else { $null }
        if ($existingProcess) {
            Write-ColorOutput "Backend appears to be running already. Use 'stop-backend' first." $Colors.Yellow
            return
        }
        Remove-Item $pidFile -ErrorAction SilentlyContinue
    }
    
    Write-ColorOutput "Starting Django backend..." $Colors.Yellow
    
    # Start Django backend in a new PowerShell window
    $cmd = "cd '$BackendDir'; python manage.py runserver $BackendPort"
    $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd -PassThru -WindowStyle Minimized
    $process.Id | Out-File -FilePath $pidFile -Encoding UTF8
    
    Start-Sleep -Seconds 3
    Write-ColorOutput "Backend started on port $BackendPort (PID: $($process.Id))" $Colors.Green
}

function Start-FrontendService {
    $pidFile = "$PidDir\frontend.pid"
    
    if (Test-Path $pidFile) {
        $storedPid = Get-Content $pidFile -ErrorAction SilentlyContinue
        $existingProcess = if ($storedPid) { Get-Process -Id ([int]$storedPid) -ErrorAction SilentlyContinue } else { $null }
        if ($existingProcess) {
            Write-ColorOutput "Frontend appears to be running already. Use 'stop-frontend' first." $Colors.Yellow
            return
        }
        Remove-Item $pidFile -ErrorAction SilentlyContinue
    }
    
    Write-ColorOutput "Starting Vite frontend..." $Colors.Yellow
    
    # Start Vite frontend in a new PowerShell window
    $cmd = "cd '$FrontendDir'; npm run dev -- --port $FrontendPort"
    $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd -PassThru -WindowStyle Minimized
    $process.Id | Out-File -FilePath $pidFile -Encoding UTF8
    
    Start-Sleep -Seconds 3
    Write-ColorOutput "Frontend started on port $FrontendPort (PID: $($process.Id))" $Colors.Green
}

function Stop-AllServices {
    Stop-BackendService
    Stop-FrontendService
    Write-ColorOutput "Both services stopped!" $Colors.Green
}

function Stop-BackendService {
    $pidFile = "$PidDir\backend.pid"
    
    if (Test-Path $pidFile) {
        Write-ColorOutput "Stopping Django backend..." $Colors.Yellow
        $processId = Get-Content $pidFile -ErrorAction SilentlyContinue
        
        if ($processId) {
            try {
                Stop-Process -Id ([int]$processId) -Force -ErrorAction SilentlyContinue
                Remove-Item $pidFile -ErrorAction SilentlyContinue
                Write-ColorOutput "Backend stopped" $Colors.Green
            } catch {
                Remove-Item $pidFile -ErrorAction SilentlyContinue
            }
        }
    }
    
    # Simple cleanup of Python processes
    try {
        $pythonProcesses = Get-Process python -ErrorAction SilentlyContinue
        if ($pythonProcesses) {
            $pythonProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
            Write-ColorOutput "Cleaned up Python processes" $Colors.Yellow
        }
    } catch {
        # Ignore errors
    }
}

function Stop-FrontendService {
    $pidFile = "$PidDir\frontend.pid"
    
    if (Test-Path $pidFile) {
        Write-ColorOutput "Stopping Vite frontend..." $Colors.Yellow
        $processId = Get-Content $pidFile -ErrorAction SilentlyContinue
        
        if ($processId) {
            try {
                Stop-Process -Id ([int]$processId) -Force -ErrorAction SilentlyContinue
                Remove-Item $pidFile -ErrorAction SilentlyContinue
                Write-ColorOutput "Frontend stopped" $Colors.Green
            } catch {
                Remove-Item $pidFile -ErrorAction SilentlyContinue
            }
        }
    }
    
    # Simple cleanup of Node processes
    try {
        $nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
        if ($nodeProcesses) {
            $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
            Write-ColorOutput "Cleaned up Node processes" $Colors.Yellow
        }
    } catch {
        # Ignore errors
    }
}

function Show-Status {
    Write-ColorOutput "Service Status:" $Colors.Cyan
    Write-Host ""
    
    # Check backend
    $backendPidFile = "$PidDir\backend.pid"
    Write-Host "Backend:  " -NoNewline
    
    if (Test-Path $backendPidFile) {
        $processId = Get-Content $backendPidFile -ErrorAction SilentlyContinue
        try {
            $process = Get-Process -Id ([int]$processId) -ErrorAction SilentlyContinue
            if ($process) {
                Write-ColorOutput "Running (PID: $processId)" $Colors.Green
            } else {
                Write-ColorOutput "Not running (stale PID file)" $Colors.Red
                Remove-Item $backendPidFile -ErrorAction SilentlyContinue
            }
        } catch {
            Write-ColorOutput "Not running (invalid PID)" $Colors.Red
            Remove-Item $backendPidFile -ErrorAction SilentlyContinue
        }
    } else {
        Write-ColorOutput "Not running" $Colors.Red
    }
    
    # Check frontend
    $frontendPidFile = "$PidDir\frontend.pid"
    Write-Host "Frontend: " -NoNewline
    
    if (Test-Path $frontendPidFile) {
        $processId = Get-Content $frontendPidFile -ErrorAction SilentlyContinue
        try {
            $process = Get-Process -Id ([int]$processId) -ErrorAction SilentlyContinue
            if ($process) {
                Write-ColorOutput "Running (PID: $processId)" $Colors.Green
            } else {
                Write-ColorOutput "Not running (stale PID file)" $Colors.Red
                Remove-Item $frontendPidFile -ErrorAction SilentlyContinue
            }
        } catch {
            Write-ColorOutput "Not running (invalid PID)" $Colors.Red
            Remove-Item $frontendPidFile -ErrorAction SilentlyContinue
        }
    } else {
        Write-ColorOutput "Not running" $Colors.Red
    }
    
    Write-Host ""
    if (Test-Path "$PidDir\backend.pid") {
        Write-ColorOutput "Backend:  http://localhost:$BackendPort" $Colors.Cyan
    }
    if (Test-Path "$PidDir\frontend.pid") {
        Write-ColorOutput "Frontend: http://localhost:$FrontendPort" $Colors.Cyan
    }
}

function Clean-Up {
    Stop-AllServices
    Write-ColorOutput "Cleaning up..." $Colors.Yellow
    
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
    
    Write-ColorOutput "Cleanup completed!" $Colors.Green
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
    "install-backend" { Install-BackendDependencies }
    "install-frontend" { Install-FrontendDependencies }
    "clean" { Clean-Up }
    "help" { Show-Help }
    default { Show-Help }
}