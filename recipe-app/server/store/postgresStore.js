import {
  pool
} from "../db.js";

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
      `SELECT
        r.id,
        r.title,
        r.ingredients,
        r.steps,
        r.tags,
        r.servings,
        r.time_minutes,
        r.image_url,
        r.image_source_url,
        (r.image_data IS NOT NULL) AS has_image,
        r.created_at,
        r.updated_at,
        r.user_id,
        r.is_private,
        u.username
      FROM recipes r
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.is_private = false
      ORDER BY r.id DESC`
    );

    return result.rows;
  },

  async getRecipeById(id) {
    const result = await pool.query(
      `SELECT
      r.id,
      r.title,
      r.ingredients,
      r.steps,
      r.tags,
      r.servings,
      r.time_minutes,
      r.image_url,
      r.image_source_url,
      r.image_data,
      r.image_mime_type,
      (r.image_data IS NOT NULL) AS has_image,
      r.created_at,
      r.updated_at,
      r.user_id,
      r.is_private,
      u.username
    FROM recipes r
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  },

  async getRecipesByUserId(userId) {
    const result = await pool.query(
      `SELECT
        r.id,
        r.title,
        r.ingredients,
        r.steps,
        r.tags,
        r.servings,
        r.time_minutes,
        r.image_url,
        r.image_source_url,
        (r.image_data IS NOT NULL) AS has_image,
        r.created_at,
        r.updated_at,
        r.user_id,
        r.is_private,
        u.username
      FROM recipes r
      LEFT JOIN users u ON u.id = r.user_id
      WHERE r.user_id = $1
      ORDER BY r.id DESC`,
      [userId]
    );

    return result.rows;
  },

  async getRecipeImageById(id) {
    const result = await pool.query(
      `SELECT id, image_data, image_mime_type
       FROM recipes
       WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
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
        image_url,
        image_source_url,
        image_data,
        image_mime_type,
        user_id,
        is_private
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING
        id,
        title,
        ingredients,
        steps,
        tags,
        servings,
        time_minutes,
        image_url,
        image_source_url,
        (image_data IS NOT NULL) AS has_image,
        created_at,
        updated_at,
        user_id,
        is_private`,
      [
        recipe.title,
        recipe.ingredients,
        recipe.steps,
        recipe.tags,
        recipe.servings,
        recipe.timeMinutes,
        recipe.imageSourceUrl,
        recipe.imageSourceUrl,
        recipe.imageData,
        recipe.imageMimeType,
        recipe.userId,
        recipe.isPrivate,
      ]
    );

    const created = result.rows[0];

    const userResult = await pool.query(
      `SELECT username FROM users WHERE id = $1`,
      [created.user_id]
    );

    return {
      ...created,
      username: userResult.rows[0]?.username ?? null,
    };
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
          image_url = $7,
          image_source_url = $8,
          image_data = $9,
          image_mime_type = $10,
          is_private = $11,
          updated_at = NOW()
      WHERE id = $12
      RETURNING
        id,
        title,
        ingredients,
        steps,
        tags,
        servings,
        time_minutes,
        image_url,
        image_source_url,
        (image_data IS NOT NULL) AS has_image,
        created_at,
        updated_at,
        user_id,
        is_private`,
      [
        recipe.title,
        recipe.ingredients,
        recipe.steps,
        recipe.tags,
        recipe.servings,
        recipe.timeMinutes,
        recipe.imageSourceUrl,
        recipe.imageSourceUrl,
        recipe.imageData,
        recipe.imageMimeType,
        recipe.isPrivate,
        id,
      ]
    );

    const updated = result.rows[0];
    if (!updated) return null;

    const userResult = await pool.query(
      `SELECT username FROM users WHERE id = $1`,
      [updated.user_id]
    );

    return {
      ...updated,
      username: userResult.rows[0]?.username ?? null,
    };
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

  async deletePrivateRecipesByUser(userId) {
    await pool.query(
      `DELETE FROM recipes
       WHERE user_id = $1
       AND is_private = true`,
      [userId]
    );
  },

  async anonymizePublicRecipesByUser(userId) {
    await pool.query(
      `UPDATE recipes
       SET user_id = NULL
       WHERE user_id = $1
       AND is_private = false`,
      [userId]
    );
  },
};