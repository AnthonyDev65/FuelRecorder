@echo off
echo ========================================
echo   FuelRecorder - Docker Stop
echo ========================================
echo.

echo Stopping all services...
echo.

docker compose down

echo.
echo ========================================
echo   All services stopped
echo ========================================
echo.
pause
