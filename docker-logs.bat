@echo off
echo ========================================
echo   FuelRecorder - Docker Logs
echo ========================================
echo.
echo Select service to view logs:
echo   1. All services
echo   2. Backend API
echo   3. Admin Dashboard
echo   4. Technician App
echo   5. PostgreSQL
echo.

set /p choice="Enter choice (1-5): "

echo.
if "%choice%"=="1" (
    docker compose logs -f
) else if "%choice%"=="2" (
    docker compose logs -f backend
) else if "%choice%"=="3" (
    docker compose logs -f frontend-admin
) else if "%choice%"=="4" (
    docker compose logs -f frontend
) else if "%choice%"=="5" (
    docker compose logs -f postgres
) else (
    echo Invalid choice
    pause
    exit /b 1
)
