# Flowise Chat Embed Proxy Server

A secure proxy server for the Flowise Chat Embed widget with integrated OAuth/OIDC authentication support.

## Configuration

The proxy server uses a JSON-based configuration system with environment-specific support.

### Configuration File Priority

The server looks for configuration files in this order:
1. `prod.config.json` (production)
2. `local.config.json` (local development)
3. `config.json` (default/fallback)

If none of these files are found, the server will exit with an error.

### Configuration Structure

```json
{
  "apiHost": "https://your-flowise-instance.com",
  "flowiseApiKey": "your-flowise-api-key",
  "oauthApiKey": "your-oauth-api-key",
  "port": 3001,
  "host": "localhost",
  "chatflows": [
    {
      "identifier": "chatflow_1",
      "chatflowId": "uuid-of-your-chatflow",
      "allowedDomains": [
        "https://yourdomain.com",
        "http://localhost:5678"
      ],
      "oauth": {
        "clientId": "your-oauth-client-id",
        "authority": "https://login.microsoftonline.com/tenant-id/v2.0",
        "redirectUri": "https://yourdomain.com/oauth-callback.html",
        "scope": "openid profile email",
        "responseType": "code",
        "prompt": "select_account"
      }
    }
  ]
}
```

### Configuration Fields

#### Root Level
- `apiHost` (required): URL of your Flowise instance
- `flowiseApiKey` (required): API key for Flowise authentication
- `oauthApiKey` (optional): API key for OAuth configuration endpoint security
- `port` (optional): Server port (default: 3001)
- `host` (optional): Server host (default: localhost)

#### Chatflow Configuration
- `identifier` (required): Unique identifier for the chatflow
- `chatflowId` (required): UUID of the Flowise chatflow
- `allowedDomains` (required): Array of domains allowed to access this chatflow
- `oauth` (optional): OAuth/OIDC configuration for this chatflow

#### OAuth Configuration
- `clientId` (required): OAuth client ID
- `authority` (required): OIDC provider authority URL
- `redirectUri` (optional): OAuth callback URL (default: http://localhost:3005/oauth-callback.html)
- `scope` (optional): OAuth scopes (default: "openid profile email")
- `responseType` (optional): OAuth response type (default: "code")
- `prompt` (optional): OAuth prompt parameter (default: "select_account")

## Setup Instructions

### 1. Create Configuration File

Choose the appropriate configuration file for your environment:

#### For Local Development
Create `local.config.json`:
```bash
cp config.json local.config.json
# Edit local.config.json with your local settings
```

#### For Production
Create `prod.config.json`:
```bash
cp prod.config.json.example prod.config.json
# Edit prod.config.json with your production settings
```

### 2. Configure OAuth Providers

#### Microsoft Azure AD
```json
{
  "oauth": {
    "clientId": "your-azure-client-id",
    "authority": "https://login.microsoftonline.com/your-tenant-id/v2.0",
    "redirectUri": "https://yourdomain.com/oauth-callback.html",
    "scope": "openid profile email"
  }
}
```

#### Google OAuth
```json
{
  "oauth": {
    "clientId": "your-app.apps.googleusercontent.com",
    "authority": "https://accounts.google.com",
    "redirectUri": "https://yourdomain.com/oauth-callback.html",
    "scope": "openid profile email"
  }
}
```

#### Auth0
```json
{
  "oauth": {
    "clientId": "your-auth0-client-id",
    "authority": "https://your-domain.auth0.com",
    "redirectUri": "https://yourdomain.com/oauth-callback.html",
    "scope": "openid profile email"
  }
}
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Server

```bash
node server.js
```

## API Endpoints

### OAuth Configuration
- `GET /api/auth/config/:identifier` - Get OAuth configuration for a chatflow
  - Headers: `x-oauth-api-key: your-oauth-api-key`
  - Returns: OAuth configuration object

### Chatflow Endpoints
- `POST /api/v1/prediction/:identifier` - Send message to chatflow
- `POST /api/v1/openai-assistants-file/:identifier` - Upload file to chatflow
- `GET /api/v1/get-upload-file` - Download uploaded file
- `GET /api/v1/chatflows/:identifier/embed` - Get embed script

### Utility Endpoints
- `GET /health` - Health check
- `GET /oauth-callback.html` - OAuth callback page
- `GET /web.js` - Chat widget JavaScript

## Security Features

### Domain Validation
Each chatflow configuration includes an `allowedDomains` array that restricts which domains can access the chatflow.

### API Key Protection
The OAuth configuration endpoint can be protected with an API key specified in the `oauthApiKey` configuration field.

### Environment Isolation
Different configuration files allow for environment-specific settings without exposing sensitive data.

## Deployment

### Docker Deployment

```dockerfile
FROM node:18-slim
WORKDIR /app
COPY proxy-server/ ./
RUN npm install --production
EXPOSE 3001
CMD ["node", "server.js"]
```

### Environment Variables Override

You can override configuration values using environment variables:
- `PORT` - Override the port
- `HOST` - Override the host
- `NODE_ENV` - Set to 'production' for production mode

### Build Integration

The main project's build process automatically copies the built `web.js` file to the proxy server's `public/` folder:

```bash
npm run build  # Builds and copies web.js
```

## Troubleshooting

### Configuration Issues
- **"No configuration found"**: Create one of the required config files
- **"Invalid chatflow configuration"**: Check that identifier and chatflowId are present
- **"Chatflow not found"**: Verify the identifier matches your configuration

### OAuth Issues
- **"OAuth configuration not found"**: Ensure the chatflow has an oauth section
- **"Invalid API key"**: Check the x-oauth-api-key header matches oauthApiKey config

### Domain Issues
- **"Access Denied"**: Add the requesting domain to allowedDomains array
- **CORS errors**: Ensure the domain is properly configured

### Debug Mode

Set `NODE_ENV=development` to see detailed logging:
```bash
NODE_ENV=development node server.js
```

## Migration from Environment Variables

If migrating from the previous .env-based configuration:

1. Create a new JSON configuration file
2. Move environment variables to the appropriate JSON fields:
   - `API_HOST` → `apiHost`
   - `FLOWISE_API_KEY` → `flowiseApiKey`
   - `OAUTH_API_KEY` → `oauthApiKey`
   - `OAUTH_chatflow_1_CLIENT_ID` → `chatflows[0].oauth.clientId`
   - etc.
3. Test the new configuration
4. Remove the old .env file

## Example Configurations

See the included example files:
- `config.json` - Default configuration with examples
- `local.config.json` - Local development configuration
- `prod.config.json.example` - Production configuration template