import { t } from "../modules/i18n.js";
import {
  linesToArray,
  commaListToArray,
  capitalizeFirst
} from "../utils/recipeFormUtils.js";

function arrayToLines(value) {
  if (!Array.isArray(value)) return "";
  return value.join("\n");
}

function tagsToText(value) {
  if (!Array.isArray(value)) return "";
  return value.join(", ");
}

function makeField(labelText, input) {
  const wrapper = document.createElement("label");
  wrapper.className = "edit-recipe-field";

  const label = document.createElement("span");
  label.className = "edit-recipe-label";
  label.textContent = labelText;

  wrapper.appendChild(label);
  wrapper.appendChild(input);

  return wrapper;
}

function makeInput(type = "text") {
  const input = document.createElement("input");
  input.type = type;
  return input;
}

function makeTextarea() {
  return document.createElement("textarea");
}

export class EditRecipeModal {
  constructor(recipeStore) {
    this.recipeStore = recipeStore;
    this.modal = null;
    this.panel = null;
    this.form = null;
    this.error = null;
    this.saveButton = null;
    this.onSaved = null;
    this.currentRecipe = null;

    this.handleKeydown = this.handleKeydown.bind(this);
  }

  open(recipe, { onSaved } = {}) {
    this.close();

    this.currentRecipe = recipe;
    this.onSaved = onSaved;

    this.modal = document.createElement("div");
    this.modal.className = "modal";

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.addEventListener("click", () => this.close());

    this.panel = document.createElement("div");
    this.panel.className = "modal-panel";
    this.panel.setAttribute("role", "dialog");
    this.panel.setAttribute("aria-modal", "true");

    const header = document.createElement("div");
    header.className = "modal-header";

    const title = document.createElement("h2");
    title.textContent = t("recipes.editRecipe");

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "modal-close";
    closeButton.setAttribute("aria-label", t("recipes.closeRecipe"));
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => this.close());

    header.appendChild(title);
    header.appendChild(closeButton);

    const body = document.createElement("div");
    body.className = "modal-body";

    this.form = document.createElement("form");
    this.form.className = "edit-recipe-form";
    this.form.addEventListener("submit", (event) => this.handleSubmit(event));

    const titleInput = makeInput("text");
    titleInput.name = "title";
    titleInput.value = recipe.title || "";

    const imageUrlInput = makeInput("url");
    imageUrlInput.name = "imageUrl";
    imageUrlInput.value = recipe.imageSourceUrl || "";
    imageUrlInput.placeholder = t("recipes.imageUrlPlaceholder");

    const ingredientsInput = makeTextarea();
    ingredientsInput.name = "ingredients";
    ingredientsInput.value = arrayToLines(recipe.ingredients);

    const stepsInput = makeTextarea();
    stepsInput.name = "steps";
    stepsInput.value = arrayToLines(recipe.steps);

    const tagsInput = makeInput("text");
    tagsInput.name = "tags";
    tagsInput.value = tagsToText(recipe.tags);
    tagsInput.placeholder = t("recipes.tagPlaceholder");

    const servingsInput = makeInput("number");
    servingsInput.name = "servings";
    servingsInput.min = "1";
    servingsInput.value = recipe.servings ?? "";

    const timeInput = makeInput("number");
    timeInput.name = "timeMinutes";
    timeInput.min = "1";
    timeInput.value = recipe.timeMinutes ?? "";

    const privateWrap = document.createElement("label");
    privateWrap.className = "inline";

    const privateCheckbox = makeInput("checkbox");
    privateCheckbox.name = "isPrivate";
    privateCheckbox.checked = recipe.isPrivate === true;

    const privateText = document.createElement("span");
    privateText.textContent = t("recipes.privateRecipe");

    privateWrap.appendChild(privateCheckbox);
    privateWrap.appendChild(privateText);

    this.error = document.createElement("p");
    this.error.className = "error";
    this.error.hidden = true;

    const actions = document.createElement("div");
    actions.className = "edit-recipe-actions";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = t("recipes.cancel");
    cancelButton.addEventListener("click", () => this.close());

    this.saveButton = document.createElement("button");
    this.saveButton.type = "submit";
    this.saveButton.className = "primary";
    this.saveButton.textContent = t("recipes.saveChanges");

    this.form.appendChild(makeField(t("recipes.title"), titleInput));
    this.form.appendChild(makeField(t("recipes.imageUrl"), imageUrlInput));
    this.form.appendChild(makeField(t("recipes.ingredientsOnePerLine"), ingredientsInput));
    this.form.appendChild(makeField(t("recipes.stepsOnePerLine"), stepsInput));
    this.form.appendChild(makeField(t("recipes.tagsSeparatedByComma"), tagsInput));
    this.form.appendChild(makeField(t("recipes.servings"), servingsInput));
    this.form.appendChild(makeField(t("recipes.timeInMinutes"), timeInput));
    this.form.appendChild(privateWrap);
    this.form.appendChild(this.error);

    actions.appendChild(cancelButton);
    actions.appendChild(this.saveButton);
    this.form.appendChild(actions);

    body.appendChild(this.form);
    this.panel.appendChild(header);
    this.panel.appendChild(body);

    this.modal.appendChild(backdrop);
    this.modal.appendChild(this.panel);

    document.body.appendChild(this.modal);
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", this.handleKeydown);
  }

  close() {
    document.removeEventListener("keydown", this.handleKeydown);
    document.body.style.overflow = "";

    if (this.modal) {
      this.modal.remove();
    }

    this.modal = null;
    this.panel = null;
    this.form = null;
    this.error = null;
    this.saveButton = null;
    this.currentRecipe = null;
  }

  handleKeydown(event) {
    if (event.key === "Escape") {
      this.close();
    }
  }

  async handleSubmit(event) {
    event.preventDefault();

    if (!this.form || !this.currentRecipe) return;

    const formData = new FormData(this.form);

    const payload = {
      title: capitalizeFirst(formData.get("title")),
      imageUrl: String(formData.get("imageUrl") || "").trim() || null,
      ingredients: linesToArray(formData.get("ingredients")),
      steps: linesToArray(formData.get("steps")),
      tags: commaListToArray(formData.get("tags"), { lowercase: true }),
      servings: formData.get("servings")
        ? Number(formData.get("servings"))
        : null,
      timeMinutes: formData.get("timeMinutes")
        ? Number(formData.get("timeMinutes"))
        : null,
      isPrivate: formData.get("isPrivate") === "on",
    };

    try {
      this.setBusy(true);
      const updated = await this.recipeStore.updateRecipe(this.currentRecipe.id, payload);

      if (typeof this.onSaved === "function") {
        this.onSaved(updated);
      }

      this.close();
    } catch (error) {
      this.showError(t("errors.recipeUpdateFailed"));
    } finally {
      this.setBusy(false);
    }
  }

  setBusy(isBusy) {
    if (!this.saveButton) return;
    this.saveButton.disabled = isBusy;
    this.saveButton.textContent = isBusy ? t("recipes.saving") : t("recipes.saveChanges");
  }

  showError(message) {
    if (!this.error) return;
    this.error.hidden = false;
    this.error.textContent = message;
  }
}