# Authentication Examples

This directory contains examples demonstrating different authentication flows supported by the Flowise Chat Embed system.

## Authentication Types

### SPA Authentication (Single Page Application)
- **File**: `local.html`
- **Configuration**: Uses `chatflow1`, `chatflow2`, or `chatflow4` (configured with `"authType": "spa"`)
- **Flow**: Client-side OAuth with PKCE
- **Token Storage**: Frontend (localStorage/sessionStorage)
- **Redirect**: `/oauth-callback.html`
- **Security**: PKCE + popup window

### Web Authentication (Traditional Web Flow)
- **File**: `web-auth.html`
- **Configuration**: Uses `chatflow3` (configured with `"authType": "web"`)
- **Flow**: Server-side OAuth flow
- **Token Storage**: Server-side session
- **Redirect**: `/callback`
- **Security**: Client secret + server-side token management

## Configuration Examples

### SPA Authentication Configuration
```json
{
  "identifier": "chatflow4",
  "chatflowId": "be29834a-84e7-45c1-ac5b-99adcc5fbcc3",
  "oauth": {
    "mode": "required",
    "authType": "spa",
    "clientId": "a3f47b20-9262-4c47-b885-41be1b0c4d56",
    "authority": "https://login.microsoftonline.com/ae9a1f93-89ad-45f8-94b4-8629e935ab33/v2.0",
    "redirectUri": "http://localhost:3005/oauth-callback.html",
    "scope": "openid profile email",
    "responseType": "code",
    "prompt": "select_account"
  }
}
```

### Web Authentication Configuration
```json
{
  "identifier": "chatflow3",
  "chatflowId": "be29834a-84e7-45c1-ac5b-99adcc5fbcc3",
  "oauth": {
    "mode": "required",
    "authType": "web",
    "clientId": "my-client-id",
    "clientSecret": "my-client-secret",
    "authority": "https://idp.calstate.edu",
    "redirectUri": "http://localhost:3005/callback",
    "scope": "openid profile email",
    "responseType": "code",
    "prompt": "select_account"
  }
}
```

## Key Differences

| Feature | SPA Authentication | Web Authentication |
|---------|-------------------|-------------------|
| **Client Secret** | Not required | Required |
| **Token Storage** | Frontend (browser) | Server-side session |
| **Security Model** | PKCE | Traditional OAuth |
| **Redirect Endpoint** | `/oauth-callback.html` | `/callback` |
| **Token Exchange** | Frontend direct | Server-side |
| **Session Management** | Client-side | Server-side |
| **API Requests** | Direct OAuth token | Session ID → Server adds token |

## Usage

1. **For SPA Authentication**: Open `local.html` in your browser
2. **For Web Authentication**: Open `web-auth.html` in your browser

Make sure the proxy server is running on `http://localhost:3005` and configured with the appropriate OAuth settings in `proxy-server/config/local.config.json`.

## Authentication Modes

Both authentication types support these modes:
- `required`: User must authenticate to use the chat
- `optional`: User can choose to authenticate or continue as guest
- `disabled`: No authentication required

## Implementation Status

- ✅ SPA Authentication (Existing)
- ✅ Web Authentication (Fully implemented)

Both authentication flows are now fully implemented and ready for use. The web authentication flow includes:
- Server-side OAuth endpoints (`/api/auth/login/:identifier`, `/callback`, `/api/auth/exchange/:identifier`)
- Frontend AuthService with web authentication support
- Session-based token management
- Automatic session cleanup and validation