const express = require("express");
const path = require("path");

const { validateRecipe } = require("./middleware/validateRecipe");

const app = express();
const port = 3000;

// JSON
app.use(express.json());

//  CSS, JS
app.use(express.static(path.join(__dirname, "..", "client")));

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "index.html"));
});

// API routes
app.post("/api/recipes", validateRecipe, (req, res) => {
  res.status(201).json({ recipe: req.recipe });
});

app.put("/api/recipes/:id", validateRecipe, (req, res) => {
  res.status(200).json({ id: req.params.id, recipe: req.recipe });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
