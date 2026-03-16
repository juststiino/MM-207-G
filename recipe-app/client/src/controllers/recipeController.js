import { api } from "../data/api.js";

export class RecipeController {
  constructor(store) {
    this.store = store;
  }

  async loadPublicRecipes() {
    const data = await api.get("/api/recipes");

    if (data && data.recipes) {
      this.store.setRecipes(data.recipes);
    }
  }
}