# Proxy Server Architecture

## Overview

The proxy server implements a clean separation between local endpoints and upstream API forwarding, providing a scalable architecture that can handle the full Flowise API surface without requiring specific endpoint implementations.

## Architecture Pattern

### Local Endpoints (Handled by Proxy)
- **OAuth Configuration**: `/api/auth/config/:identifier`
- **Chatbot Configuration**: `/api/v1/public-chatbotConfig/:identifier`
- **Static Assets**: `/web.js`, `/`, `/oauth-callback.html`
- **Health Check**: `/health`
- **Embed Scripts**: `/api/v1/chatflows/:identifier/embed`

### Generic API Proxy (Forwarded to Flowise)
- **All other `/api/v1/*` endpoints** are automatically forwarded to the upstream Flowise server
- **Automatic identifier mapping** from friendly names to UUIDs
- **Authentication injection** with Flowise API key
- **Request/response proxying** with proper error handling

### Why Some Endpoints Are Local

**`/api/v1/public-chatbotConfig/:identifier`** is handled locally because:
- **Proxy-specific configuration**: Returns authentication settings managed by the proxy
- **Enhanced features**: Includes proxy server capabilities and version info
- **Security**: Combines OAuth configuration without exposing sensitive details
- **Customization**: Allows proxy-level UI themes, feature flags, and branding

This endpoint returns a comprehensive configuration that includes both Flowise chatflow data and proxy-managed authentication settings, providing a single source of truth for the chatbot's complete configuration.

## Generic API Proxy Implementation

### Smart Identifier Resolution
```javascript
// Automatically detects and converts identifiers to chatflow UUIDs
// Input:  /api/v1/prediction/chatflow_1
// Output: /api/v1/prediction/be29834a-84e7-45c1-ac5b-99adcc5fbcc3

const pathParts = req.path.split('/').filter(Boolean);
if (pathParts.length >= 3) {
  const potentialIdentifier = pathParts[2];
  if (!isValidUUID(potentialIdentifier)) {
    const chatflow = getChatflowDetails(potentialIdentifier);
    pathParts[2] = chatflow.chatflowId;
    targetPath = '/' + pathParts.join('/');
  }
}
```

### Automatic Authentication
```javascript
const headers = {
  'Authorization': `Bearer ${config.flowiseApiKey}`,
  ...req.headers
};
```

### Content Type Handling
- **JSON requests**: Automatically forwarded with proper headers
- **Multipart uploads**: File uploads handled with FormData
- **Streaming responses**: Binary data and downloads properly streamed

## Benefits of Generic Proxy

### ✅ Scalability
- **No endpoint proliferation**: New Flowise API endpoints work automatically
- **Maintainable codebase**: Single proxy handler vs. dozens of specific endpoints
- **Future-proof**: Handles API evolution without code changes

### ✅ Consistency
- **Uniform error handling**: All API calls use same error patterns
- **Consistent logging**: Standardized request/response logging
- **Authentication**: Single point for API key management

### ✅ Performance
- **Efficient routing**: Single middleware vs. multiple route handlers
- **Streaming support**: Large files and downloads properly handled
- **Timeout management**: Configurable timeouts for all endpoints

## Request Flow

### 1. Client Request
```
POST /api/v1/prediction/chatflow_1
Content-Type: application/json
{ "question": "Hello" }
```

### 2. Proxy Processing
```javascript
// 1. Validate domain access (validateApiKey middleware)
// 2. Resolve identifier: chatflow_1 → be29834a-84e7-45c1-ac5b-99adcc5fbcc3
// 3. Construct upstream URL: https://flowise.lab.calstate.ai/api/v1/prediction/be29834a-84e7-45c1-ac5b-99adcc5fbcc3
// 4. Add authentication: Authorization: Bearer flowise-api-key
// 5. Forward request to upstream
```

### 3. Upstream Response
```javascript
// 6. Receive response from Flowise
// 7. Forward response to client
// 8. Log transaction
```

## Supported Request Types

### JSON Requests
```javascript
// Automatic JSON handling
requestOptions.data = req.body;
requestOptions.headers['Content-Type'] = 'application/json';
```

### File Uploads
```javascript
// Multipart form data handling
if (req.is('multipart/form-data')) {
  const formData = new FormData();
  if (req.file) {
    formData.append('file', req.file.buffer, req.file.originalname);
  }
  Object.keys(req.body || {}).forEach(key => {
    formData.append(key, req.body[key]);
  });
  requestOptions.data = formData;
}
```

### Streaming Downloads
```javascript
// Stream handling for downloads
if (req.path.includes('download') || req.path.includes('stream')) {
  requestOptions.responseType = 'stream';
  response.data.pipe(res);
}
```

## Error Handling

### Upstream Errors
```javascript
if (error.response) {
  res.status(error.response.status).json({
    error: error.response.data || 'Upstream server error'
  });
}
```

### Proxy Errors
```javascript
res.status(500).json({
  error: 'Proxy server error'
});
```

## Configuration

### Chatflow Mapping
```json
{
  "chatflows": [
    {
      "identifier": "chatflow_1",
      "chatflowId": "be29834a-84e7-45c1-ac5b-99adcc5fbcc3",
      "allowedDomains": ["http://localhost:5678"]
    }
  ]
}
```

### API Settings
```json
{
  "apiHost": "https://flowise.lab.calstate.ai",
  "flowiseApiKey": "your-flowise-api-key-here"
}
```

## Logging

### Request Logging
```
📤 API Proxy: POST https://flowise.lab.calstate.ai/api/v1/prediction/be29834a-84e7-45c1-ac5b-99adcc5fbcc3 (identifier: chatflow_1)
```

### Response Logging
```
📥 API Response: 200 OK (identifier: chatflow_1)
```

### Error Logging
```
❌ API Proxy Error: 404 - Not Found (identifier: chatflow_1)
```

## Security Features

### Domain Validation
- All requests validated against allowed domains per chatflow
- Origin header checking for CORS compliance

### API Key Protection
- Flowise API key never exposed to client
- Automatic injection in all upstream requests

### Identifier Validation
- Invalid identifiers rejected before upstream forwarding
- UUID validation prevents injection attacks

## Performance Considerations

### Timeout Management
```javascript
requestOptions.timeout = 30000; // 30 second timeout
```

### Header Optimization
```javascript
// Remove problematic headers
delete headers.host;
delete headers['content-length']; // Let axios handle this
```

### Memory Efficiency
- Streaming for large files
- No buffering of binary data
- Efficient FormData handling

## Monitoring

### Metrics to Track
- Request volume per identifier
- Response times by endpoint
- Error rates by status code
- Upload/download sizes

### Health Checks
```javascript
app.get('/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    upstreamHost: config.apiHost
  });
});
```

## Migration Benefits

### Before (Specific Endpoints)
- 8+ specific endpoint handlers
- Duplicate error handling code
- Manual request/response mapping
- Maintenance overhead for new endpoints

### After (Generic Proxy)
- 1 generic proxy handler
- Centralized error handling
- Automatic request forwarding
- Zero maintenance for new Flowise endpoints

## Future Enhancements

### Caching Layer
```javascript
// Potential Redis caching for GET requests
if (req.method === 'GET' && shouldCache(req.path)) {
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));
}
```

### Rate Limiting
```javascript
// Per-identifier rate limiting
const rateLimiter = rateLimit({
  keyGenerator: (req) => getIdentifierFromPath(req.path),
  max: 100, // requests per window
  windowMs: 15 * 60 * 1000 // 15 minutes
});
```

### Request Transformation
```javascript
// Middleware for request/response transformation
app.use('/api/v1/*', requestTransformer, genericProxy, responseTransformer);
```

This architecture provides a clean, maintainable, and scalable foundation for proxying the entire Flowise API surface while maintaining the specific local functionality needed for OAuth configuration and domain validation.