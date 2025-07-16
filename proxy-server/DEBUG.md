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