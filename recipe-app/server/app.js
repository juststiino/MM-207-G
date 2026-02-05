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

// CSS, JS
app.use(staticFiles(join(__dirname, "..", "client")));

// Homepage 
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "..", "client/src", "index.html"));
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
