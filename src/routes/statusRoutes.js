import express from "express";

const router = express.Router();

// 📌 Endpoint do sprawdzania statusu serwera
router.get("/", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Backend działa poprawnie!", 
    timestamp: new Date().toISOString() 
  });
});

export default router;
