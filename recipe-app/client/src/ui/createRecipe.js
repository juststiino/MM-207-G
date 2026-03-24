import { RecipeStore } from "../data/recipeStore.js";
import { request } from "../data/api.js";
import { loadTranslations, t } from "../modules/i18n.js";
import { initNavbar } from "./navbar.js";

const recipeStore = new RecipeStore();

await loadTranslations();

const form = document.getElementById("recipeForm");
const msg = document.getElementById("msg");

function applyPageTranslations() {
  document.title = t("pages.createRecipe");

  const siteTitle = document.querySelector(".site-header h1");
  if (siteTitle) siteTitle.textContent = t("pages.createRecipe");

  const navLinks = document.querySelectorAll(".navbar .navButton");
  if (navLinks[0]) navLinks[0].textContent = t("nav.home");
  if (navLinks[1]) navLinks[1].textContent = t("nav.login");
  if (navLinks[2]) navLinks[2].textContent = t("nav.createRecipe");
  if (navLinks[3]) navLinks[3].textContent = t("nav.myRecipes");

  const sectionTitle = document.querySelector("main .card h2");
  if (sectionTitle) sectionTitle.textContent = t("recipes.newRecipe");

  const titleLabel = document.querySelector('label[for="title"] .edit-recipe-label');
  if (titleLabel) titleLabel.textContent = t("recipes.title");

  const imageUrlLabel = document.querySelector('label[for="imageUrl"] .edit-recipe-label');
  if (imageUrlLabel) imageUrlLabel.textContent = t("recipes.imageUrl");

  const ingredientsLabel = document.querySelector('label[for="ingredients"] .edit-recipe-label');
  if (ingredientsLabel) ingredientsLabel.textContent = t("recipes.ingredientsOnePerLine");

  const stepsLabel = document.querySelector('label[for="steps"] .edit-recipe-label');
  if (stepsLabel) stepsLabel.textContent = t("recipes.stepsOnePerLine");

  const tagsLabel = document.querySelector('label[for="tags"] .edit-recipe-label');
  if (tagsLabel) tagsLabel.textContent = t("recipes.tagsSeparatedByComma");

  const servingsLabel = document.querySelector('label[for="servings"] .edit-recipe-label');
  if (servingsLabel) servingsLabel.textContent = t("recipes.servings");

  const timeLabel = document.querySelector('label[for="timeMinutes"] .edit-recipe-label');
  if (timeLabel) timeLabel.textContent = t("recipes.timeInMinutes");

  const privateText = document.querySelector('label.inline span');
  if (privateText) privateText.textContent = t("recipes.privateRecipe");

  const imageUrlInput = document.getElementById("imageUrl");
  if (imageUrlInput) imageUrlInput.placeholder = t("recipes.imageUrlPlaceholder");

  const tagsInput = document.getElementById("tags");
  if (tagsInput) tagsInput.placeholder = t("recipes.tagPlaceholder");

  const submitButton = form?.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = t("recipes.saveRecipe");
}

function linesToArray(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function commaListToArray(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

applyPageTranslations();
initNavbar();

if (!localStorage.getItem("token")) {
  window.location.href = "/login.html";
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  msg.textContent = "";

  const title = document.getElementById("title").value.trim();
  const imageUrl = document.getElementById("imageUrl").value.trim();
  const ingredients = linesToArray(document.getElementById("ingredients").value);
  const steps = linesToArray(document.getElementById("steps").value);
  const tags = commaListToArray(document.getElementById("tags").value);

  const servingsRaw = document.getElementById("servings").value.trim();
  const timeMinutesRaw = document.getElementById("timeMinutes").value.trim();
  const isPrivate = document.getElementById("isPrivate").checked;

  const payload = {
    title,
    imageUrl: imageUrl || null,
    ingredients,
    steps,
    tags,
    servings: servingsRaw ? Number(servingsRaw) : null,
    timeMinutes: timeMinutesRaw ? Number(timeMinutesRaw) : null,
    isPrivate,
  };

  try {
    const created = await recipeStore.createRecipe(payload);

    msg.textContent = created.offline
      ? t("recipes.recipeSavedOffline")
      : t("recipes.recipeCreatedSuccessfully");

    form.reset();
  } catch (error) {
    msg.textContent = t("errors.recipeCreateFailed");
    console.error(error);
  }
});