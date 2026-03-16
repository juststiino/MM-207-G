import { RecipeStore } from "../data/recipeStore.js";

const recipeStore = new RecipeStore();

const recipeList = document.getElementById("recipeList");
const msg = document.getElementById("msg");
const empty = document.getElementById("recipes-empty");

function renderRecipes() {
  const recipes = recipeStore.getRecipes();

  recipeList.innerHTML = "";

  if (!recipes.length) {
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  recipeList.innerHTML = recipes
    .map(
      (recipe) => `
        <article class="recipe-card">
          <h3>${recipe.title}</h3>

          <p><strong>Servings:</strong> ${recipe.servings ?? "-"}</p>
          <p><strong>Time:</strong> ${recipe.timeMinutes ?? "-"} min</p>

          <h4>Ingredients</h4>
          <ul>
            ${(recipe.ingredients || []).map((i) => `<li>${i}</li>`).join("")}
          </ul>

          <h4>Steps</h4>
          <ol>
            ${(recipe.steps || []).map((s) => `<li>${s}</li>`).join("")}
          </ol>

          <p><strong>Tags:</strong> ${
            recipe.tags?.length ? recipe.tags.join(", ") : "-"
          }</p>
        </article>
      `
    )
    .join("");
}

recipeStore.addEventListener("change", renderRecipes);

async function init() {
  try {
    if (msg) msg.textContent = "Loading recipes...";
    await recipeStore.loadPublicRecipes();
    if (msg) msg.textContent = "";
  } catch (err) {
    console.error(err);
    if (msg) msg.textContent = err.message || "Failed to load recipes";
  }
}

init();