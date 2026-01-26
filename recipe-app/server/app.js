const express = require("express");
const path = require("path");

const { authRoutes } = require("./routes/authRoutes");
const { recipeRoutes } = require("./routes/recipeRoutes");
const { userRoutes } = require("./routes/userRoutes");

const app = express();
const port = 3000;

// JSON
app.use(express.json());

// CSS, JS
app.use(express.static(path.join(__dirname, "..", "client")));

// Homepage 
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "index.html"));
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
