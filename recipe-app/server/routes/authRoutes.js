// Create or log in to a user

import { Router } from "express";
import { createUser, authenticate } from "../services/userService.js";
import { signToken } from "../services/authService.js";

const router = Router();

// Creates new user
router.post("/register", async (req, res) => {
  try {
    const { username, password, tosAccepted } = req.body;

    const user = await createUser({ username, password, tosAccepted });

    return res.status(201).json({ user });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// Log in to an existing user
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await authenticate({ username, password });
    if (!user) {
      return res.status(401).json({ error: "Wrong user or password" });
    }

    const token = signToken({ id: user.id, username: user.username });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: "Server error" });
  }
});

export const authRoutes = router;