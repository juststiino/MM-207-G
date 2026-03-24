import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { validateRecipe } from "../middleware/validateRecipe.js";
import { store } from "../store/postgresStore.js";
import { downloadImageFromUrl } from "../services/imageService.js";
import { t } from "../i18n.js";

const router = Router();

function getRecipeImageUrl(recipe) {
  if (recipe?.has_image) {
    return `/api/recipes/${recipe.id}/image`;
  }

  if (recipe?.image_url) {
    return recipe.image_url;
  }

  return null;
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
    imageUrl: getRecipeImageUrl(recipe),
    isPrivate: recipe.is_private === true,
    ownerUserId: recipe.user_id,
    username: recipe.username,
    createdAt: recipe.created_at,
    updatedAt: recipe.updated_at,
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
    let imagePayload = {
      imageData: null,
      imageMimeType: null,
      imageSourceUrl: null,
    };

    if (req.recipe.imageUrl) {
      imagePayload = await downloadImageFromUrl(req.recipe.imageUrl);
    }

    const recipe = await store.createRecipe({
      title: req.recipe.title,
      ingredients: req.recipe.ingredients,
      steps: req.recipe.steps,
      tags: req.recipe.tags,
      servings: req.recipe.servings,
      timeMinutes: req.recipe.timeMinutes,
      userId: req.user.id,
      isPrivate: req.recipe.isPrivate,
      ...imagePayload,
    });

    return res.status(201).json({
      recipe: mapDbRecipeToClient(recipe),
    });

  } catch (error) {

    console.error(error);

    if (error.status) {
      return res.status(error.status).json({
        error: t(req, "errors.invalidImage"),
        message: t(req, error.translationKey || "errors.invalidImage"),
      });
    }

    return res.status(500).json({
      error: t(req, "errors.recipeCreateFailedServer"),
    });
  }
});



router.get("/", async (req, res) => {
  try {

    const recipes = await store.getPublicRecipes();

    return res.json({
      recipes: recipes.map(mapDbRecipeToClient),
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: t(req, "errors.recipeFetchFailedServer"),
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
      error: t(req, "errors.userRecipesFetchFailedServer"),
    });
  }
});



router.get("/:id/image", async (req, res) => {
  try {

    const image = await store.getRecipeImageById(req.params.id);

    if (!image || !image.image_data || !image.image_mime_type) {
      return res.status(404).json({
        error: t(req, "errors.imageNotFound"),
      });
    }

    res.setHeader("Content-Type", image.image_mime_type);
    res.setHeader("Cache-Control", "public, max-age=86400");

    return res.send(image.image_data);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: t(req, "errors.imageFetchFailedServer"),
    });
  }
});



router.put("/:id", requireAuth, validateRecipe, async (req, res) => {
  try {

    const user = { id: req.user.id };

    const found = await findUserRecipeById(user, req.params.id);

    if (!found) {
      return res.status(404).json({
        error: t(req, "errors.recipeNotFound"),
      });
    }

    let imagePayload = {
      imageData: null,
      imageMimeType: null,
      imageSourceUrl: null,
    };

    if (req.recipe.imageUrl) {
      imagePayload = await downloadImageFromUrl(req.recipe.imageUrl);
    }

    const updated = await store.updateRecipe(req.params.id, {
      title: req.recipe.title,
      ingredients: req.recipe.ingredients,
      steps: req.recipe.steps,
      tags: req.recipe.tags,
      servings: req.recipe.servings,
      timeMinutes: req.recipe.timeMinutes,
      isPrivate: req.recipe.isPrivate,
      ...imagePayload,
    });

    return res.json({
      recipe: mapDbRecipeToClient(updated),
    });

  } catch (error) {

    console.error(error);

    if (error.status) {
      return res.status(error.status).json({
        error: t(req, "errors.invalidImage"),
        message: t(req, error.translationKey || "errors.invalidImage"),
      });
    }

    return res.status(500).json({
      error: t(req, "errors.recipeUpdateFailedServer"),
    });
  }
});



router.delete("/:id", requireAuth, async (req, res) => {
  try {

    const user = { id: req.user.id };

    const found = await findUserRecipeById(user, req.params.id);

    if (!found) {
      return res.status(404).json({
        error: t(req, "errors.recipeNotFound"),
      });
    }

    const deleted = await store.deleteRecipe(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        error: t(req, "errors.recipeNotFound"),
      });
    }

    return res.status(200).json({
      message: "ok",
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: t(req, "errors.recipeDeleteFailedServer"),
    });
  }
});



export const recipeRoutes = router;