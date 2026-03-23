import { request } from "./api.js";

const CACHE_KEYS = {
  public: "recipebook.publicRecipes",
  mine: "recipebook.myRecipes",
};

function saveLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

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
    try {
      const res = await request("/api/recipes", {
        method: "GET",
      });

      const recipes = res.recipes || [];
      saveLocal(CACHE_KEYS.public, recipes);
      this.setRecipes(recipes);
      return this.recipes;
    } catch (error) {
      const cached = readLocal(CACHE_KEYS.public);
      this.setRecipes(cached);
      return this.recipes;
    }
  }

  async loadMyRecipes() {
    try {
      const res = await request("/api/recipes/mine", {
        method: "GET",
      });

      const recipes = res.recipes || [];
      saveLocal(CACHE_KEYS.mine, recipes);
      this.setRecipes(recipes);
      return this.recipes;
    } catch (error) {
      const cached = readLocal(CACHE_KEYS.mine);
      this.setRecipes(cached);
      return this.recipes;
    }
  }

  async createRecipe(recipe) {
    const res = await request("/api/recipes", {
      method: "POST",
      body: JSON.stringify(recipe),
    });

    const created = res.recipe;

    const mine = readLocal(CACHE_KEYS.mine);
    saveLocal(CACHE_KEYS.mine, [created, ...mine]);

    return created;
  }

  async updateRecipe(id, recipe) {
    const res = await request(`/api/recipes/${id}`, {
      method: "PUT",
      body: JSON.stringify(recipe),
    });

    const updated = res.recipe;

    const mine = readLocal(CACHE_KEYS.mine).map((item) =>
      item.id === id ? updated : item
    );
    saveLocal(CACHE_KEYS.mine, mine);

    return updated;
  }

  async deleteRecipe(id) {
    await request(`/api/recipes/${id}`, {
      method: "DELETE",
    });

    const mine = readLocal(CACHE_KEYS.mine).filter((item) => item.id !== id);
    saveLocal(CACHE_KEYS.mine, mine);
  }
}