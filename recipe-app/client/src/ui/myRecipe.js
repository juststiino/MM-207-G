import { RecipeStore } from "../data/recipeStore.js";
import { renderRecipeGallery } from "./recipeCard.js";
import { RecipeModal } from "./recipeModal.js";
import { EditRecipeModal } from "./editRecipeModal.js";
import { loadTranslations, t } from "../modules/i18n.js";
import { initNavbar } from "./navbar.js";

await loadTranslations();

const recipeStore = new RecipeStore();
const recipeModal = new RecipeModal();
const editRecipeModal = new EditRecipeModal(recipeStore);

const recipeList = document.getElementById("recipeList");
const msg = document.getElementById("msg");

let searchTerm = "";

function applyPageTranslations() {
  document.title = t("pages.myRecipes");

  const siteTitle = document.querySelector(".site-header h1");
  if (siteTitle) siteTitle.textContent = t("pages.myRecipes");

  const sectionTitle = document.querySelector("main .card h2");
  if (sectionTitle) sectionTitle.textContent = t("recipes.yourRecipes");

  const modalTitle = document.getElementById("recipeModalTitle");
  if (modalTitle) modalTitle.textContent = t("pages.recipe");

  const closeButton = document.querySelector("#recipeModal .modal-close");
  if (closeButton) {
    closeButton.setAttribute("aria-label", t("recipes.closeRecipe"));
  }

  const searchInput = document.getElementById("globalSearch");
  if (searchInput) {
    searchInput.placeholder = t("recipes.searchPlaceholder");
    searchInput.setAttribute("aria-label", t("recipes.searchRecipes"));
    searchInput.value = searchTerm;
  }
}

function recipeMatchesSearch(recipe, query) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) return true;

  const title = String(recipe.title || "").toLowerCase();
  const username = String(recipe.username || "").toLowerCase();

  const tags = Array.isArray(recipe.tags)
    ? recipe.tags.join(" ").toLowerCase()
    : String(recipe.tags || "").toLowerCase();

  return (
    title.includes(normalizedQuery) ||
    username.includes(normalizedQuery) ||
    tags.includes(normalizedQuery)
  );
}

async function init() {
  initNavbar();
  applyPageTranslations();

  if (!localStorage.getItem("token")) {
    window.location.href = "/login.html";
    return;
  }

  const searchInput = document.getElementById("globalSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      searchTerm = event.target.value || "";
      renderRecipes();
    });
  }

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
  const filteredRecipes = recipes.filter((recipe) =>
    recipeMatchesSearch(recipe, searchTerm)
  );

  renderRecipeGallery(recipeList, filteredRecipes, {
    emptyText: searchTerm.trim()
      ? t("recipes.noSearchResults")
      : t("recipes.noUserRecipes"),
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

window.addEventListener("languagechange", () => {
  applyPageTranslations();
  renderRecipes();
});

init();