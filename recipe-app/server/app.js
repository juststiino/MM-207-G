import 'dotenv/config';
import express, { json, static as staticFiles } from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { authRoutes } from "./routes/authRoutes.js";
import { recipeRoutes } from "./routes/recipeRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;

// JSON
app.use(json());

app.use(function(err, req, res, next) {
  // Log the stack trace to the server console
  console.error(err.stack);
});

// CSS, JS
app.use(staticFiles(join(__dirname, "..", "client")));

// Homepage 
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "..", "client", "index.html"));
});

// API routes 

// Users
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// Recipes
app.use("/api/recipes", recipeRoutes);

// server is running?
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

import { pool } from "./db.js";

pool.query("SELECT NOW()")
  .then(res => console.log("DB connected:", res.rows[0]))
  .catch(err => console.error("DB error:", err));
  