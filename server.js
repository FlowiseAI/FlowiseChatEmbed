Error.stackTraceLimit = 0;

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import { generateEmbedScript } from './src/utils/embedScript.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_HOST = process.env.API_HOST;
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;

if (!API_HOST) {
  console.error('API_HOST is not set in environment variables');
  process.exit(1);
}

if (!FLOWISE_API_KEY) {
  console.error('FLOWISE_API_KEY is not set in environment variables');
  process.exit(1);
}

const parseChatflows = () => {
  try {
    const chatflows = new Map();
    
    // Get all environment variables that don't start with special prefixes
    const chatflowVars = Object.entries(process.env).filter(([key]) => {
      return !key.startsWith('_') && 
             !key.startsWith('npm_') && 
             !key.startsWith('yarn_') && 
             !key.startsWith('VSCODE_') && 
             key !== 'API_HOST' && 
             key !== 'FLOWISE_API_KEY' &&
             key !== 'PORT' &&
             key !== 'HOST' &&
             key !== 'BASE_URL' &&
             key !== 'NODE_ENV';
    });

    if (chatflowVars.length === 0) {
      console.error('No chatflow configurations found in environment variables');
      process.exit(1);
    }

    const defaultDomains = process.env.NODE_ENV === 'production' 
      ? [] 
      : ['http://localhost:5678'];

    for (const [identifier, value] of chatflowVars) {
      const parts = value.split(',').map(s => s.trim());
      const chatflowId = parts[0];
      const configuredDomains = parts.length > 1 ? parts.slice(1) : [];
      
      const domains = [...new Set([...defaultDomains, ...configuredDomains])];

      if (!chatflowId) {
        console.error(`Missing chatflow ID for ${identifier}`);
        continue;
      }

      if (domains.includes('*')) {
        console.error(`\x1b[31mError: Wildcard (*) domains are not allowed in ${identifier}. This flow will not be accessible.\x1b[0m`);
        continue;
      }

      chatflows.set(identifier, { chatflowId, domains });
    }

    if (chatflows.size === 0) {
      console.error('No valid chatflow configurations found');
      process.exit(1);
    }

    return chatflows;
  } catch (error) {
    console.error('Failed to parse chatflow configurations:', error);
    process.exit(1);
  }
};

const chatflows = parseChatflows();

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
  const parts = value.split(',').map(s => s.trim());
  return isValidUUID(parts[0]); 
};

console.info('\x1b[36m%s\x1b[0m', 'Configured chatflows:');
chatflows.forEach((config, identifier) => {
  if (isValidChatflowConfig(config.chatflowId)) {
    console.info('\x1b[36m%s\x1b[0m', `  ${identifier}: ${config.chatflowId} (${config.domains.join(', ')})`);
  }
});

const isValidDomain = (origin, domains) => {
  if (!origin) return true;
  return domains.includes(origin);
};

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['*'],
  }),
);

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
  });
  res.sendFile(path.join(__dirname, 'dist', 'web.js'));
});

const validateApiKey = (req, res, next) => {
  if (req.path === '/web.js' || req.path === '/' || req.method === 'OPTIONS') {
    return next();
  }

  if (req.path.includes('/get-upload-file')) {
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
    req.chatflow = chatflow;
  } catch (error) {
    return res.status(404).json({ error: 'Not Found' });
  }

  const origin = req.headers.origin;
  const userAgent = req.headers['user-agent'];
  const acceptLanguage = req.headers['accept-language'];
  const accept = req.headers['accept'];
  const secChUa = req.headers['sec-ch-ua'];
  const secChUaPlatform = req.headers['sec-ch-ua-platform'];
  const secChUaMobile = req.headers['sec-ch-ua-mobile'];
  const secFetchMode = req.headers['sec-fetch-mode'];
  const secFetchSite = req.headers['sec-fetch-site'];

  if (
    userAgent &&
    acceptLanguage &&
    accept &&
    secChUa &&
    secChUaPlatform &&
    secChUaMobile &&
    ['?0', '?1'].includes(secChUaMobile) &&
    secFetchMode === 'cors' &&
    secFetchSite &&
    ['same-origin', 'same-site', 'cross-site'].includes(secFetchSite)
  ) {
    if (isValidDomain(origin, chatflow.domains)) {
      return next();
    }
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1] === FLOWISE_API_KEY) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
};

app.use(validateApiKey);

const proxyEndpoints = {
  prediction: {
    method: 'POST',
    path: '/api/v1/prediction/:identifier',
    target: '/api/v1/prediction',
  },
  config: {
    method: 'GET',
    path: '/api/v1/public-chatbotConfig/:identifier',
    target: '/api/v1/public-chatbotConfig',
  },
  streaming: {
    method: 'GET',
    path: '/api/v1/chatflows-streaming/:identifier',
    target: '/api/v1/chatflows-streaming',
  },
  files: {
    method: 'GET',
    path: '/api/v1/get-upload-file',
    target: '/api/v1/get-upload-file',
  },
};

const handleProxy = async (req, res, targetPath) => {
  try {
    let identifier = req.query.chatflowId?.split('/')[0] || req.path.split('/').pop() || null;

    if (!identifier) {
      return res.status(400).json({ error: 'Bad Request' });
    }

    const chatflow = getChatflowDetails(identifier);
    if (!chatflow) {
      return res.status(404).json({ error: 'Not Found' });
    }

    if (req.query.chatId && req.query.fileName) {
      const url = `${API_HOST}${targetPath}?chatflowId=${chatflow.chatflowId}&chatId=${req.query.chatId}&fileName=${req.query.fileName}`;

      const response = await fetch(url, {
        method: req.method,
        headers: {
          Authorization: `Bearer ${FLOWISE_API_KEY}`,
        },
      });

      if (!response.ok) {
        console.error(`File proxy error: ${response.status} ${response.statusText}`);
        return res.status(response.status).json({ error: `File proxy error: ${response.statusText}` });
      }

      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }

      return response.body.pipe(res);
    }

    let finalPath = `${targetPath}/${chatflow.chatflowId}`;
    const url = `${API_HOST}${finalPath}`;

    const response = await fetch(url, {
      method: req.method,
      headers: {
        ...(req.method !== 'GET' && { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${FLOWISE_API_KEY}`,
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    if (!response.ok) {
      console.error(`Proxy error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: `Proxy error: ${response.statusText}` });
    }

    const contentType = response.headers.get('content-type');

    if (contentType?.includes('image/') || contentType?.includes('audio/') || contentType?.includes('application/octet-stream')) {
      res.setHeader('Content-Type', contentType);
      return response.body.pipe(res);
    }

    if (contentType?.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      return response.body.pipe(res);
    }

    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return res.json(data);
    }

    return response.body.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

Object.values(proxyEndpoints).forEach(({ method, path, target }) => {
  app[method.toLowerCase()](path, (req, res) => {
    return handleProxy(req, res, target);
  });
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/api/v1/attachments/:identifier/:chatId', upload.array('files'), async (req, res) => {
  try {
    const chatId = req.params.chatId;
    if (!chatId) {
      return res.status(400).json({ error: 'Bad Request' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Bad Request' });
    }

    const form = new FormData();
    req.files.forEach((file) => {
      form.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
    });

    const chatflow = req.chatflow;
    const targetUrl = `${API_HOST}/api/v1/attachments/${chatflow.chatflowId}/${chatId}`;

    const response = await axios.post(targetUrl, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${FLOWISE_API_KEY}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Attachment upload error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  const addr = server.address();
  if (!addr || typeof addr === 'string') return;

  const baseUrl = process.env.BASE_URL || 
                 process.env.NODE_ENV === 'production' 
                   ? `https://${process.env.HOST || 'localhost'}`
                   : `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${addr.port}`;
  
  generateEmbedScript(baseUrl);
});
