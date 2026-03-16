import { RecipeStore } from "../data/recipeStore.js";

const recipeStore = new RecipeStore();

const recipeList = document.getElementById("recipeList");
const msg = document.getElementById("msg");

function renderRecipes() {
  const recipes = recipeStore.getRecipes();

  if (!recipes.length) {
    recipeList.innerHTML = "<p>You have no recipes yet.</p>";
    return;
  }

  recipeList.innerHTML = recipes
    .map(
      (recipe) => `
        <article class="recipe-card">
          <h3>${recipe.title}</h3>
          <p><strong>Servings:</strong> ${recipe.servings ?? "-"}</p>
          <p><strong>Time:</strong> ${recipe.timeMinutes ?? "-"} min</p>
          <p><strong>Private:</strong> ${recipe.isPrivate ? "Yes" : "No"}</p>

          <h4>Ingredients</h4>
          <ul>
            ${recipe.ingredients.map((item) => `<li>${item}</li>`).join("")}
          </ul>

          <h4>Steps</h4>
          <ol>
            ${recipe.steps.map((step) => `<li>${step}</li>`).join("")}
          </ol>

          <h4>Tags</h4>
          <p>${recipe.tags?.length ? recipe.tags.join(", ") : "-"}</p>
        </article>
      `
    )
    .join("");
}

recipeStore.addEventListener("change", renderRecipes);

async function init() {
  try {
    msg.textContent = "Loading recipes...";
    await recipeStore.loadMyRecipes();
    msg.textContent = "";
  } catch (error) {
    console.error(error);
    msg.textContent = error.message || "Failed to load recipes.";
  }
}

init();