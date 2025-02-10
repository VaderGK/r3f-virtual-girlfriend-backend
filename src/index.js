// src/index.js
import express from 'express';
const router = express.Router();
import chatRoutes from './routes/chatRoutes.js';
import ttsRoutes from './routes/ttsRoutes.js';
import { checkDependencies } from './utils/execUtils.js';

checkDependencies();

router.get("/", (req, res) => res.send("Hello World!"));

// Używamy routerów zdefiniowanych w innych plikach
router.use('/', chatRoutes);
router.use('/', ttsRoutes);

export default router;