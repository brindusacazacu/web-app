import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { recipesRouter } from "./routes/recipes.js";

const app = express();

// =========================
// Path helpers (ESM)
// =========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =========================
// Middleware
// =========================
app.use(express.json({ limit: "1mb" }));

// =========================
// API routes
// =========================
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/recipes", recipesRouter);

// =========================
// Serve client (frontend)
// =========================
app.use(express.static(path.join(__dirname, "../../client")));

// fallback pentru SPA (index.html)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/index.html"));
});

// =========================
// Start server + DB
// =========================
const PORT = process.env.PORT || 4000;

await connectDB(process.env.MONGODB_URI);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
