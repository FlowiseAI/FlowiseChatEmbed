import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_HOST = process.env.API_HOST;
const CHATFLOW_ID = process.env.CHATFLOW_ID;
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'], // Include Authorization header
    credentials: true,
    optionsSuccessStatus: 200
}));

app.options('*', cors());

app.use(express.json());

app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, 'public')));


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

        if (FLOWISE_API_KEY) {  // Add API key to headers if defined
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


Object.entries(proxyEndpoints).forEach(([route, targetPath]) => {
    const [method, path] = route.split(':');
    app[method.toLowerCase()](path, (req, res) => handleProxy(req, res, targetPath));
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
