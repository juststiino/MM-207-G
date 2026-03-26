const translations = {};
let currentLanguage = "en";

const STORAGE_KEY = "language";

function detectBrowserLanguage() {
  const langs = navigator.languages || [navigator.language];

  for (const lang of langs) {
    const lower = lang.toLowerCase();

    if (lower.startsWith("no") || lower.startsWith("nb") || lower.startsWith("nn")) {
      return "no";
    }

    if (lower.startsWith("en")) {
      return "en";
    }
  }

  return "en";
}

export async function loadTranslations() {
  const [enRes, noRes] = await Promise.all([
    fetch("/localization/en.json"),
    fetch("/localization/no.json")
  ]);

  translations.en = await enRes.json();
  translations.no = await noRes.json();

  currentLanguage = localStorage.getItem(STORAGE_KEY) || detectBrowserLanguage();
}

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(lang) {
  if (!translations[lang]) return;

  currentLanguage = lang;
  localStorage.setItem(STORAGE_KEY, lang);

  window.dispatchEvent(new CustomEvent("languagechange", {
    detail: { language: lang }
  }));
}

export function t(path) {
  const keys = path.split(".");
  let value = translations[currentLanguage];

  for (const key of keys) {
    value = value?.[key];
  }

  return value || path;
}