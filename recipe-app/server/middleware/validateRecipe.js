import { t } from "../i18n.js";

function validateRecipe(req, res, next) {
  const method = req.method.toUpperCase();
  const hasBodyMethod = method === "POST" || method === "PUT" || method === "PATCH";

  if (hasBodyMethod) {
    const contentType = req.headers["content-type"] || "";
    if (!contentType.includes("application/json")) {
      return res.status(415).json({
        error: t(req, "errors.unsupportedMediaType"),
        message: t(req, "errors.useJsonContentType"),
      });
    }
  }

  const body = req.body;
  if (!body || typeof body !== "object") {
    return res.status(400).json({
      error: t(req, "errors.badRequest"),
      message: t(req, "errors.requestBodyMustBeJsonObject"),
    });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];
  const steps = Array.isArray(body.steps) ? body.steps : [];
  const tags = Array.isArray(body.tags) ? body.tags : [];
  const isPrivate = typeof body.isPrivate === "boolean" ? body.isPrivate : false;

  if (!title) {
    return res.status(400).json({
      error: t(req, "errors.badRequest"),
      message: t(req, "errors.titleMissing"),
    });
  }

  const normalizedIngredients = ingredients
    .filter((x) => typeof x === "string")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);

  const normalizedSteps = steps
    .filter((x) => typeof x === "string")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);

  const normalizedTags = tags
    .filter((x) => typeof x === "string")
    .map((x) => x.trim().toLowerCase())
    .filter((x) => x.length > 0);

  if (normalizedIngredients.length === 0) {
    return res.status(400).json({
      error: t(req, "errors.badRequest"),
      message: t(req, "errors.ingredientsMissing"),
    });
  }

  if (normalizedSteps.length === 0) {
    return res.status(400).json({
      error: t(req, "errors.badRequest"),
      message: t(req, "errors.stepsMissing"),
    });
  }

  let servings = null;
  if (body.servings !== undefined && body.servings !== null) {
    if (!isNaN(Number(body.servings))) {
      servings = Number(body.servings);
    }
  }

  let timeMinutes = null;
  if (body.timeMinutes !== undefined && body.timeMinutes !== null) {
    if (!isNaN(Number(body.timeMinutes))) {
      timeMinutes = Number(body.timeMinutes);
    }
  }

  let imageUrl = null;

  if (typeof body.imageUrl === "string") {
    const trimmed = body.imageUrl.trim();

    if (trimmed.length > 0) {
      try {
        const url = new URL(trimmed);

        if (url.protocol !== "http:" && url.protocol !== "https:") {
          return res.status(400).json({
            error: t(req, "errors.badRequest"),
            message: t(req, "errors.imageUrlMustBeHttp"),
          });
        }

        imageUrl = trimmed;
      } catch {
        return res.status(400).json({
          error: t(req, "errors.badRequest"),
          message: t(req, "errors.imageUrlInvalid"),
        });
      }
    }
  }

  req.recipe = {
    title,
    ingredients: normalizedIngredients,
    steps: normalizedSteps,
    tags: normalizedTags,
    servings,
    timeMinutes,
    imageUrl,
    isPrivate,
  };

  return next();
}

export { validateRecipe };