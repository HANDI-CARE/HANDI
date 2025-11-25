@echo off
REM ChromaDB and Data Initialization Auto Setup Script (Windows)
REM Usage: setup_chromadb.bat

setlocal enabledelayedexpansion

echo ==========================================
echo   ChromaDB and Data Initialization Start
echo ==========================================

REM Navigate to script directory
cd /d "%~dp0"
echo Current working directory: %CD%

REM 1. Check and cleanup existing ChromaDB containers
echo 1. Checking and cleaning up existing ChromaDB containers...

REM Check and stop running containers
for /f "tokens=*" %%i in ('docker ps -q -f name=chromadb 2^>nul') do (
    echo    Stopping existing ChromaDB container...
    docker stop chromadb >nul 2>&1
)

REM Check and remove all containers
for /f "tokens=*" %%i in ('docker ps -a -q -f name=chromadb 2^>nul') do (
    echo    Removing existing ChromaDB container...
    docker rm chromadb >nul 2>&1
)

REM 2. Create ChromaDB volume directory
echo 2. Creating ChromaDB volume directory...
set "CHROMA_DB_PATH=.\chroma_db_path"
if not exist "%CHROMA_DB_PATH%" mkdir "%CHROMA_DB_PATH%"
echo    ChromaDB data storage path: %CD%\%CHROMA_DB_PATH%

REM 3. Run ChromaDB container
echo 3. Starting ChromaDB container...
docker run -d --rm --name chromadb -p 8000:8000 -v "%CD%\chroma_db_path:/chroma/chroma" -e IS_PERSISTENT=TRUE -e ANONYMIZED_TELEMETRY=TRUE chromadb/chroma:latest

if errorlevel 1 (
    echo    Error: ChromaDB container startup failed
    exit /b 1
)

echo    ChromaDB container is running in background.

REM 4. Wait for ChromaDB server to be ready
echo 4. Waiting for ChromaDB server to be ready...
set /a max_attempts=30
set /a attempt=0

:wait_loop
set /a attempt+=1
curl -s http://localhost:8000/api/v1/heartbeat >nul 2>&1
if not errorlevel 1 (
    echo    ChromaDB server is ready!
    goto server_ready
)

if !attempt! geq !max_attempts! (
    echo    Error: ChromaDB server failed to start.
    echo    Check container logs: docker logs chromadb
    exit /b 1
)

echo    Waiting for ChromaDB server... (!attempt!/!max_attempts!)
timeout /t 2 /nobreak >nul
goto wait_loop

:server_ready

REM 5. Check if required files exist
echo 5. Checking data files and scripts...

set "SKIP_MEDICINE=false"
set "SKIP_MEDICINE_DETAIL=false"
set "SKIP_SENIOR_MEDICINE=false"
set "SKIP_SENIOR_INGREDIENT=false"

if not exist "data\medicine_total_info.csv" (
    echo    Warning: data\medicine_total_info.csv file not found.
    echo    Skipping medicine information data.
    set "SKIP_MEDICINE=true"
) else (
    echo    ✓ data\medicine_total_info.csv file found
)

if not exist "data\medicine_detail_info.csv" (
    echo    Warning: data\medicine_detail_info.csv file not found.
    echo    Skipping medicine detail information data.
    set "SKIP_MEDICINE_DETAIL=true"
) else (
    echo    ✓ data\medicine_detail_info.csv file found
)

if not exist "data\senior_danger_medicine.csv" (
    echo    Warning: data\senior_danger_medicine.csv file not found.
    echo    Skipping senior danger medicine data.
    set "SKIP_SENIOR_MEDICINE=true"
) else (
    echo    ✓ data\senior_danger_medicine.csv file found
)

if not exist "data\senior_danger_ingredient.csv" (
    echo    Warning: data\senior_danger_ingredient.csv file not found.
    echo    Skipping senior danger ingredient data.
    set "SKIP_SENIOR_INGREDIENT=true"
) else (
    echo    ✓ data\senior_danger_ingredient.csv file found
)

if not exist "script\medicine_total_info_ingestor.py" (
    echo    Error: script\medicine_total_info_ingestor.py file not found.
    exit /b 1
)

if not exist "script\medicine_detail_info_ingestor.py" (
    echo    Error: script\medicine_detail_info_ingestor.py file not found.
    exit /b 1
)

if not exist "script\senior_danger_medicine_ingestor.py" (
    echo    Error: script\senior_danger_medicine_ingestor.py file not found.
    exit /b 1
)

if not exist "script\senior_danger_ingredient_ingestor.py" (
    echo    Error: script\senior_danger_ingredient_ingestor.py file not found.
    exit /b 1
)

REM 6. Load medicine information data
if "%SKIP_MEDICINE%" == "false" (
    echo 6. Starting medicine information data collection...
    echo    Running python script\medicine_total_info_ingestor.py...
    
    python script\medicine_total_info_ingestor.py
    if errorlevel 1 (
        echo    Error: Medicine information data collection failed
        echo    ChromaDB container logs: docker logs chromadb
        exit /b 1
    )
    echo    ✓ Medicine information data collection completed
) else (
    echo 6. Skipping medicine information data collection ^(file not found^)
)

REM 7. Load medicine detail information data
if "%SKIP_MEDICINE_DETAIL%" == "false" (
    echo 7. Starting medicine detail information data collection...
    echo    Running python script\medicine_detail_info_ingestor.py...
    
    python script\medicine_detail_info_ingestor.py
    if errorlevel 1 (
        echo    Error: Medicine detail information data collection failed
        echo    ChromaDB container logs: docker logs chromadb
        exit /b 1
    )
    echo    ✓ Medicine detail information data collection completed
) else (
    echo 7. Skipping medicine detail information data collection ^(file not found^)
)

REM 8. Load senior danger medicine data
if "%SKIP_SENIOR_MEDICINE%" == "false" (
    echo 8. Starting senior danger medicine data collection...
    echo    Running python script\senior_danger_medicine_ingestor.py...
    
    python script\senior_danger_medicine_ingestor.py
    if errorlevel 1 (
        echo    Error: Senior danger medicine data collection failed
        echo    ChromaDB container logs: docker logs chromadb
        exit /b 1
    )
    echo    ✓ Senior danger medicine data collection completed
) else (
    echo 8. Skipping senior danger medicine data collection ^(file not found^)
)

REM 9. Load senior danger ingredient data
if "%SKIP_SENIOR_INGREDIENT%" == "false" (
    echo 9. Starting senior danger ingredient data collection...
    echo    Running python script\senior_danger_ingredient_ingestor.py...
    
    python script\senior_danger_ingredient_ingestor.py
    if errorlevel 1 (
        echo    Error: Senior danger ingredient data collection failed
        echo    ChromaDB container logs: docker logs chromadb
        exit /b 1
    )
    echo    ✓ Senior danger ingredient data collection completed
) else (
    echo 9. Skipping senior danger ingredient data collection ^(file not found^)
)

REM 10. Completion message and status check
echo ==========================================
echo   Setup Complete!
echo ==========================================
echo ChromaDB Server: http://localhost:8000
echo ChromaDB Data Path: %CD%\chroma_db_path
echo.
echo Container Status Check:
docker ps -f name=chromadb --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
echo Available Commands:
echo   - Stop container: docker stop chromadb
echo   - Check container logs: docker logs chromadb
echo   - Test ChromaDB API: curl http://localhost:8000/api/v1/heartbeat
echo.
echo Data initialization completed successfully!

pause