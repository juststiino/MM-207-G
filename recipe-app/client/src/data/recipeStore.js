import {
  request
} from "./api.js";

const CACHE_KEYS = {
  public: "recipebook.publicRecipes",
  mine: "recipebook.myRecipes",
};

const PENDING_KEY = "recipes_pending";

function readPending() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY)) || [];
  } catch {
    return [];
  }
}

function savePending(list) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(list));
}

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

function makeOfflineId() {
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sameId(a, b) {
  return String(a) === String(b);
}

function applyPendingToRecipes(recipes) {
  const pending = readPending();

  if (!pending.length) return recipes;

  let merged = [...recipes];

  for (const item of pending) {
    if (item.type === "update") {
      merged = merged.map((recipe) =>
        sameId(recipe.id, item.id) ?
        {
          ...recipe,
          ...item.recipe,
          id: item.id,
          offline: true,
        } :
        recipe
      );
    }

    if (item.type === "create") {
      const exists = merged.some((recipe) => sameId(recipe.id, item.recipe.id));
      if (!exists) {
        merged = [item.recipe, ...merged];
      }
    }
  }

  return merged;
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

      let recipes = res.recipes || [];
      recipes = applyPendingToRecipes(recipes);

      saveLocal(CACHE_KEYS.mine, recipes);
      this.setRecipes(recipes);
      return this.recipes;
    } catch (error) {
      let cached = readLocal(CACHE_KEYS.mine);
      cached = applyPendingToRecipes(cached);

      saveLocal(CACHE_KEYS.mine, cached);
      this.setRecipes(cached);
      return this.recipes;
    }
  }

  async createRecipe(recipe) {
    try {
      const res = await request("/api/recipes", {
        method: "POST",
        body: JSON.stringify(recipe),
      });

      const created = res.recipe;

      const mine = readLocal(CACHE_KEYS.mine);
      const newMine = [created, ...mine];

      saveLocal(CACHE_KEYS.mine, newMine);
      this.setRecipes(newMine);

      return created;
    } catch (error) {
      const offlineRecipe = {
        ...recipe,
        id: makeOfflineId(),
        offline: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        username: JSON.parse(localStorage.getItem("user") || "null")?.username || "You",
      };

      const mine = readLocal(CACHE_KEYS.mine);
      const newMine = [offlineRecipe, ...mine];

      saveLocal(CACHE_KEYS.mine, newMine);
      this.setRecipes(newMine);

      const pending = readPending();
      pending.push({
        type: "create",
        recipe: offlineRecipe,
      });
      savePending(pending);

      return offlineRecipe;
    }
  }

  async updateRecipe(id, recipe) {
    try {
      const res = await request(`/api/recipes/${id}`, {
        method: "PUT",
        body: JSON.stringify(recipe),
      });

      const updated = res.recipe;

      const mine = readLocal(CACHE_KEYS.mine).map((item) =>
        item.id === id ? updated : item
      );

      saveLocal(CACHE_KEYS.mine, mine);
      this.setRecipes(mine);

      return updated;
    } catch (error) {
      const mine = readLocal(CACHE_KEYS.mine);

      const existing = mine.find((item) => item.id === id) || {};

      const updated = {
        ...existing,
        ...recipe,
        id,
        offline: true,
      };

      const newMine = mine.map((item) =>
        item.id === id ? updated : item
      );

      saveLocal(CACHE_KEYS.mine, newMine);
      this.setRecipes(newMine);

      const pending = readPending();

      const withoutSameUpdate = pending.filter(
        (item) => !(item.type === "update" && item.id === id)
      );

      withoutSameUpdate.push({
        type: "update",
        id,
        recipe,
      });

      savePending(withoutSameUpdate);

      return updated;
    }
  }

  async deleteRecipe(id) {
    await request(`/api/recipes/${id}`, {
      method: "DELETE",
    });

    const mine = readLocal(CACHE_KEYS.mine).filter((item) => item.id !== id);
    saveLocal(CACHE_KEYS.mine, mine);
  }

  async loadRecipeById(id) {
    const res = await request(`/api/recipes/${id}`, {
      method: "GET",
    });

    return res.recipe;
  }
}

export async function syncPending() {
  if (!navigator.onLine) return;

  const pending = readPending();

  if (!pending.length) return;

  const remaining = [];
  let mine = readLocal(CACHE_KEYS.mine);

  for (const item of pending) {
    try {
      if (item.type === "create") {
        const recipeToSend = {
          ...item.recipe
        };
        delete recipeToSend.id;
        delete recipeToSend.offline;

        const res = await request("/api/recipes", {
          method: "POST",
          body: JSON.stringify(recipeToSend),
        });

        const created = res.recipe;

        mine = mine.map((recipe) =>
          sameId(recipe.id, item.recipe.id) ? created : recipe
        );
      }

      if (item.type === "update") {
        const res = await request(`/api/recipes/${item.id}`, {
          method: "PUT",
          body: JSON.stringify(item.recipe),
        });

        const updated = res.recipe;

        mine = mine.map((recipe) =>
          sameId(recipe.id, item.id) ? updated : recipe
        );
      }
    } catch (err) {
      remaining.push(item);
    }
  }

  saveLocal(CACHE_KEYS.mine, mine);
  savePending(remaining);
}