// server.js
// version 1.0.8
// last change: Poprawiona obsługa WebSocket - dodano heartbeat (ping)

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const ALLOWED_ORIGINS = [
    'https://agents.efekt.ai',
    /https:\/\/sb1b5q5eh3e-.*\.local-credentialless\.webcontainer\.io$/
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.some(allowed => allowed instanceof RegExp ? allowed.test(origin) : allowed === origin)) {
            callback(null, true);
        } else {
            console.log(`❌ Odrzucone połączenie CORS z niedozwolonego origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use('/audios', express.static(path.join(__dirname, 'audios'), {
    setHeaders: (res, req) => {
        if (req.headers.origin && ALLOWED_ORIGINS.some(allowed => allowed instanceof RegExp ? allowed.test(req.headers.origin) : allowed === req.headers.origin)) {
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        res.setHeader('Content-Type', 'audio/mpeg'); // 👈 Dodane!
    }
}));


import indexRoutes from './src/index.js';
app.use('/', indexRoutes);

const server = app.listen(PORT, () => {
    console.log(`🚀 Server działa na porcie ${PORT}`);
});

const wss = new WebSocketServer({ server });

const heartbeatInterval = 30000; // Ping co 30 sekund

wss.on('connection', (ws, req) => {
    console.log('📡 Połączono z WebSocket!');
    
    const origin = req.headers.origin;
    if (!origin || !ALLOWED_ORIGINS.some(allowed => allowed instanceof RegExp ? allowed.test(origin) : allowed === origin)) {
        console.log(`❌ Odrzucone połączenie WebSocket z niedozwolonego origin: ${origin}`);
        ws.close();
        return;
    }

    ws.send(JSON.stringify({ log: "👋 Witamy w systemie logowania przez WebSocket!" }));

    ws.on('message', (message) => {
        console.log(`📩 Otrzymano wiadomość: ${message}`);
    });

    ws.on('close', () => {
        console.log('❌ WebSocket rozłączony');
    });

    // 🔄 Heartbeat - wysyłanie "ping" do klienta
    const interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
        } else {
            clearInterval(interval);
        }
    }, heartbeatInterval);
});
