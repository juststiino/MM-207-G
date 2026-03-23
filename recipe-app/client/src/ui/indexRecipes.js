import { RecipeStore } from "../data/recipeStore.js";
import { renderRecipeGallery } from "./recipeCard.js";
import { RecipeModal } from "./recipeModal.js";
import { loadTranslations, t } from "../modules/i18n.js";
import { initNavbar } from "./navbar.js";

await loadTranslations();

const recipeStore = new RecipeStore();
const recipeModal = new RecipeModal();

const recipeList = document.getElementById("recipeList");
const msg = document.getElementById("msg");
const empty = document.getElementById("recipes-empty");

function applyPageTranslations() {
  document.title = t("pages.recipeBook");

  const siteTitle = document.querySelector(".site-header h1");
  if (siteTitle) siteTitle.textContent = t("pages.recipeBook");

  const navLinks = document.querySelectorAll(".navbar .navButton");
  if (navLinks[0]) navLinks[0].textContent = t("nav.home");
  if (navLinks[1]) navLinks[1].textContent = t("nav.login");
  if (navLinks[2]) navLinks[2].textContent = t("nav.createRecipe");
  if (navLinks[3]) navLinks[3].textContent = t("nav.myRecipes");

  const sectionTitle = document.querySelector("main .card h2");
  if (sectionTitle) sectionTitle.textContent = t("recipes.publicRecipes");

  if (empty) empty.textContent = t("recipes.noPublicRecipes");

  const modalTitle = document.getElementById("recipeModalTitle");
  if (modalTitle) modalTitle.textContent = t("pages.recipe");

  const closeButton = document.querySelector("#recipeModal .modal-close");
  if (closeButton) {
    closeButton.setAttribute("aria-label", t("recipes.closeRecipe"));
  }
}

function renderRecipes() {
  const recipes = recipeStore.getRecipes();

  if (!recipes.length) {
    recipeList.replaceChildren();
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  renderRecipeGallery(recipeList, recipes, {
    emptyText: t("recipes.noPublicRecipes"),
    onOpen: (recipe) => recipeModal.open(recipe),
  });
}

recipeStore.addEventListener("change", renderRecipes);

async function init() {
  applyPageTranslations();
  initNavbar();

  try {
    if (msg) msg.textContent = t("recipes.loadingRecipes");
    await recipeStore.loadPublicRecipes();
    if (msg) msg.textContent = "";
  } catch (error) {
    console.error(error);
    if (msg) msg.textContent = error.message || t("errors.recipesLoadFailed");
  }
}

init();