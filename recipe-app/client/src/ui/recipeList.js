export class RecipeList extends HTMLElement {
  constructor() {
    super();
    this.store = null;
    this.controller = null;
  }

  set deps({ store, controller }) {
    this.store = store;
    this.controller = controller;

    this.store.addEventListener("change", () => this.render());

    this.controller.loadPublicRecipes();

    this.render();
  }

  render() {
    if (!this.store) return;

    const recipes = this.store.getRecipes();

    this.innerHTML = `
      <section class="card">
        <h2>Recipes</h2>

        ${
          recipes.length === 0
            ? "<p>No recipes yet</p>"
            : recipes
                .map(
                  (r) => `
              <div class="recipe">
                <h3>${r.title}</h3>
                <p>${r.ingredients}</p>
                <p>${r.instructions}</p>
              </div>
            `
                )
                .join("")
        }
      </section>
    `;
  }
}