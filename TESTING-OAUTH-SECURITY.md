# Testing OAuth API Key Security

## Current Configuration ✅

### Server Configuration (`proxy-server/config.json`)
```json
{
  "oauthApiKey": "your-secure-oauth-api-key-here"
}
```
**✅ This is CORRECT - use the original, unobfuscated key in the server config**

### Client Obfuscation (`src/constants.ts`)
The client code contains the obfuscated version that decrypts back to the original key.

## How the Security Flow Works

### 1. Obfuscation Process (Client-side)
```
Original: "your-secure-api-key-here"
    ↓ (reverse)
Layer 1: "ereh-yek-ipa-eruces-ruoy"
    ↓ (base64 encode with btoa - browser compatible)
Layer 2: "ZXJlaC15ZWstaXBhLWVydWNlcy1ydW95"
    ↓ (character shift)
Layer 3: [obfuscated string stored in code]
```

### 2. Runtime Decryption (Client-side)
```javascript
const apiKey = decryptApiKey(OBFUSCATED_OAUTH_API_KEY);
// Result: "your-secure-api-key-here"
```

### 3. Authentication Flow
```
Client → Decrypt → "your-secure-api-key-here" → HTTP Header → Server
Server → Compare with config.json → "your-secure-api-key-here" → ✅ Match
```

## Testing Steps

### 1. Start the Proxy Server
```bash
cd proxy-server
node server.js
```

### 2. Test OAuth Config Endpoint
```bash
# This should work (with correct key)
curl -H "x-oauth-api-key: your-secure-api-key-here" \
     http://localhost:3001/api/auth/config/chatflow_1

# This should fail (with wrong key)
curl -H "x-oauth-api-key: wrong-key" \
     http://localhost:3001/api/auth/config/chatflow_1
```

### 3. Test Client Integration
Load your chatbot with a chatflow that has OAuth configured, and verify:
- OAuth configuration is fetched successfully
- Authentication flow works properly
- No plain-text API keys visible in browser dev tools

## Security Verification

### ✅ What to Check
1. **Server logs show successful OAuth config requests**
2. **Browser dev tools show obfuscated key in source code**
3. **Network tab shows correct API key in request headers**
4. **Authentication flow completes successfully**

### ❌ What Should NOT Work
1. **Requests without API key should return 401**
2. **Requests with wrong API key should return 401**
3. **Plain-text API key should not be visible in client code**

## Configuration Values

### DO NOT change these in config.json:
- ❌ `"oauthApiKey": "ereh-yek-ipa-eruces-ruoy"` (reversed - WRONG)
- ❌ `"oauthApiKey": "ZXJlaC15ZWstaXBhLWVydWNlcy1ydW95"` (base64 - WRONG)

### ✅ Correct config.json value:
```json
{
  "oauthApiKey": "your-secure-api-key-here"
}
```

## Production Deployment

### For Production Use:
1. **Generate a strong, unique API key**
2. **Update the obfuscated value in `src/constants.ts`**
3. **Update the server config with the same original key**
4. **Test the complete flow**

### Example Production Setup:
```json
// config.json
{
  "oauthApiKey": "prod-secure-key-abc123xyz789"
}
```

```typescript
// constants.ts - update the layer1 value
const layer1 = '987zyx321cba-yek-eruces-dorp'; // reversed production key
```

## Troubleshooting

### Common Issues:
1. **401 Errors**: Check that server config matches decrypted client key
2. **Decryption Failures**: Verify obfuscation layers are correctly implemented
3. **CORS Issues**: Ensure allowed domains include your client origin

### Debug Steps:
1. **Log the decrypted key** (temporarily) to verify it matches server config
2. **Check server logs** for API key validation messages
3. **Verify network requests** include correct headers