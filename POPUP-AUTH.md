# Popup OAuth Authentication

The Flowise Chat Embed now uses popup windows for OAuth authentication instead of full-page redirects, providing a better user experience.

## Quick Setup

1. **Update OAuth Provider**: Add the popup callback URL to your OAuth provider's allowed redirect URIs:
   - Production: `https://your-domain.com/oauth-callback.html`
   - Development: `http://localhost:51914/oauth-callback.html`

2. **No Code Changes Required**: The popup authentication works automatically with your existing OAuth configuration.

## How It Works

- **Better UX**: Users stay on your page while authenticating in a popup
- **Automatic Handling**: Popup opens, handles OAuth flow, and closes automatically
- **Secure Communication**: Uses `postMessage` for secure parent-popup communication
- **Error Handling**: Gracefully handles popup blocking and authentication errors

## OAuth Provider Examples

### Google OAuth 2.0
```
Authorized redirect URIs:
- https://your-domain.com/oauth-callback.html
- http://localhost:51914/oauth-callback.html (for development)
```

### Microsoft Azure AD
```
Redirect URIs:
- https://your-domain.com/oauth-callback.html
- http://localhost:51914/oauth-callback.html (for development)
```

### Auth0
```
Allowed Callback URLs:
- https://your-domain.com/oauth-callback.html
- http://localhost:51914/oauth-callback.html (for development)
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
- Make sure dev server is running on `http://localhost:51914`
- Check browser console for any JavaScript errors
- Verify `/oauth-callback.html` is accessible at `http://localhost:51914/oauth-callback.html`

## Testing

1. Start the debug server: `yarn debug`
2. Open `http://localhost:51914/examples/`
3. Click "Sign In" - popup should open
4. Complete OAuth flow in popup
5. Popup should close and you should be authenticated

The popup authentication provides a seamless experience while maintaining all the security benefits of OAuth/OIDC authentication.