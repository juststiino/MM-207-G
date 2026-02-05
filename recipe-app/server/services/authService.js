// generates an auth token and verifies it

import { createHmac } from "crypto";

const TOKEN_SECRET = process.env.TOKEN_SECRET || "tempDevSecret";

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", TOKEN_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${sig}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;

  const [data, sig] = token.split(".");
  const expected = createHmac("sha256", TOKEN_SECRET)
    .update(data)
    .digest("base64url");

  if (sig !== expected) return null;

  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export { signToken, verifyToken };
