// server.js
// version 1.0.3
// last change: poprawa obsługi WebSocket w Railway

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { WebSocketServer } from 'ws';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

import indexRoutes from './src/index.js';
app.use('/', indexRoutes);

// 🚀 Tworzymy serwer HTTP
const server = app.listen(PORT, () => {
    console.log(`🚀 Server działa na porcie ${PORT}`);
});

// 🌍 Poprawiona obsługa WebSocket - używamy `server`
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
