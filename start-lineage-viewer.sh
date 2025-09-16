#!/bin/bash

# Lineage Viewer - Unified Start/Stop Script
# Provides options for different startup methods: npm, docker, or both

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}[LINEAGE VIEWER]${NC} $1"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        return 1
    fi
    return 0
}

# Function to check if Marquez is running
check_marquez() {
    if curl -s http://localhost:3004/api/v1/namespaces > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start CORS proxy
start_cors_proxy() {
    if check_port 3005; then
        print_warning "CORS proxy is already running on port 3005"
        return 0
    fi
    
    print_status "Starting CORS proxy on port 3005..."
    node cors-proxy.js &
    CORS_PID=$!
    echo $CORS_PID > .cors-proxy.pid
    
    # Wait for it to start
    sleep 2
    if check_port 3005; then
        print_success "CORS proxy started successfully (PID: $CORS_PID)"
        return 0
    else
        print_error "Failed to start CORS proxy"
        return 1
    fi
}

# Function to stop CORS proxy
stop_cors_proxy() {
    if [ -f .cors-proxy.pid ]; then
        local pid=$(cat .cors-proxy.pid)
        if kill -0 $pid 2>/dev/null; then
            print_status "Stopping CORS proxy (PID: $pid)..."
            kill $pid
            rm .cors-proxy.pid
            print_success "CORS proxy stopped"
        else
            print_warning "CORS proxy PID file exists but process is not running"
            rm .cors-proxy.pid
        fi
    else
        print_status "Stopping any running CORS proxy processes..."
        pkill -f "node.*cors-proxy" 2>/dev/null || true
        print_success "CORS proxy stopped"
    fi
}

# Function to start React app with npm
start_react_npm() {
    if check_port 3000; then
        print_warning "React app is already running on port 3000"
        return 0
    fi
    
    print_status "Starting React app with npm..."
    cd lineage-viewer-app
    PORT=3000 npm start &
    REACT_PID=$!
    echo $REACT_PID > ../.react-app.pid
    cd ..
    
    # Wait for it to start
    print_status "Waiting for React app to start..."
    local count=0
    while [ $count -lt 30 ]; do
        if check_port 3000; then
            print_success "React app started successfully (PID: $REACT_PID)"
            return 0
        fi
        sleep 2
        count=$((count + 1))
    done
    
    print_error "React app failed to start within 60 seconds"
    return 1
}

# Function to stop React app
stop_react() {
    if [ -f .react-app.pid ]; then
        local pid=$(cat .react-app.pid)
        if kill -0 $pid 2>/dev/null; then
            print_status "Stopping React app (PID: $pid)..."
            kill $pid
            rm .react-app.pid
            print_success "React app stopped"
        else
            print_warning "React app PID file exists but process is not running"
            rm .react-app.pid
        fi
    else
        print_status "Stopping any running React processes..."
        pkill -f "npm.*start" 2>/dev/null || true
        pkill -f "react-scripts" 2>/dev/null || true
        print_success "React app stopped"
    fi
}

# Function to start with Docker
start_docker() {
    if ! check_docker; then
        return 1
    fi
    
    print_status "Starting with Docker..."
    docker compose up --build -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    local count=0
    while [ $count -lt 30 ]; do
        if check_port 3000; then
            print_success "Docker services started successfully"
            return 0
        fi
        sleep 2
        count=$((count + 1))
    done
    
    print_error "Docker services failed to start within 60 seconds"
    return 1
}

# Function to stop Docker services
stop_docker() {
    if ! check_docker; then
        print_warning "Docker is not running, skipping Docker stop"
        return 0
    fi
    
    print_status "Stopping Docker services..."
    docker compose down
    print_success "Docker services stopped"
}

# Function to show status
show_status() {
    print_header "Service Status"
    echo ""
    
    # Check Marquez
    if check_marquez; then
        print_success "Marquez API: Running (http://localhost:3004)"
    else
        print_error "Marquez API: Not running"
    fi
    
    # Check CORS proxy
    if check_port 3005; then
        print_success "CORS Proxy: Running (http://localhost:3005)"
    else
        print_error "CORS Proxy: Not running"
    fi
    
    # Check React app
    if check_port 3000; then
        print_success "React App: Running (http://localhost:3000)"
    else
        print_error "React App: Not running"
    fi
    
    # Check Docker
    if check_docker; then
        print_success "Docker: Available"
        if docker compose ps | grep -q "Up"; then
            print_success "Docker Services: Running"
        else
            print_warning "Docker Services: Not running"
        fi
    else
        print_error "Docker: Not available"
    fi
    
    echo ""
}

# Function to show help
show_help() {
    print_header "Lineage Viewer - Unified Start/Stop Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start [method]    Start the application"
    echo "  stop              Stop all services"
    echo "  restart [method]  Restart the application"
    echo "  status            Show service status"
    echo "  help              Show this help message"
    echo ""
    echo "Start Methods:"
    echo "  npm               Start with npm (React app + CORS proxy on host)"
    echo "  docker            Start with Docker (React app in container + CORS proxy on host)"
    echo "  both              Start both npm and Docker (for testing)"
    echo ""
    echo "Examples:"
    echo "  $0 start npm      # Start with npm"
    echo "  $0 start docker   # Start with Docker"
    echo "  $0 stop           # Stop everything"
    echo "  $0 status         # Check status"
    echo ""
    echo "Prerequisites:"
    echo "  - Marquez API running on port 3004"
    echo "  - Node.js and npm installed"
    echo "  - Docker Desktop running (for Docker method)"
    echo ""
}

# Function to start services
start_services() {
    local method=${1:-"npm"}
    
    print_header "Starting Lineage Viewer ($method method)"
    echo ""
    
    # Check prerequisites
    if ! check_marquez; then
        print_error "Marquez API is not running on port 3004"
        print_status "Please start Marquez first:"
        print_status "  docker compose up -d"
        return 1
    fi
    
    # Start CORS proxy
    start_cors_proxy
    
    case $method in
        "npm")
            start_react_npm
            ;;
        "docker")
            start_docker
            ;;
        "both")
            start_react_npm
            start_docker
            ;;
        *)
            print_error "Unknown start method: $method"
            print_status "Available methods: npm, docker, both"
            return 1
            ;;
    esac
    
    echo ""
    print_success "Lineage Viewer started successfully!"
    print_status "Access the application at: http://localhost:3000"
    print_status "API health check: http://localhost:3005/health"
    echo ""
}

# Function to stop all services
stop_all() {
    print_header "Stopping Lineage Viewer"
    echo ""
    
    stop_react
    stop_docker
    stop_cors_proxy
    
    print_success "All services stopped"
    echo ""
}

# Function to restart services
restart_services() {
    local method=${1:-"npm"}
    
    print_header "Restarting Lineage Viewer ($method method)"
    echo ""
    
    stop_all
    sleep 2
    start_services $method
}

# Main script logic
case "$1" in
    "start")
        start_services $2
        ;;
    "stop")
        stop_all
        ;;
    "restart")
        restart_services $2
        ;;
    "status")
        show_status
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    "")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac