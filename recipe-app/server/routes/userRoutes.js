import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { deleteUserAndAnonymizePublicData } from "../services/userService.js";

const router = Router();

// get all recipes for specific user
router.get("/recipes", requireAuth, (req, res) => {
  const user = store.users.get(req.user.id);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const recipes = user.privateRecipes.map((r) => ({ 
    id: r.id,
    title: r.title,
    ingredients: r.ingredients,
    instructions: r.instructions,
    createdAt: r.createdAt,
  }));
    for (const r of store.publicRecipes) {
      if (r.ownerUserId === userId) {
        recipes.push(r);
      }
    }
  return res.json({ recipes: recipes });
});

// delete user
router.delete("/me", requireAuth, (req, res) => {
  const ok = deleteUserAndAnonymizePublicData(req.user.id);
  if (!ok) return res.status(404).json({ error: "User not found" });
  return res.status(200).json({ message: 'User deleted' });
});


export const userRoutes = router;
