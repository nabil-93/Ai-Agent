@echo off
title JobAgents - Launcher
color 0A
echo ========================================
echo    JobAgents - Launching Platform
echo ========================================
echo.

echo [1/3] Starting Backend (port 8000)...
start "JobAgents Backend" cmd /k "cd /d %~dp0backend && py -m uvicorn app.main:app --reload --port 8000"
timeout /t 4 /nobreak >nul

echo [2/3] Starting Frontend (port 3000)...
start "JobAgents Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 8 /nobreak >nul

echo [3/3] Opening browser...
start http://localhost:3000

echo.
echo ========================================
echo    All services running!
echo ========================================
echo.
echo  Backend:  http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo  Frontend: http://localhost:3000 (ola 3001)
echo.
echo  Bach tsaker koulshi: saker juj windows li tla3o
echo ========================================
echo.
pause
