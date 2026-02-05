// Methods for validating content of recipe-related requests

function validateRecipe(req, res, next) {
  const method = req.method.toUpperCase()
  const hasBodyMethod = method === "POST" || method === "PUT" || method === "PATCH"

  // If req. has body, it checks if it is JSON
  if (hasBodyMethod) {
    const contentType = req.headers["content-type"] || ""
    if (!contentType.includes("application/json")) {
      return res.status(415).json({
        error: "Unsupported media type",
        message: "Use content type: application/json",
      })
    }
  }

  // Returns bad req. if it does not have a body, or body is not an object
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
  const isPrivate = typeof body.isPrivate === "boolean" ? body.isPrivate : false;

  // Checks everything inside the JSON
  // title
  if (!title) {
    return res.status(400).json({
      error: "Bad request",
      message: "Title is missing or empty",
    })
  }

  // ingredients, steps and tags
  // cleanup and normalization
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

    // Checks that the fields are not empty
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

  // Checks for serving and timeminutes - null check
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

  // Sets the normalized and validatet recipe on to the req.
  req.recipe = {
    title,
    ingredients: normalizedIngredients,
    steps: normalizedSteps,
    tags: normalizedTags,
    servings,
    timeMinutes,
    isPrivate,
  }

  return next()
}

export default { validateRecipe }
