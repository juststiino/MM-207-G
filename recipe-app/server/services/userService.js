// Handles the user accounts
// create, authenticate and delete

import { scryptSync, randomUUID, randomBytes } from "crypto";
import { store } from "../store/postgresStore.js";

function hashPassword(password, hashKey) {
  return scryptSync(password, hashKey, 64).toString("hex");
}

// create new user
async function createUser({ username, password, tosAccepted }) {
  const cleanUsername = typeof username === "string" ? username.trim() : "";

  if (!cleanUsername || typeof password !== "string" || password.length < 6) {
    throw new Error("Missing username or password (min 6 chars)");
  }

  if (tosAccepted !== true) {
    throw new Error("ToS consent required");
  }

  const existing = await store.getUserByUsername(cleanUsername);
  if (existing) {
    throw new Error("Username already exists");
  }

  const id = randomUUID();
  const hashKey = randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, hashKey);

  const user = {
    id,
    username: cleanUsername,
    passwordHash,
    hashKey,
    createdAt: new Date().toISOString(),
  };

  return await store.createUser(user);
}

// authenticate user
async function authenticate({ username, password }) {
  const cleanUsername =
    typeof username === "string" ? username.trim() : "";

  const user = await store.getUserByUsername(cleanUsername);
  if (!user) return null;

  const passwordHash = hashPassword(password, user.hashkey);

  if (passwordHash !== user.password) return null;

  return { id: user.id, username: user.username };
}

// delete user
async function deleteUserAndAnonymizePublicData(userId) {
  // delete private recipes
  await store.deletePrivateRecipesByUser(userId);

  // anonymize public recipes
  await store.anonymizePublicRecipesByUser(userId);

  // delete user
  return store.deleteUser(userId);
}

export { createUser, authenticate, deleteUserAndAnonymizePublicData };