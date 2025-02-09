import dotenv from "dotenv";
import app from "./src/index.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

// 🚀 Start serwera
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
