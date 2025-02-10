// server.js
// version 1.0.4
// last change: poprawiona obsługa CORS i serwowanie plików audio

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import path from 'path'; // 🔹 Dodane dla obsługi ścieżek plików
import { fileURLToPath } from 'url';

// Konwersja ścieżek dla ES6 modułów
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// 🚀 Obsługa statycznych plików (np. audio)
app.use('/audios', express.static(path.join(__dirname, 'audios')));

// 🔹 Obsługa CORS dla plików audio
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Pozwól na pobieranie z każdego źródła
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// 📌 Importowanie tras API
import indexRoutes from './src/index.js';
app.use('/', indexRoutes);

// 🚀 Tworzymy serwer HTTP
const server = app.listen(PORT, () => {
    console.log(`🚀 Server działa na porcie ${PORT}`);
});

// 🌍 Obsługa WebSocket
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
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
