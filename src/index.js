import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chatRoutes.js";
import ttsRoutes from "./routes/ttsRoutes.js";
import statusRoutes from "./routes/statusRoutes.js";

const app = express();
app.use(express.json());
app.use(cors());

// 📌 Podpięcie tras
app.use("/chat", chatRoutes);
app.use("/tts", ttsRoutes);
app.use("/status", statusRoutes);

export default app;
