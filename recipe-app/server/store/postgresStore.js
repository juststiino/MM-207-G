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
};