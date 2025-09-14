#!/bin/bash

# Simple script to run Cypress tests for the Lineage Viewer
# This script assumes the app is already running

echo "🚀 Running Lineage Viewer Cypress Tests..."

# Check if the app is running
echo "🔍 Checking if app is running..."
if ! curl -s http://localhost:3003 > /dev/null; then
    echo "❌ App is not running on http://localhost:3003"
    echo "Please start the app first with: npm start"
    echo "And make sure the CORS proxy is running with: node cors-proxy.js"
    exit 1
fi

echo "✅ App is running! Running Cypress tests..."

# Run Cypress tests
npm run cypress:run

echo "✅ Tests completed!"
