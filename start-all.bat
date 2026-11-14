@echo off
echo ========================================================
echo    DANG KHOI CHAY BREWLITE A2 (BACKEND + FRONTEND)
echo ========================================================
REM Khoi dong container DB cua Assignment 2 (Port 5434)
docker start brewlite-a2-db >nul 2>&1 || docker compose up -d db

start "BrewLite A2 Backend (Port 4001)" cmd /k "cd apps\api && npm run start:dev"
start "BrewLite A2 Frontend (Port 3001)" cmd /k "cd apps\web && npm run dev"
echo.
echo Backend A2 dang chay tai:   http://localhost:4001/api
echo Frontend A2 dang chay tai:  http://localhost:3001
echo Quay Barista A2:            http://localhost:3001/barista
echo Xem Database truc quan:     http://localhost:5556 (chay view-db.bat)
echo ========================================================
