import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import app from "./src/index.js"; // Import aplikacji

dotenv.config();

const PORT = process.env.PORT || 8000;
const server = createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
