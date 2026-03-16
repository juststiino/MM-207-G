// Web component for register, login and delete account
// Depends on UserStore and UserController

import { t } from "../modules/i18n.js";

function tr(key, fallback) {
  const value = t(key);
  return value === key ? fallback : value;
}

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

    // Observe and rerender when store changes
    this.store.addEventListener("change", () => this.updateUi());

    this.render();
  }

  get template() {
    const tpl = document.getElementById("user-manager-template");
    if (!tpl) {
      throw new Error("Missing <template id='user-manager-template'> in index.html");
    }
    return tpl;
  }

  render() {
    this.innerHTML = "";

    const fragment = this.template.content.cloneNode(true);
    this.appendChild(fragment);

    this.cacheElements();
    this.applyTranslations();
    this.bindEvents();
    this.bindLegalModalLinks();
    this.updateUi();
  }

  cacheElements() {
    this.elLoggedIn = this.querySelector('[data-view="logged-in"]');
    this.elLoggedOut = this.querySelector('[data-view="logged-out"]');

    this.elLoggedInHint = this.querySelector('[data-view="logged-in"] .hint');
    this.elUsername = this.querySelector("[data-username]");

    this.elLoginForm = this.querySelector("[data-login]");
    this.elRegisterForm = this.querySelector("[data-register]");
    this.elDeleteBtn = this.querySelector("[data-delete]");

    this.elError = this.querySelector("[data-error]");
    this.elErrorPrefix = this.querySelector("[data-error] strong");
    this.elErrorText = this.querySelector("[data-error-text]");
  }

  applyTranslations() {
    const cardTitle = this.querySelector("section.card h2");
    if (cardTitle) {
      cardTitle.textContent = tr("ui.user", "User");
    }

    const loginTitle = this.elLoginForm?.querySelector("h3");
    if (loginTitle) {
      loginTitle.textContent = tr("ui.login", "Login");
    }

    const registerTitle = this.elRegisterForm?.querySelector("h3");
    if (registerTitle) {
      registerTitle.textContent = tr("ui.register", "Register");
    }

    if (this.elDeleteBtn) {
      this.elDeleteBtn.textContent = tr("ui.deleteAccount", "Delete account");
    }

    const loginSubmit = this.elLoginForm?.querySelector('button[type="submit"]');
    if (loginSubmit) {
      loginSubmit.textContent = tr("ui.login", "Login");
    }

    const registerSubmit = this.elRegisterForm?.querySelector('button[type="submit"]');
    if (registerSubmit) {
      registerSubmit.textContent = tr("ui.register", "Register");
    }

    if (this.elErrorPrefix) {
      this.elErrorPrefix.textContent = `${tr("ui.error", "Error:")}`;
    }

    // Login form labels
    const loginUsernameInput = this.elLoginForm?.querySelector('input[name="username"]');
    const loginPasswordInput = this.elLoginForm?.querySelector('input[name="password"]');

    const loginUsernameLabel = loginUsernameInput?.closest("label");
    const loginPasswordLabel = loginPasswordInput?.closest("label");

    if (loginUsernameLabel && loginUsernameLabel.childNodes[0]) {
      loginUsernameLabel.childNodes[0].textContent = `${tr("ui.username", "Username")}\n`;
    }

    if (loginPasswordLabel && loginPasswordLabel.childNodes[0]) {
      loginPasswordLabel.childNodes[0].textContent = `${tr("ui.password", "Password")}\n`;
    }

    // Register form labels
    const registerUsernameInput = this.elRegisterForm?.querySelector('input[name="username"]');
    const registerPasswordInput = this.elRegisterForm?.querySelector('input[name="password"]');

    const registerUsernameLabel = registerUsernameInput?.closest("label");
    const registerPasswordLabel = registerPasswordInput?.closest("label");

    if (registerUsernameLabel && registerUsernameLabel.childNodes[0]) {
      registerUsernameLabel.childNodes[0].textContent = `${tr("ui.username", "Username")}\n`;
    }

    if (registerPasswordLabel && registerPasswordLabel.childNodes[0]) {
      registerPasswordLabel.childNodes[0].textContent = `${tr("ui.passwordMin", "Password (min 6 chars)")}\n`;
    }

    // Terms of service consent label
    const tosCheckbox = this.elRegisterForm?.querySelector('input[name="tosAccepted"]');
    const tosLabel = tosCheckbox?.closest("label");
    if (tosLabel && tosLabel.childNodes[0]) {
      tosLabel.childNodes[0].textContent = `${tr("ui.tosConsent", "Terms of service consent")}\n`;
    }

    // Legal agreement text and links
    const hint = this.elRegisterForm?.querySelector("span.hint");
    const tosLink = this.elRegisterForm?.querySelector('a[data-legal="tos"]');
    const privacyLink = this.elRegisterForm?.querySelector('a[data-legal="privacy"]');

    if (hint && tosLink && privacyLink) {
      tosLink.textContent = tr("ui.termsOfService", "Terms of Service");
      privacyLink.textContent = tr("ui.privacyPolicy", "Privacy Policy");

      hint.textContent = "";
      hint.append(
        document.createTextNode(`${tr("ui.agreePrefix", "I agree to the")} `),
        tosLink,
        document.createTextNode(` ${tr("ui.and", "and")} `),
        privacyLink,
        document.createTextNode(".")
      );
    }
  }

  updateLoggedInHint() {
    if (!this.elLoggedInHint) return;

    const username = this.store?.user?.username || "";

    this.elLoggedInHint.textContent = "";
    this.elLoggedInHint.append(
      document.createTextNode(`${tr("ui.loggedInAs", "Logged in as")} `)
    );

    const strong = document.createElement("strong");
    strong.setAttribute("data-username", "");
    strong.textContent = username;

    this.elLoggedInHint.append(
      strong,
      document.createTextNode(".")
    );

    this.elUsername = strong;
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
      title.textContent = tr("ui.document", "Document");
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

        title.textContent =
          kind === "tos"
            ? tr("ui.termsOfService", "Terms of Service")
            : tr("ui.privacyPolicy", "Privacy Policy");

        modal.hidden = false;

        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);

          const html = await res.text();
          const doc = new DOMParser().parseFromString(html, "text/html");

          // Prefer main, fallback to body
          const main = doc.querySelector("main");
          content.innerHTML = main ? main.innerHTML : doc.body.innerHTML;
        } catch {
          content.textContent = tr("errors.legalLoadFailed", "Failed to load document");
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

    if (this.elLoggedIn) this.elLoggedIn.hidden = !loggedIn;
    if (this.elLoggedOut) this.elLoggedOut.hidden = loggedIn;

    this.updateLoggedInHint();

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
    } 
    catch (err) {
      this.setError(err.message || tr("errors.loginFailed", "Login failed"));
    }
    finally {
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
    } 
    catch (err) {
      this.setError(err.message || tr("errors.registerFailed", "Registration failed"));
    }
    finally {
      this.setBusy(false);
    }
  }

  async handleDelete() {
    if (!this.controller) return;

    try {
      this.setError("");
      this.setBusy(true);

      await this.controller.deleteAccount();
    } 
    catch {
      this.setError(tr("errors.deleteFailed", "Failed to delete account"));
    } 
    finally {
      this.setBusy(false);
    }
  }
}

customElements.define("user-manager", UserManager);