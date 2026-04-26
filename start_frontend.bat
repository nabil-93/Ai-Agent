@echo off
title JobAgents Frontend
cd /d "%~dp0frontend"
echo ========================================
echo   JobAgents Frontend - Starting...
echo ========================================
echo.
echo URL: http://localhost:3000 (ola 3001)
echo.
call npm run dev
pause
