# Building and Running the Flowise Proxy Server in the CSU AI VMs

## Production Docker Build

For production deployment, build the Docker image and push to the ACR:

1. Run from the toor of the project (NOT within `proxy-server`)

2. You must be logded into Azure `az login`

3. You must be logged in using credentials for the csuaidevacr registry `az acr login -n csuaidevacr`.

4. build and push the image to the registry:
   ```
   docker buildx build --platform linux/amd64,linux/arm64 -t csuaidevacr.azurecr.io/flowise-proxy:latest -f proxy-server/Dockerfile --push . --no-cache
   ```

## Production docker compose

1. The following folders and their contents need to be copied into the VM repos folders, specifically the `/vm-deploy/docker/` folder.

| source folder | target folder in VM repo |
|---------------|--------------------------|
|/client-bot | /vm-deploy/docker/flowise-proxy/client-bot |
|/config | /vm-deploy/docker/flowise-proxy/config |

2. Copy the `.env` environment variables and their values into the `/vm-deploy/docker/.env` file

2. Copy the `production-docker-compose.yml` service snippet to the VM docker-compose.yml file in `/vm-deploy/docker/`

As with all the `vm-deploy/docker/` folders and files, these should be copied into the VM.


