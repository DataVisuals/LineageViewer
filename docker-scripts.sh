#!/bin/bash

# Docker management scripts for Lineage Viewer

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "Docker Management Script for Lineage Viewer"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev         Start in development mode"
    echo "  prod        Start in production mode"
    echo "  build       Build all images"
    echo "  stop        Stop all services"
    echo "  clean       Clean up containers and images"
    echo "  logs        Show logs"
    echo "  status      Show service status"
    echo "  shell       Access container shell"
    echo "  test        Run tests in container"
    echo "  help        Show this help message"
    echo ""
}

# Function to start development mode
start_dev() {
    print_status "Starting Lineage Viewer in development mode..."
    check_docker
    docker compose up --build
}

# Function to start production mode
start_prod() {
    print_status "Starting Lineage Viewer in production mode..."
    check_docker
    docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
    print_success "Services started in production mode!"
    print_status "Lineage Viewer: http://localhost:3000"
    print_status "CORS Proxy: http://localhost:3005"
}

# Function to build images
build_images() {
    print_status "Building Docker images..."
    check_docker
    docker compose build --no-cache
    print_success "Images built successfully!"
}

# Function to stop services
stop_services() {
    print_status "Stopping all services..."
    docker compose down
    print_success "Services stopped!"
}

# Function to clean up
clean_up() {
    print_status "Cleaning up Docker resources..."
    docker compose down --rmi all --volumes --remove-orphans
    docker system prune -f
    print_success "Cleanup completed!"
}

# Function to show logs
show_logs() {
    print_status "Showing logs (press Ctrl+C to exit)..."
    docker compose logs -f
}

# Function to show status
show_status() {
    print_status "Service Status:"
    docker compose ps
    echo ""
    print_status "Health Checks:"
    docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
}

# Function to access shell
access_shell() {
    print_status "Accessing container shell..."
    echo "Available containers:"
    docker compose ps --format "table {{.Name}}\t{{.Status}}"
    echo ""
    read -p "Enter container name (lineage-viewer or cors-proxy): " container
    docker compose exec $container sh
}

# Function to run tests
run_tests() {
    print_status "Running tests in container..."
    docker compose exec lineage-viewer npm run cypress:run
}

# Main script logic
case "${1:-help}" in
    dev)
        start_dev
        ;;
    prod)
        start_prod
        ;;
    build)
        build_images
        ;;
    stop)
        stop_services
        ;;
    clean)
        clean_up
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    shell)
        access_shell
        ;;
    test)
        run_tests
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
