// server.js
// version 1.0.5
// last change: poprawiona obsługa CORS dla frontendowej domeny

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

// 🌍 DOZWOLONA DOMENA FRONTENDU (dostosuj do swojej produkcji!)
const ALLOWED_ORIGIN = 'https://agents.efekt.ai';

// ✅ Middleware CORS (dostęp tylko dla produkcyjnego frontendu)
app.use(cors({
    origin: ALLOWED_ORIGIN, 
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// ✅ Serwowanie plików audio (potrzebne do działania TTS i lipsync)
app.use('/audios', express.static(path.join(__dirname, 'audios'), {
    setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
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

// 🌍 Obsługa WebSocket
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    const origin = req.headers.origin;
    if (origin !== ALLOWED_ORIGIN) {
        console.log(`❌ Odrzucone połączenie WebSocket z niedozwolonej domeny: ${origin}`);
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
