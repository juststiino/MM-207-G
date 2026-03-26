// one time use only script for optimalize images for recipies

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const { pool } = await import("../db.js");

const MAX_WIDTH = 800;
const WEBP_QUALITY = 82;
const MAX_OUTPUT_SIZE_BYTES = 1 * 1024 * 1024;

async function optimizeBuffer(buffer) {
  let pipeline = sharp(buffer, { animated: false }).rotate();

  const metadata = await pipeline.metadata();

  if (metadata.width && metadata.width > MAX_WIDTH) {
    pipeline = pipeline.resize({
      width: MAX_WIDTH,
      withoutEnlargement: true,
    });
  }

  const outputBuffer = await pipeline
    .webp({
      quality: WEBP_QUALITY,
      effort: 4,
    })
    .toBuffer();

  if (!outputBuffer || outputBuffer.length === 0) {
    throw new Error("Optimized image buffer was empty");
  }

  if (outputBuffer.length > MAX_OUTPUT_SIZE_BYTES) {
    throw new Error("Optimized image is still too large");
  }

  return outputBuffer;
}

async function optimizeStoredRecipeImages() {
  const result = await pool.query(`
    SELECT id, image_data, image_mime_type
    FROM public.recipes
    WHERE image_data IS NOT NULL
    ORDER BY id ASC
  `);

  const recipes = result.rows;
  console.log(`Fant ${recipes.length} oppskrifter med lagrede bilder.`);

  for (const recipe of recipes) {
    try {
      const optimizedBuffer = await optimizeBuffer(recipe.image_data);

      await pool.query(
        `
        UPDATE public.recipes
        SET image_data = $1,
            image_mime_type = $2,
            updated_at = NOW()
        WHERE id = $3
        `,
        [optimizedBuffer, "image/webp", recipe.id]
      );

      console.log(`Optimaliserte bilde for oppskrift ${recipe.id}`);
    } catch (error) {
      console.error(
        `Kunne ikke optimalisere oppskrift ${recipe.id}: ${error.message}`
      );
    }
  }

  await pool.end();
  console.log("Ferdig.");
}

optimizeStoredRecipeImages().catch(async (error) => {
  console.error("Optimalisering feilet:", error);
  await pool.end();
  process.exit(1);
});