// One time use only script for exporting old recipe images to the new format. 

import "dotenv/config";
import { pool } from "../db.js";
import { downloadImageFromUrl } from "../services/imageService.js";

async function migrateOldRecipeImages() {
  const result = await pool.query(`
    SELECT id, image_url, image_source_url
    FROM public.recipes
    WHERE image_data IS NULL
      AND (
        image_url IS NOT NULL
        OR image_source_url IS NOT NULL
      )
    ORDER BY id ASC
  `);

  const recipes = result.rows;

  console.log(`Fant ${recipes.length} oppskrifter å migrere.`);

  for (const recipe of recipes) {
    const sourceUrl = recipe.image_source_url || recipe.image_url;

    if (!sourceUrl) {
      console.log(`Skipper oppskrift ${recipe.id}, mangler URL.`);
      continue;
    }

    try {
      const imagePayload = await downloadImageFromUrl(sourceUrl);

      await pool.query(
        `
        UPDATE public.recipes
        SET image_data = $1,
            image_mime_type = $2,
            image_source_url = $3,
            updated_at = NOW()
        WHERE id = $4
        `,
        [
          imagePayload.imageData,
          imagePayload.imageMimeType,
          imagePayload.imageSourceUrl,
          recipe.id,
        ]
      );

      console.log(`Migrerte bilde for oppskrift ${recipe.id}`);
    } catch (error) {
      console.error(`Kunne ikke migrere oppskrift ${recipe.id}:`, error.message);
    }
  }

  await pool.end();
  console.log("Ferdig.");
}

migrateOldRecipeImages().catch(async (error) => {
  console.error("Migrering feilet:", error);
  await pool.end();
  process.exit(1);
});