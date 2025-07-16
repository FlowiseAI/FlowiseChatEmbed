# Server-Side Authentication Mode Configuration

## Overview

Authentication mode configuration has been moved from client-side initialization to server-side chatflow configuration. This allows for centralized management of authentication behavior per chatflow.

## Configuration Structure

### Server Configuration (`proxy-server/config.json`)

Each chatflow in the `chatflows` array now includes a `mode` attribute in the `oauth` object:

```json
{
  "apiHost": "https://flowise.lab.calstate.ai",
  "flowiseApiKey": "your-flowise-api-key-here",
  "oauthApiKey": "your-secure-oauth-api-key-here",
  "oauthRedirectUri": "http://localhost:3005/oauth-callback.html",
  "port": 3001,
  "host": "localhost",
  "chatflows": [
    {
      "identifier": "chatflow_1",
      "chatflowId": "be29834a-84e7-45c1-ac5b-99adcc5fbcc3",
      "allowedDomains": [
        "http://localhost:5678",
        "https://yourdomain.com"
      ],
      "oauth": {
        "mode": "optional",
        "clientId": "a3f47b20-9262-4c47-b885-41be1b0c4d56",
        "authority": "https://login.microsoftonline.com/ae9a1f93-89ad-45f8-94b4-8629e935ab33/v2.0",
        "scope": "openid profile email",
        "responseType": "code",
        "prompt": "select_account"
      }
    }
  ]
}
```

## Authentication Modes

### `"required"`
- **Behavior**: Users MUST authenticate before using the chatbot
- **UI**: Shows authentication prompt, no "skip" option
- **Use Case**: Secure chatbots requiring user identification

```json
"oauth": {
  "mode": "required",
  "clientId": "...",
  "authority": "..."
}
```

### `"optional"`
- **Behavior**: Users CAN authenticate but can also continue as guest
- **UI**: Shows authentication prompt with "Sign In" and "Continue as Guest" options
- **Use Case**: Personalized features available but not mandatory

```json
"oauth": {
  "mode": "optional",
  "clientId": "...",
  "authority": "..."
}
```

### `"disabled"`
- **Behavior**: No authentication available
- **UI**: No authentication prompts shown
- **Use Case**: Public chatbots with no user-specific features

```json
"oauth": {
  "mode": "disabled",
  "clientId": "...",
  "authority": "..."
}
```

## Client-Side Integration

### Automatic Server Configuration Fetch

The chatbot automatically fetches authentication configuration from the server:

```javascript
// No authentication config needed in client initialization
Chatbot.init({
  chatflowid: 'chatflow_1',
  apiHost: 'http://localhost:3001'
});
```

### Server vs Client Configuration Priority

1. **Server-side config** (highest priority)
2. **Client-side config** (fallback)

```javascript
// Server config will override this if available
Chatbot.init({
  chatflowid: 'chatflow_1',
  apiHost: 'http://localhost:3001',
  authentication: {
    mode: 'optional', // This will be overridden by server config
    oauth: { /* ... */ }
  }
});
```

### Force Server Configuration

```javascript
// Explicitly request server configuration
Chatbot.init({
  chatflowid: 'chatflow_1',
  apiHost: 'http://localhost:3001',
  authentication: {
    mode: 'server' // Forces server config fetch
  }
});
```

## API Response Format

### OAuth Configuration Endpoint

**Request:**
```
GET /api/auth/config/{chatflow_identifier}
Headers:
  x-oauth-api-key: your-secure-oauth-api-key-here
```

**Response:**
```json
{
  "mode": "optional",
  "oauth": {
    "clientId": "a3f47b20-9262-4c47-b885-41be1b0c4d56",
    "authority": "https://login.microsoftonline.com/ae9a1f93-89ad-45f8-94b4-8629e935ab33/v2.0",
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

## Migration Guide

### From Client-Side to Server-Side Configuration

**Before (Client-Side):**
```javascript
Chatbot.init({
  chatflowid: 'my_chatflow',
  apiHost: 'http://localhost:3001',
  authentication: {
    mode: 'optional',
    oauth: {
      clientId: 'client-id',
      authority: 'https://login.microsoftonline.com/tenant/v2.0',
      scope: 'openid profile email'
    }
  }
});
```

**After (Server-Side):**

1. **Update `proxy-server/config.json`:**
```json
{
  "chatflows": [
    {
      "identifier": "my_chatflow",
      "oauth": {
        "mode": "optional",
        "clientId": "client-id",
        "authority": "https://login.microsoftonline.com/tenant/v2.0",
        "scope": "openid profile email"
      }
    }
  ]
}
```

2. **Simplify client initialization:**
```javascript
Chatbot.init({
  chatflowid: 'my_chatflow',
  apiHost: 'http://localhost:3001'
  // No authentication config needed
});
```

## Benefits

### ✅ Centralized Management
- All authentication configuration in one place
- No need to update client code for auth changes
- Consistent behavior across deployments

### ✅ Per-Chatflow Configuration
- Different authentication modes for different chatflows
- Flexible deployment scenarios
- Easy A/B testing of authentication strategies

### ✅ Security
- Authentication configuration not exposed in client code
- Server-side validation of all auth parameters
- Centralized API key management

### ✅ Maintainability
- Single source of truth for auth configuration
- Easier updates and rollbacks
- Reduced client-side complexity

## Console Logging

The client provides clear logging to indicate configuration source:

```
🔧 Using server-side OAuth configuration (mode: optional)
⚠️ No server-side OAuth config found, using client-side config
❌ No OAuth configuration found, authentication disabled
🔄 Falling back to client-side configuration
```

## Error Handling

### Server Configuration Unavailable
- Falls back to client-side configuration if provided
- Disables authentication if no fallback available
- Logs appropriate warnings

### Invalid Configuration
- Server validates all OAuth parameters
- Returns 404 for missing chatflows
- Returns 401 for invalid API keys

## Testing

### Test Different Modes

1. **Required Mode:**
```bash
# Update config.json with mode: "required"
# Restart server
# Load chatbot - should force authentication
```

2. **Optional Mode:**
```bash
# Update config.json with mode: "optional"  
# Restart server
# Load chatbot - should show skip option
```

3. **Disabled Mode:**
```bash
# Update config.json with mode: "disabled"
# Restart server  
# Load chatbot - should skip authentication entirely
```

### Verify Server Response
```bash
curl -H "x-oauth-api-key: your-secure-oauth-api-key-here" \
     http://localhost:3001/api/auth/config/chatflow_1
```

## Best Practices

### 🎯 Configuration Management
- Use environment-specific config files (`prod.config.json`, `local.config.json`)
- Version control configuration changes
- Document mode choices for each chatflow

### 🔒 Security
- Rotate OAuth API keys regularly
- Use HTTPS in production
- Validate all OAuth parameters server-side

### 📊 Monitoring
- Log authentication mode usage
- Monitor configuration fetch success rates
- Track authentication completion rates by mode

## Troubleshooting

### Common Issues

1. **Mode not taking effect:**
   - Verify server configuration is valid JSON
   - Check server logs for configuration loading
   - Ensure client is fetching from correct endpoint

2. **Fallback to client config:**
   - Check API key in request headers
   - Verify chatflow identifier exists in server config
   - Confirm server is running and accessible

3. **Authentication not working:**
   - Validate OAuth parameters in server config
   - Check redirect URI configuration
   - Verify client ID and authority are correct