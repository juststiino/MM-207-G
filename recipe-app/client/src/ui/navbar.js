import { loadTranslations, t, getLanguage, setLanguage } from "../modules/i18n.js";

await loadTranslations();

function isLoggedIn() {
  return !!localStorage.getItem("token");
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login.html";
}

function updateNavLabels() {
  const homeLink = document.querySelector('[data-nav="home"]');
  const myPageLink = document.querySelector('[data-nav="myPage"]');
  const createLink = document.querySelector('[data-nav="createRecipe"]');
  const myRecipesLink = document.querySelector('[data-nav="myRecipes"]');
  const loginLink = document.querySelector('[data-nav="login"]');
  const registerLink = document.querySelector('[data-nav="register"]');
  const logoutButton = document.querySelector('[data-nav="logout"]');

  if (homeLink) homeLink.textContent = t("nav.home");
  if (myPageLink) myPageLink.textContent = t("nav.myPage");
  if (createLink) createLink.textContent = t("nav.createRecipe");
  if (myRecipesLink) myRecipesLink.textContent = t("nav.myRecipes");
  if (loginLink) loginLink.textContent = t("ui.login");
  if (registerLink) registerLink.textContent = t("ui.register");
  if (logoutButton) logoutButton.textContent = t("ui.logout");

  const languageButton = document.querySelector("[data-language-toggle]");
  if (languageButton) {
    languageButton.textContent = getLanguage() === "no" ? "NO" : "EN";
  }

  const searchInput = document.querySelector("#globalSearch");
  if (searchInput) {
    searchInput.placeholder = t("recipes.searchPlaceholder");
    searchInput.setAttribute("aria-label", t("recipes.searchRecipes"));
  }
}

function buildNavbar() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  navbar.innerHTML = "";

  const homeLink = document.createElement("a");
  homeLink.href = "/index.html";
  homeLink.className = "navButton";
  homeLink.setAttribute("data-nav", "home");

  const menuWrap = document.createElement("div");
  menuWrap.className = "nav-menu-wrap";

  const myPageLink = document.createElement("a");
  myPageLink.href = "/login.html";
  myPageLink.className = "navButton navButton-account";
  myPageLink.setAttribute("data-nav", "myPage");

  const dropdown = document.createElement("div");
  dropdown.className = "nav-dropdown";

  if (isLoggedIn()) {
    const createLink = document.createElement("a");
    createLink.href = "/createRecipe.html";
    createLink.className = "nav-dropdown-link";
    createLink.setAttribute("data-nav", "createRecipe");

    const myRecipesLink = document.createElement("a");
    myRecipesLink.href = "/myRecipe.html";
    myRecipesLink.className = "nav-dropdown-link";
    myRecipesLink.setAttribute("data-nav", "myRecipes");

    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.className = "nav-dropdown-link nav-dropdown-button";
    logoutButton.setAttribute("data-nav", "logout");
    logoutButton.addEventListener("click", logout);

    dropdown.appendChild(createLink);
    dropdown.appendChild(myRecipesLink);
    dropdown.appendChild(logoutButton);
  } else {
    const loginLink = document.createElement("a");
    loginLink.href = "/login.html";
    loginLink.className = "nav-dropdown-link";
    loginLink.setAttribute("data-nav", "login");

    const registerLink = document.createElement("a");
    registerLink.href = "/login.html?mode=register";
    registerLink.className = "nav-dropdown-link";
    registerLink.setAttribute("data-nav", "register");

    dropdown.appendChild(loginLink);
    dropdown.appendChild(registerLink);
  }

  menuWrap.appendChild(myPageLink);
  menuWrap.appendChild(dropdown);

  const spacer = document.createElement("div");
  spacer.className = "nav-spacer";

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.id = "globalSearch";
  searchInput.className = "nav-search";

  const currentQuery = new URLSearchParams(window.location.search).get("q") || "";
  searchInput.value = currentQuery;

  searchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();

    const query = searchInput.value.trim();
    const params = new URLSearchParams();

    if (query) {
      params.set("q", query);
    }

    window.location.href = `/index.html${params.toString() ? `?${params.toString()}` : ""}`;
  });

  const languageButton = document.createElement("button");
  languageButton.type = "button";
  languageButton.className = "navButton lang-button";
  languageButton.setAttribute("data-language-toggle", "");

  languageButton.onclick = () => {
    const next = getLanguage() === "no" ? "en" : "no";
    setLanguage(next);
  };

  navbar.appendChild(homeLink);
  navbar.appendChild(menuWrap);
  navbar.appendChild(spacer);
  navbar.appendChild(searchInput);
  navbar.appendChild(languageButton);

  updateNavLabels();
}

export function initNavbar() {
  buildNavbar();

  window.addEventListener("languagechange", () => {
    updateNavLabels();
  });
}