import { loadTranslations, t } from "../modules/i18n.js";

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

export function initNavbar() {
  updateNavLabels();
  updateNavVisibility();

  protectLink('.navbar a[href="/createRecipe.html"]');
  protectLink('.navbar a[href="/myRecipe.html"]');
}