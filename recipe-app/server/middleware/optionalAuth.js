import { verifyToken } from "../services/authService.js";

export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }

  const token = authHeader.slice(7).trim();
  const user = verifyToken(token);

  req.user = user || null;
  next();
}