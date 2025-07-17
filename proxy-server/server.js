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
    oauthConfigs.set(chatflow.identifier, {
      mode: chatflow.oauth.mode || 'optional', // Default to 'optional' if not specified
      clientId: chatflow.oauth.clientId,
      authority: chatflow.oauth.authority,
      redirectUri: config.oauthRedirectUri || 'http://localhost:3005/oauth-callback.html',
      scope: chatflow.oauth.scope || 'openid profile email',
      responseType: chatflow.oauth.responseType || 'code',
      prompt: chatflow.oauth.prompt || 'select_account'
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
  
  next();
});

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

// File upload middleware - must be declared before use
const upload = multer({ storage: multer.memoryStorage() });

// Attachment upload endpoint - MUST be before the generic API proxy
app.post('/api/v1/attachments/:identifier/:chatId', upload.any(), async (req, res) => {
  const { identifier, chatId } = req.params;
  
  try {
    const chatflow = getChatflowDetails(identifier);
    
    debugLog(`Attachment upload - identifier: ${identifier}, chatId: ${chatId}`);
    debugLog(`Files received:`, req.files?.length || 0);
    
    if (!req.files || req.files.length === 0) {
      console.warn('\x1b[33m%s\x1b[0m', `⚠️  Attachment upload failed: No files provided (identifier: ${identifier})`);
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const apiUrl = `${config.apiHost}/api/v1/attachments/${chatflow.chatflowId}/${chatId}`;
    console.info('\x1b[34m%s\x1b[0m', `📤 API Call: POST ${apiUrl} (identifier: ${identifier}, files: ${req.files.length})`);
    
    const formData = new FormData();
    let totalSize = 0;
    
    // Add all uploaded files
    req.files.forEach((file, index) => {
      formData.append('files', file.buffer, file.originalname);
      totalSize += file.size;
      debugLog(`Added file ${index}: ${file.originalname} (${file.size} bytes, ${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Add other form fields from body
    Object.keys(req.body || {}).forEach(key => {
      formData.append(key, req.body[key]);
      debugLog(`Added field ${key}: ${req.body[key]}`);
    });
    
    debugLog(`Total upload size: ${totalSize} bytes (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
    
    // Check if the upload size is reasonable (warn if > 50MB)
    if (totalSize > 50 * 1024 * 1024) {
      console.warn('\x1b[33m%s\x1b[0m', `⚠️  Large upload detected: ${(totalSize / 1024 / 1024).toFixed(2)} MB - this may exceed server limits`);
    }
    
    const response = await axios.post(
      apiUrl,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${config.flowiseApiKey}`,
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );
    
    console.info('\x1b[32m%s\x1b[0m', `📥 API Response: ${response.status} ${response.statusText} (identifier: ${identifier})`);
    res.json(response.data);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Attachment upload error: ${error.response?.status || 'Unknown'} - ${error.message} (identifier: ${identifier})`);
    
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
