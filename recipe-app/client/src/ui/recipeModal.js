import { t } from "../modules/i18n.js";

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

  if (hours > 0 && mins > 0) return `${hours} h ${mins} min`;
  if (hours > 0) return `${hours} h`;
  return `${mins} min`;
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
  const span = document.createElement("span");
  span.className = "recipe-tag";
  span.textContent = text;
  return span;
}

function makeList(items, ordered = false) {
  const list = document.createElement(ordered ? "ol" : "ul");
  list.className = "recipe-detail-list";

  for (const item of items || []) {
    const li = document.createElement("li");
    li.textContent = item;
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

export class RecipeModal {
  constructor() {
    this.modal = document.getElementById("recipeModal");
    this.body = document.getElementById("recipeModalBody");
    this.title = document.getElementById("recipeModalTitle");

    if (!this.modal || !this.body || !this.title) {
      throw new Error("Recipe modal elements are missing in HTML.");
    }

    this.boundClose = this.close.bind(this);
    this.boundKeydown = this.handleKeydown.bind(this);

    this.modal.querySelectorAll("[data-modal-close]").forEach((element) => {
      element.addEventListener("click", this.boundClose);
    });
  }

  open(recipe, options = {}) {
    const {
      showVisibility = false,
      allowEdit = false,
      allowDelete = false,
      onEdit = null,
      onDelete = null,
    } = options;

    this.title.textContent = recipe.title || t("pages.recipe");
    this.body.replaceChildren(
      this.buildContent(recipe, {
        showVisibility,
        allowEdit,
        allowDelete,
        onEdit,
        onDelete,
      })
    );
    this.modal.hidden = false;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", this.boundKeydown);
  }

  close() {
    this.modal.hidden = true;
    this.body.replaceChildren();
    document.body.style.overflow = "";
    document.removeEventListener("keydown", this.boundKeydown);
  }

  handleKeydown(event) {
    if (event.key === "Escape") {
      this.close();
    }
  }

  buildContent(recipe, options = {}) {
    const {
      showVisibility = false,
      allowEdit = false,
      allowDelete = false,
      onEdit = null,
      onDelete = null,
    } = options;

    const wrapper = document.createElement("div");
    wrapper.className = "recipe-detail";

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

    const meta = document.createElement("div");
    meta.className = "recipe-detail-meta";

    const timeText = formatTime(recipe.timeMinutes);
    if (timeText) meta.appendChild(makePill(`⏱ ${timeText}`));
    if (recipe.servings) {
      meta.appendChild(makePill(`🍴 ${recipe.servings} ${t("recipes.servingsSuffix")}`));
    }
    if (showVisibility) {
      meta.appendChild(makePill(recipe.isPrivate ? t("recipes.private") : t("recipes.public")));
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

    top.appendChild(media);
    top.appendChild(meta);
    top.appendChild(tagsWrap);

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

    const by = document.createElement("p");
    by.textContent = `${t("recipes.by")} ${recipe.username || t("recipes.unknown")}`;

    const created = document.createElement("p");
    created.textContent = `${t("recipes.created")} ${formatDateTime(recipe.createdAt)}`;

    const updated = document.createElement("p");
    updated.textContent = `${t("recipes.lastUpdated")} ${formatDateTime(recipe.updatedAt)}`;

    info.appendChild(by);
    info.appendChild(created);
    info.appendChild(updated);

    footer.appendChild(info);

    if (allowEdit || allowDelete) {
      const actions = document.createElement("div");
      actions.className = "recipe-detail-actions";

      if (allowEdit && typeof onEdit === "function") {
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "primary";
        editButton.textContent = t("recipes.editRecipe");
        editButton.addEventListener("click", () => {
          this.close();
          onEdit(recipe);
        });
        actions.appendChild(editButton);
      }

      if (allowDelete && typeof onDelete === "function") {
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "danger";
        deleteButton.textContent = t("recipes.deleteRecipe");

        deleteButton.addEventListener("click", () => {
          this.close();
          onDelete(recipe);
        });

        actions.appendChild(deleteButton);
      }

      footer.appendChild(actions);
    }

    wrapper.appendChild(top);
    wrapper.appendChild(ingredientsSection);
    wrapper.appendChild(stepsSection);
    wrapper.appendChild(footer);

    return wrapper;
  }
}