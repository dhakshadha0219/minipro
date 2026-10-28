@echo off
title Starting Food Dehydration Digital Twin
echo ======================================================
echo Starting Food Dehydration Digital Twin System...
echo ======================================================

:: Start Backend
start "Backend - FastAPI (Port 8000)" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

:: Start Frontend
start "Frontend - React Vite (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both servers have been launched in separate windows!
echo - Frontend:    http://localhost:5173
echo - Backend API: http://127.0.0.1:8000
echo - Swagger Docs: http://127.0.0.1:8000/docs
echo.
pause
