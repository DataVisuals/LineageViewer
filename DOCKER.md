# Docker Setup for Lineage Viewer

This document provides instructions for running the Lineage Viewer application using Docker.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

### Development Mode

```bash
# Start all services in development mode
docker-compose up

# Or run in background
docker-compose up -d
```

### Production Mode

```bash
# Start all services in production mode
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up

# Or run in background
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Services

### 1. CORS Proxy (`cors-proxy`)
- **Port**: 3005
- **Purpose**: Proxies requests to Marquez API
- **Health Check**: `http://localhost:3005/api/v1/namespaces`

### 2. Lineage Viewer (`lineage-viewer`)
- **Port**: 3000
- **Purpose**: React application
- **Health Check**: `http://localhost:3000`

## Docker Commands

### Build Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build lineage-viewer
docker-compose build cors-proxy
```

### Run Services

```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up lineage-viewer
docker-compose up cors-proxy

# Start in background
docker-compose up -d
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop and remove images
docker-compose down --rmi all
```

### View Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs lineage-viewer
docker-compose logs cors-proxy

# Follow logs in real-time
docker-compose logs -f
```

### Execute Commands

```bash
# Execute command in running container
docker-compose exec lineage-viewer sh
docker-compose exec cors-proxy sh

# Run one-time command
docker-compose run lineage-viewer npm test
```

## Environment Variables

### CORS Proxy
- `NODE_ENV`: Environment (development/production)

### Lineage Viewer
- `NODE_ENV`: Environment (development/production)
- `REACT_APP_API_URL`: API URL (default: http://cors-proxy:3005)

## Health Checks

Both services include health checks:

- **CORS Proxy**: Checks if API endpoint responds
- **Lineage Viewer**: Checks if web server responds

## Development vs Production

### Development Mode
- Uses `docker-compose.override.yml` automatically
- Mounts source code as volumes for hot reloading
- Runs `npm start` for development server

### Production Mode
- Uses `docker-compose.prod.yml`
- Builds optimized production bundle
- Uses `serve` to serve static files
- Includes health checks and restart policies

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :3005
   
   # Kill the process
   kill -9 <PID>
   ```

2. **Build Failures**
   ```bash
   # Clean build
   docker-compose build --no-cache
   
   # Remove all containers and images
   docker-compose down --rmi all
   docker system prune -a
   ```

3. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Debugging

```bash
# Check container status
docker-compose ps

# Check container logs
docker-compose logs -f lineage-viewer

# Access container shell
docker-compose exec lineage-viewer sh

# Check health status
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

## Customization

### Custom Environment Variables

Create a `.env` file:

```bash
# .env
NODE_ENV=production
REACT_APP_API_URL=http://localhost:3005
```

### Custom Ports

Modify `docker-compose.yml`:

```yaml
services:
  lineage-viewer:
    ports:
      - "8080:3000"  # Custom port
```

## Integration with Marquez

To use with a local Marquez instance:

1. Start Marquez services
2. Update `REACT_APP_API_URL` to point to Marquez
3. Or use the included CORS proxy

## Security Considerations

- The CORS proxy is configured for development use
- For production, consider using a proper reverse proxy
- Ensure proper network isolation
- Use secrets management for sensitive data

## Performance Optimization

- Use multi-stage builds for smaller images
- Enable Docker BuildKit for faster builds
- Use `.dockerignore` to exclude unnecessary files
- Consider using Alpine Linux base images

## Monitoring

```bash
# Monitor resource usage
docker stats

# Check container health
docker-compose ps

# View detailed logs
docker-compose logs --tail=100 -f
```

