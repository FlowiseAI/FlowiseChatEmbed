# Server-Side OAuth Configuration

This document explains how to configure OAuth authentication on the server-side for enhanced security and centralized management.

## Overview

Instead of including OAuth configuration in client-side JavaScript, you can now store OAuth settings securely on the proxy server. This approach offers several benefits:

- **Centralized Management**: Update OAuth settings without redeploying client code
- **Environment-Specific Configs**: Different settings for dev/staging/prod
- **Reduced Client Exposure**: OAuth details are fetched securely from the server

## Setup Instructions

### 1. Configure Proxy Server Environment

Add OAuth configuration to your `proxy-server/.env` file:

```bash
# OAuth API Key for secure config retrieval
OAUTH_API_KEY=your-secure-random-api-key-here

# OAuth configuration for chatflow_1
OAUTH_chatflow_1_CLIENT_ID=your-client-id
OAUTH_chatflow_1_AUTHORITY=https://login.microsoftonline.com/tenant-id/v2.0
OAUTH_chatflow_1_REDIRECT_URI=http://localhost:3005/oauth-callback.html
OAUTH_chatflow_1_SCOPE=openid profile email
OAUTH_chatflow_1_RESPONSE_TYPE=code
OAUTH_chatflow_1_PROMPT=select_account

# Add more chatflows as needed
OAUTH_chatflow_2_CLIENT_ID=another-client-id
OAUTH_chatflow_2_AUTHORITY=https://accounts.google.com
# ... etc
```

### 2. Update Client Configuration

#### Option A: Use Server Mode
Set authentication mode to 'server' in your client config:

```javascript
export const authConfig = {
  mode: 'server', // Fetch config from server
  // Other UI settings...
  promptConfig: {
    title: 'Sign In to Continue',
    message: 'Please sign in to access personalized chat features.',
    loginButtonText: 'Sign In',
    skipButtonText: 'Continue as Guest'
  }
};
```

#### Option B: Remove Client Config Entirely
Simply don't provide any authentication config:

```javascript
Chatbot.init({
  chatflowid: 'chatflow_1',
  apiHost: 'http://localhost:3001',
  // authentication: undefined, // Will auto-fetch from server
  theme: { /* your theme */ }
});
```

### 3. Security Features

#### Encrypted API Key
The client includes an encrypted API key that is decrypted at runtime to authenticate with the server's OAuth config endpoint.

#### Domain Validation
The proxy server validates requests based on configured allowed domains for each chatflow.

#### Rate Limiting
The OAuth config endpoint can be rate-limited to prevent abuse.

## API Endpoint

The proxy server exposes the following endpoint:

```
GET /api/auth/config/:chatflowId
Headers:
  x-oauth-api-key: <encrypted-api-key>

Response:
{
  "mode": "optional",
  "oauth": {
    "clientId": "your-client-id",
    "authority": "https://login.microsoftonline.com/tenant-id/v2.0",
    "redirectUri": "http://localhost:3005/oauth-callback.html",
    "scope": "openid profile email",
    "responseType": "code",
    "prompt": "select_account"
  },
  "promptConfig": {
    "title": "Sign In to Continue",
    "message": "Please sign in to access personalized chat features and chat history.",
    "loginButtonText": "Sign In",
    "skipButtonText": "Continue as Guest"
  },
  "tokenStorageKey": "flowise_tokens_chatflow_1",
  "autoRefresh": true,
  "refreshThreshold": 300
}
```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `OAUTH_API_KEY` | API key for secure config access | Yes |
| `OAUTH_{id}_CLIENT_ID` | OAuth client ID for chatflow | Yes |
| `OAUTH_{id}_AUTHORITY` | OIDC provider authority URL | Yes |
| `OAUTH_{id}_REDIRECT_URI` | OAuth callback URL | No* |
| `OAUTH_{id}_SCOPE` | OAuth scopes | No* |
| `OAUTH_{id}_RESPONSE_TYPE` | OAuth response type | No* |
| `OAUTH_{id}_PROMPT` | OAuth prompt parameter | No* |

*Default values are provided for optional variables.

## Migration from Client-Side Config

1. **Backup existing config**: Save your current client-side OAuth settings
2. **Add server config**: Set up environment variables on the proxy server
3. **Update client code**: Change mode to 'server' or remove auth config
4. **Test thoroughly**: Verify authentication flow works correctly
5. **Deploy**: Update both server and client deployments

## Troubleshooting

### Common Issues

1. **"OAuth configuration not found"**
   - Check that environment variables are set correctly
   - Verify chatflow identifier matches exactly
   - Ensure proxy server has been restarted after config changes

2. **"Invalid API key"**
   - Verify OAUTH_API_KEY is set in server environment
   - Check that client is using correct encrypted key

3. **Authentication not working**
   - Check browser console for fetch errors
   - Verify proxy server is accessible from client
   - Ensure CORS is configured correctly

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will show OAuth configuration loading in the proxy server console.

## Security Considerations

- **API Key Security**: The encrypted API key provides basic protection but should be rotated regularly
- **HTTPS**: Always use HTTPS in production
- **Environment Isolation**: Use different OAuth configs for different environments
- **Access Logging**: Monitor access to the OAuth config endpoint
- **Regular Updates**: Keep OAuth provider settings up to date

## Example Configurations

### Microsoft Azure AD
```bash
OAUTH_chatflow_1_CLIENT_ID=12345678-1234-1234-1234-123456789012
OAUTH_chatflow_1_AUTHORITY=https://login.microsoftonline.com/your-tenant-id/v2.0
OAUTH_chatflow_1_SCOPE=openid profile email
```

### Google OAuth
```bash
OAUTH_chatflow_2_CLIENT_ID=your-app.apps.googleusercontent.com
OAUTH_chatflow_2_AUTHORITY=https://accounts.google.com
OAUTH_chatflow_2_SCOPE=openid profile email
```

### Auth0
```bash
OAUTH_chatflow_3_CLIENT_ID=your-auth0-client-id
OAUTH_chatflow_3_AUTHORITY=https://your-domain.auth0.com
OAUTH_chatflow_3_SCOPE=openid profile email

## Deployment

### Build Process

The build process has been optimized for containerized deployments:

1. **Build and Copy**: The `npm run build` command now automatically copies the built `web.js` file to `proxy-server/public/web.js`
2. **Self-Contained**: The proxy server no longer needs access to the `dist/` folder from the main repository
3. **Container-Ready**: The proxy server can be deployed independently with all required files

### Build Commands

```bash
# Build and copy web.js to proxy server
npm run build

# Copy web.js manually (if needed)
npm run copy-web-js
```

### Container Deployment

When deploying in a container:

1. **Build the project**: Run `npm run build` to generate and copy `web.js`
2. **Copy proxy server**: Copy the entire `proxy-server/` folder to your container
3. **Set environment variables**: Configure OAuth settings in the container environment
4. **Start server**: Run `node server.js` from the proxy-server directory

The proxy server will serve `web.js` from its local `public/` folder, eliminating the need for the main repository's `dist/` folder.

### File Structure in Deployment

```
proxy-server/
├── server.js
├── package.json
├── .env
└── public/
    ├── web.js          # Copied from dist/web.js during build
    ├── oauth-callback.html
    └── index.html
```

### Docker Example

```dockerfile
# Build stage
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage
FROM node:18-slim
WORKDIR /app
COPY --from=builder /app/proxy-server ./
RUN npm install --production
EXPOSE 3001
CMD ["node", "server.js"]
```