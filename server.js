import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_HOST = process.env.API_HOST;
const CHATFLOW_ID = process.env.CHATFLOW_ID;
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'credentialless');
    if (req.path.endsWith('.js')) {
        res.header('Content-Type', 'application/javascript');
    }
    next();
});

app.options('*', cors());

app.use(express.json());

app.use(express.static(path.join(__dirname, 'dist'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

const proxyEndpoints = {
    'POST:/api/v1/prediction/proxy': `/api/v1/prediction/${CHATFLOW_ID}`,
    'GET:/api/v1/public-chatbotConfig/proxy': `/api/v1/public-chatbotConfig/${CHATFLOW_ID}`,
    'GET:/api/v1/chatflows-streaming/proxy': `/api/v1/chatflows-streaming/${CHATFLOW_ID}`
};

const handleProxy = async (req, res, targetPath) => {
    try {
        const url = `${API_HOST}${targetPath}`;
        const headers = {
            'Content-Type': 'application/json',
        };

        if (FLOWISE_API_KEY) {
            headers['Authorization'] = `Bearer ${FLOWISE_API_KEY}`;
        }

        const response = await fetch(url, {
            method: req.method,
            headers: headers,
            body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
        });

        if (response.headers.get('content-type')?.includes('text/event-stream')) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            return response.body.pipe(res);
        }

        const data = await response.json();
        return res.json(data);

    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const validateApiKey = (req, res, next) => {
    if (req.path.startsWith('/web.js') || 
        req.path.startsWith('/dist/') || 
        req.path.startsWith('/public/') ||
        req.method === 'OPTIONS') {
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
