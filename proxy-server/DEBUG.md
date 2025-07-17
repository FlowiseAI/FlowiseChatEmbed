# Debugging the Proxy Server

This guide explains how to debug the proxy server using VSCode's built-in debugger to investigate the Base64 image upload issue.

## VSCode Debug Configurations

Three debug configurations are available in `.vscode/launch.json`:

### 1. Debug Proxy Server
- **Use case**: Normal debugging with breakpoints
- **How to use**: 
  1. Set breakpoints in `server.js` where you want to inspect
  2. Go to Run and Debug (Ctrl+Shift+D)
  3. Select "Debug Proxy Server" from dropdown
  4. Press F5 or click the green play button

### 2. Debug Proxy Server (Break on Start)
- **Use case**: Debug from the very beginning of server startup
- **How to use**: Same as above but select "Debug Proxy Server (Break on Start)"
- **Note**: Will pause execution immediately when the server starts

### 3. Debug Proxy Server (Attach)
- **Use case**: Attach to an already running server started with `--inspect`
- **How to use**: 
  1. Start server manually: `yarn debug` (from proxy-server directory)
  2. Select "Debug Proxy Server (Attach)" and press F5

## Recommended Debugging Strategy for Base64 Image Issue

### Step 1: Set Strategic Breakpoints

Set breakpoints at these key locations in `server.js`:

1. **Line ~499**: API Proxy entry point
   ```javascript
   console.info('\x1b[34m%s\x1b[0m', `📤 API Proxy: ${req.method} ${apiUrl}${identifier ? ` (identifier: ${identifier})` : ''}`);
   ```

2. **Line ~520**: Request body handling
   ```javascript
   if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
   ```

3. **Line ~541**: JSON data assignment
   ```javascript
   requestOptions.data = req.body;
   ```

4. **Line ~551**: Axios request execution
   ```javascript
   const response = await axios(requestOptions);
   ```

5. **Line ~568**: Error handling
   ```javascript
   } catch (error) {
   ```

### Step 2: Inspect Variables

When breakpoints hit, examine these variables in the Debug Console or Variables panel:

- `req.body` - Check the size and structure of the request body
- `requestOptions` - Verify maxContentLength and maxBodyLength are set to Infinity
- `requestOptions.data` - Inspect the actual data being sent to axios
- `error.message` - In the catch block, see the exact error details
- `error.code` - Check for specific error codes

### Step 3: Debug Console Commands

Use these commands in the Debug Console (Ctrl+Shift+Y):

```javascript
// Check request body size
JSON.stringify(req.body).length

// Check if uploads array exists and its size
req.body.uploads && req.body.uploads.length

// Check Base64 data size if uploads exist
req.body.uploads && req.body.uploads[0] && req.body.uploads[0].data.length

// Inspect axios config
requestOptions.maxContentLength
requestOptions.maxBodyLength

// Check headers
Object.keys(requestOptions.headers)
```

### Step 4: Test Scenario

1. Start the debugger with "Debug Proxy Server"
2. Set breakpoints as described above
3. Send a Base64 image through your chatbot UI
4. When breakpoints hit, inspect the variables
5. Step through the code (F10) to see exactly where the error occurs

## Common Issues to Look For

1. **maxContentLength/maxBodyLength not set**: Check if these are actually `Infinity`
2. **Request body size**: Measure actual size of `req.body` when serialized
3. **Axios version conflicts**: Ensure axios version supports Infinity limits
4. **Memory limits**: Node.js might have memory constraints
5. **Upstream server limits**: The Flowise server itself might have limits

## Manual Testing Commands

From the proxy-server directory:

```bash
# Start with debugging enabled
yarn debug

# Start with break on first line
yarn debug-brk
```

## Environment Variables

The debug configuration sets:
- `NODE_ENV=development`
- `DEBUG=*` (enables all debug output)

## Next Steps

After identifying where the error occurs:
1. Check if it's a client-side limit (proxy server)
2. Check if it's a server-side limit (Flowise API)
3. Consider implementing request size validation
4. Consider implementing Base64 to multipart conversion for large images

## OAuth Session Management Debugging

The proxy server includes OAuth session management that tracks user authentication across chat sessions. Here's how to debug and monitor this functionality.

### Debug Mode Setup

To enable OAuth session debugging, start the server with debug mode:

```bash
# Option 1: Use the debug script
cd proxy-server
NODE_ENV=debug yarn start

# Option 2: Use the dedicated debug script
yarn start-debug

# Option 3: Use existing debug script
yarn debug-verbose
```

### Session State Management

The proxy server maintains a session state map that tracks:
- **Chat ID** → **User Information** mapping
- **Token expiry times** for automatic session cleanup
- **Last access times** for session monitoring

### Debug Endpoints

#### View Session State (Protected)

The debug endpoint requires a valid chatflow identifier and is protected by API key validation:

```bash
# View sessions for a specific chatflow
curl "http://localhost:3005/debug/sessions/chatflow1"

# View all sessions
curl "http://localhost:3005/debug/sessions/all"
```

**Response Format:**
```json
{
  "totalSessions": 2,
  "filteredSessions": 1,
  "sessions": {
    "861e5787-6c84-4c50-87be-7da67cf4f1dd": {
      "userId": "user-123-456",
      "email": "user@example.com",
      "name": "User Name",
      "identifier": "chatflow1",
      "createdAt": "2025-01-16T19:42:00.000Z",
      "expiresAt": "2025-01-17T02:37:00.000Z",
      "lastAccessed": "2025-01-16T19:45:00.000Z",
      "isExpired": false,
      "timeUntilExpiry": 25020000
    }
  },
  "timestamp": "2025-01-16T19:45:00.000Z"
}
```

### Debug Log Messages

When `NODE_ENV=debug`, you'll see these OAuth-related debug messages:

#### Initial Authentication
```
🔍 DEBUG: 🔍 Extracting user context for originalUrl: /api/v1/prediction/chatflow1
🔍 DEBUG: 🔍 Full path: /api/v1/prediction/chatflow1
🔍 DEBUG: 🔍 Path parts: [api, v1, prediction, chatflow1]
🔍 DEBUG: 🔍 Found identifier as last path part: chatflow1
🔍 DEBUG: 🔐 User authenticated via OAuth token: {
  identifier: 'chatflow1',
  userId: 'user-123-456',
  email: 'user@example.com',
  name: 'User Name',
  username: 'username'
}
🔍 DEBUG: 💾 Stored session state for chatId: 861e5787-6c84-4c50-87be-7da67cf4f1dd {
  userId: 'user-123-456',
  email: 'user@example.com',
  expiresAt: '2025-01-17T02:37:00.000Z'
}
```

#### Subsequent Requests (Using Cached Session)
```
🔍 DEBUG: ℹ️ No OAuth token provided in request (identifier: chatflow1)
🔍 DEBUG: 🔄 Using cached session for chatId: 861e5787-6c84-4c50-87be-7da67cf4f1dd {
  userId: 'user-123-456',
  email: 'user@example.com'
}
```

#### Session Cleanup
```
🔍 DEBUG: Cleaned up 2 expired sessions
🔍 DEBUG: 🗑️ Removed expired session for chatId: old-chat-id
```

### OAuth Debugging Breakpoints

Set breakpoints at these locations for OAuth debugging:

1. **Line ~630**: User context extraction entry
   ```javascript
   const extractUserContext = async (req, res, next) => {
   ```

2. **Line ~672**: OAuth token validation
   ```javascript
   if (userInfoResponse.ok) {
   ```

3. **Line ~675**: Session state storage
   ```javascript
   if (req.body && req.body.chatId && req.method === 'POST') {
   ```

4. **Line ~712**: Cached session retrieval
   ```javascript
   if (req.body && req.body.chatId) {
   ```

### Debug Console Commands for OAuth

Use these commands in the Debug Console when debugging OAuth:

```javascript
// Check if user context is attached
req.user

// Check session state size
sessionState.size

// Check specific session
sessionState.get('your-chat-id-here')

// Check OAuth config for identifier
oauthConfigs.get('chatflow1')

// Check JWT token expiry
decodeJWTExpiry('your-jwt-token-here')

// Check request body for chatId
req.body && req.body.chatId
```

### Session State Structure

Each session in the `sessionState` Map contains:

```javascript
{
  userInfo: {
    sub: "user-123-456",           // Unique user ID
    email: "user@example.com",     // User email
    name: "User Name",             // Display name
    preferred_username: "username" // Username
  },
  identifier: "chatflow1",         // Chatflow identifier
  createdAt: 1705456620000,        // Session creation timestamp
  expiresAt: 1705543020000,        // Expiry based on JWT token
  lastAccessed: 1705456620000      // Last access timestamp
}
```

### Common OAuth Issues to Debug

1. **Token Validation Failures**: Check if OAuth provider endpoints are accessible
2. **Session Not Created**: Verify POST request contains `chatId` in body
3. **Session Expiry**: Check JWT token expiry time extraction
4. **Identifier Detection**: Ensure identifier is correctly extracted from URL path
5. **Memory Leaks**: Monitor session cleanup and expired session removal

### Monitoring Session Health

- **Active Sessions**: Use `/debug/sessions/all` to see total active sessions
- **Session Expiry**: Check `timeUntilExpiry` values in debug response
- **Memory Usage**: Monitor `sessionState.size` over time
- **Cleanup Frequency**: Sessions are cleaned every 5 minutes automatically

### Testing OAuth Flow

1. Start server with `NODE_ENV=debug yarn start`
2. Set breakpoints in OAuth middleware
3. Send authenticated chat request with `chatId`
4. Verify session creation in debug logs
5. Send follow-up request without token
6. Verify cached session usage
7. Check session state via debug endpoint