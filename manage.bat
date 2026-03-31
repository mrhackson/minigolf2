@echo off
setlocal enabledelayedexpansion

if "%~1"=="" goto :help
if "%~1"=="help" goto :help
if "%~1"=="start" goto :start
if "%~1"=="stop" goto :stop
if "%~1"=="start-backend" goto :start-backend
if "%~1"=="start-frontend" goto :start-frontend
if "%~1"=="stop-backend" goto :stop-backend
if "%~1"=="stop-frontend" goto :stop-frontend
if "%~1"=="status" goto :status
if "%~1"=="install" goto :install
if "%~1"=="clean" goto :clean
goto :help

:help
echo.
echo Minigolf Application Commands:
echo.
echo Main Commands:
echo   manage.bat start          - Start both frontend and backend
echo   manage.bat stop           - Stop both frontend and backend
echo   manage.bat status         - Check status of both services
echo.
echo Individual Service Commands:
echo   manage.bat start-backend  - Start Django backend server
echo   manage.bat start-frontend - Start Vite frontend server
echo   manage.bat stop-backend   - Stop Django backend server
echo   manage.bat stop-frontend  - Stop Vite frontend server
echo.
echo Setup Commands:
echo   manage.bat install        - Install dependencies for both
echo   manage.bat clean          - Stop all services and clean up
echo.
goto :eof

:install
echo Installing dependencies...
cd backend
pip install -r requirements.txt
cd ..\frontend
npm install
cd ..
echo Dependencies installed!
goto :eof

:start
call :start-backend
call :start-frontend
echo Both services started!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
goto :eof

:start-backend
echo Starting Django backend...
if not exist ".pids" mkdir .pids
cd backend
start /b python manage.py runserver 8000
cd ..
echo Backend started on port 8000
goto :eof

:start-frontend
echo Starting Vite frontend...
if not exist ".pids" mkdir .pids
cd frontend
start /b npm run dev -- --port 5173
cd ..
echo Frontend started on port 5173
goto :eof

:stop
call :stop-backend
call :stop-frontend
echo Both services stopped!
goto :eof

:stop-backend
echo Stopping Django backend...
taskkill /f /im python.exe >nul 2>&1
echo Backend stopped
goto :eof

:stop-frontend
echo Stopping Vite frontend...
tasklist | findstr node.exe >nul && taskkill /f /im node.exe >nul 2>&1
echo Frontend stopped
goto :eof

:status
echo Service Status:
echo.
tasklist | findstr python.exe >nul && (
    echo Backend:  Running
) || (
    echo Backend:  Not running
)
tasklist | findstr node.exe >nul && (
    echo Frontend: Running  
) || (
    echo Frontend: Not running
)
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:8000
goto :eof

:clean
call :stop
if exist ".pids" rmdir /s /q ".pids" >nul 2>&1
if exist "backend\*.pyc" del /s /q "backend\*.pyc" >nul 2>&1
if exist "frontend\dist" rmdir /s /q "frontend\dist" >nul 2>&1
echo Cleanup completed!
goto :eof