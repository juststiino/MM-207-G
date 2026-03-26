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

    const params = new URLSearchParams(window.location.search);
    this.mode = params.get("mode") === "register" ? "register" : "login";
  }

  set deps({ store, controller }) {
    this.store = store;
    this.controller = controller;

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

    window.addEventListener("languagechange", () => {
      this.applyTranslations();
      this.updateUi();
    });
  }

  cacheElements() {
    this.elLoggedIn = this.querySelector('[data-view="logged-in"]');
    this.elLoggedOut = this.querySelector('[data-view="logged-out"]');

    this.elLoggedInHint = this.querySelector('[data-view="logged-in"] .hint');
    this.elUsername = this.querySelector("[data-username]");

    this.elLoginForm = this.querySelector("[data-login]");
    this.elRegisterForm = this.querySelector("[data-register]");
    this.elDeleteBtn = this.querySelector("[data-delete]");
    this.elLogoutBtn = this.querySelector("[data-logout]");

    this.elShowRegister = this.querySelector("[data-show-register]");
    this.elShowLogin = this.querySelector("[data-show-login]");
    this.elRegisterPrompt = this.querySelector("[data-register-prompt]");
    this.elLoginPrompt = this.querySelector("[data-login-prompt]");

    this.elError = this.querySelector("[data-error]");
    this.elErrorPrefix = this.querySelector("[data-error] strong");
    this.elErrorText = this.querySelector("[data-error-text]");

    this.elCreateRecipeLink = this.querySelector('[data-my-page-link="create"]');
    this.elMyRecipesLink = this.querySelector('[data-my-page-link="recipes"]');
  }

  applyTranslations() {
    const cardTitle = this.querySelector("section.card h2");
    if (cardTitle) {
      cardTitle.textContent = tr("ui.myPage", "My page");
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

    if (this.elLogoutBtn) {
      this.elLogoutBtn.textContent = tr("ui.logout", "Log out");
    }

    const loginSubmit = this.elLoginForm?.querySelector('button[type="submit"]');
    if (loginSubmit) {
      loginSubmit.textContent = tr("ui.login", "Login");
    }

    const registerSubmit = this.elRegisterForm?.querySelector('button[type="submit"]');
    if (registerSubmit) {
      registerSubmit.textContent = tr("ui.register", "Register");
    }

    if (this.elShowRegister) {
      this.elShowRegister.textContent = tr("ui.registerHere", "Register here");
    }

    if (this.elShowLogin) {
      this.elShowLogin.textContent = tr("ui.loginHere", "Log in here");
    }

    if (this.elRegisterPrompt) {
      this.elRegisterPrompt.textContent = tr("ui.noUserPrompt", "Don't have a user?");
    }

    if (this.elLoginPrompt) {
      this.elLoginPrompt.textContent = tr("ui.hasUserPrompt", "Already have a user?");
    }

    if (this.elErrorPrefix) {
      this.elErrorPrefix.textContent = `${tr("ui.error", "Error:")}`;
    }

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

    const tosLabelText = this.elRegisterForm?.querySelector("[data-tos-label]");
    if (tosLabelText) {
      tosLabelText.textContent = tr("ui.tosConsent", "Terms of service consent");
    }

    const tosLink = this.elRegisterForm?.querySelector('a[data-legal-link="tos"]');
    const privacyLink = this.elRegisterForm?.querySelector('a[data-legal-link="privacy"]');

    if (tosLink) {
      tosLink.textContent = tr("ui.termsOfService", "Terms of Service");
    }

    if (privacyLink) {
      privacyLink.textContent = tr("ui.privacyPolicy", "Privacy Policy");
    }

    const createTitle = this.elCreateRecipeLink?.querySelector(".my-page-card-title");
    const createText = this.elCreateRecipeLink?.querySelector(".my-page-card-text");

    if (createTitle) {
      createTitle.textContent = tr("ui.createRecipe", "Create recipe");
    }
    if (createText) {
      createText.textContent = tr("ui.createRecipeDescription", "Create and save a new recipe.");
    }

    const myRecipesTitle = this.elMyRecipesLink?.querySelector(".my-page-card-title");
    const myRecipesText = this.elMyRecipesLink?.querySelector(".my-page-card-text");

    if (myRecipesTitle) {
      myRecipesTitle.textContent = tr("ui.myRecipes", "My recipes");
    }
    if (myRecipesText) {
      myRecipesText.textContent = tr("ui.myRecipesDescription", "View, edit and manage your recipes.");
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

    if (this.elLogoutBtn) {
      this.elLogoutBtn.addEventListener("click", () => this.handleLogout());
    }

    if (this.elShowRegister) {
      this.elShowRegister.addEventListener("click", () => {
        this.mode = "register";
        this.setError("");
        this.updateUi();
      });
    }

    if (this.elShowLogin) {
      this.elShowLogin.addEventListener("click", () => {
        this.mode = "login";
        this.setError("");
        this.updateUi();
      });
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

    modal.querySelectorAll("[data-modal-close]").forEach((el) => {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (e) => {
      if (!modal.hidden && e.key === "Escape") closeModal();
    });

    this.querySelectorAll("a[data-legal-link]").forEach((a) => {
      a.addEventListener("click", async (e) => {
        e.preventDefault();

        const kind = a.getAttribute("data-legal-link");
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

    if (!loggedIn) {
      if (this.elLoginForm) this.elLoginForm.hidden = this.mode !== "login";
      if (this.elRegisterForm) this.elRegisterForm.hidden = this.mode !== "register";
    }

    this.updateLoggedInHint();

    const showError = !!this.error;
    if (this.elError) this.elError.hidden = !showError;
    if (this.elErrorText) this.elErrorText.textContent = this.error;

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
      window.location.href = "/myRecipe.html";
    } catch (err) {
      this.setError(err.message || tr("errors.loginFailed", "Login failed"));
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
      window.location.href = "/myRecipe.html";
    } catch (err) {
      this.setError(err.message || tr("errors.registerFailed", "Registration failed"));
    } finally {
      this.setBusy(false);
    }
  }

  handleLogout() {
    if (this.store?.setUser) {
      this.store.setUser(null);
    }

    if (this.store?.setToken) {
      this.store.setToken(null);
    }

    window.location.href = "/login.html";
  }

  async handleDelete() {
    if (!this.controller) return;

    const confirmed = window.confirm(
      tr("ui.deleteAccountConfirm", "Are you sure you want to delete your account? Private recipes will be deleted.")
    );

    if (!confirmed) return;

    try {
      this.setError("");
      this.setBusy(true);

      await this.controller.deleteAccount();
      window.location.href = "/login.html";
    } catch {
      this.setError(tr("errors.deleteFailed", "Failed to delete account"));
    } finally {
      this.setBusy(false);
    }
  }
}

customElements.define("user-manager", UserManager);