import { RecipeStore } from "../data/recipeStore.js";
import { EditRecipeModal } from "./editRecipeModal.js";
import { loadTranslations, t } from "../modules/i18n.js";
import { initNavbar } from "./navbar.js";

await loadTranslations();

const recipeStore = new RecipeStore();
const editRecipeModal = new EditRecipeModal(recipeStore);

const msg = document.getElementById("msg");
const container = document.getElementById("singleRecipeContainer");

function getRecipeIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
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

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);

  if (typeof tags === "string") {
    return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  }

  return [];
}

function formatTime(minutes) {
  if (!minutes || Number.isNaN(Number(minutes))) return null;

  const total = Number(minutes);
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  if (hours > 0 && mins > 0) return `${hours} ${t("recipes.h")} ${mins} ${t("recipes.min")}`;
  if (hours > 0) return `${hours} ${t("recipes.h")}`;
  return `${mins} ${t("recipes.min")}`;
}

function formatDateTime(value) {
  if (!value) return t("recipes.unknown");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("recipes.unknown");
  return date.toLocaleString();
}

function makePill(text) {
  const span = document.createElement("span");
  span.className = "recipe-pill";
  span.textContent = text;
  return span;
}

function makeTag(text) {
  const link = document.createElement("a");
  link.className = "recipe-tag recipe-tag-link";
  link.textContent = text;
  link.href = `/index.html?tag=${encodeURIComponent(text)}`;

  link.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  return link;
}

function makeList(items, ordered = false) {
  const list = document.createElement(ordered ? "ol" : "ul");
  list.className = ordered
    ? "recipe-detail-list recipe-check-list"
    : "recipe-detail-list";

  for (const item of items || []) {
    const li = document.createElement("li");

    if (ordered) {
      li.className = "recipe-check-item";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "recipe-check-button";
      button.setAttribute("aria-pressed", "false");

      const circle = document.createElement("span");
      circle.className = "recipe-check-circle";
      circle.setAttribute("aria-hidden", "true");

      const text = document.createElement("span");
      text.className = "recipe-check-text";
      text.textContent = item;

      button.appendChild(circle);
      button.appendChild(text);

      button.addEventListener("click", () => {
        const isChecked = button.classList.toggle("is-checked");
        button.setAttribute("aria-pressed", String(isChecked));
        text.classList.toggle("is-checked", isChecked);
      });

      li.appendChild(button);
    } else {
      li.textContent = item;
    }

    list.appendChild(li);
  }

  return list;
}

function createImagePlaceholder() {
  const imagePlaceholder = document.createElement("div");
  imagePlaceholder.className = "recipe-detail-image";
  imagePlaceholder.textContent = t("recipes.recipePlaceholder");
  return imagePlaceholder;
}

function applyPageTranslations() {
  document.title = t("pages.recipe");

  const siteTitle = document.querySelector(".site-header h1");
  if (siteTitle) siteTitle.textContent = t("pages.recipeBook");

  const navLinks = document.querySelectorAll(".navbar .navButton");
  if (navLinks[0]) navLinks[0].textContent = t("nav.home");
  if (navLinks[1]) navLinks[1].textContent = t("nav.myPage");
  if (navLinks[2]) navLinks[2].textContent = t("nav.createRecipe");
  if (navLinks[3]) navLinks[3].textContent = t("nav.myRecipes");
}

function buildRecipePage(recipe) {
  container.replaceChildren();

  const wrapper = document.createElement("div");
  wrapper.className = "recipe-detail recipe-page-detail";

  const topBar = document.createElement("div");
  topBar.className = "recipe-page-topbar";

  const headingWrap = document.createElement("div");
  headingWrap.className = "recipe-page-heading-wrap";

  const title = document.createElement("h2");
  title.className = "recipe-page-title";
  title.textContent = recipe.title || t("recipes.untitledRecipe");

  const subtitle = document.createElement("p");
  subtitle.className = "recipe-page-subtitle";
  subtitle.textContent = `${t("recipes.by")} ${recipe.username || t("recipes.unknown")}`;

  headingWrap.appendChild(title);
  headingWrap.appendChild(subtitle);

  const actions = document.createElement("div");
  actions.className = "recipe-page-actions";

  const shareButton = document.createElement("button");
  shareButton.type = "button";
  shareButton.className = "icon-button";
  shareButton.setAttribute("aria-label", t("recipes.copyRecipeLink"));
  shareButton.setAttribute("title", t("recipes.copyRecipeLink"));
  shareButton.textContent = "🔗";

  const copyMsg = document.createElement("span");
  copyMsg.className = "copy-feedback";
  copyMsg.hidden = true;
  copyMsg.textContent = t("recipes.linkCopied");

  let copyMsgTimeout;

  shareButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);

      copyMsg.textContent = t("recipes.linkCopied");
      copyMsg.hidden = false;

      clearTimeout(copyMsgTimeout);
      copyMsgTimeout = setTimeout(() => {
        copyMsg.hidden = true;
      }, 2000);
    } catch {
      copyMsg.textContent = t("errors.copyLinkFailed");
      copyMsg.hidden = false;

      clearTimeout(copyMsgTimeout);
      copyMsgTimeout = setTimeout(() => {
        copyMsg.hidden = true;
      }, 2500);
    }
  });

  actions.appendChild(copyMsg);
  actions.appendChild(shareButton);

  topBar.appendChild(headingWrap);
  topBar.appendChild(actions);

  const top = document.createElement("div");
  top.className = "recipe-detail-top";

  let media;
  if (recipe.imageUrl) {
    const image = document.createElement("img");
    image.className = "recipe-detail-photo";
    image.src = recipe.imageUrl;
    image.alt = recipe.title || t("recipes.recipeImage");
    image.onerror = () => {
      image.replaceWith(createImagePlaceholder());
    };
    media = image;
  } else {
    media = createImagePlaceholder();
  }

  const side = document.createElement("div");
  side.className = "recipe-page-side";

  const meta = document.createElement("div");
  meta.className = "recipe-card-meta";

  const timeText = formatTime(recipe.timeMinutes);
  if (timeText) meta.appendChild(makePill(`⏱ ${timeText}`));
  if (recipe.servings) {
    meta.appendChild(makePill(`🍴 ${recipe.servings} ${t("recipes.servingsSuffix")}`));
  }
  meta.appendChild(makePill(recipe.isPrivate ? t("recipes.private") : t("recipes.public")));

  const tagsWrap = document.createElement("div");
  tagsWrap.className = "recipe-tags";

  const tags = normalizeTags(recipe.tags);
  if (tags.length) {
    for (const tag of tags) {
      tagsWrap.appendChild(makeTag(tag));
    }
  } else {
    tagsWrap.appendChild(makeTag(t("recipes.noTags")));
  }

  side.appendChild(meta);
  side.appendChild(tagsWrap);

  top.appendChild(media);
  top.appendChild(side);

  const ingredientsSection = document.createElement("section");
  ingredientsSection.className = "recipe-detail-section";

  const ingredientsTitle = document.createElement("h3");
  ingredientsTitle.textContent = t("recipes.ingredients");

  ingredientsSection.appendChild(ingredientsTitle);
  ingredientsSection.appendChild(makeList(recipe.ingredients || [], false));

  const stepsSection = document.createElement("section");
  stepsSection.className = "recipe-detail-section";

  const stepsTitle = document.createElement("h3");
  stepsTitle.textContent = t("recipes.steps");

  stepsSection.appendChild(stepsTitle);
  stepsSection.appendChild(makeList(recipe.steps || [], true));

  const footer = document.createElement("div");
  footer.className = "recipe-detail-footer";

  const info = document.createElement("div");
  info.className = "recipe-detail-info";

  const created = document.createElement("p");
  created.textContent = `${t("recipes.created")} ${formatDateTime(recipe.createdAt)}`;

  const updated = document.createElement("p");
  updated.textContent = `${t("recipes.lastUpdated")} ${formatDateTime(recipe.updatedAt)}`;

  info.appendChild(created);
  info.appendChild(updated);
  footer.appendChild(info);

    if (isOwner(recipe)) {
    const footerActions = document.createElement("div");
    footerActions.className = "recipe-detail-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "primary";
    editButton.textContent = t("recipes.editRecipe");

    editButton.addEventListener("click", () => {
      editRecipeModal.open(recipe, {
        onSaved: (updatedRecipe) => {
          buildRecipePage(updatedRecipe);
        },
      });
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger";
    deleteButton.textContent = t("recipes.deleteRecipe");

    deleteButton.addEventListener("click", async () => {
      const confirmed = window.confirm(`${t("recipes.deleteConfirmPrefix")} "${recipe.title}"?`);
      if (!confirmed) return;

      try {
        await recipeStore.deleteRecipe(recipe.id);
        window.location.href = "/index.html";
      } catch (error) {
        alert(error.message || t("errors.recipeDeleteFailed"));
      }
    });

    footerActions.appendChild(editButton);
    footerActions.appendChild(deleteButton);
    footer.appendChild(footerActions);
  }

  wrapper.appendChild(topBar);
  wrapper.appendChild(top);
  wrapper.appendChild(ingredientsSection);
  wrapper.appendChild(stepsSection);
  wrapper.appendChild(footer);

  container.appendChild(wrapper);
}

async function init() {
  applyPageTranslations();
  initNavbar();

  const id = getRecipeIdFromUrl();

  if (!id) {
    msg.textContent = t("errors.missingRecipeId");
    return;
  }

  try {
    msg.textContent = t("recipes.loadingRecipe");

    const recipe = await recipeStore.loadRecipeById(id);

    if (!recipe) {
      msg.textContent = t("errors.recipeNotFound");
      return;
    }

    msg.textContent = "";
    buildRecipePage(recipe);
  } catch (error) {
    console.error(error);
    msg.textContent = error.message || t("errors.recipeLoadFailed");
  }

  window.addEventListener("languagechange", async () => {
    applyPageTranslations();

    const id = getRecipeIdFromUrl();
    if (!id) return;

    try {
      const recipe = await recipeStore.loadRecipeById(id);
      if (recipe) {
        buildRecipePage(recipe);
      }
    } catch (error) {
      console.error(error);
    }
  });
}

init();