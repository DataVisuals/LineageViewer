#!/bin/bash

echo "🚀 Starting Lineage Viewer System..."

# Check if Marquez is running
if ! curl -s http://localhost:8080/api/v1/namespaces > /dev/null; then
    echo "📦 Starting Marquez..."
    docker compose -f docker-compose-column-lineage.yml up -d
    
    echo "⏳ Waiting for Marquez to start..."
    sleep 10
    
    # Load lineage data
    echo "📊 Loading lineage data..."
    python working_comprehensive_loader.py
else
    echo "✅ Marquez is already running"
fi

# Start React app
echo "🎨 Starting React Lineage Viewer on port 3003..."
cd lineage-viewer-app
PORT=3003 npm start
