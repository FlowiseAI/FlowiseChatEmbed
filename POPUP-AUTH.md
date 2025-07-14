# Popup OAuth Authentication

The Flowise Chat Embed now uses popup windows for OAuth authentication with a centralized callback server, providing a better user experience and easier deployment.

## Centralized Callback Server

Instead of requiring each website to host its own OAuth callback page, Flowise uses a centralized callback server that handles OAuth callbacks for all embedded chatbot instances.

### Benefits:
- **Single OAuth Configuration**: Configure your OAuth provider once with a single callback URL
- **Easier Deployment**: No need to host callback pages on each website
- **Consistent Security**: Centralized security updates and monitoring
- **Cross-Domain Support**: Works across different domains and subdomains

## Quick Setup

### 1. Deploy the Callback Server

**Development**:
```bash
cd callback-server
npm install
npm start
# Server runs on http://localhost:3001
```

**Production**: Deploy the `callback-server` folder to your hosting platform

### 2. Configure OAuth Provider

Add the centralized callback URL to your OAuth provider:
- **Development**: `http://localhost:3001/oauth-callback.html`
- **Production**: `https://your-callback-server.com/oauth-callback.html`

### 3. No Code Changes Required

The chatbot automatically uses the centralized callback server based on your environment.

## How It Works

- **Better UX**: Users stay on your page while authenticating in a popup
- **Automatic Handling**: Popup opens, handles OAuth flow, and closes automatically
- **Secure Communication**: Uses `postMessage` for secure parent-popup communication
- **Error Handling**: Gracefully handles popup blocking and authentication errors

## OAuth Provider Examples

### Google OAuth 2.0
```
Authorized redirect URIs:
- https://your-callback-server.com/oauth-callback.html
- http://localhost:3001/oauth-callback.html (for development)
```

### Microsoft Azure AD / Entra ID
```
Redirect URIs (Single-page application):
- https://your-callback-server.com/oauth-callback.html
- http://localhost:3001/oauth-callback.html (for development)

Important: Configure as "Single-page application" in Azure AD app registration
Authority URL format: https://login.microsoftonline.com/{tenant-id}/v2.0
```

### Auth0
```
Allowed Callback URLs:
- https://your-callback-server.com/oauth-callback.html
- http://localhost:3001/oauth-callback.html (for development)
```

## Troubleshooting

### Popup Blocked
- Users will see an error message asking to allow popups
- Add your domain to browser's popup exception list
- Authentication will work normally after allowing popups

### OAuth Provider Errors
- Ensure popup callback URL is added to your OAuth provider
- Check that the callback URL exactly matches what's configured
- Verify OAuth client ID and authority URL are correct

### Development Issues
- Make sure callback server is running on `http://localhost:3001`
- Make sure debug server is running on `http://localhost:51914`
- Check browser console for any JavaScript errors
- Verify `/oauth-callback.html` is accessible at `http://localhost:3001/oauth-callback.html`

### Microsoft Azure AD Specific Issues
- Ensure app is configured as "Single-page application" in Azure AD
- Use authority URL format: `https://login.microsoftonline.com/{tenant-id}/v2.0`
- Token exchange must happen from browser (automatic in current implementation)

## Testing

1. Start the callback server: `cd callback-server && npm start`
2. Start the debug server: `yarn debug`
3. Open `http://localhost:51914/examples/`
4. Click "Sign In" - popup should open to callback server
5. Complete OAuth flow in popup
6. Popup should close and you should be authenticated

The popup authentication provides a seamless experience while maintaining all the security benefits of OAuth/OIDC authentication.