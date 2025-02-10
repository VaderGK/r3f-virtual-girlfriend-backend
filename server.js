// server.js
// version 1.0.6
// last change: obsługa CORS dla StackBlitz + produkcja

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

// Konwersja ścieżek dla ES6 modułów
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// 🌍 DOZWOLONE DOMENY FRONTENDU (produkcja + testy StackBlitz)
const ALLOWED_ORIGINS = [
    'https://agents.efekt.ai',
    /https:\/\/sb1b5q5eh3e-.*\.local-credentialless\.webcontainer\.io$/
];

// ✅ Middleware CORS (sprawdzamy dynamicznie)
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

// ✅ Serwowanie plików audio (dodane nagłówki CORS)
app.use('/audios', express.static(path.join(__dirname, 'audios'), {
    setHeaders: (res, req) => {
        if (req.headers.origin && ALLOWED_ORIGINS.some(allowed => allowed instanceof RegExp ? allowed.test(req.headers.origin) : allowed === req.headers.origin)) {
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    }
}));

// 📌 Importowanie tras API
import indexRoutes from './src/index.js';
app.use('/', indexRoutes);

// 🚀 Tworzymy serwer HTTP
const server = app.listen(PORT, () => {
    console.log(`🚀 Server działa na porcie ${PORT}`);
});

// 🌍 Obsługa WebSocket (sprawdzamy origin)
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    const origin = req.headers.origin;
    if (!origin || !ALLOWED_ORIGINS.some(allowed => allowed instanceof RegExp ? allowed.test(origin) : allowed === origin)) {
        console.log(`❌ Odrzucone połączenie WebSocket z niedozwolonego origin: ${origin}`);
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

// 🔍 Przechwytywanie `console.log` i wysyłanie do WebSocket
const originalConsoleLog = console.log;
console.log = (...args) => {
    const message = args.join(' ');
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify({ log: message }));
        }
    });
    originalConsoleLog(...args);
};
