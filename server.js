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
const CHATFLOW_ID = process.env.CHATFLOW_ID;
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];

if (!API_HOST) {
  console.error('API_HOST is not set in environment variables');
  process.exit(1);
}

if (!CHATFLOW_ID) {
  console.error('CHATFLOW_ID is not set in environment variables');
  process.exit(1);
}

if (!FLOWISE_API_KEY) {
  console.error('FLOWISE_API_KEY is not set in environment variables');
  process.exit(1);
}

if (ALLOWED_ORIGINS.includes('*')) {
  console.warn('\x1b[33m%s\x1b[0m', 'Warning: ALLOWED_ORIGINS is set to "*" which allows all origins. Consider restricting this in production.');
} else {
  console.info('\x1b[36m%s\x1b[0m', `CORS enabled for origins: ${ALLOWED_ORIGINS.join(', ')}`);
}

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes('*')) {
        return callback(null, true);
      }

      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200,
  }),
);

const setJSHeaders = (res, path) => {
  if (path.endsWith('.js')) {
    res.set('Content-Type', 'application/javascript');
  }
};

app.use(express.static(path.join(__dirname, 'dist'), { setHeaders: setJSHeaders }));
app.use(express.static(path.join(__dirname, 'public'), { setHeaders: setJSHeaders }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/api/v1/attachments/proxy/:chatId', upload.array('files'), async (req, res) => {
  try {
    const chatId = req.params.chatId;
    if (!chatId) {
      return res.status(400).json({ error: 'chatId is required' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const form = new FormData();
    req.files.forEach((file) => {
      form.append('files', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
    });

    const chatflowId = CHATFLOW_ID;

    const targetUrl = `${API_HOST}/api/v1/attachments/${chatflowId}/${chatId}`;

    const response = await axios.post(targetUrl, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${FLOWISE_API_KEY}`,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Attachment upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

const proxyEndpoints = {
  'POST:/api/v1/prediction/proxy': `/api/v1/prediction/${CHATFLOW_ID}`,
  'GET:/api/v1/public-chatbotConfig/proxy': `/api/v1/public-chatbotConfig/${CHATFLOW_ID}`,
  'GET:/api/v1/chatflows-streaming/proxy': `/api/v1/chatflows-streaming/${CHATFLOW_ID}`,
  'GET:/api/v1/get-upload-file/:chatId/:fileName/proxy': `/api/v1/get-upload-file`,
};

const handleProxy = async (req, res, targetPath) => {
  try {
    let finalPath = targetPath;

    const queryParams = new URLSearchParams(req.query);
    if (queryParams.get('chatflowId') === 'proxy') {
      queryParams.set('chatflowId', CHATFLOW_ID);
    }

    if (req.params.chatId) queryParams.append('chatId', req.params.chatId);
    if (req.params.fileName) queryParams.append('fileName', req.params.fileName);

    finalPath = `${targetPath}?${queryParams.toString()}`;

    const url = `${API_HOST}${finalPath}`;
    const headers = {
      ...(req.method !== 'GET' && { 'Content-Type': 'application/json' }),
    };

    if (FLOWISE_API_KEY) {
      headers['Authorization'] = `Bearer ${FLOWISE_API_KEY}`;
    }

    const response = await fetch(url, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

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
    res.status(500).json({ error: 'Internal server error' });
  }
};

const validateApiKey = (req, res, next) => {
  if (req.path.startsWith('/web.js') || req.path.startsWith('/dist/') || req.path.startsWith('/public/') || req.method === 'OPTIONS') {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin || referer) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== FLOWISE_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Invalid API Key' });
  }

  next();
};

app.use(validateApiKey);

Object.entries(proxyEndpoints).forEach(([route, targetPath]) => {
  const [method, path] = route.split(':');
  app[method.toLowerCase()](path, (req, res) => handleProxy(req, res, targetPath));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  const addr = server.address();
  if (!addr || typeof addr === 'string') return;

  const isProduction = process.env.NODE_ENV === 'production' || process.env.PRODUCTION === 'true' || process.env.VERCEL_ENV === 'production';

  const protocol = isProduction ? 'https' : 'http';
  const host = process.env.HOST || process.env.VERCEL_URL || `localhost:${addr.port}`;
  const baseUrl = `${protocol}://${host}`;

  console.log(`Server running on ${baseUrl}`);
  generateEmbedScript(baseUrl);
});
