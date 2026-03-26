import { loadTranslations, t, getLanguage, setLanguage } from "../modules/i18n.js";

await loadTranslations();

function isLoggedIn() {
  return !!localStorage.getItem("token");
}

function updateNavLabels() {
  const navLinks = document.querySelectorAll(".navbar .navButton");

  if (navLinks[0]) navLinks[0].textContent = t("nav.home");
  if (navLinks[1]) navLinks[1].textContent = t("nav.login");
  if (navLinks[2]) navLinks[2].textContent = t("nav.createRecipe");
  if (navLinks[3]) navLinks[3].textContent = t("nav.myRecipes");

  const languageButton = document.querySelector("[data-language-toggle]");
  if (languageButton) {
    languageButton.textContent = getLanguage() === "no" ? "NO" : "EN";
  }
}

function updateNavVisibility() {
  const loggedIn = isLoggedIn();
  const loginLink = document.querySelector('.navbar a[href="/login.html"]');

  if (loginLink) {
    loginLink.style.display = loggedIn ? "none" : "";
  }
}

function protectLink(selector, targetIfLoggedOut = "/login.html") {
  const link = document.querySelector(selector);
  if (!link) return;

  link.addEventListener("click", (event) => {
    if (isLoggedIn()) return;

    event.preventDefault();
    window.location.href = targetIfLoggedOut;
  });
}

function initLanguageToggle() {
  let button = document.querySelector("[data-language-toggle]");

  if (!button) {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    button = document.createElement("button");
    button.type = "button";
    button.className = "navButton lang-button";
    button.setAttribute("data-language-toggle", "");
    navbar.appendChild(button);
  }

  button.onclick = () => {
    const next = getLanguage() === "no" ? "en" : "no";
    setLanguage(next);
  };
}

export function initNavbar() {
  initLanguageToggle();
  updateNavLabels();
  updateNavVisibility();

  protectLink('.navbar a[href="/createRecipe.html"]');
  protectLink('.navbar a[href="/myRecipe.html"]');

  window.addEventListener("languagechange", () => {
    updateNavLabels();
  });
}