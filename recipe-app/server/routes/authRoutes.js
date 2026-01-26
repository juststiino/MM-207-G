// Create or log in to a user

const express = require("express");
const { createUser, authenticate } = require("../services/userService");
const { signToken } = require("../services/authService");

const router = express.Router();

// Creates new user
router.post("/register", (req, res) => {
  try {
    const { username, password, tosAccepted } = req.body;
    const user = createUser({ username, password, tosAccepted });
    return res.status(201).json({ user });
  } 
  catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// Log in to an existing user
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = authenticate({ username, password });

  if (!user) return res.status(401).json({ error: "Wrong user or password" });

  const token = signToken({ id: user.id, username: user.username });
  return res.json({ token });
});

module.exports = { authRoutes: router };
