// Web component for register, login and delete account
// Depends on UserStore and UserController

export class UserManager extends HTMLElement {
  constructor() {
    super();

    this.store = null;
    this.controller = null;

    this.busy = false;
    this.error = "";
  }

  set deps({ store, controller }) {
    this.store = store;
    this.controller = controller;

    // Observer who rerender when store changes
    this.store.addEventListener("change", () => this.updateUi());

    this.render();
  }

  get template() {
    const t = document.getElementById("user-manager-template");
    if (!t) {
      throw new Error("Missing <template id='user-manager-template'> in index.html");
    }
    return t;
  }

  render() {
    this.innerHTML = "";

    const fragment = this.template.content.cloneNode(true);
    this.appendChild(fragment);

    this.cacheElements();
    this.bindEvents();
    this.updateUi();
    this.bindLegalModalLinks();
  }

  cacheElements() {
    this.elLoggedIn = this.querySelector('[data-view="logged-in"]');
    this.elLoggedOut = this.querySelector('[data-view="logged-out"]');

    this.elUsername = this.querySelector("[data-username]");

    this.elLoginForm = this.querySelector("[data-login]");
    this.elRegisterForm = this.querySelector("[data-register]");
    this.elDeleteBtn = this.querySelector("[data-delete]");

    this.elError = this.querySelector("[data-error]");
    this.elErrorText = this.querySelector("[data-error-text]");
  }

  bindEvents() {
    if (this.elLoginForm) {
      this.elLoginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }

    if (this.elRegisterForm) {
      this.elRegisterForm.addEventListener("submit", (e) => this.handleRegister(e));
    }

    if (this.elDeleteBtn) {
      this.elDeleteBtn.addEventListener("click", () => this.handleDelete());
    }
  }

  bindLegalModalLinks() {
    const modal = document.getElementById("legalModal");
    const title = document.getElementById("legalTitle");
    const content = document.getElementById("legalContent");

    if (!modal || !title || !content) return;

    const closeModal = () => {
      modal.hidden = true;
      content.innerHTML = "";
      title.textContent = "Document";
    };

    // Close on backdrop or close button
    modal.querySelectorAll("[data-modal-close]").forEach((el) => {
      el.addEventListener("click", closeModal);
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (!modal.hidden && e.key === "Escape") closeModal();
    });

    // Intercept legal links inside this component
    this.querySelectorAll("a[data-legal]").forEach((a) => {
      a.addEventListener("click", async (e) => {
        e.preventDefault();

        const kind = a.getAttribute("data-legal");
        const url = a.getAttribute("href");

        title.textContent = kind === "tos" ? "Terms of Service" : "Privacy Policy";
        modal.hidden = false;

        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);

          const html = await res.text();
          const doc = new DOMParser().parseFromString(html, "text/html");

          // Prefer <main>, fallback to body
          const main = doc.querySelector("main");
          content.innerHTML = main ? main.innerHTML : doc.body.innerHTML;
        } catch (err) {
          content.textContent = err?.message || String(err);
        }
      });
    });
  }

  setBusy(v) {
    this.busy = v;
    this.updateUi();
  }

  setError(msg) {
    this.error = msg || "";
    this.updateUi();
  }

  updateUi() {
    const loggedIn = !!this.store?.token;
    const username = this.store?.user?.username || "";

    if (this.elLoggedIn) this.elLoggedIn.hidden = !loggedIn;
    if (this.elLoggedOut) this.elLoggedOut.hidden = loggedIn;

    if (this.elUsername) this.elUsername.textContent = username;

    const showError = !!this.error;
    if (this.elError) this.elError.hidden = !showError;
    if (this.elErrorText) this.elErrorText.textContent = this.error;

    // Disable inputs while busy
    const disable = this.busy;
    const inputs = this.querySelectorAll("input, button");
    inputs.forEach((el) => {
      el.disabled = disable;
    });
  }

  async handleLogin(e) {
    e.preventDefault();
    if (!this.controller) return;

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    const username =
      typeof data.username === "string" ? data.username.trim() : "";
    const password =
      typeof data.password === "string" ? data.password : "";

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

    const username =
      typeof data.username === "string" ? data.username.trim() : "";
    const password =
      typeof data.password === "string" ? data.password : "";
    const tosAccepted = form.tosAccepted?.checked === true;

    try {
      this.setError("");
      this.setBusy(true);

      await this.controller.register({
        username,
        password,
        tosAccepted,
      });

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
}

customElements.define("user-manager", UserManager);