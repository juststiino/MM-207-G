export function normalizeListLine(line) {
  return String(line || "")
    .trim()
    .replace(/^(\d+[\.\)]\s*|[-*]\s*)/, "");
}

export function linesToArray(value) {
  return String(value || "")
    .split("\n")
    .map((line) => normalizeListLine(line))
    .filter(Boolean);
}

export function commaListToArray(value, { lowercase = false } = {}) {
  const items = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return lowercase ? items.map((item) => item.toLowerCase()) : items;
}

export function capitalizeFirst(text) {
  const str = String(text || "").trim();
  if (!str) return "";

  return str.charAt(0).toUpperCase() + str.slice(1);
}