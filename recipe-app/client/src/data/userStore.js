import { request } from "./api.js";

// Handles everything having to do with user
// Store tokens and user info and has methods for registering, logging in, and deleting the user
export class UserStore extends EventTarget {
  constructor() {
    super();
    this.token = null;
    this.user = null;
  }

  setToken(token) {
    this.token = token;
    this.dispatchEvent(new Event("change"));
  }

  async register({ username, password, tosAccepted }) {
    const res = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, tosAccepted }),
    });

    this.user = res.user;
    this.dispatchEvent(new Event("change"));
    return res.user;
  }

  async login({ username, password }) {
    const res = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    this.setToken(res.token);
    return res.token;
  }

  async deleteMe() {
    await request("/api/user/me", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    this.user = null;
    this.token = null;
    this.dispatchEvent(new Event("change"));
  }
}
