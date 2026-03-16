import en from "./localization/en.json" with { type: "json" };
import no from "./localization/no.json" with { type: "json" };

const translations = { en, no };

export function getLanguage(req) {
  const header = req.headers["accept-language"] || "";
  const langs = header.split(",").map((part) => part.trim().toLowerCase());

  for (const lang of langs) {
    if (lang.startsWith("nb") || lang.startsWith("nn") || lang.startsWith("no")) {
      return "no";
    }

    if (lang.startsWith("en")) {
      return "en";
    }
  }

  return "en";
}

export function t(req, key) {
  const lang = getLanguage(req);
  const parts = key.split(".");

  let value = translations[lang];

  for (const p of parts) {
    value = value?.[p];
  }

  return value || key;
}