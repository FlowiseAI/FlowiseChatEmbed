# Docker Setup for Flowise Proxy Server

This document explains how to build and run the Flowise Proxy Server using Docker.

## Prerequisites

- Docker installed on your system
- A valid Flowise instance running
- Configuration files prepared

## Configuration

The proxy server looks for configuration files in the `/proxy-server/config/` directory in the following priority order:

1. `prod.config.json` (highest priority)
2. `local.config.json` 
3. `config.json` (lowest priority)

### Creating Configuration

1. Copy the example configuration:
   ```bash
   cp config/config.json.example config/config.json
   ```

2. Edit the configuration file with your settings:
   - `apiHost`: Your Flowise instance URL
   - `flowiseApiKey`: Your Flowise API key
   - `port`: Port to run the server on (default: 3001)
   - `host`: Host to bind to (**MUST be "0.0.0.0" for Docker**, use "localhost" for local development)
   - `chatflows`: Array of chatflow configurations

**Important**: When running in Docker, the `host` must be set to `"0.0.0.0"` in your config file, not `"localhost"`. This allows the server to accept connections from outside the container.

## Building the Docker Image

From the **root project directory** (not the proxy-server directory), run:

```bash
docker build -f proxy-server/Dockerfile -t flowise-proxy-server .
```

Or from the `proxy-server` directory, run:

```bash
cd .. && docker build -f proxy-server/Dockerfile -t flowise-proxy-server .
```

## Running the Container

### Basic Run

```bash
docker run -d \
  --name flowise-proxy \
  -p 3001:3001 \
  -v $(pwd)/config:/app/config:ro \
  flowise-proxy-server
```

### With Custom Port

```bash
docker run -d \
  --name flowise-proxy \
  -p 8080:3001 \
  -v $(pwd)/config:/app/config:ro \
  flowise-proxy-server
```

### With Environment Variables

```bash
docker run -d \
  --name flowise-proxy \
  -p 3001:3001 \
  -v $(pwd)/config:/app/config:ro \
  -e NODE_ENV=production \
  flowise-proxy-server
```

## Docker Compose Example

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  flowise-proxy:
    build: .
    container_name: flowise-proxy-server
    ports:
      - "3001:3001"
    volumes:
      - ./config:/app/config:ro
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "const http = require('http'); const options = { hostname: 'localhost', port: 3001, path: '/health', timeout: 2000 }; const req = http.request(options, (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); }); req.on('error', () => process.exit(1)); req.end();"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Run with:
```bash
docker-compose up -d
```

## Volume Mounting

The container expects configuration files to be mounted at `/app/config`. This allows you to:

- Update configuration without rebuilding the image
- Use different configurations for different environments
- Keep sensitive data outside the container image

### Example Directory Structure

```
proxy-server/
├── config/
│   ├── config.json              # Default configuration
│   ├── local.config.json        # Local development
│   └── prod.config.json         # Production configuration
├── Dockerfile
├── docker-compose.yml
└── server.js
```

## Exposed Ports

- **3001**: Default application port (configurable via config file)
- **3005**: Alternative port (also exposed for flexibility)

The actual port used depends on your configuration file settings. Make sure to map the correct port when running the container.

## Health Check

The container includes a health check that verifies the `/health` endpoint. You can check the health status with:

```bash
docker ps
# or
docker inspect flowise-proxy --format='{{.State.Health.Status}}'
```

## Logs

View container logs:
```bash
docker logs flowise-proxy
```

Follow logs in real-time:
```bash
docker logs -f flowise-proxy
```

## Troubleshooting

### Configuration Not Found
- Ensure your config directory is properly mounted
- Check that at least one of the three config files exists
- Verify file permissions (container runs as non-root user)

### Port Conflicts
- Change the host port mapping: `-p 8080:3001`
- Or update the port in your configuration file

### Permission Issues
- Ensure the config directory is readable by the container
- The container runs as user `nodejs` (UID 1001)

## Security Notes

- The container runs as a non-root user for security
- Configuration files are mounted read-only
- Sensitive data (API keys) should be in config files, not environment variables
- Use proper firewall rules to restrict access to the proxy server
- CORS is configured to allow all origins (`*`) since the proxy server implements its own domain validation logic
- Domain access control is enforced through the `allowedDomains` configuration in each chatflow

## Development

For development with auto-reload:
```bash
docker run -it --rm \
  -p 3001:3001 \
  -v $(pwd):/app \
  -v $(pwd)/config:/app/config:ro \
  node:22-alpine \
  sh -c "cd /app && npm install && npm run debug-verbose"