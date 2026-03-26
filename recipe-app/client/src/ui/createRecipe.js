import { RecipeStore } from "../data/recipeStore.js";
import { loadTranslations, t } from "../modules/i18n.js";
import { initNavbar } from "./navbar.js";
import { linesToArray, commaListToArray, capitalizeFirst } from "../utils/recipeFormUtils.js";

const recipeStore = new RecipeStore();

await loadTranslations();

const msg = document.getElementById("msg");
const form = document.getElementById("recipeForm");

if (form && msg && form.parentNode) {
  form.parentNode.insertBefore(msg, form);
}

function showMessage(text, type = "info") {
  msg.textContent = text;
  msg.className = `message message-${type}`;
}

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

applyPageTranslations();
initNavbar();

window.addEventListener("languagechange", () => {
  applyPageTranslations();
});

if (!localStorage.getItem("token")) {
  window.location.href = "/login.html";
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  msg.textContent = "";
  msg.className = "";

  const title = capitalizeFirst(
    document.getElementById("title").value
  );

  const imageUrl = document.getElementById("imageUrl").value.trim();
  const ingredients = linesToArray(document.getElementById("ingredients").value);
  const steps = linesToArray(document.getElementById("steps").value);
  const tags = commaListToArray(
    document.getElementById("tags").value,
    { lowercase: true }
  );
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

  showMessage(
    created.offline
      ? t("recipes.recipeSavedOffline")
      : t("recipes.recipeCreatedSuccessfully"),
    "success"
  );

    form.reset();
  } catch (error) {
    showMessage(t("errors.recipeCreateFailed"), "error");
    console.error(error);
  }
});