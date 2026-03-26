// Verifies that requests have valid auth token, and returns unauthorized if not

import { verifyToken } from "../services/authService.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.slice(7).trim();
  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = user;
  next();
}