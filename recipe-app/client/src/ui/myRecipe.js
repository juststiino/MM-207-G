import { RecipeStore } from "../data/recipeStore.js";
import { renderRecipeGallery } from "./recipeCard.js";
import { RecipeModal } from "./recipeModal.js";
import { EditRecipeModal } from "./editRecipeModal.js";
import { loadTranslations, t } from "../modules/i18n.js";
import { initNavbar } from "./navbar.js";
import { UserStore } from "../data/userStore.js";
import { UserController } from "../controllers/userController.js";

await loadTranslations();

const recipeStore = new RecipeStore();
const recipeModal = new RecipeModal();
const editRecipeModal = new EditRecipeModal(recipeStore);
const userStore = new UserStore();
const userController = new UserController(userStore);

const recipeList = document.getElementById("recipeList");
const msg = document.getElementById("msg");

function applyPageTranslations() {
  document.title = t("pages.myRecipes");

  const siteTitle = document.querySelector(".site-header h1");
  if (siteTitle) siteTitle.textContent = t("pages.myRecipes");

  const navLinks = document.querySelectorAll(".navbar .navButton");
  if (navLinks[0]) navLinks[0].textContent = t("nav.home");
  if (navLinks[1]) navLinks[1].textContent = t("nav.login");
  if (navLinks[2]) navLinks[2].textContent = t("nav.createRecipe");
  if (navLinks[3]) navLinks[3].textContent = t("nav.myRecipes");

  const sectionTitle = document.querySelector("main .card h2");
  if (sectionTitle) sectionTitle.textContent = t("recipes.yourRecipes");

  const modalTitle = document.getElementById("recipeModalTitle");
  if (modalTitle) modalTitle.textContent = t("pages.recipe");

  const closeButton = document.querySelector("#recipeModal .modal-close");
  if (closeButton) {
    closeButton.setAttribute("aria-label", t("recipes.closeRecipe"));
  }
}

async function init() {
  applyPageTranslations();
  initNavbar();

  if (!localStorage.getItem("token")) {
    window.location.href = "/login.html";
    return;
  }

  renderAccountSection();

  try {
    if (msg) msg.textContent = t("recipes.loadingRecipes");
    await recipeStore.loadMyRecipes();
    if (msg) msg.textContent = "";
  } catch (error) {
    console.error(error);
    if (msg) msg.textContent = error.message || t("errors.recipesLoadFailed");
  }
}

function handleRecipeSaved(updatedRecipe) {
  const recipes = recipeStore.getRecipes().map((recipe) =>
    recipe.id === updatedRecipe.id ? updatedRecipe : recipe
  );

  recipeStore.setRecipes(recipes);
}

async function handleRecipeDeleted(recipe) {
  const confirmed = window.confirm(`${t("recipes.deleteConfirmPrefix")} "${recipe.title}"?`);
  if (!confirmed) return;

  try {
    await recipeStore.deleteRecipe(recipe.id);

    const recipes = recipeStore.getRecipes().filter((item) => item.id !== recipe.id);
    recipeStore.setRecipes(recipes);
  } catch (error) {
    alert(error.message || t("errors.recipeDeleteFailed"));
  }
}

function openEditRecipe(recipe) {
  editRecipeModal.open(recipe, {
    onSaved: handleRecipeSaved,
  });
}

function renderRecipes() {
  const recipes = recipeStore.getRecipes();

  renderRecipeGallery(recipeList, recipes, {
    emptyText: t("recipes.noUserRecipes"),
    showVisibility: true,
    onOpen: (recipe) =>
      recipeModal.open(recipe, {
        showVisibility: true,
        allowEdit: true,
        allowDelete: true,
        onEdit: openEditRecipe,
        onDelete: handleRecipeDeleted,
      }),
  });
}

recipeStore.addEventListener("change", renderRecipes);

function renderAccountSection() {
  const mainCard = document.querySelector("main .card");
  if (!mainCard) return;

  let accountBox = document.getElementById("accountBox");
  if (!accountBox) {
    accountBox = document.createElement("div");
    accountBox.id = "accountBox";
    accountBox.className = "recipe-detail-footer";
    mainCard.appendChild(accountBox);
  }

  accountBox.replaceChildren();

  const info = document.createElement("div");
  info.className = "recipe-detail-info";

  const username =
    userStore.user?.username ||
    JSON.parse(localStorage.getItem("user") || "null")?.username ||
    t("recipes.unknown");

  const name = document.createElement("p");
  name.textContent = `${t("ui.loggedInAs")} ${username}`;

  info.appendChild(name);

  const actions = document.createElement("div");
  actions.className = "recipe-detail-actions";

  const logoutButton = document.createElement("button");
  logoutButton.type = "button";
  logoutButton.textContent = t("ui.logout");
  logoutButton.className = "account-logout";

  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/index.html";
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "danger";
  deleteButton.textContent = t("ui.deleteAccount");

  deleteButton.addEventListener("click", async () => {
    const confirmed = window.confirm(t("ui.deleteAccount"));
    if (!confirmed) return;

    try {
      await userController.deleteAccount();
      window.location.href = "/index.html";
    } catch (error) {
      alert(error.message || t("errors.deleteFailed"));
    }
  });

  actions.appendChild(logoutButton);
  actions.appendChild(deleteButton);

  accountBox.appendChild(info);
  accountBox.appendChild(actions);
}

init();