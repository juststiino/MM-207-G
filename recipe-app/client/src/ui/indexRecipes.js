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
const empty = document.getElementById("recipes-empty");

let searchTerm = "";
let activeTag = "";
let allRecipes = [];

function getSearchFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("q") || "";
}

function syncSearchInput() {
  const searchInput = document.getElementById("globalSearch");
  if (searchInput) {
    searchInput.value = searchTerm;
  }
}

function applyPageTranslations() {
  document.title = t("pages.recipeBook");

  const siteTitle = document.querySelector(".site-header h1");
  if (siteTitle) siteTitle.textContent = t("pages.recipeBook");

  const sectionTitle = document.querySelector("main .card h2");
  if (sectionTitle) {
    sectionTitle.textContent = activeTag
      ? `${t("recipes.tagResults")} #${activeTag}`
      : t("recipes.Recipes");
  }

  if (empty) {
    if (activeTag) {
      empty.textContent = t("recipes.noTagResults");
    } else if (searchTerm.trim()) {
      empty.textContent = t("recipes.noSearchResults");
    } else {
      empty.textContent = t("recipes.noRecipes");
    }
  }

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
  }
  
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function isOwner(recipe) {
  const user = getCurrentUser();
  if (!user || !recipe) return false;

  return String(recipe.ownerUserId) === String(user.id);
}

function dedupeRecipes(recipes) {
  const seen = new Set();
  const result = [];

  for (const recipe of recipes) {
    const id = String(recipe.id);
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(recipe);
  }

  return result;
}

function recipeMatchesSearch(recipe, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;

  const isPrivate = recipe.isPrivate === true || recipe.isPublic === false;

  if (isPrivate && !isOwner(recipe)) {
    return false;
  }

  const title = String(recipe.title || "").toLowerCase();
  const username = String(recipe.username || "").toLowerCase();
  const tags = Array.isArray(recipe.tags)
    ? recipe.tags.join(" ").toLowerCase()
    : String(recipe.tags || "").toLowerCase();

  return (
    title.includes(q) ||
    username.includes(q) ||
    tags.includes(q)
  );
}

function recipeMatchesTag(recipe, tag) {
  const normalizedTag = String(tag || "").trim().toLowerCase();
  if (!normalizedTag) return true;

  const isPrivate = recipe.isPrivate === true || recipe.isPublic === false;

  if (isPrivate && !isOwner(recipe)) {
    return false;
  }

  const tags = normalizeTags(recipe.tags);
  return tags.includes(normalizedTag);
}

function getTagFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("tag") || "";
}

function normalizeTags(tags) {
  if (!tags) return [];

  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
  }

  return String(tags)
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function handleRecipeSaved(updatedRecipe) {
  allRecipes = allRecipes.map((recipe) =>
    String(recipe.id) === String(updatedRecipe.id) ? updatedRecipe : recipe
  );

  renderRecipes();
}

function openEditRecipe(recipe) {
  editRecipeModal.open(recipe, {
    onSaved: handleRecipeSaved,
  });
}

async function handleRecipeDeleted(recipe) {
  const confirmed = window.confirm(`${t("recipes.deleteConfirmPrefix")} "${recipe.title}"?`);
  if (!confirmed) return;

  try {
    await recipeStore.deleteRecipe(recipe.id);

    allRecipes = allRecipes.filter(
      (item) => String(item.id) !== String(recipe.id)
    );

    renderRecipes();
  } catch (error) {
    alert(error.message || t("errors.recipeDeleteFailed"));
  }
}

function renderRecipes() {
  const filteredRecipes = allRecipes.filter((recipe) => {
    return (
      recipeMatchesSearch(recipe, searchTerm) &&
      recipeMatchesTag(recipe, activeTag)
    );
  });

  if (!filteredRecipes.length) {
    recipeList.replaceChildren();

    if (empty) {
      empty.textContent = activeTag
        ? t("recipes.noTagResults")
        : searchTerm.trim()
          ? t("recipes.noSearchResults")
          : t("recipes.noRecipes");
      empty.hidden = false;
    }

    return;
  }

  if (empty) empty.hidden = true;

  renderRecipeGallery(recipeList, filteredRecipes, {
    showVisibility: true,
    emptyText: activeTag
      ? t("recipes.noTagResults")
      : searchTerm.trim()
        ? t("recipes.noSearchResults")
        : t("recipes.noRecipes"),
        onOpen: (recipe) =>
      recipeModal.open(recipe, {
        allowEdit: isOwner(recipe),
        allowDelete: isOwner(recipe),
        onEdit: openEditRecipe,
        onDelete: handleRecipeDeleted,
      }),
  });
}

async function init() {
  initNavbar();

  searchTerm = getSearchFromUrl();
  activeTag = getTagFromUrl();

  syncSearchInput();
  applyPageTranslations();

  const searchInput = document.getElementById("globalSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      searchTerm = event.target.value || "";
      renderRecipes();
    });
  }

  try {
    if (msg) msg.textContent = t("recipes.loadingRecipes");

    const publicRecipes = await recipeStore.loadPublicRecipes();
    let combined = [...publicRecipes];

    if (localStorage.getItem("token")) {
      const myRecipes = await recipeStore.loadMyRecipes();
      combined = [...publicRecipes, ...myRecipes];
    }

    allRecipes = dedupeRecipes(combined);

    if (msg) msg.textContent = "";
    renderRecipes();
  } catch (error) {
    console.error(error);
    if (msg) msg.textContent = error.message || t("errors.recipesLoadFailed");
  }
}

window.addEventListener("languagechange", () => {
  applyPageTranslations();
  syncSearchInput();
  renderRecipes();
});

init();