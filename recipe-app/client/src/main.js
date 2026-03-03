import { UserStore } from "./data/userStore.js";
import { UserController } from "./controllers/userController.js";
import "./ui/userManager.js";

const store = new UserStore();
const controller = new UserController(store);

const el = document.querySelector("user-manager");
if (!el) {
  throw new Error("Missing <user-manager></user-manager> in index.html");
}

el.deps = { store, controller };
