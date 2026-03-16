import { request } from "../data/api.js";

const form = document.getElementById("recipeForm");
const msg = document.getElementById("msg");

function textareaToArray(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  msg.textContent = "";

  const title = document.getElementById("title").value.trim();
  const ingredients = textareaToArray(
    document.getElementById("ingredients").value
  );
  const steps = textareaToArray(
    document.getElementById("steps").value
  );
  const tags = textareaToArray(
    document.getElementById("tags").value
  );

  const servingsRaw = document.getElementById("servings").value.trim();
  const timeMinutesRaw = document.getElementById("timeMinutes").value.trim();
  const isPublic = document.getElementById("isPublic").checked;

  const payload = {
    title,
    ingredients,
    steps,
    tags,
    servings: servingsRaw ? Number(servingsRaw) : null,
    timeMinutes: timeMinutesRaw ? Number(timeMinutesRaw) : null,
    isPrivate: !isPublic,
  };

  try {
    const result = await request("/api/recipes", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    msg.textContent = "Recipe created successfully.";
    console.log(result);
    form.reset();
  } catch (error) {
    msg.textContent = error.message || "Failed to create recipe.";
    console.error(error);
  }
});