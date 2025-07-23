Error.stackTraceLimit = 0;

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import { generateEmbedScript } from './src/utils/embedScript.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug logging utility - only logs when NODE_ENV=debug
const debugLog = (message, ...args) => {
  if (process.env.NODE_ENV === 'debug') {
    console.log('\x1b[35m%s\x1b[0m', `🔍 DEBUG: ${message}`, ...args);
  }
};

// Configuration loading with priority: prod.config.json > local.config.json > config.json
const loadConfiguration = () => {
  const configFiles = ['prod.config.json', 'local.config.json', 'config.json'];
  
  for (const configFile of configFiles) {
    const configPath = path.join(__dirname, 'config', configFile);
    if (fs.existsSync(configPath)) {
      try {
        const configData = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configData);
        console.info('\x1b[32m%s\x1b[0m', `✓ Loaded configuration from: config/${configFile}`);
        return config;
      } catch (error) {
        console.error(`Error parsing config/${configFile}:`, error.message);
        continue;
      }
    }
  }
  
  console.error('\x1b[31m%s\x1b[0m', '✗ No configuration found. Please create one of: config/prod.config.json, config/local.config.json, or config/config.json');
  process.exit(1);
};

const config = loadConfiguration();

// Session state management for tracking chat sessions with user info
const sessionState = new Map();

// Web authentication session management
const webAuthSessions = new Map();

// Helper function to generate secure session ID
const generateSessionId = async () => {
  const crypto = await import('crypto');
  return crypto.randomBytes(32).toString('hex');
};

// Helper function to clean up expired web auth sessions
const cleanupExpiredWebSessions = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [sessionId, session] of webAuthSessions.entries()) {
    if (session.expiresAt && session.expiresAt < now) {
      webAuthSessions.delete(sessionId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    debugLog(`Cleaned up ${cleanedCount} expired web auth sessions`);
  }
};

// Token refresh service for web authentication sessions
const refreshWebAuthToken = async (sessionId, session) => {
  try {
    const oauthConfig = oauthConfigs.get(session.identifier);
    if (!oauthConfig || !session.tokens?.refresh_token) {
      console.warn('\x1b[33m%s\x1b[0m', `⚠️  Cannot refresh token: missing OAuth config or refresh token (sessionId: ${sessionId})`);
      return false;
    }

    // Discover OAuth endpoints for token refresh
    const discoveredEndpoints = await discoverOAuthEndpoints(oauthConfig);
    
    console.info('\x1b[36m%s\x1b[0m', `🔄 Refreshing token for session: ${sessionId}`);
    
    // Prepare token refresh request
    const refreshParams = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      refresh_token: session.tokens.refresh_token
    });

    const refreshResponse = await fetch(discoveredEndpoints.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: refreshParams.toString()
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('\x1b[31m%s\x1b[0m', `❌ Token refresh failed (${refreshResponse.status}):`, errorText);
      return false;
    }

    const refreshResult = await refreshResponse.json();
    
    // Update session with new tokens
    const oldExpiry = session.tokens.expires_at;
    session.tokens = {
      access_token: refreshResult.access_token,
      token_type: refreshResult.token_type,
      expires_in: refreshResult.expires_in || 3600,
      expires_at: Date.now() + (refreshResult.expires_in || 3600) * 1000,
      refresh_token: refreshResult.refresh_token || session.tokens.refresh_token, // Keep old refresh token if new one not provided
      id_token: refreshResult.id_token || session.tokens.id_token,
      scope: refreshResult.scope || session.tokens.scope
    };

    // Update session expiry based on new token
    session.expiresAt = session.tokens.expires_at;

    console.info('\x1b[32m%s\x1b[0m', `✅ Token refreshed successfully for session: ${sessionId}`);
    console.info('\x1b[36m%s\x1b[0m', `🔍 Token Refresh Details:`, {
      sessionId: sessionId,
      oldExpiry: new Date(oldExpiry).toISOString(),
      newExpiry: new Date(session.tokens.expires_at).toISOString(),
      expiresIn: refreshResult.expires_in,
      hasNewRefreshToken: !!refreshResult.refresh_token
    });

    return true;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Token refresh error for session ${sessionId}:`, error.message);
    return false;
  }
};

// Background token refresh service
const refreshActiveTokens = async () => {
  const now = Date.now();
  const refreshThreshold = 5 * 60 * 1000; // Refresh tokens 5 minutes before expiry
  let refreshedCount = 0;
  let failedCount = 0;

  console.info('\x1b[36m%s\x1b[0m', `🔄 Starting background token refresh check (${webAuthSessions.size} active sessions)`);

  for (const [sessionId, session] of webAuthSessions.entries()) {
    // Only refresh authenticated sessions with tokens
    if (!session.authenticated || !session.tokens?.access_token || !session.tokens?.refresh_token) {
      continue;
    }

    // Check if token expires within the refresh threshold
    const tokenExpiresAt = session.tokens.expires_at;
    if (tokenExpiresAt && (tokenExpiresAt - now) <= refreshThreshold) {
      console.info('\x1b[33m%s\x1b[0m', `⏰ Token expiring soon for session ${sessionId}, attempting refresh...`);
      
      const refreshSuccess = await refreshWebAuthToken(sessionId, session);
      if (refreshSuccess) {
        refreshedCount++;
      } else {
        failedCount++;
        // Remove session if refresh failed
        webAuthSessions.delete(sessionId);
        console.warn('\x1b[33m%s\x1b[0m', `🗑️  Removed session ${sessionId} due to refresh failure`);
      }
    }
  }

  if (refreshedCount > 0 || failedCount > 0) {
    console.info('\x1b[32m%s\x1b[0m', `✅ Background token refresh completed: ${refreshedCount} refreshed, ${failedCount} failed`);
  }
};

// Run web session cleanup every 5 minutes
setInterval(cleanupExpiredWebSessions, 5 * 60 * 1000);

// Run background token refresh every 2 minutes
setInterval(refreshActiveTokens, 2 * 60 * 1000);

// Helper function to decode JWT token and extract expiry
const decodeJWTExpiry = (token) => {
  try {
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    // Return expiry time in milliseconds (exp is in seconds)
    return payload.exp ? payload.exp * 1000 : null;
  } catch (error) {
    debugLog(`Error decoding JWT token: ${error.message}`);
    return null;
  }
};

// Helper function to clean up expired sessions
const cleanupExpiredSessions = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [chatId, session] of sessionState.entries()) {
    if (session.expiresAt && session.expiresAt < now) {
      sessionState.delete(chatId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    debugLog(`Cleaned up ${cleanedCount} expired sessions`);
  }
};

// Run session cleanup every 5 minutes
setInterval(cleanupExpiredSessions, 5 * 60 * 1000);

// Resolve debug setting with per-chatflow override capability
const resolveDebugSetting = (chatflow) => {
  const globalDebug = config.debug === true;
  const chatflowDebug = chatflow.debug === true;
  
  // Enable debug if either global debug is true OR chatflow debug overrides to true
  const shouldEnableDebug = globalDebug || chatflowDebug;
  
  if (shouldEnableDebug) {
    if (globalDebug && chatflowDebug) {
      debugLog(`Debug enabled for ${chatflow.identifier}: Global debug=true, Chatflow debug=true`);
    } else if (globalDebug && !chatflowDebug) {
      debugLog(`Debug enabled for ${chatflow.identifier}: Global debug=true (chatflow debug=false ignored)`);
    } else if (!globalDebug && chatflowDebug) {
      debugLog(`Debug enabled for ${chatflow.identifier}: Chatflow debug=true overriding global debug=false`);
    }
  } else {
    debugLog(`Debug disabled for ${chatflow.identifier}: Global debug=false, Chatflow debug=false`);
  }
  
  return shouldEnableDebug;
};

// Validate required configuration
if (!config.apiHost) {
  console.error('apiHost is not set in configuration');
  process.exit(1);
}

if (!config.flowiseApiKey) {
  console.error('flowiseApiKey is not set in configuration');
  process.exit(1);
}

if (!config.chatflows || !Array.isArray(config.chatflows) || config.chatflows.length === 0) {
  console.error('No chatflows configured');
  process.exit(1);
}

// Create chatflows map for quick lookup
const chatflows = new Map();
const oauthConfigs = new Map();

for (const chatflow of config.chatflows) {
  if (!chatflow.identifier || !chatflow.chatflowId) {
    console.error('Invalid chatflow configuration: missing identifier or chatflowId');
    continue;
  }
  
  // Default domains for development
  const defaultDomains = process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5678'];
  const domains = [...new Set([...defaultDomains, ...(chatflow.allowedDomains || [])])];
  
  if (domains.includes('*')) {
    console.error(`\x1b[31mError: Wildcard (*) domains are not allowed in ${chatflow.identifier}. This flow will not be accessible.\x1b[0m`);
    continue;
  }
  
  chatflows.set(chatflow.identifier, {
    chatflowId: chatflow.chatflowId,
    domains: domains,
    debug: chatflow.debug,
    identifier: chatflow.identifier
  });
  
  // Store OAuth configuration if present
  if (chatflow.oauth) {
    const authType = chatflow.oauth.authType || 'spa'; // Default to SPA if not specified
    const defaultRedirectUri = authType === 'web'
      ? `http://localhost:${config.port || 3005}/callback`
      : (config.oauthRedirectUri || 'https://chatbot.lab.calstate.ai/oauth-callback.html');
    
    oauthConfigs.set(chatflow.identifier, {
      mode: chatflow.oauth.mode || 'optional', // Default to 'optional' if not specified
      authType: authType,
      clientId: chatflow.oauth.clientId,
      clientSecret: chatflow.oauth.clientSecret || null,
      authority: chatflow.oauth.authority,
      redirectUri: chatflow.oauth.redirectUri || defaultRedirectUri,
      scope: chatflow.oauth.scope || 'openid profile email',
      responseType: chatflow.oauth.responseType || 'code',
      prompt: chatflow.oauth.prompt || 'select_account',
      // IDP-agnostic endpoint configuration
      tokenEndpoint: chatflow.oauth.tokenEndpoint,
      userInfoEndpoint: chatflow.oauth.userInfoEndpoint,
      authorizationEndpoint: chatflow.oauth.authorizationEndpoint,
      jwksUri: chatflow.oauth.jwksUri,
      issuer: chatflow.oauth.issuer
    });
  }
}

if (chatflows.size === 0) {
  console.error('No valid chatflow configurations found');
  process.exit(1);
}

const getChatflowDetails = (identifier) => {
  let chatflow = chatflows.get(identifier);

  if (!chatflow) {
    const lowerIdentifier = identifier.toLowerCase();
    for (const [key, value] of chatflows.entries()) {
      if (key.toLowerCase() === lowerIdentifier) {
        chatflow = value;
        break;
      }
    }
  }

  if (!chatflow) {
    throw new Error(`Chatflow not found: ${identifier}`);
  }
  return chatflow;
};

const isValidUUID = (str) => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
};

const isValidChatflowConfig = (value) => {
  if (!value) return false;
  return isValidUUID(value);
};

// OAuth endpoint discovery function for IDP-agnostic authentication
const discoverOAuthEndpoints = async (oauthConfig) => {
  const endpoints = {
    tokenEndpoint: oauthConfig.tokenEndpoint,
    userInfoEndpoint: oauthConfig.userInfoEndpoint,
    authorizationEndpoint: oauthConfig.authorizationEndpoint,
    jwksUri: oauthConfig.jwksUri,
    issuer: oauthConfig.issuer
  };

  console.info('\x1b[36m%s\x1b[0m', `🔍 OAuth endpoint discovery for ${oauthConfig.authority}`);
  console.info('\x1b[36m%s\x1b[0m', `🔍 Explicit endpoints provided:`, {
    tokenEndpoint: !!endpoints.tokenEndpoint,
    userInfoEndpoint: !!endpoints.userInfoEndpoint,
    authorizationEndpoint: !!endpoints.authorizationEndpoint
  });

  // If all required endpoints are explicitly configured, use them
  if (endpoints.tokenEndpoint && endpoints.userInfoEndpoint && endpoints.authorizationEndpoint) {
    console.info('\x1b[32m%s\x1b[0m', `✅ Using explicit OAuth endpoints for ${oauthConfig.authority}`);
    console.info('\x1b[32m%s\x1b[0m', `   - Authorization: ${endpoints.authorizationEndpoint}`);
    console.info('\x1b[32m%s\x1b[0m', `   - Token: ${endpoints.tokenEndpoint}`);
    console.info('\x1b[32m%s\x1b[0m', `   - UserInfo: ${endpoints.userInfoEndpoint}`);
    return endpoints;
  }

  // Try OpenID Connect Discovery
  try {
    const discoveryUrl = `${oauthConfig.authority}/.well-known/openid_configuration`;
    console.info('\x1b[36m%s\x1b[0m', `🔍 Attempting OIDC discovery from: ${discoveryUrl}`);
    
    const response = await fetch(discoveryUrl);
    if (response.ok) {
      const discoveryDoc = await response.json();
      console.info('\x1b[32m%s\x1b[0m', `✅ OIDC discovery successful for ${oauthConfig.authority}`);
      
      const discoveredEndpoints = {
        tokenEndpoint: endpoints.tokenEndpoint || discoveryDoc.token_endpoint,
        userInfoEndpoint: endpoints.userInfoEndpoint || discoveryDoc.userinfo_endpoint,
        authorizationEndpoint: endpoints.authorizationEndpoint || discoveryDoc.authorization_endpoint,
        jwksUri: endpoints.jwksUri || discoveryDoc.jwks_uri,
        issuer: endpoints.issuer || discoveryDoc.issuer
      };
      
      console.info('\x1b[32m%s\x1b[0m', `   - Authorization: ${discoveredEndpoints.authorizationEndpoint}`);
      console.info('\x1b[32m%s\x1b[0m', `   - Token: ${discoveredEndpoints.tokenEndpoint}`);
      console.info('\x1b[32m%s\x1b[0m', `   - UserInfo: ${discoveredEndpoints.userInfoEndpoint}`);
      
      return discoveredEndpoints;
    }
  } catch (error) {
    console.warn('\x1b[33m%s\x1b[0m', `⚠️  OIDC discovery failed for ${oauthConfig.authority}: ${error.message}`);
  }

  // Fallback: construct generic OAuth 2.0 endpoints (avoid Microsoft-specific paths)
  console.warn('\x1b[33m%s\x1b[0m', `⚠️  Using fallback endpoint construction for ${oauthConfig.authority}`);
  
  const baseUrl = oauthConfig.authority.replace(/\/$/, ''); // Remove trailing slash
  
  const fallbackEndpoints = {
    tokenEndpoint: endpoints.tokenEndpoint || `${baseUrl}/oauth/token`,
    userInfoEndpoint: endpoints.userInfoEndpoint || `${baseUrl}/oauth/userinfo`,
    authorizationEndpoint: endpoints.authorizationEndpoint || `${baseUrl}/oauth/authorize`,
    jwksUri: endpoints.jwksUri || `${baseUrl}/oauth/jwks`,
    issuer: endpoints.issuer || baseUrl
  };
  
  console.warn('\x1b[33m%s\x1b[0m', `   - Authorization: ${fallbackEndpoints.authorizationEndpoint}`);
  console.warn('\x1b[33m%s\x1b[0m', `   - Token: ${fallbackEndpoints.tokenEndpoint}`);
  console.warn('\x1b[33m%s\x1b[0m', `   - UserInfo: ${fallbackEndpoints.userInfoEndpoint}`);
  
  return fallbackEndpoints;
};

console.info('\x1b[36m%s\x1b[0m', 'Configured chatflows:');
chatflows.forEach((config, identifier) => {
  if (isValidChatflowConfig(config.chatflowId)) {
    console.info('\x1b[36m%s\x1b[0m', `  ${identifier}: ${config.chatflowId} (${config.domains.join(', ')})`);
  }
});

console.info('\x1b[33m%s\x1b[0m', 'Configured OAuth:');
if (oauthConfigs.size > 0) {
  oauthConfigs.forEach((oauthConfig, identifier) => {
    console.info('\x1b[33m%s\x1b[0m', `  ${identifier}: ${oauthConfig.authority} (${oauthConfig.clientId})`);
  });
} else {
  console.info('\x1b[33m%s\x1b[0m', '  No OAuth configurations found');
}

const isValidDomain = (origin, domains) => {
  if (!origin) return true;
  return domains.includes(origin);
};

const app = express();

// CORS middleware - must be first
app.use(
  cors({
    origin: '*',
    credentials: false, // Must be false when origin is '*'
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['*'],
    exposedHeaders: ['*'],
    preflightContinue: false,
    optionsSuccessStatus: 200
  }),
);

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const origin = req.headers.origin || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  console.info('\x1b[90m%s\x1b[0m', `📨 ${timestamp} - ${method} ${url} (origin: ${origin})`);
  
  // Debug: Check for multipart requests at the very beginning
  if (req.url.includes('/attachments/') && req.method === 'POST') {
    console.info('\x1b[36m%s\x1b[0m', `🔍 RAW REQUEST DEBUG: Attachment request detected`);
    console.info('\x1b[36m%s\x1b[0m', `🔍 RAW REQUEST DEBUG: Raw Content-Type header: "${req.headers['content-type']}"`);
    
    // Check if boundary is present in the raw header
    const rawContentType = req.headers['content-type'];
    if (rawContentType && rawContentType.includes('multipart/form-data')) {
      const boundaryMatch = rawContentType.match(/boundary=([^;]+)/);
      const boundary = boundaryMatch ? boundaryMatch[1] : null;
      console.info('\x1b[36m%s\x1b[0m', `🔍 RAW REQUEST DEBUG: Raw boundary extracted: "${boundary}"`);
      
      if (boundary) {
        console.info('\x1b[32m%s\x1b[0m', `✅ RAW REQUEST DEBUG: Boundary IS present in original request!`);
      } else {
        console.error('\x1b[31m%s\x1b[0m', `❌ RAW REQUEST DEBUG: Boundary NOT present in original request!`);
      }
    } else {
      console.error('\x1b[31m%s\x1b[0m', `❌ RAW REQUEST DEBUG: Not multipart/form-data in original request!`);
    }
    
    // Log all headers for debugging
    console.info('\x1b[36m%s\x1b[0m', `🔍 RAW REQUEST DEBUG: All raw headers:`);
    Object.keys(req.headers).forEach(key => {
      console.info('\x1b[36m%s\x1b[0m', `🔍   ${key}: ${req.headers[key]}`);
    });
  }
  
  next();
});

// File upload middleware - must be declared before use
const upload = multer({ storage: multer.memoryStorage() });

// Attachment upload endpoint - MUST be before body parsing middleware to preserve multipart data
// This endpoint forwards form data directly without intermediate processing
app.post('/api/v1/attachments/:identifier/:chatId', (req, res, next) => {
  // Skip all Express body parsing and handle raw request
  req.rawBody = [];
  req.on('data', chunk => {
    req.rawBody.push(chunk);
  });
  req.on('end', () => {
    req.rawBody = Buffer.concat(req.rawBody);
    next();
  });
}, async (req, res) => {
  const { identifier, chatId } = req.params;
  
  try {
    const chatflow = getChatflowDetails(identifier);
    
    console.info('\x1b[35m%s\x1b[0m', `🔍 ATTACHMENT DEBUG: Starting upload - identifier: ${identifier}, chatId: ${chatId}`);
    
    // Debug: Log all incoming headers
    console.info('\x1b[35m%s\x1b[0m', `🔍 ATTACHMENT DEBUG: Incoming headers:`);
    Object.keys(req.headers).forEach(key => {
      console.info('\x1b[35m%s\x1b[0m', `🔍   ${key}: ${req.headers[key]}`);
    });
    
    // Check if this is actually multipart form data
    let contentType = req.headers['content-type'];
    console.info('\x1b[35m%s\x1b[0m', `🔍 ATTACHMENT DEBUG: Content-Type: "${contentType}"`);
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      console.warn('\x1b[33m%s\x1b[0m', `⚠️  Attachment upload failed: Not multipart form data (identifier: ${identifier})`);
      console.warn('\x1b[33m%s\x1b[0m', `⚠️  Received Content-Type: "${contentType}"`);
      return res.status(400).json({ error: 'Request must be multipart/form-data' });
    }
    
    // Extract and validate boundary
    let boundaryMatch = contentType.match(/boundary=([^;]+)/);
    let boundary = boundaryMatch ? boundaryMatch[1] : null;
    console.info('\x1b[35m%s\x1b[0m', `🔍 ATTACHMENT DEBUG: Extracted boundary: "${boundary}"`);
    
    // If no boundary in header, try to extract from raw body data
    if (!boundary && req.rawBody) {
      console.warn('\x1b[33m%s\x1b[0m', `⚠️  ATTACHMENT DEBUG: No boundary in header, attempting to extract from body data`);
      
      // Look for boundary in the first few lines of the raw body
      const bodyStart = req.rawBody.toString('utf8', 0, Math.min(200, req.rawBody.length));
      console.info('\x1b[35m%s\x1b[0m', `🔍 ATTACHMENT DEBUG: Body start: "${bodyStart.replace(/\r?\n/g, '\\n')}"`);
      
      // Multipart data typically starts with --boundary
      const bodyBoundaryMatch = bodyStart.match(/^--([^\r\n]+)/);
      if (bodyBoundaryMatch) {
        boundary = bodyBoundaryMatch[1];
        console.info('\x1b[32m%s\x1b[0m', `✅ ATTACHMENT DEBUG: Extracted boundary from body: "${boundary}"`);
        
        // Update the Content-Type header to include the boundary
        const updatedContentType = `multipart/form-data; boundary=${boundary}`;
        console.info('\x1b[32m%s\x1b[0m', `✅ ATTACHMENT DEBUG: Updated Content-Type: "${updatedContentType}"`);
        
        // We'll use the updated content type for the upstream request
        contentType = updatedContentType;
      } else {
        console.error('\x1b[31m%s\x1b[0m', `❌ ATTACHMENT DEBUG: Could not extract boundary from body data either`);
        return res.status(400).json({ error: 'Multipart boundary not found in Content-Type header or body data' });
      }
    }
    
    if (!boundary) {
      console.error('\x1b[31m%s\x1b[0m', `❌ ATTACHMENT DEBUG: No boundary found in Content-Type header`);
      return res.status(400).json({ error: 'Multipart boundary not found in Content-Type header' });
    }
    
    const apiUrl = `${config.apiHost}/api/v1/attachments/${chatflow.chatflowId}/${chatId}`;
    console.info('\x1b[34m%s\x1b[0m', `📤 API Call (streaming): POST ${apiUrl} (identifier: ${identifier})`);
    
    // Log content length if available for size monitoring
    const contentLength = req.headers['content-length'];
    if (contentLength) {
      const sizeInMB = (parseInt(contentLength) / 1024 / 1024).toFixed(2);
      console.info('\x1b[35m%s\x1b[0m', `🔍 ATTACHMENT DEBUG: Content-Length: ${contentLength} bytes (${sizeInMB} MB)`);
      
      // Check if the upload size is reasonable (warn if > 50MB)
      if (parseInt(contentLength) > 50 * 1024 * 1024) {
        console.warn('\x1b[33m%s\x1b[0m', `⚠️  Large upload detected: ${sizeInMB} MB - this may exceed server limits`);
      }
    } else {
      console.info('\x1b[35m%s\x1b[0m', `🔍 ATTACHMENT DEBUG: No Content-Length header present`);
    }
    
    // Debug: Log the raw body buffer info
    console.info('\x1b[35m%s\x1b[0m', `🔍 ATTACHMENT DEBUG: Raw body buffer size: ${req.rawBody ? req.rawBody.length : 'null'} bytes`);
    
    // Prepare headers for upstream request
    const upstreamHeaders = {
      'Authorization': `Bearer ${config.flowiseApiKey}`,
      'Content-Type': contentType, // Use the corrected content-type with boundary
    };
    
    // Forward content-length if present
    if (contentLength) {
      upstreamHeaders['Content-Length'] = contentLength;
    }
    
    console.info('\x1b[35m%s\x1b[0m', `🔍 ATTACHMENT DEBUG: Upstream headers being sent:`);
    Object.keys(upstreamHeaders).forEach(key => {
      console.info('\x1b[35m%s\x1b[0m', `🔍   ${key}: ${upstreamHeaders[key]}`);
    });
    
    console.info('\x1b[35m%s\x1b[0m', `🔍 ATTACHMENT DEBUG: About to make axios request to: ${apiUrl}`);
    
    // Create axios request with raw buffer data
    const response = await axios({
      method: 'POST',
      url: apiUrl,
      headers: upstreamHeaders,
      data: req.rawBody, // Use the raw buffer data
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 300000, // 5 minute timeout for large uploads
    });
    
    console.info('\x1b[32m%s\x1b[0m', `📥 API Response: ${response.status} ${response.statusText} (identifier: ${identifier})`);
    console.info('\x1b[35m%s\x1b[0m', `🔍 ATTACHMENT DEBUG: Response headers:`);
    Object.keys(response.headers || {}).forEach(key => {
      console.info('\x1b[35m%s\x1b[0m', `🔍   ${key}: ${response.headers[key]}`);
    });
    
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Attachment upload error: ${error.response?.status || 'Unknown'} - ${error.message} (identifier: ${identifier})`);
    
    // Enhanced error debugging
    console.error('\x1b[31m%s\x1b[0m', `❌ ATTACHMENT DEBUG: Error details:`);
    console.error('\x1b[31m%s\x1b[0m', `❌   Error message: ${error.message}`);
    console.error('\x1b[31m%s\x1b[0m', `❌   Error code: ${error.code || 'N/A'}`);
    console.error('\x1b[31m%s\x1b[0m', `❌   Response status: ${error.response?.status || 'N/A'}`);
    console.error('\x1b[31m%s\x1b[0m', `❌   Response statusText: ${error.response?.statusText || 'N/A'}`);
    
    if (error.response?.data) {
      console.error('\x1b[31m%s\x1b[0m', `❌   Response data:`, error.response.data);
    }
    
    if (error.response?.headers) {
      console.error('\x1b[31m%s\x1b[0m', `❌   Response headers:`);
      Object.keys(error.response.headers).forEach(key => {
        console.error('\x1b[31m%s\x1b[0m', `❌     ${key}: ${error.response.headers[key]}`);
      });
    }
    
    // Handle specific error cases
    if (error.response?.status === 413) {
      console.error('\x1b[31m%s\x1b[0m', `❌ File too large - FlowWise server rejected the upload (413 Request Entity Too Large)`);
      res.status(413).json({
        error: 'File too large. Please try uploading a smaller file or reduce the image size.',
        details: 'The FlowWise server has a file size limit that was exceeded.'
      });
    } else {
      res.status(error.response?.status || 500).json({
        error: error.response?.data || 'Internal server error'
      });
    }
  }
});

// Body parsing middleware - MUST be after the attachments endpoint
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle OPTIONS preflight for /web.js
app.options('/web.js', (req, res) => {
  const origin = req.headers.origin;
  const allAllowedDomains = Array.from(chatflows.values()).flatMap((config) => config.domains);

  if (!isValidDomain(origin, allAllowedDomains)) {
    return res.status(403).send('Access Denied');
  }

  res.set({
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Credentials': 'false',
  });
  res.status(200).end();
});

app.get('/web.js', (req, res) => {
  const origin = req.headers.origin;

  const allAllowedDomains = Array.from(chatflows.values()).flatMap((config) => config.domains);

  if (!isValidDomain(origin, allAllowedDomains)) {
    return res.status(403).send('Access Denied');
  }

  res.set({
    'Content-Type': 'application/javascript',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Credentials': 'false',
  });
  res.sendFile(path.join(__dirname, 'public', 'web.js'));
});

// Web authentication initiation endpoint
app.post('/api/auth/login/:identifier', async (req, res) => {
  const { identifier } = req.params;
  const { sessionId } = req.body;
  
  console.info('\x1b[35m%s\x1b[0m', `🔐 Web Auth Login Request: POST /api/auth/login/${identifier}`);
  
  try {
    // Check if chatflow exists
    const chatflow = getChatflowDetails(identifier);
    
    // Get OAuth config for this identifier
    const oauthConfig = oauthConfigs.get(identifier);
    if (!oauthConfig) {
      console.warn('\x1b[33m%s\x1b[0m', `⚠️  Web auth failed: No OAuth configuration (identifier: ${identifier})`);
      return res.status(404).json({ error: 'OAuth configuration not found for this chatflow' });
    }
    
    // Verify this is configured for web authentication
    if (oauthConfig.authType !== 'web') {
      console.warn('\x1b[33m%s\x1b[0m', `⚠️  Web auth failed: Not configured for web auth (identifier: ${identifier}, authType: ${oauthConfig.authType})`);
      return res.status(400).json({ error: 'This chatflow is not configured for web authentication' });
    }
    
    // Generate session ID if not provided
    const finalSessionId = sessionId || await generateSessionId();
    
    // Generate state parameter with session ID
    const state = Buffer.from(`${finalSessionId}|${Date.now()}`).toString('base64');
    
    // Discover OAuth endpoints for IDP-agnostic authentication
    const discoveredEndpoints = await discoverOAuthEndpoints(oauthConfig);
    
    // Build authorization URL using discovered endpoint
    const authUrl = new URL(discoveredEndpoints.authorizationEndpoint);
    authUrl.searchParams.set('client_id', oauthConfig.clientId);
    authUrl.searchParams.set('response_type', oauthConfig.responseType);
    authUrl.searchParams.set('redirect_uri', oauthConfig.redirectUri);
    authUrl.searchParams.set('scope', oauthConfig.scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', oauthConfig.prompt);
    
    console.info('\x1b[36m%s\x1b[0m', `🔍 Using authorization endpoint: ${discoveredEndpoints.authorizationEndpoint}`);
    
    // Store session state
    webAuthSessions.set(finalSessionId, {
      sessionId: finalSessionId,
      identifier: identifier,
      state: state,
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
      authType: 'web'
    });
    
    console.info('\x1b[32m%s\x1b[0m', `✅ Web auth initiated (identifier: ${identifier}, sessionId: ${finalSessionId})`);
    
    res.json({
      authUrl: authUrl.toString(),
      sessionId: finalSessionId,
      state: state
    });
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Web auth initiation failed: ${error.message} (identifier: ${identifier})`);
    res.status(500).json({ error: 'Failed to initiate web authentication' });
  }
});

// Web authentication callback endpoint
app.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;
  
  console.info('\x1b[35m%s\x1b[0m', `🔐 Web Auth Callback: GET /callback`);
  
  try {
    if (error) {
      console.error('\x1b[31m%s\x1b[0m', `❌ OAuth error in callback: ${error} - ${error_description}`);
      return res.status(400).send(`
        <html>
          <head>
            <title>Authentication Error - Flowise Chat Embed</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
              }
              .error {
                color: #f87171;
              }
              h1 {
                margin-bottom: 20px;
              }
              p {
                margin: 10px 0;
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Authentication Error</h1>
              <p>Error: ${error}</p>
              <p>Description: ${error_description || 'No description provided'}</p>
            </div>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }
    
    if (!code || !state) {
      console.error('\x1b[31m%s\x1b[0m', `❌ Missing code or state in callback`);
      return res.status(400).send(`
        <html>
          <head>
            <title>Authentication Error - Flowise Chat Embed</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
              }
              .error {
                color: #f87171;
              }
              h1 {
                margin-bottom: 20px;
              }
              p {
                margin: 0;
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Authentication Error</h1>
              <p>Missing authorization code or state parameter</p>
            </div>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }
    
    // Decode state to get session ID
    const decodedState = Buffer.from(state, 'base64').toString();
    const [sessionId] = decodedState.split('|');
    
    // Find the session
    const session = webAuthSessions.get(sessionId);
    if (!session) {
      console.error('\x1b[31m%s\x1b[0m', `❌ Session not found for sessionId: ${sessionId}`);
      return res.status(400).send(`
        <html>
          <head>
            <title>Authentication Error - Flowise Chat Embed</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
              }
              .error {
                color: #f87171;
              }
              h1 {
                margin-bottom: 20px;
              }
              p {
                margin: 0;
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Authentication Error</h1>
              <p>Session not found or expired</p>
            </div>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }
    
    // Validate state
    if (session.state !== state) {
      console.error('\x1b[31m%s\x1b[0m', `❌ State mismatch for sessionId: ${sessionId}`);
      return res.status(400).send(`
        <html>
          <head>
            <title>Authentication Error - Flowise Chat Embed</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
              }
              .error {
                color: #f87171;
              }
              h1 {
                margin-bottom: 20px;
              }
              p {
                margin: 0;
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Authentication Error</h1>
              <p>Invalid state parameter</p>
            </div>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }
    
    // Get OAuth config
    const oauthConfig = oauthConfigs.get(session.identifier);
    if (!oauthConfig) {
      console.error('\x1b[31m%s\x1b[0m', `❌ OAuth config not found for identifier: ${session.identifier}`);
      return res.status(500).send(`
        <html>
          <head>
            <title>Authentication Error - Flowise Chat Embed</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
              }
              .error {
                color: #f87171;
              }
              h1 {
                margin-bottom: 20px;
              }
              p {
                margin: 0;
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Authentication Error</h1>
              <p>OAuth configuration not found</p>
            </div>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }
    
    // Discover OAuth endpoints for IDP-agnostic authentication
    const discoveredEndpoints = await discoverOAuthEndpoints(oauthConfig);
    
    // Exchange code for tokens
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: oauthConfig.clientId,
      client_secret: oauthConfig.clientSecret,
      code: code,
      redirect_uri: oauthConfig.redirectUri
    });
    
    console.info('\x1b[36m%s\x1b[0m', `🔍 Exchanging code for tokens at: ${discoveredEndpoints.tokenEndpoint}`);
    
    const tokenResponse = await fetch(discoveredEndpoints.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenParams.toString()
    });
    
    const tokenResult = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('\x1b[31m%s\x1b[0m', `❌ Token exchange failed:`, tokenResult);
    } else {
      // Debug: Log token exchange success and scope details
      console.info('\x1b[32m%s\x1b[0m', `✅ Token exchange successful for session: ${sessionId}`);
      console.info('\x1b[36m%s\x1b[0m', `🔍 Token Details:`, {
        token_type: tokenResult.token_type,
        expires_in: tokenResult.expires_in,
        scope: tokenResult.scope,
        has_access_token: !!tokenResult.access_token,
        has_refresh_token: !!tokenResult.refresh_token,
        has_id_token: !!tokenResult.id_token
      });
      
      if (tokenResult.scope) {
        console.info('\x1b[36m%s\x1b[0m', `🔍 Granted Scopes: ${tokenResult.scope}`);
      }
    }
    
    if (!tokenResponse.ok) {
      return res.status(500).send(`
        <html>
          <head>
            <title>Authentication Error - Flowise Chat Embed</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
              }
              .container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
              }
              .error {
                color: #f87171;
              }
              h1 {
                margin-bottom: 20px;
              }
              p {
                margin: 0;
                opacity: 0.9;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="error">Authentication Error</h1>
              <p>Failed to exchange authorization code for tokens</p>
            </div>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    }
    
    // Get user info using discovered endpoint
    console.info('\x1b[36m%s\x1b[0m', `🔍 Fetching user info from: ${discoveredEndpoints.userInfoEndpoint}`);
    
    const userInfoResponse = await fetch(discoveredEndpoints.userInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${tokenResult.access_token}`,
        'Accept': 'application/json'
      }
    });
    
    let userInfo = {};
    if (userInfoResponse.ok) {
      userInfo = await userInfoResponse.json();
      console.info('\x1b[32m%s\x1b[0m', `✅ User info retrieved successfully from userinfo endpoint`);
      
      // Debug: Log detailed user profile information
      console.info('\x1b[36m%s\x1b[0m', `🔍 User Profile Details:`, {
        sub: userInfo.sub || 'N/A',
        email: userInfo.email || 'N/A',
        email_verified: userInfo.email_verified || 'N/A',
        name: userInfo.name || 'N/A',
        given_name: userInfo.given_name || 'N/A',
        family_name: userInfo.family_name || 'N/A',
        preferred_username: userInfo.preferred_username || 'N/A',
        picture: userInfo.picture || 'N/A'
      });
      
      // Log all available fields for debugging
      console.info('\x1b[36m%s\x1b[0m', `🔍 Complete User Info Object:`, userInfo);
    } else {
      const errorText = await userInfoResponse.text();
      console.error('\x1b[31m%s\x1b[0m', `❌ Failed to fetch user info (${userInfoResponse.status}):`, errorText);
      // For debugging, let's still try to get some basic info from the ID token if available
      if (tokenResult.id_token) {
        try {
          const idTokenPayload = JSON.parse(Buffer.from(tokenResult.id_token.split('.')[1], 'base64').toString());
          userInfo = {
            sub: idTokenPayload.sub,
            email: idTokenPayload.email || idTokenPayload.preferred_username,
            name: idTokenPayload.name,
            given_name: idTokenPayload.given_name,
            family_name: idTokenPayload.family_name
          };
          console.info('\x1b[33m%s\x1b[0m', `⚠️  Using ID token claims as fallback for user info`);
          
          // Debug: Log detailed user profile information from ID token
          console.info('\x1b[36m%s\x1b[0m', `🔍 ID Token Profile Details:`, {
            sub: userInfo.sub || 'N/A',
            email: userInfo.email || 'N/A',
            name: userInfo.name || 'N/A',
            given_name: userInfo.given_name || 'N/A',
            family_name: userInfo.family_name || 'N/A',
            preferred_username: userInfo.preferred_username || 'N/A'
          });
          
          // Log complete ID token payload for debugging
          console.info('\x1b[36m%s\x1b[0m', `🔍 Complete ID Token Payload:`, idTokenPayload);
        } catch (idTokenError) {
          console.error('\x1b[31m%s\x1b[0m', `❌ Failed to parse ID token:`, idTokenError.message);
        }
      }
    }
    
    // Update session with tokens and user info
    session.tokens = {
      access_token: tokenResult.access_token,
      token_type: tokenResult.token_type,
      expires_in: tokenResult.expires_in || 3600,
      expires_at: Date.now() + (tokenResult.expires_in || 3600) * 1000,
      refresh_token: tokenResult.refresh_token,
      id_token: tokenResult.id_token,
      scope: tokenResult.scope
    };
    session.userInfo = userInfo;
    session.authenticated = true;
    
    console.info('\x1b[32m%s\x1b[0m', `✅ Web auth completed successfully`);
    console.info('\x1b[36m%s\x1b[0m', `🔍 Session Summary:`, {
      identifier: session.identifier,
      sessionId: sessionId,
      userEmail: userInfo.email || 'N/A',
      userSub: userInfo.sub || 'N/A',
      userName: userInfo.name || 'N/A',
      givenName: userInfo.given_name || 'N/A',
      familyName: userInfo.family_name || 'N/A',
      hasTokens: !!session.tokens,
      hasUserInfo: !!session.userInfo,
      tokenScope: session.tokens?.scope || 'N/A',
      sessionExpiresAt: new Date(session.expiresAt).toISOString()
    });
    
    // Return success page
    res.send(`
      <html>
        <head>
          <title>Authentication Successful - Flowise Chat Embed</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              background: rgba(255, 255, 255, 0.1);
              padding: 30px;
              border-radius: 10px;
              backdrop-filter: blur(10px);
            }
            .success {
              color: #4ade80;
            }
            h1 {
              margin-bottom: 20px;
            }
            p {
              margin: 0;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">Authentication Successful!</h1>
            <p>You have been successfully authenticated. You can now close this window and return to the chat.</p>
          </div>
          <script>
            // Notify parent window if opened as popup
            if (window.opener) {
              window.opener.postMessage({
                type: 'web-auth-success',
                sessionId: '${sessionId}'
              }, '*');
            }
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Web auth callback error: ${error.message}`);
    res.status(500).send(`
      <html>
        <head>
          <title>Authentication Error - Flowise Chat Embed</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              background: rgba(255, 255, 255, 0.1);
              padding: 30px;
              border-radius: 10px;
              backdrop-filter: blur(10px);
            }
            .error {
              color: #f87171;
            }
            h1 {
              margin-bottom: 20px;
            }
            p {
              margin: 0;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Authentication Error</h1>
            <p>An unexpected error occurred during authentication</p>
          </div>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  }
});

// Session exchange endpoint
app.post('/api/auth/exchange/:identifier', (req, res) => {
  const { identifier } = req.params;
  const { sessionId } = req.body;
  
  console.info('\x1b[35m%s\x1b[0m', `🔐 Session Exchange Request: POST /api/auth/exchange/${identifier}`);
  
  try {
    // Find the session
    const session = webAuthSessions.get(sessionId);
    if (!session || !session.authenticated) {
      console.warn('\x1b[33m%s\x1b[0m', `⚠️  Session not found or not authenticated (sessionId: ${sessionId})`);
      return res.status(404).json({ error: 'Session not found or not authenticated' });
    }
    
    // Verify session belongs to this identifier
    if (session.identifier !== identifier) {
      console.warn('\x1b[33m%s\x1b[0m', `⚠️  Session identifier mismatch (sessionId: ${sessionId}, expected: ${identifier}, got: ${session.identifier})`);
      return res.status(403).json({ error: 'Session identifier mismatch' });
    }
    
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      console.warn('\x1b[33m%s\x1b[0m', `⚠️  Session expired (sessionId: ${sessionId})`);
      webAuthSessions.delete(sessionId);
      return res.status(401).json({ error: 'Session expired' });
    }
    
    console.info('\x1b[32m%s\x1b[0m', `✅ Session exchange successful (identifier: ${identifier}, sessionId: ${sessionId})`);
    
    // Return session info for frontend
    res.json({
      sessionId: sessionId,
      userInfo: session.userInfo,
      expiresAt: session.expiresAt,
      authType: 'web'
    });
    
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Session exchange error: ${error.message} (identifier: ${identifier})`);
    res.status(500).json({ error: 'Session exchange failed' });
  }
});

// OAuth configuration endpoint
app.get('/api/auth/config/:identifier', (req, res) => {
  const { identifier } = req.params;
  const apiKey = req.headers['x-oauth-api-key'];
  
  console.info('\x1b[35m%s\x1b[0m', `🔐 OAuth Config Request: GET /api/auth/config/${identifier}`);
  
  // Validate API key if configured
  if (config.oauthApiKey && apiKey !== config.oauthApiKey) {
    console.warn('\x1b[33m%s\x1b[0m', `⚠️  OAuth config failed: Invalid API key (identifier: ${identifier})`);
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  // Check if chatflow exists
  try {
    getChatflowDetails(identifier);
  } catch (error) {
    console.warn('\x1b[33m%s\x1b[0m', `⚠️  OAuth config failed: Chatflow not found (identifier: ${identifier})`);
    return res.status(404).json({ error: 'Chatflow not found' });
  }
  
  // Get OAuth config for this identifier
  const oauthConfig = oauthConfigs.get(identifier);
  if (!oauthConfig) {
    console.warn('\x1b[33m%s\x1b[0m', `⚠️  OAuth config failed: No OAuth configuration (identifier: ${identifier})`);
    return res.status(404).json({ error: 'OAuth configuration not found for this chatflow' });
  }
  
  console.info('\x1b[32m%s\x1b[0m', `✅ OAuth config provided (identifier: ${identifier}, authority: ${oauthConfig.authority})`);
  
  // Return OAuth configuration
  res.json({
    mode: oauthConfig.mode, // Use mode from chatflow configuration
    oauth: {
      clientId: oauthConfig.clientId,
      authority: oauthConfig.authority,
      redirectUri: oauthConfig.redirectUri,
      scope: oauthConfig.scope,
      responseType: oauthConfig.responseType,
      prompt: oauthConfig.prompt,
      authType: oauthConfig.authType // Include authentication type
    },
    promptConfig: {
      title: 'Are you with CSU?',
      message: 'If so, please sign in to access personalized chat features and chat history.',
      loginButtonText: 'Sign In',
      skipButtonText: 'Continue as Guest'
    },
    tokenStorageKey: `flowise_tokens_${identifier}`,
    autoRefresh: true,
    refreshThreshold: 300
  });
});

const validateApiKey = (req, res, next) => {
  if (req.path === '/web.js' || req.path === '/' || req.method === 'OPTIONS') {
    return next();
  }

  if (req.path.includes('/get-upload-file')) {
    return next();
  }

  // Skip validation for OAuth endpoints and other local endpoints
  if (req.path === '/oauth-callback.html' || req.path === '/exchange-token' || req.path === '/health' || req.path.startsWith('/api/auth/config/') || req.path.startsWith('/api/v1/public-chatbotConfig/')) {
    return next();
  }

  let identifier;
  const pathParts = req.path.split('/').filter(Boolean);

  if (pathParts.length >= 3) {
    identifier = pathParts[3];
  } else {
    identifier = req.query.chatflowId?.split('/')[0];
  }

  if (!identifier) {
    return res.status(400).json({ error: 'Bad Request' });
  }

  let chatflow;
  try {
    chatflow = getChatflowDetails(identifier);
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }

  const origin = req.headers.origin;
  if (!isValidDomain(origin, chatflow.domains)) {
    return res.status(403).json({ error: 'Access Denied' });
  }

  next();
};

app.use(validateApiKey);

// Health check endpoint
app.get('/health', (_, res) => {
  console.info('\x1b[32m%s\x1b[0m', '💚 Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Session state debug endpoint (only in debug mode) - requires identifier for API validation
app.get('/debug/sessions/:identifier', (req, res) => {
  if (process.env.NODE_ENV !== 'debug') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const { identifier } = req.params;
  const sessions = {};
  const now = Date.now();
  
  // Filter sessions by identifier if specified, or show all
  for (const [chatId, session] of sessionState.entries()) {
    if (!identifier || identifier === 'all' || session.identifier === identifier) {
      sessions[chatId] = {
        userId: session.userInfo.sub,
        email: session.userInfo.email,
        name: session.userInfo.name,
        identifier: session.identifier,
        createdAt: new Date(session.createdAt).toISOString(),
        expiresAt: new Date(session.expiresAt).toISOString(),
        lastAccessed: new Date(session.lastAccessed).toISOString(),
        isExpired: session.expiresAt < now,
        timeUntilExpiry: session.expiresAt - now
      };
    }
  }
  
  res.json({
    totalSessions: sessionState.size,
    filteredSessions: Object.keys(sessions).length,
    sessions: sessions,
    timestamp: new Date().toISOString()
  });
});

// OAuth callback endpoint
app.get('/oauth-callback.html', (_, res) => {
  console.info('\x1b[35m%s\x1b[0m', '🔐 OAuth callback page requested');
  res.sendFile(path.join(__dirname, 'public', 'oauth-callback.html'));
});

// Helper function to detect and log configuration conflicts
const detectConfigConflicts = (localConfig, flowiseConfig, identifier) => {
  const conflicts = [];
  const localKeys = Object.keys(localConfig);
  const flowiseKeys = Object.keys(flowiseConfig);
  
  // Find overlapping keys
  const overlappingKeys = localKeys.filter(key => flowiseKeys.includes(key));
  
  if (overlappingKeys.length > 0) {
    console.warn('\x1b[33m%s\x1b[0m', `⚠️  Configuration conflicts detected for ${identifier}:`);
    
    overlappingKeys.forEach(key => {
      const localValue = JSON.stringify(localConfig[key]);
      const flowiseValue = JSON.stringify(flowiseConfig[key]);
      
      if (localValue !== flowiseValue) {
        conflicts.push({
          key,
          localValue: localConfig[key],
          flowiseValue: flowiseConfig[key]
        });
        
        console.warn('\x1b[33m%s\x1b[0m', `   - ${key}: local=${localValue} vs flowise=${flowiseValue} (using local)`);
      } else {
        console.info('\x1b[36m%s\x1b[0m', `   - ${key}: values match, no conflict`);
      }
    });
  }
  
  return conflicts;
};

// Helper function to merge configurations with local taking precedence
const mergeConfigurations = (localConfig, flowiseConfig, identifier) => {
  // Detect conflicts first
  const conflicts = detectConfigConflicts(localConfig, flowiseConfig, identifier);
  
  // Merge with local config taking precedence
  const mergedConfig = {
    ...flowiseConfig,  // FlowWise config as base
    ...localConfig     // Local config overrides
  };
  
  if (conflicts.length > 0) {
    console.info('\x1b[36m%s\x1b[0m', `🔀 Merged config for ${identifier}: ${conflicts.length} conflicts resolved (local values used)`);
  } else {
    console.info('\x1b[36m%s\x1b[0m', `🔀 Merged config for ${identifier}: no conflicts detected`);
  }
  
  return mergedConfig;
};

// Public chatbot configuration endpoint (fetches from FlowWise and merges with local config)
app.get('/api/v1/public-chatbotConfig/:identifier', async (req, res) => {
  const { identifier } = req.params;
  
  console.info('\x1b[35m%s\x1b[0m', `🔧 Chatbot Config Request: GET /api/v1/public-chatbotConfig/${identifier}`);
  
  try {
    // Validate chatflow exists
    const chatflow = getChatflowDetails(identifier);
    
    // Get OAuth config for this identifier if available
    const oauthConfig = oauthConfigs.get(identifier);
    
    // Build local chatbot configuration
    const localConfig = {
      // Basic chatflow information
      chatflowId: chatflow.chatflowId,
      identifier: identifier,
      
      // Debug configuration (global + per-chatflow override)
      debug: resolveDebugSetting(chatflow),
      
      // Authentication configuration (if available)
      ...(oauthConfig && {
        authentication: {
          mode: oauthConfig.mode,
          oauth: {
            clientId: oauthConfig.clientId,
            authority: oauthConfig.authority,
            redirectUri: oauthConfig.redirectUri,
            scope: oauthConfig.scope,
            responseType: oauthConfig.responseType,
            prompt: oauthConfig.prompt
          },
          promptConfig: {
            title: 'Sign In to Continue',
            message: 'Please sign in to access personalized chat features and chat history.',
            loginButtonText: 'Sign In',
            skipButtonText: 'Continue as Guest'
          },
          tokenStorageKey: `flowise_tokens_${identifier}`,
          autoRefresh: true,
          refreshThreshold: 300
        }
      }),
      
      // Proxy server information
      proxyServer: {
        version: '1.0.0',
        host: `${req.protocol}://${req.get('host')}`,
        features: {
          authentication: !!oauthConfig,
          domainValidation: true,
          apiProxy: true
        }
      }
    };
    
    // Fetch FlowWise chatbot configuration
    let flowiseConfig = {};
    try {
      console.info('\x1b[34m%s\x1b[0m', `📤 Fetching FlowWise config: GET ${config.apiHost}/api/v1/public-chatbotConfig/${chatflow.chatflowId}`);
      
      const flowiseResponse = await axios({
        method: 'GET',
        url: `${config.apiHost}/api/v1/public-chatbotConfig/${chatflow.chatflowId}`,
        headers: {
          'Authorization': `Bearer ${config.flowiseApiKey}`,
        },
        timeout: 10000, // 10 second timeout
      });
      
      if (flowiseResponse.data) {
        flowiseConfig = flowiseResponse.data;
        console.info('\x1b[32m%s\x1b[0m', `✅ FlowWise config fetched successfully (uploads: ${!!flowiseConfig.uploads}, keys: ${Object.keys(flowiseConfig).join(', ')})`);
      }
    } catch (flowiseError) {
      console.warn('\x1b[33m%s\x1b[0m', `⚠️  Failed to fetch FlowWise config: ${flowiseError.message}`);
      console.warn('\x1b[33m%s\x1b[0m', `   Continuing with local config only...`);
    }
    
    // Merge configurations with conflict detection
    const finalConfig = mergeConfigurations(localConfig, flowiseConfig, identifier);
    
    console.info('\x1b[32m%s\x1b[0m', `✅ Chatbot config provided (identifier: ${identifier}, auth: ${!!oauthConfig}, uploads: ${!!finalConfig.uploads})`);
    res.json(finalConfig);
    
  } catch (error) {
    console.warn('\x1b[33m%s\x1b[0m', `⚠️  Chatbot config failed: ${error.message} (identifier: ${identifier})`);
    res.status(404).json({ error: error.message });
  }
});

// User context extraction middleware
const extractUserContext = async (req, res, next) => {
  try {
    // Use originalUrl to get the full path before Express strips the prefix
    const fullPath = req.originalUrl.split('?')[0]; // Remove query string for path processing
    const pathParts = fullPath.split('/').filter(Boolean);
    let identifier = null;
    
    debugLog(`🔍 Extracting user context for originalUrl: ${req.originalUrl}`);
    debugLog(`🔍 Full path: ${fullPath}`);
    debugLog(`🔍 Path parts: [${pathParts.join(', ')}]`);
    
    // Identifier is almost always the last entry in the request URI
    if (pathParts.length > 0) {
      const potentialIdentifier = pathParts[pathParts.length - 1];
      if (potentialIdentifier && !isValidUUID(potentialIdentifier)) {
        identifier = potentialIdentifier;
        debugLog(`🔍 Found identifier as last path part: ${identifier}`);
      }
    }
    
    if (identifier) {
      const oauthConfig = oauthConfigs.get(identifier);
      
      if (oauthConfig) {
        // Check for access token in Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const accessToken = authHeader.split(' ')[1];
          
          try {
            // Validate token with OAuth provider using existing getUserInfo approach
            const response = await fetch(`${oauthConfig.authority}/.well-known/openid-configuration`);
            const discoveryDoc = await response.json();
            
            if (discoveryDoc.userinfo_endpoint) {
              const userInfoResponse = await fetch(discoveryDoc.userinfo_endpoint, {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Accept': 'application/json'
                }
              });
              
              if (userInfoResponse.ok) {
                const userInfo = await userInfoResponse.json();
                req.user = userInfo;
                
                // Check if this is a chat request with chatId for session management
                if (req.body && req.body.chatId && req.method === 'POST') {
                  const chatId = req.body.chatId;
                  const tokenExpiry = decodeJWTExpiry(accessToken);
                  
                  // Store session state mapping chatId to user info
                  const sessionData = {
                    userInfo: userInfo,
                    identifier: identifier,
                    createdAt: Date.now(),
                    expiresAt: tokenExpiry || (Date.now() + 24 * 60 * 60 * 1000), // Default 24h if no expiry
                    lastAccessed: Date.now()
                  };
                  
                  sessionState.set(chatId, sessionData);
                  
                  debugLog(`💾 Stored session state for chatId: ${chatId}`, {
                    userId: userInfo.sub,
                    email: userInfo.email,
                    expiresAt: new Date(sessionData.expiresAt).toISOString()
                  });
                }
                
                // Debug message showing extracted user info (only in debug mode)
                debugLog(`🔐 User authenticated via OAuth token:`, {
                  identifier: identifier,
                  userId: userInfo.sub,
                  email: userInfo.email,
                  name: userInfo.name,
                  username: userInfo.preferred_username
                });
              } else {
                debugLog(`⚠️ OAuth token validation failed: ${userInfoResponse.status} ${userInfoResponse.statusText} (identifier: ${identifier})`);
              }
            }
          } catch (error) {
            debugLog(`⚠️ OAuth token validation error: ${error.message} (identifier: ${identifier})`);
          }
        } else {
          debugLog(`ℹ️ No OAuth token provided in request (identifier: ${identifier})`);
          
          // Check for web authentication session ID in headers
          const sessionId = req.headers['x-session-id'];
          if (sessionId) {
            const webSession = webAuthSessions.get(sessionId);
            if (webSession && webSession.authenticated) {
              // Check if token needs refresh (within 10 minutes of expiry)
              const now = Date.now();
              const refreshThreshold = 10 * 60 * 1000; // 10 minutes
              const tokenExpiresAt = webSession.tokens?.expires_at;
              
              if (tokenExpiresAt && (tokenExpiresAt - now) <= refreshThreshold && webSession.tokens?.refresh_token) {
                debugLog(`⏰ Token expiring soon for session ${sessionId}, attempting on-demand refresh...`);
                
                // Attempt to refresh token on-demand
                const refreshSuccess = await refreshWebAuthToken(sessionId, webSession);
                if (!refreshSuccess) {
                  // If refresh failed, remove session
                  webAuthSessions.delete(sessionId);
                  debugLog(`🗑️ Removed session ${sessionId} due to on-demand refresh failure`);
                  return next(); // Continue without user context
                }
              }
              
              // Check session validity after potential refresh
              if (webSession.expiresAt > now) {
                req.user = webSession.userInfo;
                req.webAuthSession = webSession;
                
                debugLog(`🔐 Using web auth session: ${sessionId}`, {
                  userId: webSession.userInfo.sub,
                  email: webSession.userInfo.email,
                  tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt).toISOString() : 'N/A'
                });
              } else {
                // Session expired and couldn't be refreshed, remove it
                webAuthSessions.delete(sessionId);
                debugLog(`🗑️ Removed expired web auth session: ${sessionId}`);
              }
            }
          }
          
          // Check if we have session state for this chat even without a token
          if (req.body && req.body.chatId) {
            const chatId = req.body.chatId;
            const existingSession = sessionState.get(chatId);
            
            if (existingSession && existingSession.expiresAt > Date.now()) {
              // Use cached user info from session
              req.user = existingSession.userInfo;
              existingSession.lastAccessed = Date.now();
              
              debugLog(`🔄 Using cached session for chatId: ${chatId}`, {
                userId: existingSession.userInfo.sub,
                email: existingSession.userInfo.email
              });
            } else if (existingSession) {
              // Session expired, remove it
              sessionState.delete(chatId);
              debugLog(`🗑️ Removed expired session for chatId: ${chatId}`);
            }
          }
        }
      } else {
        debugLog(`ℹ️ No OAuth configuration for identifier: ${identifier}`);
      }
    }
  } catch (error) {
    debugLog(`❌ Error in user context extraction: ${error.message}`);
  }
  
  next();
};

// Apply user context extraction middleware to all API routes
app.use('/api/v1/*', extractUserContext);

// Generic API proxy for all /api/v1/* endpoints
// This forwards all Flowise API calls to the upstream server with proper authentication
app.use('/api/v1/*', async (req, res) => {
  try {
    // Use originalUrl to get the full path before Express strips the prefix
    const fullPath = req.originalUrl.split('?')[0]; // Remove query string for path processing
    
    // DEBUG: Log initial request details
    debugLog(`req.path = "${req.path}"`);
    debugLog(`req.url = "${req.url}"`);
    debugLog(`req.originalUrl = "${req.originalUrl}"`);
    debugLog(`fullPath = "${fullPath}"`);
    
    // Extract identifier from various possible locations in the path
    let identifier = null;
    let targetPath = fullPath; // Use the full original path
    
    // Parse path to find identifier and convert to chatflowId
    const pathParts = fullPath.split('/').filter(Boolean);
    debugLog(`pathParts = [${pathParts.join(', ')}]`);
    
    // Look for identifier in common positions
    if (pathParts.length >= 3) {
      // For paths like /api/v1/prediction/:identifier or /api/v1/public-chatbotConfig/:identifier
      const potentialIdentifier = pathParts[2];
      
      // Check if this looks like an identifier (not a UUID)
      if (potentialIdentifier && !isValidUUID(potentialIdentifier)) {
        try {
          const chatflow = getChatflowDetails(potentialIdentifier);
          identifier = potentialIdentifier;
          // Replace identifier with actual chatflowId in the path
          pathParts[2] = chatflow.chatflowId;
          targetPath = '/' + pathParts.join('/');
          debugLog(`After identifier replacement - targetPath = "${targetPath}"`);
        } catch (error) {
          // Not a valid identifier, continue with original path
        }
      }
    }
    
    // For paths with identifier in different positions (e.g., /api/v1/attachments/:identifier/:chatId)
    if (!identifier && pathParts.length >= 4) {
      const potentialIdentifier = pathParts[3];
      if (potentialIdentifier && !isValidUUID(potentialIdentifier)) {
        try {
          const chatflow = getChatflowDetails(potentialIdentifier);
          identifier = potentialIdentifier;
          pathParts[3] = chatflow.chatflowId;
          targetPath = '/' + pathParts.join('/');
          debugLog(`After position 3 replacement - targetPath = "${targetPath}"`);
        } catch (error) {
          // Not a valid identifier, continue with original path
        }
      }
    }
    
    // Construct the full API URL
    const queryString = req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?')[1] : '';
    const apiUrl = `${config.apiHost}${targetPath}${queryString}`;
    
    debugLog(`config.apiHost = "${config.apiHost}"`);
    debugLog(`targetPath = "${targetPath}"`);
    debugLog(`queryString = "${queryString}"`);
    debugLog(`Final apiUrl = "${apiUrl}"`);
    
    // Log user context if available
    if (req.user) {
      console.info('\x1b[35m%s\x1b[0m', `👤 User context available: ${req.user.email || req.user.sub} (${req.user.name || 'No name'}) for ${identifier || 'unknown identifier'}`);
    }
    
    console.info('\x1b[34m%s\x1b[0m', `📤 API Proxy: ${req.method} ${apiUrl}${identifier ? ` (identifier: ${identifier})` : ''}${req.user ? ` [User: ${req.user.email || req.user.sub}]` : ''}`);
    
    // Prepare headers
    const headers = {
      'Authorization': `Bearer ${config.flowiseApiKey}`,
      ...req.headers
    };
    
    // Remove host header to avoid conflicts
    delete headers.host;
    delete headers['content-length']; // Let axios handle this
    
    // Prepare request options
    const requestOptions = {
      method: req.method,
      url: apiUrl,
      headers,
      timeout: 30000, // 30 second timeout
    };
    
    // Handle request body for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (req.is('multipart/form-data')) {
        debugLog(`Detected multipart/form-data request - this should be handled by specific route`);
        // Multipart requests should be handled by specific routes (like /api/v1/attachments)
        // If we get here, it means the route wasn't matched properly
        return res.status(400).json({ error: 'Multipart requests must use specific endpoints' });
      } else {
        // Handle JSON data
        requestOptions.data = req.body;
        debugLog(`Using JSON body data`);
      }
    }
    
    // Handle streaming responses
    const isStreamingRequest = req.body && req.body.streaming === true;
    const isDownloadRequest = req.path.includes('download') || req.path.includes('stream');
    
    if (isStreamingRequest || isDownloadRequest) {
      requestOptions.responseType = 'stream';
      debugLog(`Setting responseType to stream (streaming: ${isStreamingRequest}, download: ${isDownloadRequest})`);
    }
    
    // Make the request
    debugLog(`Making axios request with options:`, JSON.stringify({
      method: requestOptions.method,
      url: requestOptions.url,
      headers: Object.keys(requestOptions.headers || {}),
      hasData: !!requestOptions.data,
      dataSize: requestOptions.data ? JSON.stringify(requestOptions.data).length : 0,
      timeout: requestOptions.timeout,
      maxContentLength: requestOptions.maxContentLength,
      maxBodyLength: requestOptions.maxBodyLength
    }, null, 2));
    
    const response = await axios(requestOptions);
    
    console.info('\x1b[32m%s\x1b[0m', `📥 API Response: ${response.status} ${response.statusText}${identifier ? ` (identifier: ${identifier})` : ''}`);
    debugLog(`Response headers:`, response.headers);
    debugLog(`Response data type: ${typeof response.data}`);
    
    // Safe JSON stringification to avoid circular reference errors
    let dataSize = 'unknown';
    let dataPreview = 'unable to stringify';
    try {
      const jsonString = JSON.stringify(response.data);
      dataSize = `${jsonString.length} chars`;
      dataPreview = jsonString.substring(0, 500) + (jsonString.length > 500 ? '...' : '');
    } catch (err) {
      debugLog(`Cannot stringify response data (likely circular reference):`, err.message);
      if (response.data && typeof response.data === 'object') {
        dataPreview = `Object with keys: [${Object.keys(response.data).join(', ')}]`;
      } else {
        dataPreview = String(response.data).substring(0, 500);
      }
    }
    
    debugLog(`Response data size: ${dataSize}`);
    debugLog(`Response data preview:`, dataPreview);
    
    // Handle streaming responses
    if (requestOptions.responseType === 'stream') {
      debugLog(`Handling as stream response`);
      debugLog(`Stream response headers:`, response.headers);
      
      // Copy response headers - important for Server-Sent Events
      Object.keys(response.headers).forEach(key => {
        res.setHeader(key, response.headers[key]);
      });
      
      // Ensure proper headers for Server-Sent Events
      if (response.headers['content-type']?.includes('text/event-stream')) {
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        debugLog(`Set SSE headers for event stream`);
      }
      
      res.status(response.status);
      response.data.pipe(res);
      
      // Log when stream ends
      response.data.on('end', () => {
        debugLog(`Stream ended`);
      });
      
      response.data.on('error', (err) => {
        debugLog(`Stream error:`, err);
      });
    } else {
      debugLog(`Handling as JSON response`);
      debugLog(`Sending response with status ${response.status}`);
      // Handle regular JSON responses
      res.status(response.status).json(response.data);
      debugLog(`Response sent successfully`);
    }
    
  } catch (error) {
    const identifier = req.path.split('/')[3]; // Best guess for logging
    console.error('\x1b[31m%s\x1b[0m', `❌ API Proxy Error: ${error.response?.status || 'Unknown'} - ${error.message}${identifier ? ` (identifier: ${identifier})` : ''}`);
    
    // Safe error logging to avoid circular references
    const errorDetails = {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    };
    
    // Safely handle response headers and data
    if (error.response?.headers) {
      errorDetails.responseHeaders = Object.keys(error.response.headers);
    }
    
    if (error.response?.data) {
      try {
        if (typeof error.response.data === 'string') {
          errorDetails.responseData = error.response.data.substring(0, 500);
        } else if (typeof error.response.data === 'object') {
          errorDetails.responseData = JSON.stringify(error.response.data).substring(0, 500);
        } else {
          errorDetails.responseData = String(error.response.data).substring(0, 500);
        }
      } catch (stringifyError) {
        errorDetails.responseData = `Cannot stringify response data: ${stringifyError.message}`;
      }
    }
    
    debugLog(`Error details:`, errorDetails);
    
    if (error.response) {
      debugLog(`Sending error response with status ${error.response.status}`);
      res.status(error.response.status).json({
        error: error.response.data || 'Upstream server error'
      });
    } else {
      res.status(500).json({
        error: 'Proxy server error'
      });
    }
  }
});

// File upload endpoint
app.post('/api/v1/openai-assistants-file/:identifier', upload.single('file'), async (req, res) => {
  try {
    const { identifier } = req.params;
    const chatflow = getChatflowDetails(identifier);
    
    if (!req.file) {
      console.warn('\x1b[33m%s\x1b[0m', `⚠️  File upload failed: No file provided (identifier: ${identifier})`);
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const apiUrl = `${config.apiHost}/api/v1/openai-assistants-file/${chatflow.chatflowId}`;
    console.info('\x1b[34m%s\x1b[0m', `📤 API Call: POST ${apiUrl} (identifier: ${identifier}, file: ${req.file.originalname}, size: ${req.file.size} bytes)`);
    
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);
    
    const response = await axios.post(
      apiUrl,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${config.flowiseApiKey}`,
          ...formData.getHeaders(),
        },
      }
    );
    
    console.info('\x1b[32m%s\x1b[0m', `📥 API Response: ${response.status} ${response.statusText} (identifier: ${identifier}, file: ${req.file.originalname})`);
    res.json(response.data);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ API Error: ${error.response?.status || 'Unknown'} - ${error.message} (identifier: ${identifier}, file: ${req.file?.originalname || 'unknown'})`);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Internal server error'
    });
  }
});

// Get upload file endpoint
app.get('/api/v1/get-upload-file', async (req, res) => {
  try {
    const { chatflowId, chatId, fileName } = req.query;
    
    debugLog(`get-upload-file request - chatflowId: ${chatflowId}, chatId: ${chatId}, fileName: ${fileName}`);
    
    // Convert identifier to actual chatflow UUID if needed
    let actualChatflowId = chatflowId;
    if (chatflowId && !isValidUUID(chatflowId)) {
      try {
        const chatflow = getChatflowDetails(chatflowId);
        actualChatflowId = chatflow.chatflowId;
        debugLog(`Converted identifier "${chatflowId}" to UUID "${actualChatflowId}"`);
      } catch (error) {
        console.warn('\x1b[33m%s\x1b[0m', `⚠️  Invalid chatflow identifier: ${chatflowId}`);
        return res.status(404).json({ error: `Chatflow not found: ${chatflowId}` });
      }
    }
    
    const apiUrl = `${config.apiHost}/api/v1/get-upload-file`;
    console.info('\x1b[34m%s\x1b[0m', `📤 API Call: GET ${apiUrl} (chatflowId: ${actualChatflowId}, chatId: ${chatId}, fileName: ${fileName})`);
    
    const response = await axios.get(
      apiUrl,
      {
        params: { chatflowId: actualChatflowId, chatId, fileName },
        headers: {
          'Authorization': `Bearer ${config.flowiseApiKey}`,
        },
        responseType: 'stream',
        maxContentLength: Infinity, // Remove content length limit
        maxBodyLength: Infinity,    // Remove body length limit
      }
    );
    
    console.info('\x1b[32m%s\x1b[0m', `📥 API Response: ${response.status} ${response.statusText} (fileName: ${fileName})`);
    response.data.pipe(res);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ API Error: ${error.response?.status || 'Unknown'} - ${error.message} (fileName: ${fileName})`);
    res.status(error.response?.status || 500).json({
      error: error.response?.data || 'Internal server error'
    });
  }
});

// Embed script generation
app.get('/api/v1/chatflows/:identifier/embed', (req, res) => {
  try {
    const { identifier } = req.params;
    const origin = req.headers.origin || req.headers.referer;
    
    console.info('\x1b[36m%s\x1b[0m', `📜 Embed Script Request: GET /api/v1/chatflows/${identifier}/embed (origin: ${origin})`);
    
    const chatflow = getChatflowDetails(identifier);
    
    const script = generateEmbedScript({
      chatflowid: identifier,
      apiHost: `${req.protocol}://${req.get('host')}`,
      chatflowConfig: req.query,
    });
    
    console.info('\x1b[32m%s\x1b[0m', `✅ Embed script generated (identifier: ${identifier}, size: ${script.length} chars)`);
    
    res.set('Content-Type', 'application/javascript');
    res.send(script);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Embed script error: ${error.message} (identifier: ${identifier})`);
    res.status(404).json({ error: error.message });
  }
});

const PORT = config.port || 3001;
const HOST = config.host || 'localhost';

app.listen(PORT, HOST, () => {
  console.info('\x1b[32m%s\x1b[0m', `✓ Proxy server running on http://${HOST}:${PORT}`);
  console.info('\x1b[32m%s\x1b[0m', `✓ Flowise API Host: ${config.apiHost}`);
});
