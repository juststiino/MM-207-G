import "dotenv/config";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import express, { json, static as staticFiles } from "express";

import { authRoutes } from "./routes/authRoutes.js";
import { recipeRoutes } from "./routes/recipeRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { pool } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

app.use(json());

app.use((err, req, res, next) => {
  console.error(err.stack);
  next(err);
});

app.get("/public/service-worker.js", (req, res) => {
  res.setHeader("Service-Worker-Allowed", "/");
  res.sendFile(join(__dirname, "..", "client", "public", "service-worker.js"));
});

// Static files
app.use(staticFiles(join(__dirname, "..", "client")));

// Homepage
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "..", "client", "index.html"));
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/recipes", recipeRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

pool.query("SELECT NOW()")
  .then((res) => console.log("DB connected:", res.rows[0]))
  .catch((err) => console.error("DB error:", err));