// Web component for register, login and delete account
// Depends on UserStore and UserController

export class UserManager extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.store = null;
    this.controller = null;

    this.busy = false;
    this.error = "";
  }

  set deps({ store, controller }) {
    this.store = store;
    this.controller = controller;

    // Observer who rerender when store changes
    this.store.addEventListener("change", () => this.render());

    this.render();
  }

  setBusy(v) {
    this.busy = v;
    this.render();
  }

  setError(msg) {
    this.error = msg || "";
    this.render();
  }

  async handleLogin(e) {
    e.preventDefault();
    if (!this.controller) return;

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    const username = typeof data.username === "string" ? data.username.trim() : "";
    const password = typeof data.password === "string" ? data.password : "";

    try {
      this.setError("");
      this.setBusy(true);

      await this.controller.login({ username, password });

      form.reset();
    } catch (err) {
      this.setError(err?.message || String(err));
    } finally {
      this.setBusy(false);
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    if (!this.controller) return;

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    const username = typeof data.username === "string" ? data.username.trim() : "";
    const password = typeof data.password === "string" ? data.password : "";
    const tosAccepted = form.tosAccepted?.checked === true;

    try {
      this.setError("");
      this.setBusy(true);

      await this.controller.register({ username, password, tosAccepted });

      form.reset();
    } catch (err) {
      this.setError(err?.message || String(err));
    } finally {
      this.setBusy(false);
    }
  }

  async handleDelete() {
    if (!this.controller) return;

    try {
      this.setError("");
      this.setBusy(true);

      await this.controller.deleteAccount();
    } catch (err) {
      this.setError(err?.message || String(err));
    } finally {
      this.setBusy(false);
    }
  }

  render() {
    const loggedIn = !!this.store?.token;
    const username = this.store?.user?.username || "";

    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
        .card { border: 1px solid #ddd; border-radius: 10px; padding: 14px; margin-top: 14px; }
        .row { display:flex; gap:12px; flex-wrap:wrap; align-items:flex-start; }
        form { min-width: 260px; }
        label { display:grid; gap:6px; margin-bottom:10px; }
        input { padding: 10px; border: 1px solid #ccc; border-radius: 8px; }
        button { padding: 10px 12px; border: 1px solid #ccc; border-radius: 8px; background: white; cursor:pointer; }
        button.primary { border-color: #111; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .error { color: #b00020; margin: 10px 0 0 0; }
        .hint { color: #666; }
        .inline { display:flex; gap:8px; align-items:center; }
      </style>

      <section class="card">
        <h2>User</h2>

        ${
          loggedIn
            ? `
              <p class="hint">Logged in ${username ? `as <strong>${escapeHtml(username)}</strong>` : ""}.</p>
              <button id="delete" class="primary" ${this.busy ? "disabled" : ""}>
                Delete account
              </button>
            `
            : `
              <div class="row">
                <form id="login" class="card" style="margin:0;">
                  <h3 style="margin-top:0;">Login</h3>
                  <label>
                    Username
                    <input name="username" autocomplete="username" required ${this.busy ? "disabled" : ""} />
                  </label>
                  <label>
                    Password
                    <input name="password" type="password" autocomplete="current-password" required ${this.busy ? "disabled" : ""} />
                  </label>
                  <button type="submit" class="primary" ${this.busy ? "disabled" : ""}>Login</button>
                </form>

                <form id="register" class="card" style="margin:0;">
                  <h3 style="margin-top:0;">Register</h3>
                  <label>
                    Username
                    <input name="username" autocomplete="username" required ${this.busy ? "disabled" : ""} />
                  </label>
                  <label>
                    Password (min 6 chars)
                    <input name="password" type="password" autocomplete="new-password" required ${this.busy ? "disabled" : ""} />
                  </label>

                  <label>
                    Terms of service consent
                    <span class="inline">
                      <input type="checkbox" name="tosAccepted" ${this.busy ? "disabled" : ""} />
                      <span class="hint">I consent to the terms of service</span>
                    </span>
                  </label>

                  <button type="submit" class="primary" ${this.busy ? "disabled" : ""}>Register</button>
                </form>
              </div>
            `
        }

        ${this.error ? `<p class="error"><strong>Error:</strong> ${escapeHtml(this.error)}</p>` : ""}
      </section>
    `;

    // Bind events after render
    const loginForm = this.shadowRoot.querySelector("#login");
    if (loginForm) loginForm.addEventListener("submit", (e) => this.handleLogin(e));

    const registerForm = this.shadowRoot.querySelector("#register");
    if (registerForm) registerForm.addEventListener("submit", (e) => this.handleRegister(e));

    const delBtn = this.shadowRoot.querySelector("#delete");
    if (delBtn) delBtn.addEventListener("click", () => this.handleDelete());
  }
}

customElements.define("user-manager", UserManager);

// Avoid injecting raw strings into innerHTML
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
