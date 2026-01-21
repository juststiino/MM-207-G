function validateRecipe(req, res, next) {
  const method = req.method.toUpperCase()
  const hasBodyMethod = method === "POST" || method === "PUT" || method === "PATCH"

  if (hasBodyMethod) {
    const contentType = req.headers["content-type"] || ""
    if (!contentType.includes("application/json")) {
      return res.status(415).json({
        error: "Unsupported media type",
        message: "Use content type: application/json",
      })
    }
  }

  const body = req.body
  if (!body || typeof body !== "object") {
    return res.status(400).json({
      error: "Bad request",
      message: "Request body must be a JSON object",
    })
  }

  const title = typeof body.title === "string" ? body.title.trim() : ""
  const ingredients = Array.isArray(body.ingredients) ? body.ingredients : []
  const steps = Array.isArray(body.steps) ? body.steps : []
  const tags = Array.isArray(body.tags) ? body.tags : []

  if (!title) {
    return res.status(400).json({
      error: "Bad request",
      message: "Title is missing or empty",
    })
  }

  const normalizedIngredients = ingredients
    .filter((x) => typeof x === "string")
    .map((x) => x.trim())
    .filter((x) => x.length > 0)

  const normalizedSteps = steps
    .filter((x) => typeof x === "string")
    .map((x) => x.trim())
    .filter((x) => x.length > 0)

  const normalizedTags = tags
    .filter((x) => typeof x === "string")
    .map((x) => x.trim().toLowerCase())
    .filter((x) => x.length > 0)

  if (normalizedIngredients.length === 0) {
    return res.status(400).json({
      error: "Bad request",
      message: "Ingredients is missing or empty",
    })
  }

  if (normalizedSteps.length === 0) {
    return res.status(400).json({
      error: "Bad request",
      message: "Steps is missing or empty",
    })
  }

  let servings = null
  if (body.servings !== undefined && body.servings !== null) {
    if (!isNaN(Number(body.servings))) {
      servings = Number(body.servings)
    }
  }

  let timeMinutes = null
  if (body.timeMinutes !== undefined && body.timeMinutes !== null) {
    if (!isNaN(Number(body.timeMinutes))) {
      timeMinutes = Number(body.timeMinutes)
    }
  }

  req.recipe = {
    title,
    ingredients: normalizedIngredients,
    steps: normalizedSteps,
    tags: normalizedTags,
    servings,
    timeMinutes,
  }

  return next()
}

module.exports = { validateRecipe }
