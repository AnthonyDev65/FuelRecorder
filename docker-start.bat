@echo off
echo ========================================
echo   FuelRecorder - Docker Setup
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Check if .env file exists
if not exist ".env" (
    echo [INFO] Creating .env file from .env.example...
    if exist ".env.example" (
        copy .env.example .env
        echo [OK] .env file created
    ) else (
        echo [WARNING] .env.example not found, creating default .env
        echo DB_PASSWORD=postgres_secret > .env
        echo JWT_SECRET=dev_jwt_secret_key_change_in_production_1234567890 >> .env
        echo JWT_EXPIRATION=7d >> .env
        echo NODE_ENV=development >> .env
        echo PORT=5000 >> .env
        echo REACT_APP_API_URL=http://localhost:5000/api >> .env
        echo [OK] Default .env file created
    )
) else (
    echo [OK] .env file exists
)

echo.
echo ========================================
echo   Starting all services...
echo ========================================
echo.

docker compose up -d

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to start services. Check the logs above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Waiting for services to be ready...
echo ========================================
echo.

REM Wait for PostgreSQL
echo Waiting for PostgreSQL to start...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo   Service Status
echo ========================================
echo.

docker compose ps

echo.
echo ========================================
echo   FuelRecorder is running!
echo ========================================
echo.
echo   Backend API:      http://localhost:5000
echo   Admin Dashboard:  http://localhost:3001
echo   Technician App:   http://localhost:3000
echo.
echo   To view logs: docker compose logs -f
echo   To stop:      docker compose down
echo.
echo   Default admin credentials:
echo     Ficha: ADMIN001
echo     Password: admin123 (or the one you set)
echo.
pause
