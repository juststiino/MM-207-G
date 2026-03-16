import { pool } from "../db.js";

export const store = {
  async createUser(user) {
    const result = await pool.query(
      `INSERT INTO users (username, password, hashkey, tos_accepted, created_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, password, hashkey, tos_accepted, created_at`,
      [
        user.username,
        user.passwordHash,
        user.hashKey,
        true,
        user.createdAt,
      ]
    );

    return result.rows[0];
  },

  async getUserByUsername(username) {
    const result = await pool.query(
      `SELECT id, username, password, hashkey, tos_accepted, created_at
       FROM users
       WHERE username = $1`,
      [username]
    );
    return result.rows[0] || null;
  },

  async deleteUser(userId) {
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
  },

  async getPublicRecipes() {
    const result = await pool.query(
      `SELECT id, title, ingredients, steps, tags, servings, time_minutes, created_at, user_id, is_private
       FROM recipes
       WHERE is_private = false
       ORDER BY id DESC`
    );

    return result.rows;
  },

  async getRecipeById(id) {
    const result = await pool.query(
      `SELECT id, title, ingredients, steps, tags, servings, time_minutes, created_at, user_id, is_private
       FROM recipes
       WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  },

  async getRecipesByUserId(userId) {
    const result = await pool.query(
      `SELECT id, title, ingredients, steps, tags, servings, time_minutes, created_at, user_id, is_private
       FROM recipes
       WHERE user_id = $1
       ORDER BY id DESC`,
      [userId]
    );

    return result.rows;
  },

  async createRecipe(recipe) {
    const result = await pool.query(
      `INSERT INTO recipes (
        title,
        ingredients,
        steps,
        tags,
        servings,
        time_minutes,
        user_id,
        is_private
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        title,
        ingredients,
        steps,
        tags,
        servings,
        time_minutes,
        created_at,
        user_id,
        is_private`,
      [
        recipe.title,
        recipe.ingredients,
        recipe.steps,
        recipe.tags,
        recipe.servings,
        recipe.timeMinutes,
        recipe.userId,
        recipe.isPrivate,
      ]
    );

    return result.rows[0];
  },

  async updateRecipe(id, recipe) {
    const result = await pool.query(
      `UPDATE recipes
       SET title = $1,
           ingredients = $2,
           steps = $3,
           tags = $4,
           servings = $5,
           time_minutes = $6,
           is_private = $7
       WHERE id = $8
       RETURNING
         id,
         title,
         ingredients,
         steps,
         tags,
         servings,
         time_minutes,
         created_at,
         user_id,
         is_private`,
      [
        recipe.title,
        recipe.ingredients,
        recipe.steps,
        recipe.tags,
        recipe.servings,
        recipe.timeMinutes,
        recipe.isPrivate,
        id,
      ]
    );

    return result.rows[0] || null;
  },

  async deleteRecipe(id) {
    const result = await pool.query(
      `DELETE FROM recipes
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    return result.rows[0] || null;
  },
};