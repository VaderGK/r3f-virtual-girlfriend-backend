// server.js
// version 1.1.0
// last change: CAŁKOWITE USUNIĘCIE OGRANICZEŃ CORS + WebSocket

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

// ✅ Usunięcie ograniczeń CORS (każdy może się łączyć)
app.use(cors({
    origin: "*", // 🟢 Pozwala na połączenia z każdego originu
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// ✅ Middleware do parsowania JSON w `req.body`
app.use(express.json());

// ✅ Serwowanie plików audio (dowolny dostęp)
app.use('/audios', express.static(path.join(__dirname, 'audios'), {
    setHeaders: (res) => {
        res.setHeader('Access-Control-Allow-Origin', '*'); // 🟢 Zezwalamy na dostęp do plików audio z dowolnego miejsca
        res.setHeader('Content-Type', 'audio/mpeg');
    }
}));

import indexRoutes from './src/index.js';
app.use('/', indexRoutes);

// 🚀 Tworzymy serwer HTTP
const server = app.listen(PORT, () => {
    console.log(`🚀 Server działa na porcie ${PORT}`);
});

// 🌍 Obsługa WebSocket bez ograniczeń
const wss = new WebSocketServer({ server });

const heartbeatInterval = 30000; // Ping co 30 sekund

wss.on('connection', (ws) => {
    console.log('📡 Połączono z WebSocket!');

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
