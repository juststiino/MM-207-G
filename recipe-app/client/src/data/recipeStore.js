import { request } from "./api.js";

export class RecipeStore extends EventTarget {
  constructor() {
    super();
    this.recipes = [];
  }

  setRecipes(recipes) {
    this.recipes = recipes;
    this.dispatchEvent(new Event("change"));
  }

  getRecipes() {
    return this.recipes;
  }

  async loadPublicRecipes() {
    const res = await request("/api/recipes", {
      method: "GET",
    });

    this.setRecipes(res.recipes || []);
    return this.recipes;
  }

  async loadMyRecipes() {
    const res = await request("/api/recipes/mine", {
      method: "GET",
    });

    this.setRecipes(res.recipes || []);
    return this.recipes;
  }
}