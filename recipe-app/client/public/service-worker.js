const CACHE_NAME = "recipe-cache-v8";

const APP_SHELL = [
  "/",
  "/index.html",
  "/login.html",
  "/createRecipe.html",
  "/myRecipe.html",
  "/privacy.html",
  "/tos.html",
  "/styles.css",

  "/public/manifest.json",
  "/public/icon-192.png",
  "/public/icon-512.png",

  "/src/main.js",

  "/src/data/api.js",
  "/src/data/recipeStore.js",
  "/src/data/userStore.js",

  "/src/controllers/userController.js",

  "/src/ui/navbar.js",
  "/src/ui/userManager.js",
  "/src/ui/indexRecipes.js",
  "/src/ui/createRecipe.js",
  "/src/ui/myRecipe.js",
  "/src/ui/recipeCard.js",
  "/src/ui/recipeModal.js",
  "/src/ui/editRecipeModal.js",

  "/src/utils/escapeHTML.js",

  "/src/modules/i18n.js",

  "/localization/en.json",
  "/localization/no.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of APP_SHELL) {
        try {
          await cache.add(url);
          console.log("cached", url);
        } catch (err) {
          console.error("FAILED", url);
        }
      }
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/index.html"))
        )
    );
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});