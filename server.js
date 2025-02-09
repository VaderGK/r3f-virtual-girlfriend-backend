import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import indexRoutes from './src/index.js'; // Importujemy router z src/index.js
import statusRoutes from './src/routes/statusRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Używamy zaimportowanych routerów
app.use('/', indexRoutes);
app.use('/api/status', statusRoutes);


app.listen(PORT, () => {
    console.log(`Virtual Girlfriend listening on port ${PORT}`);
});