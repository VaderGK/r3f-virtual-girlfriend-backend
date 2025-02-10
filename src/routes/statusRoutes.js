// src/routes/statusRoutes.js
// version 1.0.0
import express from 'express';
const router = express.Router();

router.get("/", (req, res) => res.json({ status: "ok", message: "Backend działa poprawnie!" }));

export default router;