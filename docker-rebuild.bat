@echo off
echo ========================================
echo   FuelRecorder - Docker Rebuild
echo ========================================
echo.

echo This will:
echo   1. Stop all containers
echo   2. Remove volumes (WARNING: This deletes database data!)
echo   3. Rebuild all images
echo   4. Start all services
echo.
set /p confirm="Continue? (y/n): "
if /i not "%confirm%"=="y" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo Stopping and removing containers...
docker compose down -v

echo.
echo Rebuilding images...
docker compose build --no-cache

echo.
echo Starting all services...
docker compose up -d

echo.
echo Waiting for services to start...
timeout /t 15 /nobreak >nul

echo.
echo ========================================
echo   Service Status
echo ========================================
echo.

docker compose ps

echo.
echo ========================================
echo   FuelRecorder rebuilt successfully!
echo ========================================
echo.
echo   Backend API:      http://localhost:5000
echo   Admin Dashboard:  http://localhost:3001
echo   Technician App:   http://localhost:3000
echo.
pause
