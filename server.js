// server.js
// version 1.0.7
// last change: Poprawiona kolejność middleware'ów + poprawione CORS dla audio

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

// 🌍 DOZWOLONE DOMENY FRONTENDU
const ALLOWED_ORIGINS = [
    'https://agents.efekt.ai',
    /https:\/\/sb1b5q5eh3e-.*\.local-credentialless\.webcontainer\.io$/
];

// ✅ Middleware CORS (Musi być PRZED użyciem JSON)
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.some(allowed => allowed instanceof RegExp ? allowed.test(origin) : allowed === origin)) {
            callback(null, true);
        } else {
            console.log(`❌ Odrzucone połączenie CORS z: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// ✅ Teraz `express.json()` MUSI być przed routerami!
app.use(express.json());

// ✅ Serwowanie plików audio (CORS Fix)
app.use('/audios', express.static(path.join(__dirname, 'audios'), {
    setHeaders: (res, req) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    }
}));

// 📌 Importowanie tras API (Teraz JSON działa!)
import indexRoutes from './src/index.js';
app.use('/', indexRoutes);

// 🚀 Serwer HTTP
const server = app.listen(PORT, () => {
    console.log(`🚀 Server działa na porcie ${PORT}`);
});

// 🌍 Obsługa WebSocket
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    const origin = req.headers.origin;
    if (!origin || !ALLOWED_ORIGINS.some(allowed => allowed instanceof RegExp ? allowed.test(origin) : allowed === origin)) {
        console.log(`❌ Odrzucone połączenie WebSocket z: ${origin}`);
        ws.close();
        return;
    }

    console.log('📡 Połączono z WebSocket!');
    ws.send(JSON.stringify({ log: "👋 Witamy w systemie logowania przez WebSocket!" }));

    ws.on('message', (message) => {
        console.log(`📩 Otrzymano wiadomość: ${message}`);
    });

    ws.on('close', () => {
        console.log('❌ WebSocket rozłączony');
    });
});
