import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateRecipe } from "../middleware/validateRecipe.js";
import { store } from "../store/postgresStore.js";

const router = Router();

function t(req, key, fallback) {
  if (typeof req.t === "function") {
    return req.t(key);
  }
  return fallback;
}

function mapDbRecipeToClient(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    tags: recipe.tags,
    servings: recipe.servings,
    timeMinutes: recipe.time_minutes,
    isPrivate: recipe.is_private === true,
    ownerUserId: recipe.user_id,
    createdAt: recipe.created_at,
  };
}

async function findUserRecipeById(user, id) {
  const recipe = await store.getRecipeById(id);

  if (!recipe) return null;

  if (String(recipe.user_id) !== String(user.id)) return null;

  return {
    location: recipe.is_private ? "private" : "public",
    recipe,
  };
}


router.post("/", requireAuth, validateRecipe, async (req, res) => {
  try {
    const recipe = await store.createRecipe({
      title: req.recipe.title,
      ingredients: req.recipe.ingredients,
      steps: req.recipe.steps,
      tags: req.recipe.tags,
      servings: req.recipe.servings,
      timeMinutes: req.recipe.timeMinutes,
      userId: req.user.id,
      isPrivate: req.recipe.isPrivate,
    });

    return res.status(201).json({
      recipe: mapDbRecipeToClient(recipe),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to create recipe",
    });
  }
});


router.get("/", async (req, res) => {
  try {
    const recipes = await store.getPublicRecipes();

    const publicView = recipes.map(mapDbRecipeToClient);

    return res.json({ recipes: publicView });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch recipes",
    });
  }
});


router.put("/:id", requireAuth, validateRecipe, async (req, res) => {
  try {
    const user = { id: req.user.id };

    const found = await findUserRecipeById(user, req.params.id);
    if (!found) {
      return res.status(404).json({ error: "Recipe not found" });
    }

    const updated = await store.updateRecipe(req.params.id, {
      title: req.recipe.title,
      ingredients: req.recipe.ingredients,
      steps: req.recipe.steps,
      tags: req.recipe.tags,
      servings: req.recipe.servings,
      timeMinutes: req.recipe.timeMinutes,
      isPrivate: req.recipe.isPrivate,
    });

    return res.json({
      recipe: mapDbRecipeToClient(updated),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to update recipe",
    });
  }
});

router.get("/mine", requireAuth, async (req, res) => {
  try {
    const recipes = await store.getRecipesByUserId(req.user.id);
    return res.json({
      recipes: recipes.map(mapDbRecipeToClient),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to fetch user recipes",
    });
  }
});

export const recipeRoutes = router;