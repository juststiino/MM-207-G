import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { validateRecipe } from "../middleware/validateRecipe";
import { store } from "../store/memoryStore";

const router = Router();

const recipes = [];

function findUserRecipeById(user, id) {
  // private 
  const privateIndex = user.privateRecipes.findIndex((r) => String(r.id) === String(id));
  if (privateIndex !== -1) {
    return { location: "private", index: privateIndex, recipe: user.privateRecipes[privateIndex] };
  }

  // public owned by specific user
  const publicIndex = store.publicRecipes.findIndex(
    (r) => String(r.id) === String(id) && String(r.ownerUserId) === String(user.id)
  );
  if (publicIndex !== -1) {
    return { location: "public", index: publicIndex, recipe: store.publicRecipes[publicIndex] };
  }

  return null;
}

// saves a new recipe (that is validated to public or private)
router.post("/", requireAuth, validateRecipe, (req, res) => {
  const user = store.users.get(req.user.id);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const recipe = {
    id: Date.now(), 
    title: req.recipe.title,
    ingredients: req.recipe.ingredients,
    instructions: req.recipe.instructions,
    isPrivate: req.recipe.isPrivate === true,
    ownerUserId: req.user.id,
    createdAt: new Date().toISOString(),
  };

  if (recipe.isPrivate) {
    user.privateRecipes.push(recipe);
    return res.status(201).json({ recipe, location: "user.privateRecipes" });
  }

  store.publicRecipes.push(recipe);
  return res.status(201).json({ recipe, location: "store.publicRecipes" });
});

// gets all public recipes
router.get("/", (req, res) => {
  const publicView = store.publicRecipes.map((r) => ({
    id: r.id,
    title: r.title,
    ingredients: r.ingredients,
    instructions: r.instructions,
    createdAt: r.createdAt,
  }));
  return res.json({ recipes: publicView });
});


// changes an existing recipe (that is validated)
router.put("/:id", requireAuth, validateRecipe, (req, res) => {
  const user = store.users.get(req.user.id);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const found = findUserRecipeById(user, req.params.id);
  if (!found) return res.status(404).json({ error: "Recipe not found" });

  // Update only allowed fields
  const updated = {
    ...found.recipe,
    title: req.recipe.title,
    ingredients: req.recipe.ingredients,
    instructions: req.recipe.instructions,
    isPrivate: req.recipe.isPrivate === true,
    updatedAt: new Date().toISOString(),
  };

  // From private to public
  if (found.location === "private" && updated.isPrivate === false) {
    user.privateRecipes.splice(found.index, 1);
    store.publicRecipes.push(updated);
    return res.status(200).json({ recipe: updated, movedTo: "public" });
  }

  // from public to private
  if (found.location === "public" && updated.isPrivate === true) {
    store.publicRecipes.splice(found.index, 1);
    user.privateRecipes.push(updated);
    return res.status(200).json({ recipe: updated, movedTo: "private" });
  }

  // Else? Update recipe and keep location
  if (found.location === "private") {
    user.privateRecipes[found.index] = updated;
  } else {
    store.publicRecipes[found.index] = updated;
  }

  return res.status(200).json({ recipe: updated });
});

export const recipeRoutes = router;
