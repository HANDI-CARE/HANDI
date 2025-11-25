#!/bin/bash

# ChromaDB and Data Initialization Auto Setup Script
# Usage: ./setup_chromadb.sh

set -e  # Exit script on error

echo "=========================================="
echo "  ChromaDB and Data Initialization Start"
echo "=========================================="

# Navigate to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Current working directory: $(pwd)"

# 1. Check and cleanup existing ChromaDB containers
echo "1. Checking and cleaning up existing ChromaDB containers..."
if docker ps -q -f name=chromadb | grep -q .; then
    echo "   Stopping existing ChromaDB container..."
    docker stop chromadb
fi

if docker ps -a -q -f name=chromadb | grep -q .; then
    echo "   Removing existing ChromaDB container..."
    docker rm chromadb
fi

# 2. Create ChromaDB volume directory
echo "2. Creating ChromaDB volume directory..."
CHROMA_DB_PATH="./chroma_db_path"
mkdir -p "$CHROMA_DB_PATH"
echo "   ChromaDB data storage path: $(realpath $CHROMA_DB_PATH)"

# 3. Run ChromaDB container
echo "3. Starting ChromaDB container..."
docker run -d \
    --rm \
    --name chromadb \
    -p 8000:8000 \
    -v "$(realpath $CHROMA_DB_PATH):/chroma/chroma" \
    -e IS_PERSISTENT=TRUE \
    -e ANONYMIZED_TELEMETRY=TRUE \
    chromadb/chroma:latest

echo "   ChromaDB container is running in background."

# 4. Wait for ChromaDB server to be ready
echo "4. Waiting for ChromaDB server to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
        echo "   ChromaDB server is ready!"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "   Waiting for ChromaDB server... ($attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "   Error: ChromaDB server failed to start."
    echo "   Check container logs: docker logs chromadb"
    exit 1
fi

# 5. Check if required files exist
echo "5. Checking data files and scripts..."

# Check CSV files
if [ ! -f "data/medicine_total_info.csv" ]; then
    echo "   Warning: data/medicine_total_info.csv file not found."
    echo "   Skipping medicine information data."
    SKIP_MEDICINE=true
else
    echo "   ✓ data/medicine_total_info.csv file found"
    SKIP_MEDICINE=false
fi

if [ ! -f "data/medicine_detail_info.csv" ]; then
    echo "   Warning: data/medicine_detail_info.csv file not found."
    echo "   Skipping medicine detail information data."
    SKIP_MEDICINE_DETAIL=true
else
    echo "   ✓ data/medicine_detail_info.csv file found"
    SKIP_MEDICINE_DETAIL=false
fi

if [ ! -f "data/senior_danger_medicine.csv" ]; then
    echo "   Warning: data/senior_danger_medicine.csv file not found."
    echo "   Skipping senior danger medicine data."
    SKIP_SENIOR_MEDICINE=true
else
    echo "   ✓ data/senior_danger_medicine.csv file found"
    SKIP_SENIOR_MEDICINE=false
fi

if [ ! -f "data/senior_danger_ingredient.csv" ]; then
    echo "   Warning: data/senior_danger_ingredient.csv file not found."
    echo "   Skipping senior danger ingredient data."
    SKIP_SENIOR_INGREDIENT=true
else
    echo "   ✓ data/senior_danger_ingredient.csv file found"
    SKIP_SENIOR_INGREDIENT=false
fi

# Check Python script files
if [ ! -f "script/medicine_total_info_ingestor.py" ]; then
    echo "   Error: script/medicine_total_info_ingestor.py file not found."
    exit 1
fi

if [ ! -f "script/medicine_detail_info_ingestor.py" ]; then
    echo "   Error: script/medicine_detail_info_ingestor.py file not found."
    exit 1
fi

if [ ! -f "script/senior_danger_medicine_ingestor.py" ]; then
    echo "   Error: script/senior_danger_medicine_ingestor.py file not found."
    exit 1
fi

if [ ! -f "script/senior_danger_ingredient_ingestor.py" ]; then
    echo "   Error: script/senior_danger_ingredient_ingestor.py file not found."
    exit 1
fi

# 6. Load medicine information data
if [ "$SKIP_MEDICINE" = false ]; then
    echo "6. Starting medicine information data collection..."
    echo "   Running python script/medicine_total_info_ingestor.py..."
    
    if python script/medicine_total_info_ingestor.py; then
        echo "   ✓ Medicine information data collection completed"
    else
        echo "   Error: Medicine information data collection failed"
        echo "   ChromaDB container logs: docker logs chromadb"
        exit 1
    fi
else
    echo "6. Skipping medicine information data collection (file not found)"
fi

# 7. Load medicine detail information data
if [ "$SKIP_MEDICINE_DETAIL" = false ]; then
    echo "7. Starting medicine detail information data collection..."
    echo "   Running python script/medicine_detail_info_ingestor.py..."
    
    if python script/medicine_detail_info_ingestor.py; then
        echo "   ✓ Medicine detail information data collection completed"
    else
        echo "   Error: Medicine detail information data collection failed"
        echo "   ChromaDB container logs: docker logs chromadb"
        exit 1
    fi
else
    echo "7. Skipping medicine detail information data collection (file not found)"
fi

# 8. Load senior danger medicine data
if [ "$SKIP_SENIOR_MEDICINE" = false ]; then
    echo "8. Starting senior danger medicine data collection..."
    echo "   Running python script/senior_danger_medicine_ingestor.py..."
    
    if python script/senior_danger_medicine_ingestor.py; then
        echo "   ✓ Senior danger medicine data collection completed"
    else
        echo "   Error: Senior danger medicine data collection failed"
        echo "   ChromaDB container logs: docker logs chromadb"
        exit 1
    fi
else
    echo "8. Skipping senior danger medicine data collection (file not found)"
fi

# 9. Load senior danger ingredient data
if [ "$SKIP_SENIOR_INGREDIENT" = false ]; then
    echo "9. Starting senior danger ingredient data collection..."
    echo "   Running python script/senior_danger_ingredient_ingestor.py..."
    
    if python script/senior_danger_ingredient_ingestor.py; then
        echo "   ✓ Senior danger ingredient data collection completed"
    else
        echo "   Error: Senior danger ingredient data collection failed"
        echo "   ChromaDB container logs: docker logs chromadb"
        exit 1
    fi
else
    echo "9. Skipping senior danger ingredient data collection (file not found)"
fi

# 10. Completion message and status check
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo "ChromaDB Server: http://localhost:8000"
echo "ChromaDB Data Path: $(realpath $CHROMA_DB_PATH)"
echo ""
echo "Container Status Check:"
docker ps -f name=chromadb --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Available Commands:"
echo "  - Stop container: docker stop chromadb"
echo "  - Check container logs: docker logs chromadb"
echo "  - Test ChromaDB API: curl http://localhost:8000/api/v1/heartbeat"
echo ""
echo "Data initialization completed successfully!"