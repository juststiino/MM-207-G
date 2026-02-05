// Handles the user accounts
// create, authenticate and delete

import { scryptSync, randomUUID, randomBytes } from "crypto";
import { store } from "../store/memoryStore.js";

function hashPassword(password, hashKey) {
  return scryptSync(password, hashKey, 64).toString("hex");
}

// create new user
function createUser({ username, password, tosAccepted }) {
  const cleanUsername = typeof username === "string" ? username.trim() : "";
  if (!cleanUsername || typeof password !== "string" || password.length < 6) {
    throw new Error("Missing username or password (min 6 chars)");
  }

  if (tosAccepted !== true) {
    throw new Error("ToS consent required");
  }

  if (store.usersByUsername.has(cleanUsername)) {
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
    tosAcceptedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    privateRecipes: [],
  };

  store.users.set(id, user);
  store.usersByUsername.set(cleanUsername, id);

  return { id: user.id, username: user.username, createdAt: user.createdAt };
}

// authenticate user
function authenticate({ username, password }) {
  const cleanUsername = typeof username === "string" ? username.trim() : "";
  const id = store.usersByUsername.get(cleanUsername); //change later to db
  if (!id) return null;

  const user = store.users.get(id);
  if (!user) return null;

  const passwordHash = hashPassword(password, user.hashKey);
  if (passwordHash !== user.passwordHash) return null;

  return { id: user.id, username: user.username };
}

// deleta user
function deleteUserAndAnonymizePublicData(userId) {
  const user = store.users.get(userId);
  if (!user) return false;

  // public recipes stays, even if user is deleted but username is removed
  for (const r of store.publicRecipes) {
    if (r.ownerUserId === userId) {
      r.ownerUserId = null;
      r.ownerLabel = "Deleted user";
    }
  }

  store.users.delete(userId);
  store.usersByUsername.delete(user.username);

  return true;
}

export { createUser, authenticate, deleteUserAndAnonymizePublicData };