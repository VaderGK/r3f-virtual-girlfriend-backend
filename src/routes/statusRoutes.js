const router = express.Router();

// Tutaj dodaj swoje endpointy
router.get("/status", (req, res) => {
  res.json({ status: "ok", message: "Backend działa poprawnie!" });
});

export default router; // <- Eksport jako domyślny
