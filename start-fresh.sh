#!/bin/bash

echo "🚀 Starting Fresh Lineage Viewer System..."

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose-column-lineage.yml down

# Start Marquez
echo "📦 Starting Marquez..."
docker compose -f docker-compose-column-lineage.yml up -d

# Wait for Marquez to be ready
echo "⏳ Waiting for Marquez to start..."
sleep 15

# Check if Marquez is ready
echo "🔍 Checking Marquez status..."
if curl -s http://localhost:3004/api/v1/namespaces > /dev/null; then
    echo "✅ Marquez is ready"
else
    echo "❌ Marquez not ready, waiting longer..."
    sleep 10
fi

# Load lineage data
echo "📊 Loading lineage data..."
source venv/bin/activate
python working_comprehensive_loader.py

# Start CORS proxy
echo "🔗 Starting CORS proxy on port 3005..."
node cors-proxy.js &
CORS_PID=$!

# Wait for proxy to start
sleep 3

# Start React app
echo "🎨 Starting React Lineage Viewer on port 3003..."
cd lineage-viewer-app
PORT=3003 npm start
