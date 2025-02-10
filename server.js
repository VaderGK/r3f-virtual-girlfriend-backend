// server.js
// version 1.0.1
// last change: dodano obsluge logow w websockets.

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

// WebSocket Server
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
    console.log('📡 Połączono z WebSocket!');
    ws.send(JSON.stringify({ log: "👋 Witamy w systemie logowania przez WebSocket!" }));
});

// Przechwytywanie logów i wysyłanie do WebSocket
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

// Obsługa HTTP + WebSocket w tym samym serwerze
const server = app.listen(PORT, () => {
    console.log(`🚀 Server działa na porcie ${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});
