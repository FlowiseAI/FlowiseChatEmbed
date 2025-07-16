const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3005;

// Enable CORS for all origins (since this is a callback server)
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  if (Object.keys(req.query).length > 0) {
    console.log(`[${timestamp}] Query params:`, req.query);
  }
  next();
});

// Serve static files from the callback-server directory
app.use(express.static(path.join(__dirname)));

// Serve the OAuth callback page
app.get('/oauth-callback.html', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔐 OAuth callback request received`);
  console.log(`[${timestamp}] Query parameters:`, req.query);
  console.log(`[${timestamp}] Referrer:`, req.get('Referrer') || 'None');
  console.log(`[${timestamp}] User-Agent:`, req.get('User-Agent') || 'None');
  
  if (req.query.code) {
    console.log(`[${timestamp}] ✅ Authorization code received: ${req.query.code.substring(0, 20)}...`);
  }
  if (req.query.state) {
    console.log(`[${timestamp}] ✅ State parameter received: ${req.query.state.substring(0, 20)}...`);
  }
  if (req.query.error) {
    console.log(`[${timestamp}] ❌ OAuth error: ${req.query.error} - ${req.query.error_description}`);
  }
  
  res.sendFile(path.join(__dirname, 'oauth-callback.html'));
});

// Token exchange endpoint
app.post('/exchange-token', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔄 Token exchange request received`);
  
  try {
    const { authority, clientId, code, codeVerifier } = req.body;
    
    if (!authority || !clientId || !code || !codeVerifier) {
      console.log(`[${timestamp}] ❌ Missing required parameters`);
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['authority', 'clientId', 'code', 'codeVerifier']
      });
    }

    console.log(`[${timestamp}] 📋 Exchange parameters:`, {
      authority: authority.substring(0, 50) + '...',
      clientId: clientId.substring(0, 20) + '...',
      code: code.substring(0, 20) + '...',
      codeVerifier: codeVerifier.substring(0, 20) + '...'
    });

    // Discover the token endpoint
    // Use the exact Microsoft Entra discovery endpoint format
    const discoveryUrl = `${authority}/.well-known/openid-configuration`;
    console.log(`[${timestamp}] 🔍 Discovering token endpoint: ${discoveryUrl}`);
    
    const discoveryResponse = await fetch(discoveryUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Flowise-OAuth-Callback-Server/1.0.0'
      }
    });
    
    console.log(`[${timestamp}] 📡 Discovery response status: ${discoveryResponse.status} ${discoveryResponse.statusText}`);
    
    if (!discoveryResponse.ok) {
      const errorText = await discoveryResponse.text().catch(() => 'No response body');
      console.error(`[${timestamp}] ❌ Discovery failed:`, {
        status: discoveryResponse.status,
        statusText: discoveryResponse.statusText,
        url: discoveryUrl,
        response: errorText.substring(0, 200)
      });
      throw new Error(`Discovery failed: ${discoveryResponse.status} ${discoveryResponse.statusText}`);
    }
    
    const discoveryData = await discoveryResponse.json();
    const tokenEndpoint = discoveryData.token_endpoint;
    console.log(`[${timestamp}] ✅ Token endpoint discovered: ${tokenEndpoint}`);

    // Prepare token exchange request
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code: code,
      code_verifier: codeVerifier,
      redirect_uri: `http://localhost:${PORT}/oauth-callback.html`
    });

    console.log(`[${timestamp}] 🚀 Exchanging code for tokens...`);
    
    // Exchange code for tokens
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenParams.toString()
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.log(`[${timestamp}] ❌ Token exchange failed:`, tokenData);
      return res.status(tokenResponse.status).json({
        error: 'Token exchange failed',
        details: tokenData
      });
    }

    console.log(`[${timestamp}] ✅ Token exchange successful`);
    console.log(`[${timestamp}] 📊 Token response:`, {
      access_token: tokenData.access_token ? `${tokenData.access_token.substring(0, 20)}...` : 'none',
      id_token: tokenData.id_token ? `${tokenData.id_token.substring(0, 20)}...` : 'none',
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in
    });

    // Return the tokens
    res.json(tokenData);

  } catch (error) {
    console.error(`[${timestamp}] ❌ Token exchange error:`, error.message);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'flowise-oauth-callback' });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    service: 'Flowise OAuth Callback Server',
    version: '1.0.0',
    endpoints: {
      callback: '/oauth-callback.html',
      tokenExchange: '/exchange-token',
      health: '/health'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Flowise OAuth Callback Server running on port ${PORT}`);
  console.log(`📍 Callback URL: http://localhost:${PORT}/oauth-callback.html`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});