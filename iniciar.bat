@echo off
echo Iniciando PratoCerto Escolar...
echo.

echo [1/2] Iniciando Backend (porta 3001)...
start "PratoCerto Backend" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 2 /nobreak >nul

echo [2/2] Iniciando Frontend (porta 3000)...
start "PratoCerto Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 8 /nobreak >nul

echo.
echo Sistema iniciado!
echo   Backend:  http://localhost:3001
echo   Frontend: http://localhost:3000
echo.
start "" "http://localhost:3000"
