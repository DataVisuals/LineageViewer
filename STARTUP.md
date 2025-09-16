# Lineage Viewer - Startup Guide

## Quick Start

Use the unified startup script for easy management:

```bash
# Show all options
./start-lineage-viewer.sh help

# Start with npm (recommended for development)
./start-lineage-viewer.sh start npm

# Start with Docker (recommended for production)
./start-lineage-viewer.sh start docker

# Check status
./start-lineage-viewer.sh status

# Stop everything
./start-lineage-viewer.sh stop
```

## Prerequisites

1. **Marquez API** - Must be running on port 3004
2. **Node.js & npm** - For npm method
3. **Docker Desktop** - For Docker method

## Startup Methods

### 🚀 NPM Method (Development)
- **React App**: Runs on host with hot reloading
- **CORS Proxy**: Runs on host
- **Best for**: Development, debugging, code changes

```bash
./start-lineage-viewer.sh start npm
```

### 🐳 Docker Method (Production)
- **React App**: Runs in Docker container
- **CORS Proxy**: Runs on host
- **Best for**: Production, testing, deployment

```bash
./start-lineage-viewer.sh start docker
```

### 🔄 Both Methods (Testing)
- **React App**: Both npm and Docker versions
- **CORS Proxy**: Single instance on host
- **Best for**: Testing compatibility

```bash
./start-lineage-viewer.sh start both
```

## Service URLs

- **Lineage Viewer**: http://localhost:3000
- **API Health Check**: http://localhost:3005/health
- **Marquez API**: http://localhost:3004
- **Marquez Web UI**: http://localhost:3001

## Troubleshooting

### Check Status
```bash
./start-lineage-viewer.sh status
```

### Restart Services
```bash
./start-lineage-viewer.sh restart npm
./start-lineage-viewer.sh restart docker
```

### Stop Everything
```bash
./start-lineage-viewer.sh stop
```

### Common Issues

1. **Marquez not running**: Start with `docker compose up -d`
2. **Port conflicts**: Check what's using ports 3000, 3004, 3005
3. **Docker not running**: Start Docker Desktop
4. **Permission denied**: Run `chmod +x start-lineage-viewer.sh`

## Manual Startup (Alternative)

If you prefer manual control:

```bash
# Start Marquez
docker compose up -d

# Start CORS proxy
node cors-proxy.js &

# Start React app (npm)
cd lineage-viewer-app && npm start

# OR Start React app (Docker)
docker compose up -d
```

## Development Workflow

1. **Start Marquez**: `docker compose up -d`
2. **Start Lineage Viewer**: `./start-lineage-viewer.sh start npm`
3. **Make changes**: Edit code in `lineage-viewer-app/src/`
4. **View changes**: Refresh browser at http://localhost:3000
5. **Stop when done**: `./start-lineage-viewer.sh stop`

