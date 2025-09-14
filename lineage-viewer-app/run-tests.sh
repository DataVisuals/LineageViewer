#!/bin/bash

# Script to run Cypress tests for the Lineage Viewer
# This script starts the app, runs tests, and cleans up

echo "🚀 Starting Lineage Viewer Cypress Tests..."

# Function to cleanup background processes
cleanup() {
    echo "🧹 Cleaning up background processes..."
    if [ ! -z "$APP_PID" ]; then
        kill $APP_PID 2>/dev/null || true
    fi
    if [ ! -z "$PROXY_PID" ]; then
        kill $PROXY_PID 2>/dev/null || true
    fi
}

# Set up cleanup on script exit
trap cleanup EXIT

# Start the CORS proxy in the background
echo "🌐 Starting CORS proxy..."
cd .. && node cors-proxy.js &
PROXY_PID=$!
cd lineage-viewer-app

# Wait for proxy to start
sleep 2

# Start the React app in the background
echo "⚛️ Starting React app..."
npm start &
APP_PID=$!

# Wait for the app to be ready
echo "⏳ Waiting for app to be ready..."
# Use gtimeout if available (from coreutils), otherwise use a simple loop
if command -v gtimeout >/dev/null 2>&1; then
    gtimeout 60 bash -c 'until curl -s http://localhost:3003 > /dev/null; do sleep 2; done'
elif command -v timeout >/dev/null 2>&1; then
    timeout 60 bash -c 'until curl -s http://localhost:3003 > /dev/null; do sleep 2; done'
else
    # Fallback: simple loop with counter
    COUNTER=0
    while [ $COUNTER -lt 30 ]; do
        if curl -s http://localhost:3003 > /dev/null 2>&1; then
            break
        fi
        sleep 2
        COUNTER=$((COUNTER + 1))
    done
    
    if [ $COUNTER -eq 30 ]; then
        echo "❌ App failed to start within 60 seconds"
        exit 1
    fi
fi

if [ $? -eq 0 ]; then
    echo "✅ App is ready! Running Cypress tests..."
    
    # Run Cypress tests
    npm run cypress:run
    
    echo "✅ Tests completed!"
else
    echo "❌ App failed to start within 60 seconds"
    exit 1
fi
