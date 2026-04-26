@echo off
title JobAgents Backend
cd /d "%~dp0backend"
echo ========================================
echo   JobAgents Backend - Starting...
echo ========================================
echo.
echo URL: http://localhost:8000
echo Docs: http://localhost:8000/docs
echo.
py -m uvicorn app.main:app --reload --port 8000
pause
