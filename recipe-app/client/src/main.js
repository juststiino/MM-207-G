import { loadTranslations, t, getLanguage } from "./modules/i18n.js";
import { UserStore } from "./data/userStore.js";
import { UserController } from "./controllers/userController.js";
import "./ui/userManager.js";

await loadTranslations();

// Test language detection
console.log("Current language:", getLanguage());
console.log("Login error message:", t("errors.loginFailed"));

const store = new UserStore();
const controller = new UserController(store);

const el = document.querySelector("user-manager");
if (!el) {
  throw new Error("Missing <user-manager></user-manager> in index.html");
}

el.deps = { store, controller };

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js")
    .then(() => console.log("Service worker registered"))
    .catch(err => console.log("SW error", err));
}