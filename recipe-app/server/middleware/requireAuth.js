// Verifies that requests have valid auth token, and returns unauthorized if not

import { verifyToken } from "../services/authService.js";

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  const verificationRes = verifyToken(token);
  if (!verificationRes || !verificationRes.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = { id: verificationRes.id, username: verificationRes.username };
  return next();
}

export { requireAuth };
