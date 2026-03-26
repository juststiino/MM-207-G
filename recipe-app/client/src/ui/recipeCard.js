import { t } from "../modules/i18n.js";

function formatTime(minutes) {
  if (!minutes || Number.isNaN(Number(minutes))) return null;

  const total = Number(minutes);
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  if (hours > 0 && mins > 0) return `${hours} ${t("recipes.h")} ${mins} ${t("recipes.min")}`;
  if (hours > 0) return `${hours} ${t("recipes.h")}`;
  return `${mins} ${t("recipes.min")}`;
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);

  if (typeof tags === "string") {
    return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  }

  return [];
}

function formatDate(value) {
  if (!value) return t("recipes.unknown");
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t("recipes.unknown");
  return date.toLocaleDateString();
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

function createImagePlaceholder() {
  const placeholder = document.createElement("div");
  placeholder.className = "recipe-empty-image";
  placeholder.textContent = t("recipes.recipePlaceholder");
  return placeholder;
}

export function createRecipeCard(recipe, options = {}) {
  const { showVisibility = false, onOpen } = options;

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

  const isOwner =
    currentUser &&
    recipe &&
    String(recipe.ownerUserId) === String(currentUser.id);

  const isPrivate =
    recipe.isPrivate === true || recipe.isPublic === false;

  const article = document.createElement("article");
  article.className = "recipe-card";

  if (isPrivate && isOwner) {
    article.classList.add("recipe-card-private");
  }
  article.tabIndex = 0;

  let media;
  if (recipe.imageUrl) {
    const image = document.createElement("img");
    image.className = "recipe-card-image";
    image.src = recipe.imageUrl;
    image.alt = recipe.title || t("recipes.recipeImage");
    image.onerror = () => {
      image.replaceWith(createImagePlaceholder());
    };
    media = image;
  } else {
    media = createImagePlaceholder();
  }

  const body = document.createElement("div");
  body.className = "recipe-card-body";

  const title = document.createElement("h3");
  title.className = "recipe-card-title";
  title.textContent = recipe.title || t("recipes.untitledRecipe");

  const meta = document.createElement("div");
  meta.className = "recipe-card-meta";

  const timeText = formatTime(recipe.timeMinutes);
  if (timeText) meta.appendChild(makePill(`⏱ ${timeText}`));
  if (recipe.servings) {
    meta.appendChild(makePill(`🍴 ${recipe.servings} ${t("recipes.servingsSuffix")}`));
  }
  if (showVisibility) {
    const isPrivate =
      recipe.isPrivate === true || recipe.isPublic === false;

    const currentUser = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    const isOwner =
      currentUser &&
      recipe &&
      String(recipe.ownerUserId) === String(currentUser.id);

    const pill = makePill(
      isPrivate
        ? isOwner
          ? t("recipes.private")
          : t("recipes.private")
        : t("recipes.public")
    );

    if (isPrivate && isOwner) {
      pill.classList.add("recipe-visibility-badge", "private");
    }

    meta.appendChild(pill);
  }

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

  const info = document.createElement("div");
  info.className = "recipe-card-info";

  const by = document.createElement("p");
  by.className = "recipe-card-subtext";
  by.textContent = `${t("recipes.by")} ${recipe.username || t("recipes.unknown")}`;

  info.appendChild(by);

  const openRecipe = () => {
    if (typeof onOpen === "function") onOpen(recipe);
  };

  article.addEventListener("click", openRecipe);
  article.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openRecipe();
    }
  });

  body.appendChild(title);
  body.appendChild(meta);
  body.appendChild(tagsWrap);
  body.appendChild(info);

  article.appendChild(media);
  article.appendChild(body);

  return article;
}

export function renderRecipeGallery(container, recipes, options = {}) {
  container.replaceChildren();

  if (!recipes || recipes.length === 0) {
    const emptyText = document.createElement("p");
    emptyText.className = "hint";
    emptyText.textContent = options.emptyText || t("recipes.noRecipesFound");
    container.appendChild(emptyText);
    return;
  }

  for (const recipe of recipes) {
    container.appendChild(createRecipeCard(recipe, options));
  }
}