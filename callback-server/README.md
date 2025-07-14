# Flowise OAuth Callback Server

This is a centralized OAuth callback server for the Flowise Chat Embed component. It handles OAuth callbacks from various OAuth providers and securely communicates the authentication results back to the chatbot embedded on different websites.

## Why a Centralized Callback Server?

When embedding the Flowise chatbot on multiple websites, each site would normally need to host its own OAuth callback page. This centralized approach provides several benefits:

- **Single Configuration**: Configure OAuth providers once with a single callback URL
- **Consistent Behavior**: Same callback handling across all embedded instances
- **Security**: Centralized security updates and monitoring
- **Maintenance**: Single point of maintenance for OAuth callback logic

## How It Works

1. **User Authentication**: User clicks "Sign In" in the embedded chatbot
2. **Popup Opens**: A popup window opens pointing to the OAuth provider
3. **OAuth Flow**: User completes authentication with the OAuth provider
4. **Centralized Callback**: OAuth provider redirects to this centralized callback server
5. **Secure Communication**: Callback server sends authentication result back to the parent window
6. **Popup Closes**: Authentication completes and popup closes automatically

## Setup

### Development

1. **Install Dependencies**:
   ```bash
   cd callback-server
   npm install
   ```

2. **Start the Server**:
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

3. **Server will run on**: `http://localhost:3001`

### Production Deployment

Deploy this server to your preferred hosting platform:

- **Heroku**: `git push heroku main`
- **Vercel**: `vercel deploy`
- **AWS/Azure/GCP**: Use your preferred deployment method
- **Docker**: Build and deploy the container

### OAuth Provider Configuration

Configure your OAuth providers to use the centralized callback URL:

**Development**:
```
http://localhost:3001/oauth-callback.html
```

**Production**:
```
https://your-callback-server.com/oauth-callback.html
```

## Security Features

### Origin Validation
- The callback server encodes the origin website URL in the OAuth state parameter
- Only the originating website can receive the authentication result
- Prevents cross-site authentication attacks

### State Parameter Security
- Uses base64 encoding: `base64(csrf_token|origin_url)`
- CSRF token prevents state fixation attacks
- Origin URL ensures secure communication back to the correct website

### CORS Configuration
- Configured to allow cross-origin requests for callback functionality
- Validates origins through the state parameter mechanism

## API Endpoints

### `GET /oauth-callback.html`
The main OAuth callback endpoint that handles authentication results.

**Query Parameters**:
- `code`: Authorization code from OAuth provider
- `state`: Encoded state containing CSRF token and origin URL
- `error`: Error code if authentication failed
- `error_description`: Human-readable error description

### `POST /exchange-token` (Legacy - Not Used)
**Note**: This endpoint was created during development but is not used in the final implementation. Microsoft Azure AD requires Single-Page Application (SPA) tokens to be exchanged directly from the browser, not from a server.

### `GET /health`
Health check endpoint for monitoring.

**Response**:
```json
{
  "status": "ok",
  "service": "flowise-oauth-callback"
}
```

### `GET /`
Service information endpoint.

**Response**:
```json
{
  "service": "Flowise OAuth Callback Server",
  "version": "1.0.0",
  "endpoints": {
    "callback": "/oauth-callback.html",
    "tokenExchange": "/exchange-token",
    "health": "/health"
  }
}
```

## Environment Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)

## Monitoring

Monitor the callback server using:
- Health check endpoint: `/health`
- Server logs for authentication events
- Error tracking for failed authentications

## Microsoft Azure AD / Entra ID Specific Notes

### Single-Page Application (SPA) Requirements
Microsoft Azure AD has specific requirements for Single-Page Applications:

- **Token Exchange**: Must happen directly from the browser, not from a server
- **Discovery Endpoint**: Use `https://login.microsoftonline.com/{tenant-id}/v2.0/.well-known/openid-configuration`
- **Token Endpoint**: Use `https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token`
- **Client Type**: Configure as "Single-page application" in Azure AD app registration

### Important URLs
When configuring Microsoft Azure AD, use these exact endpoint formats:
- **Authority**: `https://login.microsoftonline.com/{tenant-id}/v2.0`
- **Redirect URI**: `http://localhost:3001/oauth-callback.html` (development) or `https://your-callback-server.com/oauth-callback.html` (production)

## Troubleshooting

### Common Issues

1. **Popup Blocked**: Users need to allow popups for the embedding website
2. **CORS Errors**: Ensure the callback server allows the embedding website's origin
3. **State Validation Fails**: Check that the state parameter is properly encoded/decoded
4. **OAuth Provider Errors**: Verify the callback URL is correctly configured in the OAuth provider
5. **Microsoft SPA Errors**: Ensure token exchange happens from browser, not server (see Microsoft Azure AD notes above)

### Debug Mode

The callback page includes visual feedback:
- Loading spinner during processing
- Success message when authentication completes
- Error messages with details when authentication fails

## Integration with Flowise Chat Embed

The main Flowise Chat Embed automatically uses this callback server when configured:

```javascript
// Development - uses local callback server
const authConfig = {
  mode: 'required',
  oauth: {
    clientId: 'your-client-id',
    authority: 'https://your-oauth-provider.com',
    // redirectUri is automatically set to the callback server
    scope: 'openid profile email'
  }
};
```

The chat embed will automatically:
- Use `http://localhost:3001/oauth-callback.html` in development
- Use your production callback server URL in production
- Handle the secure communication with the callback server
- Update the authentication state when the callback completes

## License

MIT License - see the main project LICENSE file.