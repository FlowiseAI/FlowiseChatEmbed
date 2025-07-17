# Building and Running the Flowise Proxy Server

## Building the Docker Image

To build the Docker image separately, run the following command from the root directory of the project:

```bash
docker build -f proxy-server/Dockerfile -t flowise-proxy:latest .
```

This command:
- Uses the Dockerfile located at `proxy-server/Dockerfile`
- Tags the image as `flowise-proxy:latest`
- Uses the current directory (`.`) as the build context

## Running with Docker Compose

After building the image, you can run the container using Docker Compose:

```bash
cd proxy-server
docker-compose up
```

The Docker Compose file now references the pre-built image `flowise-proxy:latest` instead of building it during the compose process.

## Alternative: Build and Run in One Step

If you want to build and run in a single command, you can use:

```bash
docker build -f proxy-server/Dockerfile -t flowise-proxy:latest . && cd proxy-server && docker-compose up
```

## Image Management

To list your built images:
```bash
docker images | grep flowise-proxy
```

To remove the image:
```bash
docker rmi flowise-proxy:latest
```

To rebuild the image (useful after code changes):
```bash
docker build -f proxy-server/Dockerfile -t flowise-proxy:latest . --no-cache