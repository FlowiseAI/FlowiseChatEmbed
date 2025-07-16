# Debugging OAuth API Key Headers

## Header Information

**Header Name**: `x-oauth-api-key`
**Expected Value**: `"your-secure-api-key-here"` (decrypted from obfuscated client code)

## When the Header is Sent

The `fetchOAuthConfig` function (which sends the API key header) is only called under these conditions:

### 1. **No Authentication Config Provided**
```javascript
// Bot initialization without authentication prop
Chatbot.init({
  chatflowid: 'your-chatflow-id',
  apiHost: 'http://localhost:3001'
  // No authentication property
});
```

### 2. **Server-Mode Authentication**
```javascript
// Bot initialization with server-mode auth
Chatbot.init({
  chatflowid: 'your-chatflow-id',
  apiHost: 'http://localhost:3001',
  authentication: {
    mode: 'server' // This triggers server-side config fetch
  }
});
```

## Debugging Steps

### 1. Check Your Bot Initialization
Look at how you're initializing the chatbot. If you're providing a complete `authentication` object, the server fetch might be skipped.

### 2. Monitor Network Traffic
Look for this specific request:
```
GET http://localhost:3001/api/auth/config/your-chatflow-id
Headers:
  x-oauth-api-key: your-secure-api-key-here
  Content-Type: application/json
```

### 3. Check Browser Console
Look for these log messages:
- ✅ `"Using server-side OAuth configuration"`
- ⚠️ `"Failed to fetch server-side OAuth config, using client-side config"`
- ❌ `"No OAuth configuration found, authentication disabled"`

### 4. Verify Conditions
The API call happens in `onMount` only if:
```javascript
// Condition 1: No auth config provided
!authConfig 

// OR Condition 2: Server mode specified
authConfig.mode === 'server'
```

## Common Issues

### ❌ **Header Not Sent - Possible Causes:**

1. **Complete Auth Config Provided**
   ```javascript
   // This SKIPS server fetch
   authentication: {
     mode: 'optional',
     oauth: { /* complete config */ }
   }
   ```

2. **Wrong API Host**
   ```javascript
   // Make sure this matches your proxy server
   apiHost: 'http://localhost:3001' // Should match proxy server port
   ```

3. **Chatflow Not Configured**
   - Check that your `chatflowid` exists in `proxy-server/config.json`
   - Verify the chatflow has OAuth configuration

### ✅ **Force Server Config Fetch**
```javascript
// Option 1: No authentication prop
Chatbot.init({
  chatflowid: 'chatflow_1',
  apiHost: 'http://localhost:3001'
});

// Option 2: Explicit server mode
Chatbot.init({
  chatflowid: 'chatflow_1',
  apiHost: 'http://localhost:3001',
  authentication: {
    mode: 'server'
  }
});
```

## Testing the Header

### 1. **Manual Test**
```bash
curl -H "x-oauth-api-key: your-secure-api-key-here" \
     http://localhost:3001/api/auth/config/chatflow_1
```

### 2. **Browser DevTools**
1. Open Network tab
2. Filter by "config" or "auth"
3. Look for the request to `/api/auth/config/your-chatflow-id`
4. Check the Request Headers section for `x-oauth-api-key`

### 3. **Add Debug Logging**
Temporarily add this to `src/constants.ts`:
```javascript
export const fetchOAuthConfig = async (apiHost: string, chatflowId: string) => {
  try {
    const apiKey = decryptApiKey(OBFUSCATED_OAUTH_API_KEY);
    console.log('🔑 Sending OAuth config request with API key:', apiKey); // DEBUG
    const response = await fetch(`${apiHost}/api/auth/config/${chatflowId}`, {
      headers: {
        'x-oauth-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    // ... rest of function
  }
}
```

## Expected Server Response

### ✅ **Success (200)**
```json
{
  "mode": "optional",
  "oauth": {
    "clientId": "...",
    "authority": "...",
    "scope": "openid profile email"
  },
  "tokenStorageKey": "flowise_tokens_chatflow_1"
}
```

### ❌ **Unauthorized (401)**
```json
{
  "error": "Invalid API key"
}
```

### ❌ **Not Found (404)**
```json
{
  "error": "Chatflow not found"
}
```

## Quick Fix Checklist

- [ ] Bot initialized without complete auth config OR with `mode: 'server'`
- [ ] Correct `apiHost` pointing to proxy server
- [ ] Valid `chatflowid` that exists in proxy server config
- [ ] Proxy server running on expected port
- [ ] Network request visible in browser DevTools
- [ ] `x-oauth-api-key` header present in request
- [ ] Header value matches server config value