import { Router } from "express";
import { createUser, authenticate } from "../services/userService.js";
import { signToken } from "../services/authService.js";
import { t } from "../i18n.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { username, password, tosAccepted } = req.body;

    const user = await createUser({ username, password, tosAccepted });

    return res.status(201).json({ user });
  } catch (e) {
    let message = e.message;

    if (message === "Missing username or password (min 6 chars)") {
      message = t(req, "errors.missingUsernameOrPassword");
    } else if (message === "ToS consent required") {
      message = t(req, "errors.tosRequired");
    } else if (message === "Username already exists") {
      message = t(req, "errors.usernameExists");
    } else {
      message = t(req, "errors.serverError");
    }

    return res.status(400).json({ error: message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await authenticate({ username, password });

    if (!user) {
      return res.status(401).json({
        error: t(req, "errors.wrongUserOrPassword"),
      });
    }

    const token = signToken({
      id: user.id,
      username: user.username,
    });

    res.json({ token, user });

  } catch {
    console.trace();
    res.status(500).json({
      error: t(req, "errors.serverError"),
    });
  }
});

export const authRoutes = router;